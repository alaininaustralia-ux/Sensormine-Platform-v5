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
            // DEBUG: Log raw Kafka payload
            _logger.LogWarning("[INGESTION.SERVICE] Raw Kafka Payload for device {DeviceId}: {Payload}", 
                deviceId, payload);
            
            _logger.LogDebug("Processing message from device {DeviceId}: {Payload}", deviceId, payload);

            // Extract tenant ID from Kafka message headers (set by Edge Gateway from MQTT topic)
            var tenantId = "00000000-0000-0000-0000-000000000001"; // Default tenant
            if (message.Headers != null)
            {
                _logger.LogInformation("Message has {HeaderCount} headers", message.Headers.Count);
                foreach (var header in message.Headers)
                {
                    _logger.LogInformation("Header: {Key} = {Value}", header.Key, System.Text.Encoding.UTF8.GetString(header.GetValueBytes()));
                }
                
                var tenantHeader = message.Headers.FirstOrDefault(h => h.Key == "tenant-id");
                if (tenantHeader != null)
                {
                    tenantId = System.Text.Encoding.UTF8.GetString(tenantHeader.GetValueBytes());
                    _logger.LogInformation("Extracted tenant ID from message header: {TenantId}", tenantId);
                }
                else
                {
                    _logger.LogWarning("No tenant-id header found, using default: {TenantId}", tenantId);
                }
            }
            else
            {
                _logger.LogWarning("Message has no headers, using default tenant: {TenantId}", tenantId);
            }

            // Parse JSON payload
            var telemetryData = JsonSerializer.Deserialize<Dictionary<string, object>>(payload);
            if (telemetryData == null)
            {
                await SendToDlq(deviceId, payload, "Failed to parse JSON payload");
                return;
            }
            
            // DEBUG: Log parsed telemetry structure
            _logger.LogWarning("[INGESTION.SERVICE] Parsed telemetry keys: {Keys}", 
                string.Join(", ", telemetryData.Keys));
            if (telemetryData.ContainsKey("customFields"))
            {
                _logger.LogWarning("[INGESTION.SERVICE] Found 'customFields' key! Value type: {Type}, Value: {Value}",
                    telemetryData["customFields"]?.GetType().Name ?? "null",
                    telemetryData["customFields"]);
            }

            // Get device tenant information
            using var scope = _serviceProvider.CreateScope();
            
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
                "timestamp", "time", "device_id", "deviceId", "deviceType", "device_type",
                "battery_level", "batteryLevel", "battery",
                "signal_strength", "signalStrength", "rssi",
                "latitude", "lat", "longitude", "lng", "lon",
                "altitude", "alt"
                // NOTE: "customFields" is NOT in this list - it's handled specially in ExtractCustomFields
            };
            
            // Create telemetry data with JSONB custom fields
            // Parse deviceId as Guid (now UUID in database)
            if (!Guid.TryParse(deviceId, out var deviceGuid))
            {
                _logger.LogError("Invalid device ID format (must be GUID): {DeviceId}", deviceId);
                await SendToDlq(deviceId, payload, "Invalid device ID format (must be GUID)");
                return;
            }
            
            var telemetry = new TelemetryData
            {
                Time = ExtractTimestamp(telemetryData),
                DeviceId = deviceGuid,
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
                CustomFields = ExtractCustomFields(telemetryData, systemFields)
            };
            
            // DEBUG: Log final customFields structure
            _logger.LogWarning("[INGESTION.SERVICE] Final customFields keys: {Keys}",
                string.Join(", ", telemetry.CustomFields.Keys));
            _logger.LogWarning("[INGESTION.SERVICE] CustomFields JSON: {Json}",
                JsonSerializer.Serialize(telemetry.CustomFields));

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

    private Dictionary<string, object> ExtractCustomFields(Dictionary<string, object> telemetryData, HashSet<string> systemFields)
    {
        var customFields = new Dictionary<string, object>();
        
        foreach (var kvp in telemetryData.Where(kvp => !systemFields.Contains(kvp.Key, StringComparer.OrdinalIgnoreCase)))
        {
            // Special handling for nested customFields JSON string
            if (kvp.Key.Equals("customFields", StringComparison.OrdinalIgnoreCase))
            {
                var nestedValue = ConvertValue(kvp.Value);
                if (nestedValue is string jsonString)
                {
                    try
                    {
                        // Parse the nested JSON string
                        var nestedData = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonString);
                        if (nestedData != null)
                        {
                            // Flatten nested fields into root
                            foreach (var nested in nestedData)
                            {
                                customFields[nested.Key] = ConvertValue(nested.Value);
                            }
                        }
                        continue;
                    }
                    catch
                    {
                        // If parsing fails, just add as string
                        customFields[kvp.Key] = nestedValue;
                    }
                }
            }
            
            customFields[kvp.Key] = ConvertValue(kvp.Value);
        }
        
        return customFields;
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
                JsonValueKind.Object => ConvertJsonObject(jsonElement),
                JsonValueKind.Array => ConvertJsonArray(jsonElement),
                _ => value
            };
        }
        return value;
    }

    private Dictionary<string, object> ConvertJsonObject(JsonElement jsonElement)
    {
        var result = new Dictionary<string, object>();
        foreach (var property in jsonElement.EnumerateObject())
        {
            result[property.Name] = ConvertValue(property.Value);
        }
        return result;
    }

    private List<object> ConvertJsonArray(JsonElement jsonElement)
    {
        var result = new List<object>();
        foreach (var item in jsonElement.EnumerateArray())
        {
            result.Add(ConvertValue(item));
        }
        return result;
    }

    public override void Dispose()
    {
        _consumer?.Close();
        _consumer?.Dispose();
        base.Dispose();
    }
}
