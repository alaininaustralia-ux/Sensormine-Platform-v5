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

            // Create time-series data
            var timeSeriesData = new TimeSeriesData
            {
                DeviceId = deviceId,
                TenantId = tenantId,
                Timestamp = ExtractTimestamp(telemetryData),
                Values = telemetryData.ToDictionary(
                    kvp => kvp.Key,
                    kvp => ConvertValue(kvp.Value)
                )
            };

            // Write to TimescaleDB using scoped repository
            var repository = scope.ServiceProvider.GetRequiredService<ITimeSeriesRepository>();
            await repository.WriteAsync("telemetry", timeSeriesData, cancellationToken);

            _logger.LogInformation("Stored telemetry data for device {DeviceId} at {Timestamp}", 
                deviceId, timeSeriesData.Timestamp);
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

    private DateTimeOffset ExtractTimestamp(Dictionary<string, object> data)
    {
        if (data.TryGetValue("timestamp", out var timestampObj))
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
        }

        return DateTimeOffset.UtcNow;
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
