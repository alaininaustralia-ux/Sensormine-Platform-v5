namespace Query.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Interfaces;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.Repositories;
using Query.API.GraphQL;
using Query.API.Services;

/// <summary>
/// Controller for querying devices with their latest telemetry data
/// </summary>
[ApiController]
[Route("api/devices-with-telemetry")]
[Produces("application/json")]
public class DevicesWithTelemetryController : ControllerBase
{
    private readonly ITimeSeriesRepository _timeSeriesRepository;
    private readonly IDeviceRepository _deviceRepository;
    private readonly ITenantProvider _tenantProvider;
    private readonly ITelemetryParserService _telemetryParser;
    private readonly ILogger<DevicesWithTelemetryController> _logger;

    public DevicesWithTelemetryController(
        ITimeSeriesRepository timeSeriesRepository,
        IDeviceRepository deviceRepository,
        ITenantProvider tenantProvider,
        ITelemetryParserService telemetryParser,
        ILogger<DevicesWithTelemetryController> logger)
    {
        _timeSeriesRepository = timeSeriesRepository;
        _deviceRepository = deviceRepository;
        _tenantProvider = tenantProvider;
        _telemetryParser = telemetryParser;
        _logger = logger;
    }

    /// <summary>
    /// Get devices with their latest telemetry data
    /// </summary>
    /// <param name="deviceTypeId">Filter by device type ID (optional)</param>
    /// <param name="status">Filter by status (optional)</param>
    /// <param name="limit">Maximum number of devices to return (default: 100, max: 500)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of devices with their latest telemetry readings</returns>
    /// <response code="200">Returns the devices with telemetry data</response>
    /// <response code="400">If the request parameters are invalid</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<DeviceWithTelemetry>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDevicesWithTelemetry(
        [FromQuery] Guid? deviceTypeId = null,
        [FromQuery] string? status = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        // Validate limit
        if (limit < 1 || limit > 500)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid limit",
                Detail = "Limit must be between 1 and 500",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var tenantId = _tenantProvider.GetTenantId();

        _logger.LogInformation(
            "Fetching devices with telemetry for tenant {TenantId}, deviceTypeId={DeviceTypeId}, status={Status}, limit={Limit}",
            tenantId, deviceTypeId, status, limit);

