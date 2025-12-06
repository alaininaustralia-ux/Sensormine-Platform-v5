using MQTTnet;
using MQTTnet.Client;
using System.Text;
using System.Text.Json;
using Confluent.Kafka;

namespace Edge.Gateway.Services;

/// <summary>
/// MQTT service that subscribes to device telemetry and forwards to Kafka
/// </summary>
public class MqttService : BackgroundService
{
    private readonly ILogger<MqttService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private IMqttClient? _mqttClient;
    private IProducer<string, string>? _kafkaProducer;
    private readonly bool _enableRateLimiting;

    public MqttService(
        ILogger<MqttService> logger, 
        IConfiguration configuration,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _configuration = configuration;
        _serviceProvider = serviceProvider;
        _enableRateLimiting = _configuration.GetValue<bool>("RateLimiting:Enabled", true);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Initialize Kafka producer
            var kafkaConfig = new ProducerConfig
            {
                BootstrapServers = _configuration["Kafka:BootstrapServers"] ?? "localhost:9092"
            };
            _kafkaProducer = new ProducerBuilder<string, string>(kafkaConfig).Build();
            _logger.LogInformation("Kafka producer initialized: {Servers}", kafkaConfig.BootstrapServers);

            // Create MQTT client
            var mqttFactory = new MqttFactory();
            _mqttClient = mqttFactory.CreateMqttClient();

            // Configure MQTT client options
            var mqttHost = _configuration["Mqtt:Host"] ?? "localhost";
            var mqttPort = _configuration.GetValue<int>("Mqtt:Port", 1883);
            
            var mqttOptions = new MqttClientOptionsBuilder()
                .WithTcpServer(mqttHost, mqttPort)
                .WithClientId("EdgeGateway-" + Guid.NewGuid())
                .WithCleanSession()
                .Build();

            // Subscribe to message received event
            _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceived;

            // Connect to MQTT broker
            await _mqttClient.ConnectAsync(mqttOptions, stoppingToken);
            _logger.LogInformation("MQTT client connected to {Host}:{Port}", mqttHost, mqttPort);

            // Subscribe to device telemetry topics
            var subscribeOptions = mqttFactory.CreateSubscribeOptionsBuilder()
                .WithTopicFilter("devices/+/telemetry")
                .WithTopicFilter("sensormine/devices/+/telemetry")
                .Build();

            await _mqttClient.SubscribeAsync(subscribeOptions, stoppingToken);
            _logger.LogInformation("Subscribed to MQTT topics: devices/+/telemetry, sensormine/devices/+/telemetry");

            // Keep running until cancellation
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("MQTT service is shutting down");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in MQTT service");
            throw;
        }
    }

    private async Task OnMessageReceived(MqttApplicationMessageReceivedEventArgs args)
    {
        try
        {
            var topic = args.ApplicationMessage.Topic;
            var payload = Encoding.UTF8.GetString(args.ApplicationMessage.PayloadSegment);
            var deviceId = ExtractDeviceId(topic);

            _logger.LogInformation("Received message from device {DeviceId} on topic {Topic}", deviceId, topic);

            // Check rate limiting
            if (_enableRateLimiting)
            {
                using var scope = _serviceProvider.CreateScope();
                var rateLimiter = scope.ServiceProvider.GetRequiredService<IRateLimiterService>();
                
                if (!await rateLimiter.AllowRequestAsync(deviceId))
                {
                    _logger.LogWarning("Rate limit exceeded for device {DeviceId}, message dropped", deviceId);
                    return;
                }
            }

            // Support batch messages (JSON array)
            var messages = ParseMessages(payload, deviceId);

            // Forward to Kafka
            if (_kafkaProducer != null)
            {
                var kafkaTopic = _configuration["Kafka:TelemetryTopic"] ?? "telemetry.raw";
                
                foreach (var msg in messages)
                {
                    var message = new Message<string, string>
                    {
                        Key = msg.DeviceId,
                        Value = msg.Payload,
                        Headers = new Headers
                        {
                            { "mqtt-topic", Encoding.UTF8.GetBytes(topic) },
                            { "timestamp", Encoding.UTF8.GetBytes(DateTimeOffset.UtcNow.ToString("O")) }
                        }
                    };

                    var result = await _kafkaProducer.ProduceAsync(kafkaTopic, message);
                    _logger.LogInformation("Forwarded to Kafka topic {Topic}, partition {Partition}, offset {Offset}", 
                        result.Topic, result.Partition.Value, result.Offset.Value);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MQTT message");
        }
    }

    private List<(string DeviceId, string Payload)> ParseMessages(string payload, string deviceId)
    {
        var messages = new List<(string DeviceId, string Payload)>();

        try
        {
            using var doc = JsonDocument.Parse(payload);
            
            // Check if it's an array (batch)
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    messages.Add((deviceId, element.GetRawText()));
                }
            }
            else
            {
                // Single message
                messages.Add((deviceId, payload));
            }
        }
        catch
        {
            // If not JSON or parse error, treat as single message
            messages.Add((deviceId, payload));
        }

        return messages;
    }

    private string ExtractDeviceId(string topic)
    {
        // Extract device ID from Azure-style topic pattern: devices/{deviceId}/telemetry
        // Also supports legacy pattern: sensormine/devices/{deviceId}/telemetry
        var parts = topic.Split('/');
        
        // Check for Azure-style: devices/{deviceId}/telemetry (deviceId at index 1)
        if (parts.Length >= 3 && parts[0] == "devices")
        {
            return parts[1];
        }
        
        // Check for legacy: sensormine/devices/{deviceId}/telemetry (deviceId at index 2)
        if (parts.Length >= 4 && parts[1] == "devices")
        {
            return parts[2];
        }
        
        return "unknown";
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping MQTT service...");

        if (_mqttClient != null && _mqttClient.IsConnected)
        {
            await _mqttClient.DisconnectAsync(cancellationToken: cancellationToken);
            _mqttClient.Dispose();
        }

        _kafkaProducer?.Dispose();

        await base.StopAsync(cancellationToken);
    }
}
