namespace Sensormine.Connectors.MQTT;

using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.Models;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;

/// <summary>
/// External MQTT broker connector for integrating with third-party IoT systems
/// </summary>
public class ExternalMqttConnector : SubscriptionConnectorBase
{
    private readonly ExternalMqttConnectorConfiguration _config;
    private IManagedMqttClient? _mqttClient;
    private readonly Dictionary<string, MqttTopicSubscription> _topicMappings = new();

    /// <summary>
    /// Creates a new External MQTT connector
    /// </summary>
    public ExternalMqttConnector(ExternalMqttConnectorConfiguration configuration, ILogger<ExternalMqttConnector> logger)
        : base(configuration, logger)
    {
        _config = configuration;
    }

    /// <inheritdoc />
    public override ConnectorType Type => ConnectorType.ExternalMqtt;

    /// <inheritdoc />
    public override async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (IsConnected)
        {
            Logger.LogWarning("External MQTT connector {Name} is already connected", Name);
            return;
        }

        try
        {
            Status = ConnectionStatus.Connecting;

            var factory = new MqttFactory();
            _mqttClient = factory.CreateManagedMqttClient();

            // Set up event handlers
            _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;
            _mqttClient.ConnectedAsync += OnConnectedAsync;
            _mqttClient.DisconnectedAsync += OnDisconnectedAsync;
            _mqttClient.ConnectingFailedAsync += OnConnectingFailedAsync;

            // Build client options
            var clientOptions = BuildClientOptions();

            var managedOptions = new ManagedMqttClientOptionsBuilder()
                .WithClientOptions(clientOptions)
                .WithAutoReconnectDelay(TimeSpan.FromMilliseconds(_config.ReconnectIntervalMs))
                .Build();

            // Start the managed client
            await _mqttClient.StartAsync(managedOptions);

            // Wait for initial connection
            var timeout = TimeSpan.FromMilliseconds(_config.ConnectionTimeoutMs);
            var connected = await WaitForConnectionAsync(timeout, cancellationToken);

            if (!connected)
            {
                throw new TimeoutException($"Failed to connect to MQTT broker within {timeout.TotalSeconds} seconds");
            }

            // Subscribe to configured topics
            if (_config.TopicSubscriptions.Count > 0)
            {
                await SubscribeToTopicsAsync(_config.TopicSubscriptions, cancellationToken);
            }

            Status = ConnectionStatus.Connected;
            Logger.LogInformation("External MQTT connector {Name} connected to {Host}:{Port}",
                Name, _config.Host, _config.Port);
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
            Logger.LogError(ex, "Failed to connect External MQTT connector {Name} to {Host}:{Port}",
                Name, _config.Host, _config.Port);
            throw;
        }
    }

    /// <inheritdoc />
    public override async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_mqttClient != null)
        {
            try
            {
                _mqttClient.ApplicationMessageReceivedAsync -= OnMessageReceivedAsync;
                _mqttClient.ConnectedAsync -= OnConnectedAsync;
                _mqttClient.DisconnectedAsync -= OnDisconnectedAsync;
                _mqttClient.ConnectingFailedAsync -= OnConnectingFailedAsync;

                await _mqttClient.StopAsync();
                _mqttClient.Dispose();
                _mqttClient = null;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Error while disconnecting External MQTT connector {Name}", Name);
            }
        }

        _topicMappings.Clear();

        lock (ActiveSubscriptions)
        {
            ActiveSubscriptions.Clear();
        }

        Status = ConnectionStatus.Disconnected;
        Logger.LogInformation("External MQTT connector {Name} disconnected", Name);
    }

    /// <inheritdoc />
    public override async Task SubscribeAsync(IEnumerable<SubscriptionItem> items, CancellationToken cancellationToken = default)
    {
        // This connector uses topic-based subscriptions, not item-based
        // Convert items to topic subscriptions
        foreach (var item in items)
        {
            var topicSub = new MqttTopicSubscription
            {
                Id = item.Id,
                Name = item.Name,
                TopicFilter = item.NodeId,
                QosLevel = 1,
                SchemaId = item.SchemaId
            };

            await SubscribeToTopicAsync(topicSub, cancellationToken);
        }
    }

    /// <inheritdoc />
    public override async Task UnsubscribeAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default)
    {
        if (_mqttClient == null)
        {
            return;
        }

        foreach (var itemId in itemIds)
        {
            var topicFilter = _topicMappings.Values.FirstOrDefault(t => t.Id == itemId)?.TopicFilter;
            if (!string.IsNullOrEmpty(topicFilter))
            {
                await _mqttClient.UnsubscribeAsync(new[] { topicFilter });
                _topicMappings.Remove(topicFilter);

                lock (ActiveSubscriptions)
                {
                    ActiveSubscriptions.RemoveAll(s => s.Id == itemId);
                }

                Logger.LogInformation("Unsubscribed from MQTT topic {Topic}", topicFilter);
            }
        }
    }

    /// <summary>
    /// Subscribe to MQTT topics
    /// </summary>
    public async Task SubscribeToTopicsAsync(IEnumerable<MqttTopicSubscription> subscriptions, CancellationToken cancellationToken = default)
    {
        foreach (var sub in subscriptions)
        {
            await SubscribeToTopicAsync(sub, cancellationToken);
        }
    }

    /// <summary>
    /// Subscribe to a single MQTT topic
    /// </summary>
    public async Task SubscribeToTopicAsync(MqttTopicSubscription subscription, CancellationToken cancellationToken = default)
    {
        if (_mqttClient == null)
        {
            throw new InvalidOperationException("MQTT client is not connected");
        }

        var qos = subscription.QosLevel switch
        {
            0 => MQTTnet.Protocol.MqttQualityOfServiceLevel.AtMostOnce,
            1 => MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce,
            2 => MQTTnet.Protocol.MqttQualityOfServiceLevel.ExactlyOnce,
            _ => MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce
        };

        var topicFilter = new MqttTopicFilterBuilder()
            .WithTopic(subscription.TopicFilter)
            .WithQualityOfServiceLevel(qos)
            .Build();

        await _mqttClient.SubscribeAsync(new[] { topicFilter });

        _topicMappings[subscription.TopicFilter] = subscription;

        lock (ActiveSubscriptions)
        {
            ActiveSubscriptions.Add(new SubscriptionItem
            {
                Id = subscription.Id,
                NodeId = subscription.TopicFilter,
                Name = subscription.Name,
                SchemaId = subscription.SchemaId
            });
        }

        Logger.LogInformation("Subscribed to MQTT topic {Topic} with QoS {QoS}",
            subscription.TopicFilter, subscription.QosLevel);
    }

    /// <summary>
    /// Publish a message to an MQTT topic
    /// </summary>
    public async Task PublishAsync(string topic, string payload, int qos = 1, bool retain = false, CancellationToken cancellationToken = default)
    {
        if (_mqttClient == null)
        {
            throw new InvalidOperationException("MQTT client is not connected");
        }

        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithQualityOfServiceLevel((MQTTnet.Protocol.MqttQualityOfServiceLevel)qos)
            .WithRetainFlag(retain)
            .Build();

        await _mqttClient.EnqueueAsync(message);

        Logger.LogDebug("Published message to topic {Topic}", topic);
    }

    private MqttClientOptions BuildClientOptions()
    {
        var clientId = _config.ClientId ?? $"sensormine_{_config.Id}_{Guid.NewGuid():N}";

        var optionsBuilder = new MqttClientOptionsBuilder()
            .WithTcpServer(_config.Host, _config.Port)
            .WithClientId(clientId)
            .WithCleanSession(_config.CleanSession)
            .WithKeepAlivePeriod(TimeSpan.FromSeconds(_config.KeepAliveSeconds))
            .WithTimeout(TimeSpan.FromMilliseconds(_config.ConnectionTimeoutMs));

        // Add credentials if provided
        if (!string.IsNullOrEmpty(_config.Username))
        {
            optionsBuilder.WithCredentials(_config.Username, _config.Password ?? string.Empty);
        }

        // Configure TLS if enabled
        if (_config.UseTls)
        {
            var tlsOptions = new MqttClientTlsOptions
            {
                UseTls = true,
                AllowUntrustedCertificates = _config.SkipCertificateValidation,
                IgnoreCertificateChainErrors = _config.SkipCertificateValidation,
                IgnoreCertificateRevocationErrors = _config.SkipCertificateValidation
            };

            // Add CA certificate if provided
            if (!string.IsNullOrEmpty(_config.CaCertificatePath) && File.Exists(_config.CaCertificatePath))
            {
                var caCert = new X509Certificate2(_config.CaCertificatePath);
                tlsOptions.CertificateValidationHandler = context =>
                {
                    // Custom certificate validation
                    return true;
                };
            }

            // Add client certificate if provided
            if (!string.IsNullOrEmpty(_config.ClientCertificatePath) && File.Exists(_config.ClientCertificatePath))
            {
                var clientCert = !string.IsNullOrEmpty(_config.ClientPrivateKeyPath)
                    ? new X509Certificate2(_config.ClientCertificatePath)
                    : new X509Certificate2(_config.ClientCertificatePath);

                tlsOptions.ClientCertificatesProvider = new MqttClientCertificateProvider(clientCert);
            }

            optionsBuilder.WithTlsOptions(tlsOptions);
        }

        return optionsBuilder.Build();
    }

    private async Task<bool> WaitForConnectionAsync(TimeSpan timeout, CancellationToken cancellationToken)
    {
        var startTime = DateTime.UtcNow;

        while (DateTime.UtcNow - startTime < timeout)
        {
            if (_mqttClient?.IsConnected == true)
            {
                return true;
            }

            await Task.Delay(100, cancellationToken);
        }

        return _mqttClient?.IsConnected == true;
    }

    private Task OnConnectedAsync(MqttClientConnectedEventArgs e)
    {
        Status = ConnectionStatus.Connected;
        Logger.LogInformation("External MQTT connector {Name} connected to broker", Name);
        return Task.CompletedTask;
    }

    private Task OnDisconnectedAsync(MqttClientDisconnectedEventArgs e)
    {
        if (_config.AutoReconnect && Status != ConnectionStatus.Disconnected)
        {
            Status = ConnectionStatus.Reconnecting;
            Logger.LogWarning("External MQTT connector {Name} disconnected, reconnecting...", Name);
        }
        else
        {
            Status = ConnectionStatus.Disconnected;
            Logger.LogInformation("External MQTT connector {Name} disconnected", Name);
        }

        return Task.CompletedTask;
    }

    private Task OnConnectingFailedAsync(ConnectingFailedEventArgs e)
    {
        SetError(e.Exception?.Message ?? "Connection failed");
        Logger.LogError(e.Exception, "External MQTT connector {Name} failed to connect", Name);
        return Task.CompletedTask;
    }

    private Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        try
        {
            var topic = e.ApplicationMessage.Topic;
            var payload = e.ApplicationMessage.PayloadSegment.Array != null
                ? Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment.Array,
                    e.ApplicationMessage.PayloadSegment.Offset,
                    e.ApplicationMessage.PayloadSegment.Count)
                : string.Empty;

            // Find matching subscription
            var subscription = FindMatchingSubscription(topic);

            var dataPoints = ParsePayload(topic, payload, subscription);

            if (dataPoints.Count > 0)
            {
                RecordSuccess(0);
                OnDataReceived(dataPoints);
            }
        }
        catch (Exception ex)
        {
            RecordFailure(ex.Message);
            Logger.LogError(ex, "Error processing MQTT message from topic {Topic}", e.ApplicationMessage.Topic);
        }

        return Task.CompletedTask;
    }

    private MqttTopicSubscription? FindMatchingSubscription(string topic)
    {
        // Exact match first
        if (_topicMappings.TryGetValue(topic, out var subscription))
        {
            return subscription;
        }

        // Check for wildcard matches
        foreach (var kvp in _topicMappings)
        {
            if (MatchesTopic(kvp.Key, topic))
            {
                return kvp.Value;
            }
        }

        return null;
    }

    private static bool MatchesTopic(string filter, string topic)
    {
        var filterParts = filter.Split('/');
        var topicParts = topic.Split('/');

        for (int i = 0; i < filterParts.Length; i++)
        {
            var filterPart = filterParts[i];

            // Multi-level wildcard matches everything remaining
            if (filterPart == "#")
            {
                return true;
            }

            // Single-level wildcard matches any single level
            if (filterPart == "+")
            {
                if (i >= topicParts.Length)
                {
                    return false;
                }
                continue;
            }

            // Exact match required
            if (i >= topicParts.Length || filterPart != topicParts[i])
            {
                return false;
            }
        }

        return filterParts.Length == topicParts.Length;
    }

    private List<DataPoint> ParsePayload(string topic, string payload, MqttTopicSubscription? subscription)
    {
        var dataPoints = new List<DataPoint>();

        var format = subscription?.PayloadFormat ?? MqttPayloadFormat.Json;

        switch (format)
        {
            case MqttPayloadFormat.Json:
                dataPoints.AddRange(ParseJsonPayload(topic, payload, subscription));
                break;

            case MqttPayloadFormat.String:
                dataPoints.Add(new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = topic,
                    Name = subscription?.Name ?? topic,
                    Value = payload,
                    DataType = DataPointType.String,
                    Quality = DataQuality.Good,
                    SourceTimestamp = DateTimeOffset.UtcNow,
                    ReceivedTimestamp = DateTimeOffset.UtcNow
                });
                break;

            case MqttPayloadFormat.Binary:
                dataPoints.Add(new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = topic,
                    Name = subscription?.Name ?? topic,
                    Value = Convert.FromBase64String(payload),
                    DataType = DataPointType.ByteArray,
                    Quality = DataQuality.Good,
                    SourceTimestamp = DateTimeOffset.UtcNow,
                    ReceivedTimestamp = DateTimeOffset.UtcNow
                });
                break;

            default:
                Logger.LogWarning("Unsupported payload format {Format} for topic {Topic}", format, topic);
                break;
        }

        return dataPoints;
    }

    private List<DataPoint> ParseJsonPayload(string topic, string payload, MqttTopicSubscription? subscription)
    {
        var dataPoints = new List<DataPoint>();

        try
        {
            using var doc = JsonDocument.Parse(payload);
            var root = doc.RootElement;

            // Extract device ID from payload if path is specified
            string? deviceId = null;
            if (!string.IsNullOrEmpty(subscription?.DeviceIdPath))
            {
                deviceId = ExtractJsonValue(root, subscription.DeviceIdPath)?.ToString();
            }

            // Extract timestamp if path is specified
            DateTimeOffset timestamp = DateTimeOffset.UtcNow;
            if (!string.IsNullOrEmpty(subscription?.TimestampPath))
            {
                var tsValue = ExtractJsonValue(root, subscription.TimestampPath);
                if (tsValue is string tsString && DateTimeOffset.TryParse(tsString, out var parsedTs))
                {
                    timestamp = parsedTs;
                }
                else if (tsValue is long tsLong)
                {
                    timestamp = DateTimeOffset.FromUnixTimeMilliseconds(tsLong);
                }
            }

            // If it's an object, create data points for each property
            if (root.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in root.EnumerateObject())
                {
                    // Skip metadata fields
                    if (property.Name.StartsWith("_") ||
                        property.Name == subscription?.DeviceIdPath ||
                        property.Name == subscription?.TimestampPath)
                    {
                        continue;
                    }

                    var (value, dataType) = ParseJsonValue(property.Value);

                    dataPoints.Add(new DataPoint
                    {
                        SourceId = deviceId ?? Id.ToString(),
                        TagId = $"{topic}/{property.Name}",
                        Name = property.Name,
                        Value = value,
                        DataType = dataType,
                        Quality = DataQuality.Good,
                        SourceTimestamp = timestamp,
                        ReceivedTimestamp = DateTimeOffset.UtcNow,
                        Metadata = new Dictionary<string, string>
                        {
                            ["Topic"] = topic,
                            ["SchemaId"] = subscription?.SchemaId ?? string.Empty
                        }
                    });
                }
            }
            else
            {
                // Single value
                var (value, dataType) = ParseJsonValue(root);

                dataPoints.Add(new DataPoint
                {
                    SourceId = deviceId ?? Id.ToString(),
                    TagId = topic,
                    Name = subscription?.Name ?? topic,
                    Value = value,
                    DataType = dataType,
                    Quality = DataQuality.Good,
                    SourceTimestamp = timestamp,
                    ReceivedTimestamp = DateTimeOffset.UtcNow
                });
            }
        }
        catch (JsonException ex)
        {
            Logger.LogWarning(ex, "Failed to parse JSON payload from topic {Topic}", topic);

            // Return raw payload as string
            dataPoints.Add(new DataPoint
            {
                SourceId = Id.ToString(),
                TagId = topic,
                Name = subscription?.Name ?? topic,
                Value = payload,
                DataType = DataPointType.String,
                Quality = DataQuality.Uncertain,
                SourceTimestamp = DateTimeOffset.UtcNow,
                ReceivedTimestamp = DateTimeOffset.UtcNow
            });
        }

        return dataPoints;
    }

    private static object? ExtractJsonValue(JsonElement element, string path)
    {
        var parts = path.Split('.');
        var current = element;

        foreach (var part in parts)
        {
            if (current.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (!current.TryGetProperty(part, out current))
            {
                return null;
            }
        }

        return ParseJsonValue(current).Value;
    }

    private static (object? Value, DataPointType DataType) ParseJsonValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.True => (true, DataPointType.Boolean),
            JsonValueKind.False => (false, DataPointType.Boolean),
            JsonValueKind.Number when element.TryGetInt64(out var l) => (l, DataPointType.Int64),
            JsonValueKind.Number when element.TryGetDouble(out var d) => (d, DataPointType.Double),
            JsonValueKind.String => (element.GetString(), DataPointType.String),
            JsonValueKind.Array => (element.GetRawText(), DataPointType.Array),
            JsonValueKind.Object => (element.GetRawText(), DataPointType.String),
            JsonValueKind.Null => (null, DataPointType.Unknown),
            _ => (null, DataPointType.Unknown)
        };
    }

    /// <summary>
    /// Custom certificate provider for MQTT TLS
    /// </summary>
    private class MqttClientCertificateProvider : IMqttClientCertificatesProvider
    {
        private readonly X509Certificate2 _certificate;

        public MqttClientCertificateProvider(X509Certificate2 certificate)
        {
            _certificate = certificate;
        }

        public X509CertificateCollection GetCertificates()
        {
            return new X509CertificateCollection { _certificate };
        }
    }
}
