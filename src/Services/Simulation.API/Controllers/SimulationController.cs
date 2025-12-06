using Microsoft.AspNetCore.Mvc;
using Simulation.API.Services;

namespace Simulation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly SimulationService _simulationService;
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(SimulationService simulationService, ILogger<SimulationController> logger)
    {
        _simulationService = simulationService;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartDevice([FromBody] SimulatedDevice device)
    {
        if (string.IsNullOrWhiteSpace(device.DeviceId))
        {
            return BadRequest(new { error = "DeviceId is required" });
        }

        // Set default topic if not provided
        if (string.IsNullOrWhiteSpace(device.Topic))
        {
            device.Topic = $"devices/{device.DeviceId}/telemetry";
        }

        // Validate protocol (currently only MQTT supported)
        if (!string.IsNullOrWhiteSpace(device.Protocol) && device.Protocol.ToLower() != "mqtt")
        {
            return BadRequest(new { error = $"Protocol '{device.Protocol}' not supported. Currently only MQTT is supported." });
        }

        var started = await _simulationService.StartDevice(device);
        if (started)
        {
            _logger.LogInformation("Started simulation for device {DeviceId} on topic {Topic}", device.DeviceId, device.Topic);
            return Ok(new 
            { 
                message = $"Started simulation for device {device.DeviceId}",
                deviceId = device.DeviceId,
                topic = device.Topic,
                interval = device.Interval,
                sensorCount = device.Sensors?.Count ?? 0
            });
        }
        else
        {
            return Conflict(new { error = $"Device {device.DeviceId} is already running" });
        }
    }

    [HttpPost("stop/{deviceId}")]
    public IActionResult StopDevice(string deviceId)
    {
        var stopped = _simulationService.StopDevice(deviceId);
        if (stopped)
        {
            return Ok(new { message = $"Stopped simulation for device {deviceId}" });
        }
        else
        {
            return NotFound(new { error = $"Device {deviceId} is not running" });
        }
    }

    [HttpGet("active")]
    public IActionResult GetActiveDevices()
    {
        var devices = _simulationService.GetActiveDevices();
        return Ok(devices);
    }

    [HttpGet("logs")]
    public IActionResult GetLogs([FromQuery] string? deviceId = null, [FromQuery] int limit = 50)
    {
        var logs = _simulationService.GetLogs(deviceId, limit);
        return Ok(logs);
    }

    [HttpPost("quick-start")]
    public async Task<IActionResult> QuickStart([FromBody] QuickStartRequest request)
    {
        var device = new SimulatedDevice
        {
            DeviceId = request.DeviceId ?? $"SIM-{Guid.NewGuid():N}".Substring(0, 12),
            Name = request.Name ?? "Test Device",
            Interval = request.Interval ?? 5000,
            Sensors = new List<SimulatedSensor>
            {
                new() { Name = "temperature", SensorType = "temperature" },
                new() { Name = "humidity", SensorType = "humidity" },
                new() { Name = "pressure", SensorType = "pressure" }
            }
        };

        var started = await _simulationService.StartDevice(device);
        if (started)
        {
            return Ok(new { message = $"Started quick simulation", deviceId = device.DeviceId });
        }
        else
        {
            return Conflict(new { error = "Device already running" });
        }
    }
}

public class QuickStartRequest
{
    public string? DeviceId { get; set; }
    public string? Name { get; set; }
    public int? Interval { get; set; }
}
