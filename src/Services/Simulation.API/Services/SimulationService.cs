using MQTTnet;
using MQTTnet.Client;
using System.Text;
using System.Text.Json;
using System.Collections.Concurrent;

namespace Simulation.API.Services;

public class SimulationService : BackgroundService
{
    private readonly ILogger<SimulationService> _logger;
    private readonly IConfiguration _configuration;
    private IMqttClient? _mqttClient;
    private readonly ConcurrentDictionary<string, SimulatedDevice> _activeDevices = new();
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _deviceCancellations = new();
    private readonly ConcurrentQueue<SimulationLogEntry> _messageLogs = new();
    private const int MaxLogEntries = 100;

    public SimulationService(ILogger<SimulationService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var mqttServer = _configuration["Mqtt:Server"] ?? "localhost";
        var mqttPort = int.Parse(_configuration["Mqtt:Port"] ?? "1883");

        var factory = new MqttFactory();
        _mqttClient = factory.CreateMqttClient();

        var options = new MqttClientOptionsBuilder()
            .WithTcpServer(mqttServer, mqttPort)
            .WithClientId($"simulator-{Guid.NewGuid()}")
            .WithCleanSession()
            .Build();

        try
        {
            await _mqttClient.ConnectAsync(options, stoppingToken);
            _logger.LogInformation("Connected to MQTT broker at {Server}:{Port}", mqttServer, mqttPort);

            // Keep the service running until cancellation is requested
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Expected when service is stopping
            _logger.LogInformation("Simulation service is shutting down");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in simulation service");
        }
        finally
        {
            // Clean up all active device simulations
            foreach (var deviceId in _deviceCancellations.Keys.ToList())
            {
                StopDevice(deviceId);
            }

            if (_mqttClient?.IsConnected == true)
            {
                await _mqttClient.DisconnectAsync();
            }
        }
    }

    public async Task<bool> StartDevice(SimulatedDevice device)
    {
        if (_activeDevices.ContainsKey(device.DeviceId))
        {
            _logger.LogWarning("Device {DeviceId} is already running", device.DeviceId);
            return false;
        }

        _activeDevices[device.DeviceId] = device;
        var cts = new CancellationTokenSource();
        _deviceCancellations[device.DeviceId] = cts;

        _ = Task.Run(async () => await SimulateDeviceAsync(device, cts.Token), cts.Token);

        _logger.LogInformation("Started simulation for device {DeviceId}", device.DeviceId);
        return true;
    }

    public bool StopDevice(string deviceId)
    {
        if (_deviceCancellations.TryRemove(deviceId, out var cts))
        {
            cts.Cancel();
            _activeDevices.TryRemove(deviceId, out _);
            _logger.LogInformation("Stopped simulation for device {DeviceId}", deviceId);
            return true;
        }
        return false;
    }

    public List<SimulatedDevice> GetActiveDevices()
    {
        return _activeDevices.Values.ToList();
    }

    public List<SimulationLogEntry> GetLogs(string? deviceId = null, int limit = 50)
    {
        var logs = _messageLogs.ToList();
        
        if (!string.IsNullOrWhiteSpace(deviceId))
        {
            logs = logs.Where(l => l.DeviceId == deviceId).ToList();
        }

        return logs.OrderByDescending(l => l.Timestamp).Take(limit).ToList();
    }

    /// <summary>
    /// Publish a single message to MQTT (on-demand from UI)
    /// </summary>
    public async Task<PublishResult> PublishMessage(string topic, Dictionary<string, object> payload, string? deviceId = null)
    {
        try
        {
            if (_mqttClient?.IsConnected != true)
            {
                _logger.LogWarning("MQTT client not connected, cannot publish message");
                return new PublishResult 
                { 
                    Success = false, 
                    Error = "MQTT client not connected" 
                };
            }

            var payloadJson = JsonSerializer.Serialize(payload);

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payloadJson)
                .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message, CancellationToken.None);

            var timestamp = DateTime.UtcNow;
            _logger.LogInformation("Published telemetry to {Topic} for device {DeviceId}", topic, deviceId ?? "N/A");

            // Add to message log
            _messageLogs.Enqueue(new SimulationLogEntry
            {
                Timestamp = timestamp,
                DeviceId = deviceId ?? "manual",
                Topic = topic,
                Payload = payloadJson,
                Status = "success"
            });

            // Keep only last MaxLogEntries
            while (_messageLogs.Count > MaxLogEntries)
            {
                _messageLogs.TryDequeue(out _);
            }