        try
        {
            // Fetch devices from Device repository based on filters
            var devices = await _deviceRepository.SearchAsync(
                tenantId,
                deviceTypeId: deviceTypeId,
                status: status,
                searchTerm: null,
                page: 1,
                pageSize: limit);

            if (!devices.Any())
            {
                _logger.LogInformation("No devices found for the given filters");
                return Ok(new List<DeviceWithTelemetry>());
            }

            // Get latest telemetry for all devices in batch
            var deviceIds = devices.Select(d => d.DeviceId).ToList();
            var latestTelemetry = await _timeSeriesRepository.GetLatestTelemetryForDevicesAsync(
                deviceIds,
                cancellationToken);

            _logger.LogInformation(
                "Found {DeviceCount} devices and {TelemetryCount} telemetry records",
                devices.Count, latestTelemetry.Count);

            // Combine device metadata with telemetry - parse customFields using schema
            var result = new List<DeviceWithTelemetry>();
            
            foreach (var device in devices)
            {
                var telemetryData = latestTelemetry.TryGetValue(device.DeviceId, out var telemetry)
                    ? telemetry
                    : null;

                // Parse custom fields if telemetry exists
                Dictionary<string, object>? parsedCustomFields = null;
                if (telemetryData != null && telemetryData.CustomFields != null)
                {
                    parsedCustomFields = await _telemetryParser.ParseCustomFieldsAsync(
                        telemetryData.CustomFields,
                        device.DeviceType?.SchemaId,
                        cancellationToken);
                }

                result.Add(new DeviceWithTelemetry
                {
                    Id = device.Id,
                    DeviceId = device.DeviceId,
                    Name = device.Name,
                    DeviceTypeId = device.DeviceTypeId,
                    DeviceTypeName = device.DeviceType?.Name,
                    SerialNumber = device.SerialNumber,
                    Status = device.Status,
                    LastSeenAt = device.LastSeenAt?.UtcDateTime,
                    Metadata = device.Metadata?.ToDictionary(kvp => kvp.Key, kvp => (object)kvp.Value),
                    LatestTelemetry = telemetryData != null ? new TelemetryData
                    {
                        DeviceId = device.DeviceId,
                        Timestamp = telemetryData.Timestamp,
                        TenantId = tenantId,
                        CustomFields = parsedCustomFields ?? new Dictionary<string, object>()
                    } : null
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching devices with telemetry");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while fetching devices with telemetry",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get specific devices with their latest telemetry data by device IDs
    /// </summary>
    /// <param name="request">Request containing list of device IDs</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of devices with their latest telemetry readings</returns>
    /// <response code="200">Returns the devices with telemetry data</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost("by-ids")]
    [ProducesResponseType(typeof(List<DeviceWithTelemetry>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDevicesWithTelemetryByIds(
        [FromBody] DeviceIdListRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request?.DeviceIds == null || !request.DeviceIds.Any())
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid request",
                Detail = "DeviceIds list is required and cannot be empty",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (request.DeviceIds.Count > 500)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Too many device IDs",
                Detail = "Maximum of 500 device IDs allowed per request",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var tenantId = _tenantProvider.GetTenantId();

        _logger.LogInformation(
            "Fetching {Count} specific devices with telemetry for tenant {TenantId}",
            request.DeviceIds.Count, tenantId);

        try
        {
            // Fetch devices by their IDs
            var deviceTasks = request.DeviceIds
                .Select(deviceId => _deviceRepository.GetByDeviceIdAsync(deviceId, tenantId))
                .ToList();

            var devicesArray = await Task.WhenAll(deviceTasks);
            var devices = devicesArray.Where(d => d != null).Cast<Sensormine.Core.Models.Device>().ToList();

            if (!devices.Any())
            {
                _logger.LogInformation("No devices found for the provided device IDs");
                return Ok(new List<DeviceWithTelemetry>());
            }

            // Get latest telemetry for all devices in batch
            var deviceIds = devices.Select(d => d.DeviceId).ToList();
            var latestTelemetry = await _timeSeriesRepository.GetLatestTelemetryForDevicesAsync(
                deviceIds,
                cancellationToken);

            // Combine device metadata with telemetry - parse customFields using schema
            var result = new List<DeviceWithTelemetry>();
            
            foreach (var device in devices)
            {
                var telemetryData = latestTelemetry.TryGetValue(device.DeviceId, out var telemetry)
                    ? telemetry
                    : null;

                // Parse custom fields if telemetry exists
                Dictionary<string, object>? parsedCustomFields = null;
                if (telemetryData != null && telemetryData.CustomFields != null)
                {
                    parsedCustomFields = await _telemetryParser.ParseCustomFieldsAsync(
                        telemetryData.CustomFields,
                        device.DeviceType?.SchemaId,
                        cancellationToken);
                }

                result.Add(new DeviceWithTelemetry
                {
                    Id = device.Id,
                    DeviceId = device.DeviceId,
                    Name = device.Name,
                    DeviceTypeId = device.DeviceTypeId,
                    DeviceTypeName = device.DeviceType?.Name,
                    SerialNumber = device.SerialNumber,
                    Status = device.Status,
                    LastSeenAt = device.LastSeenAt?.UtcDateTime,
                    Metadata = device.Metadata?.ToDictionary(kvp => kvp.Key, kvp => (object)kvp.Value),
                    LatestTelemetry = telemetryData != null ? new TelemetryData
                    {
                        DeviceId = device.DeviceId,
                        Timestamp = telemetryData.Timestamp,
                        TenantId = tenantId,
                        CustomFields = parsedCustomFields ?? new Dictionary<string, object>()
                    } : null
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching devices with telemetry by IDs");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while fetching devices with telemetry",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}

/// <summary>
/// Request model for fetching devices by their IDs
/// </summary>
public class DeviceIdListRequest
{
    /// <summary>
    /// List of device IDs to fetch
    /// </summary>
    public List<string> DeviceIds { get; set; } = new();
}
