using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Confluent.Kafka;

namespace Edge.Gateway.Controllers;

/// <summary>
/// HTTP endpoint for telemetry ingestion from browser-based simulators
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly ILogger<TelemetryController> _logger;
    private readonly IConfiguration _configuration;
    private static IProducer<string, string>? _kafkaProducer;
    private static readonly object _lock = new();

    public TelemetryController(
        ILogger<TelemetryController> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        
        // Initialize Kafka producer (singleton pattern)
        if (_kafkaProducer == null)
        {
            lock (_lock)
            {
                if (_kafkaProducer == null)
                {
                    var kafkaConfig = new ProducerConfig
                    {
                        BootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092"
                    };
                    _kafkaProducer = new ProducerBuilder<string, string>(kafkaConfig).Build();
                    _logger.LogInformation("Kafka producer initialized for HTTP telemetry ingestion");
                }
            }
        }
    }

    /// <summary>
    /// Publish telemetry data via HTTP POST
    /// </summary>
    /// <param name="deviceId">Device identifier</param>
    /// <param name="payload">Telemetry payload</param>
    [HttpPost("devices/{deviceId}")]
    public async Task<IActionResult> PublishTelemetry(
        string deviceId,
        [FromBody] JsonElement payload)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                return BadRequest(new { error = "Device ID is required" });
            }

            // Validate payload
            if (payload.ValueKind == JsonValueKind.Undefined || payload.ValueKind == JsonValueKind.Null)
            {
                return BadRequest(new { error = "Payload is required" });
            }

            // Convert payload to JSON string
            var payloadJson = JsonSerializer.Serialize(payload);

            // Get Kafka topic from configuration
            var kafkaTopic = _configuration["Kafka:TelemetryTopic"] ?? "telemetry.raw";

            // Publish to Kafka
            var message = new Message<string, string>
            {
                Key = deviceId,
                Value = payloadJson,
                Timestamp = Timestamp.Default
            };

            var result = await _kafkaProducer!.ProduceAsync(kafkaTopic, message);

            _logger.LogInformation(
                "Telemetry received via HTTP from device {DeviceId} and forwarded to Kafka topic {Topic} at offset {Offset}",
                deviceId,
                kafkaTopic,
                result.Offset);

            return Ok(new
            {
                success = true,
                deviceId,
                timestamp = DateTime.UtcNow,
                bytesReceived = payloadJson.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing telemetry for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Bulk publish telemetry data from multiple devices
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> PublishBulkTelemetry(
        [FromBody] BulkTelemetryRequest request)
    {
        try
        {
            if (request.Messages == null || !request.Messages.Any())
            {
                return BadRequest(new { error = "At least one message is required" });
            }

            var kafkaTopic = _configuration["Kafka:TelemetryTopic"] ?? "telemetry.raw";
            var results = new List<object>();

            foreach (var msg in request.Messages)
            {
                if (string.IsNullOrWhiteSpace(msg.DeviceId))
                {
                    results.Add(new { deviceId = msg.DeviceId, success = false, error = "Device ID is required" });
                    continue;
                }

                try
                {
                    var payloadJson = JsonSerializer.Serialize(msg.Payload);
                    var message = new Message<string, string>
                    {
                        Key = msg.DeviceId,
                        Value = payloadJson,
                        Timestamp = Timestamp.Default
                    };

                    var result = await _kafkaProducer!.ProduceAsync(kafkaTopic, message);
                    results.Add(new { deviceId = msg.DeviceId, success = true, offset = result.Offset.Value });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing bulk telemetry for device {DeviceId}", msg.DeviceId);
                    results.Add(new { deviceId = msg.DeviceId, success = false, error = ex.Message });
                }
            }

            _logger.LogInformation("Bulk telemetry processed: {Total} messages, {Success} successful",
                request.Messages.Count,
                results.Count(r => r.GetType().GetProperty("success")?.GetValue(r) as bool? == true));

            return Ok(new
            {
                success = true,
                processed = results.Count,
                results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing bulk telemetry");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}

/// <summary>
/// Request model for bulk telemetry publishing
/// </summary>
public class BulkTelemetryRequest
{
    public List<TelemetryMessage> Messages { get; set; } = new();
}

/// <summary>
/// Individual telemetry message
/// </summary>
public class TelemetryMessage
{
    public string DeviceId { get; set; } = string.Empty;
    public JsonElement Payload { get; set; }
}
