using MQTTnet;
using MQTTnet.Server;
using System.Text;
using System.Text.Json;
using Confluent.Kafka;

namespace Edge.Gateway.Services;

/// <summary>
/// MQTT service that receives device telemetry and forwards to Kafka
/// </summary>
public class MqttService : BackgroundService
{
    private readonly ILogger<MqttService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private MqttServer? _mqttServer;
    private IProducer<string, string>? _kafkaProducer;
    private readonly bool _enableAuthentication;
    private readonly bool _enableRateLimiting;

    public MqttService(
        ILogger<MqttService> logger, 
        IConfiguration configuration,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _configuration = configuration;
        _serviceProvider = serviceProvider;
        _enableAuthentication = _configuration.GetValue<bool>("Authentication:Enabled", false);
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

            // Create MQTT server
            var mqttFactory = new MqttFactory();
            _mqttServer = mqttFactory.CreateMqttServer(ConfigureMqttServer());

            // Subscribe to events
            _mqttServer.InterceptingPublishAsync += OnMessageReceived;
            
            // Configure authentication if enabled
            if (_enableAuthentication)
            {
                _mqttServer.ValidatingConnectionAsync += OnValidatingConnection;
            }

            // Start MQTT server
            await _mqttServer.StartAsync();
            _logger.LogInformation("MQTT server started on port 1883 (Authentication: {Auth}, RateLimiting: {RateLimit})", 
                _enableAuthentication ? "Enabled" : "Disabled",
                _enableRateLimiting ? "Enabled" : "Disabled");

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

    private MqttServerOptions ConfigureMqttServer()
    {
        var optionsBuilder = new MqttServerOptionsBuilder()
            .WithDefaultEndpoint()
            .WithDefaultEndpointPort(1883);

        var options = optionsBuilder.Build();

        // Note: Authentication will be handled via ValidatingConnectionAsync event
        // Configure in ExecuteAsync after server is created

        return options;
    }

    private async Task OnMessageReceived(InterceptingPublishEventArgs args)
    {
        try
        {
            var topic = args.ApplicationMessage.Topic;
            var payload = Encoding.UTF8.GetString(args.ApplicationMessage.PayloadSegment);
            var deviceId = ExtractDeviceId(topic);

            _logger.LogDebug("Received message from device {DeviceId} on topic {Topic}", deviceId, topic);

            // Check rate limiting
            if (_enableRateLimiting)
            {
                using var scope = _serviceProvider.CreateScope();
                var rateLimiter = scope.ServiceProvider.GetRequiredService<IRateLimiterService>();
                
                if (!await rateLimiter.AllowRequestAsync(deviceId))
                {
                    _logger.LogWarning("Rate limit exceeded for device {DeviceId}, message dropped", deviceId);
                    args.ProcessPublish = false;
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
                    _logger.LogDebug("Forwarded to Kafka topic {Topic}, partition {Partition}, offset {Offset}", 
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

    private async Task OnValidatingConnection(ValidatingConnectionEventArgs args)
    {
        try
        {
            var deviceId = args.ClientId;
            var username = args.UserName;
            // Password is string in MQTTnet v4
            var password = args.Password != null ? Encoding.UTF8.GetString(Encoding.UTF8.GetBytes(args.Password)) : null;

            using var scope = _serviceProvider.CreateScope();
            var deviceApiClient = scope.ServiceProvider.GetRequiredService<IDeviceApiClient>();
            
            var isAuthenticated = await deviceApiClient.AuthenticateDeviceAsync(
                deviceId,
                username,
                args.Password, // Use directly as string
                CancellationToken.None);

            args.ReasonCode = isAuthenticated
                ? MQTTnet.Protocol.MqttConnectReasonCode.Success
                : MQTTnet.Protocol.MqttConnectReasonCode.BadUserNameOrPassword;
            
            _logger.LogInformation("Authentication attempt for device {DeviceId}: {Result}", 
                deviceId, 
                isAuthenticated ? "Success" : "Failed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating connection for client {ClientId}", args.ClientId);
            args.ReasonCode = MQTTnet.Protocol.MqttConnectReasonCode.ServerUnavailable;
        }
    }

    private string ExtractDeviceId(string topic)
    {
        // Extract device ID from topic pattern: sensormine/devices/{deviceId}/telemetry
        var parts = topic.Split('/');
        return parts.Length >= 3 ? parts[2] : "unknown";
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping MQTT service...");

        if (_mqttServer != null)
        {
            await _mqttServer.StopAsync();
            _mqttServer.Dispose();
        }

        _kafkaProducer?.Dispose();

        await base.StopAsync(cancellationToken);
    }
}
