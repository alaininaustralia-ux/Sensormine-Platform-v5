using Confluent.Kafka;
using System.Text.Json;

namespace Ingestion.Service.Services;

/// <summary>
/// Service for publishing failed messages to a dead letter queue
/// </summary>
public interface IDeadLetterQueueService
{
    Task PublishAsync(string deviceId, string payload, string reason, Dictionary<string, string>? metadata = null);
}

public class DeadLetterQueueService : IDeadLetterQueueService, IDisposable
{
    private readonly ILogger<DeadLetterQueueService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IProducer<string, string> _producer;
    private readonly string _dlqTopic;

    public DeadLetterQueueService(
        ILogger<DeadLetterQueueService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        var kafkaConfig = new ProducerConfig
        {
            BootstrapServers = _configuration["Kafka:BootstrapServers"] ?? "localhost:9092"
        };

        _producer = new ProducerBuilder<string, string>(kafkaConfig).Build();
        _dlqTopic = _configuration["Kafka:DeadLetterTopic"] ?? "telemetry.dlq";
    }

    public async Task PublishAsync(
        string deviceId,
        string payload,
        string reason,
        Dictionary<string, string>? metadata = null)
    {
        try
        {
            var dlqMessage = new
            {
                deviceId,
                payload,
                reason,
                timestamp = DateTimeOffset.UtcNow,
                metadata
            };

            var dlqPayload = JsonSerializer.Serialize(dlqMessage);

            var message = new Message<string, string>
            {
                Key = deviceId,
                Value = dlqPayload,
                Headers = new Headers
                {
                    { "error-reason", System.Text.Encoding.UTF8.GetBytes(reason) },
                    { "original-timestamp", System.Text.Encoding.UTF8.GetBytes(DateTimeOffset.UtcNow.ToString("O")) }
                }
            };

            await _producer.ProduceAsync(_dlqTopic, message);

            _logger.LogWarning(
                "Message sent to DLQ for device {DeviceId}. Reason: {Reason}",
                deviceId,
                reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish message to DLQ for device {DeviceId}", deviceId);
        }
    }

    public void Dispose()
    {
        _producer?.Dispose();
    }
}