            return new PublishResult 
            { 
                Success = true, 
                Timestamp = timestamp 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing message to {Topic}", topic);
            return new PublishResult 
            { 
                Success = false, 
                Error = ex.Message 
            };
        }
    }

    private double GenerateSensorValue(SimulatedSensor sensor, Random random)
    {
        // Use custom range if provided
        if (sensor.MinValue.HasValue && sensor.MaxValue.HasValue)
        {
            var range = sensor.MaxValue.Value - sensor.MinValue.Value;
            return sensor.MinValue.Value + (random.NextDouble() * range);
        }

        // Default ranges by sensor type
        return sensor.SensorType switch
        {
            "temperature" => random.Next(15, 35) + random.NextDouble(),
            "humidity" => random.Next(30, 80) + random.NextDouble(),
            "pressure" => random.Next(980, 1020) + random.NextDouble(),
            "flow" => random.Next(0, 100) + random.NextDouble(),
            "level" => random.Next(0, 100) + random.NextDouble(),
            "vibration" => random.NextDouble() * 10,
            "voltage" => random.Next(220, 240) + random.NextDouble(),
            "current" => random.Next(0, 20) + random.NextDouble(),
            "power" => random.Next(1000, 5000) + random.NextDouble(),
            "speed" => random.Next(0, 3000) + random.NextDouble(),
            "position" => random.Next(0, 360) + random.NextDouble(),
            "ph" => random.Next(0, 14) + random.NextDouble(),
            "co2" => random.Next(300, 1000) + random.NextDouble(),
            "light" => random.Next(0, 1000) + random.NextDouble(),
            _ => random.NextDouble() * 100
        };
    }

    private async Task SimulateDeviceAsync(SimulatedDevice device, CancellationToken cancellationToken)
    {
        var random = new Random();

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                if (_mqttClient?.IsConnected != true)
                {
                    _logger.LogWarning("MQTT client not connected, skipping message for {DeviceId}", device.DeviceId);
                    await Task.Delay(5000, cancellationToken);
                    continue;
                }

                Dictionary<string, object> telemetry;

                // Use custom payload if provided, otherwise generate sensor data
                if (device.CustomPayload != null && device.CustomPayload.Count > 0)
                {
                    telemetry = new Dictionary<string, object>(device.CustomPayload);
                    
                    // Update dynamic values in custom payload
                    foreach (var sensor in device.Sensors)
                    {
                        if (telemetry.ContainsKey(sensor.Name))
                        {
                            telemetry[sensor.Name] = GenerateSensorValue(sensor, random);
                        }
                    }
                }
                else
                {
                    // Default behavior: generate telemetry from sensors
                    telemetry = new Dictionary<string, object>();

                    foreach (var sensor in device.Sensors)
                    {
                        telemetry[sensor.Name] = GenerateSensorValue(sensor, random);
                    }

                    telemetry["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    telemetry["deviceId"] = device.DeviceId;
                }

                var payload = JsonSerializer.Serialize(telemetry);
                var topic = !string.IsNullOrWhiteSpace(device.Topic) 
                    ? device.Topic 
                    : $"devices/{device.DeviceId}/telemetry";

                var message = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(payload)
                    .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build();

                await _mqttClient.PublishAsync(message, cancellationToken);

                _logger.LogDebug("Published telemetry for {DeviceId} to {Topic}", device.DeviceId, topic);

                // Add to message log
                _messageLogs.Enqueue(new SimulationLogEntry
                {
                    Timestamp = DateTime.UtcNow,
                    DeviceId = device.DeviceId,
                    Topic = topic,
                    Payload = payload,
                    Status = "success"
                });

                // Keep only last MaxLogEntries
                while (_messageLogs.Count > MaxLogEntries)
                {
                    _messageLogs.TryDequeue(out _);
                }

                await Task.Delay(device.Interval, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error simulating device {DeviceId}", device.DeviceId);
                await Task.Delay(5000, cancellationToken);
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        foreach (var cts in _deviceCancellations.Values)
        {
            cts.Cancel();
        }

        if (_mqttClient?.IsConnected == true)
        {
            await _mqttClient.DisconnectAsync(cancellationToken: cancellationToken);
        }

        await base.StopAsync(cancellationToken);
    }
}

public class SimulatedDevice
{
    public string DeviceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Protocol { get; set; } = "mqtt";
    public int Interval { get; set; } = 5000; // milliseconds
    public string Topic { get; set; } = string.Empty;
    public List<SimulatedSensor> Sensors { get; set; } = new();
    public Dictionary<string, object>? CustomPayload { get; set; }
}

public class SimulatedSensor
{
    public string Name { get; set; } = string.Empty;
    public string SensorType { get; set; } = string.Empty;
    public double? MinValue { get; set; }
    public double? MaxValue { get; set; }
    public string? Unit { get; set; }
}

public class SimulationLogEntry
{
    public DateTime Timestamp { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class PublishResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; }
}
