using Confluent.Kafka;
using Sensormine.Storage.Interfaces;
using Sensormine.Core.Models;
using System.Text.Json;

namespace Ingestion.Service.Services;

/// <summary>
/// Kafka consumer service that ingests telemetry data and writes to TimescaleDB
/// </summary>
public class TelemetryConsumerService : BackgroundService
{
    private readonly ILogger<TelemetryConsumerService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private IConsumer<string, string>? _consumer;

    public TelemetryConsumerService(
        ILogger<TelemetryConsumerService> logger,
        IConfiguration configuration,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _configuration = configuration;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var config = new ConsumerConfig
            {
                BootstrapServers = _configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
                GroupId = _configuration["Kafka:ConsumerGroup"] ?? "ingestion-service",
                AutoOffsetReset = AutoOffsetReset.Earliest,
                EnableAutoCommit = false
            };

            _consumer = new ConsumerBuilder<string, string>(config).Build();
            var topic = _configuration["Kafka:TelemetryTopic"] ?? "telemetry.raw";
            _consumer.Subscribe(topic);

            _logger.LogInformation("Kafka consumer started, subscribed to topic: {Topic}", topic);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var consumeResult = _consumer.Consume(stoppingToken);
                    
                    if (consumeResult?.Message != null)
                    {
                        await ProcessMessage(consumeResult.Message, stoppingToken);
                        _consumer.Commit(consumeResult);
                    }
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Error consuming message from Kafka");
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in telemetry consumer service");
            throw;
        }
    }

    private async Task ProcessMessage(Message<string, string> message, CancellationToken cancellationToken)
    {
        var deviceId = message.Key;
        var payload = message.Value;

        try
        {
            _logger.LogDebug("Processing message from device {DeviceId}: {Payload}", deviceId, payload);

            // Parse JSON payload
            var telemetryData = JsonSerializer.Deserialize<Dictionary<string, object>>(payload);
            if (telemetryData == null)
            {
                await SendToDlq(deviceId, payload, "Failed to parse JSON payload");
                return;
            }

            // Get device tenant information
            using var scope = _serviceProvider.CreateScope();
            
            // TODO: Implement proper tenant lookup from device registry
            // var deviceRepository = scope.ServiceProvider.GetRequiredService<IDeviceRepository>();
            // var device = await deviceRepository.GetByDeviceIdAsync(deviceId, "");
            // var tenantId = device?.TenantId ?? "00000000-0000-0000-0000-000000000000";
            
            // For now, use empty GUID until device registry integration is complete
            var tenantId = "00000000-0000-0000-0000-000000000000";
            
            // Validate against schema (temporarily disabled for testing)
            // var schemaClient = scope.ServiceProvider.GetRequiredService<ISchemaRegistryClient>();
            // var validationResult = await schemaClient.ValidatePayloadAsync(deviceId, payload, cancellationToken);
            //
            // if (!validationResult.IsValid)
            // {
            //     var errors = string.Join("; ", validationResult.Errors);
            //     await SendToDlq(deviceId, payload, $"Schema validation failed: {errors}");
            //     return;
            // }

            // TODO: Get device type and schema for validation
            // For now, use empty string for device type
            var deviceType = "";
            
            // Separate system fields from custom fields
            var systemFields = new HashSet<string>
            {
                "timestamp", "time", "device_id", "deviceId",
                "battery_level", "batteryLevel", "battery",
                "signal_strength", "signalStrength", "rssi",
                "latitude", "lat", "longitude", "lng", "lon",
                "altitude", "alt"
            };
            
            // Create telemetry data with JSONB custom fields
            var telemetry = new TelemetryData
            {
                Time = ExtractTimestamp(telemetryData),
                DeviceId = deviceId,
                TenantId = Guid.Parse(tenantId),
                DeviceType = deviceType,
                
                // Extract system fields
                BatteryLevel = ExtractDouble(telemetryData, "battery_level") 
                    ?? ExtractDouble(telemetryData, "batteryLevel")
                    ?? ExtractDouble(telemetryData, "battery"),
                SignalStrength = ExtractDouble(telemetryData, "signal_strength")
                    ?? ExtractDouble(telemetryData, "signalStrength")
                    ?? ExtractDouble(telemetryData, "rssi"),
                Latitude = ExtractDouble(telemetryData, "latitude")
                    ?? ExtractDouble(telemetryData, "lat"),
                Longitude = ExtractDouble(telemetryData, "longitude")
                    ?? ExtractDouble(telemetryData, "lng")
                    ?? ExtractDouble(telemetryData, "lon"),
                Altitude = ExtractDouble(telemetryData, "altitude")
                    ?? ExtractDouble(telemetryData, "alt"),
                
                // Everything else goes into custom_fields
                CustomFields = telemetryData
                    .Where(kvp => !systemFields.Contains(kvp.Key, StringComparer.OrdinalIgnoreCase))
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => ConvertValue(kvp.Value)
                    )
            };

            // Write to TimescaleDB using scoped repository
            var repository = scope.ServiceProvider.GetRequiredService<ITimeSeriesRepository>();
            await repository.WriteAsync("telemetry", telemetry, cancellationToken);

            _logger.LogInformation("Stored telemetry data for device {DeviceId} at {Timestamp}", 
                deviceId, telemetry.Time);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing telemetry message for device {DeviceId}", deviceId);
            await SendToDlq(deviceId, payload, $"Processing error: {ex.Message}");
        }
    }

    private async Task SendToDlq(string deviceId, string payload, string reason)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dlqService = scope.ServiceProvider.GetRequiredService<IDeadLetterQueueService>();
            await dlqService.PublishAsync(deviceId, payload, reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message to DLQ for device {DeviceId}", deviceId);
        }
    }

    private static DateTimeOffset ExtractTimestamp(Dictionary<string, object> data)
    {
        // Try multiple timestamp field names
        var timestampFields = new[] { "timestamp", "time", "ts", "datetime" };
        
        foreach (var field in timestampFields)
        {
            if (data.TryGetValue(field, out var timestampObj))
            {
                if (timestampObj is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.String)
                {
                    if (DateTimeOffset.TryParse(jsonElement.GetString(), out var timestamp))
                    {
                        return timestamp;
                    }
                }
                else if (timestampObj is string timestampStr)
                {
                    if (DateTimeOffset.TryParse(timestampStr, out var timestamp))
                    {
                        return timestamp;
                    }
                }
                else if (timestampObj is DateTimeOffset dto)
                {
                    return dto;
                }
                else if (timestampObj is DateTime dt)
                {
                    return new DateTimeOffset(dt);
                }
                else if (timestampObj is JsonElement jsonNum && jsonNum.ValueKind == JsonValueKind.Number)
                {
                    if (jsonNum.TryGetInt64(out var unixMs))
                    {
                        return DateTimeOffset.FromUnixTimeMilliseconds(unixMs);
                    }
                }
            }
        }

        return DateTimeOffset.UtcNow;
    }
    
    private static double? ExtractDouble(Dictionary<string, object> data, string key)
    {
        if (!data.TryGetValue(key, out var value))
            return null;
        
        if (value is JsonElement jsonElement)
        {
            if (jsonElement.ValueKind == JsonValueKind.Number)
            {
                return jsonElement.GetDouble();
            }
            if (jsonElement.ValueKind == JsonValueKind.String && double.TryParse(jsonElement.GetString(), out var parsed))
            {
                return parsed;
            }
            return null;
        }
            
        return value switch
        {
            double d => d,
            float f => f,
            int i => i,
            long l => l,
            decimal dec => (double)dec,
            string s when double.TryParse(s, out var parsed) => parsed,
            _ => null
        };
    }

    private object ConvertValue(object value)
    {
        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.String => jsonElement.GetString() ?? string.Empty,
                JsonValueKind.Number => jsonElement.TryGetInt64(out var l) ? l : jsonElement.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => DBNull.Value,
                _ => value
            };
        }
        return value;
    }

    public override void Dispose()
    {
        _consumer?.Close();
        _consumer?.Dispose();
        base.Dispose();
    }
}
