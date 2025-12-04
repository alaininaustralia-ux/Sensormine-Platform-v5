namespace Query.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Query.API.Models;
using Query.API.Services;

/// <summary>
/// Controller for querying time-series data
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TimeSeriesController : ControllerBase
{
    private readonly ITimeSeriesQueryService _queryService;
    private readonly ILogger<TimeSeriesController> _logger;

    /// <summary>
    /// Maximum time range allowed for queries (90 days)
    /// </summary>
    private static readonly TimeSpan MaxTimeRange = TimeSpan.FromDays(90);
    
    /// <summary>
    /// Maximum hours to look back for recent data
    /// </summary>
    private const int MaxLookbackHours = 168; // 7 days
    
    /// <summary>
    /// Maximum results limit
    /// </summary>
    private const int MaxResultsLimit = 1000;
    
    /// <summary>
    /// Maximum number of devices per batch request
    /// </summary>
    private const int MaxDevicesPerRequest = 100;

    public TimeSeriesController(
        ITimeSeriesQueryService queryService,
        ILogger<TimeSeriesController> logger)
    {
        _queryService = queryService;
        _logger = logger;
    }

    /// <summary>
    /// Query time-series data with filters
    /// </summary>
    /// <param name="measurement">The measurement/table name to query</param>
    /// <param name="request">Query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated time-series data points</returns>
    /// <response code="200">Returns the time-series data</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost("{measurement}/query")]
    [ProducesResponseType(typeof(TimeSeriesQueryResponse<TimeSeriesDataPointResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Query(
        string measurement,
        [FromBody] TimeSeriesQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid time range",
                Detail = "EndTime must be greater than StartTime",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // Limit time range to prevent expensive queries
        if (request.EndTime - request.StartTime > MaxTimeRange)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Time range too large",
                Detail = $"Maximum time range is {MaxTimeRange.TotalDays} days",
                Status = StatusCodes.Status400BadRequest
            });
        }

        _logger.LogInformation(
            "Querying time-series data for measurement {Measurement} from {StartTime} to {EndTime}",
            measurement, request.StartTime, request.EndTime);

        var result = await _queryService.QueryAsync(measurement, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Query aggregated time-series data
    /// </summary>
    /// <param name="measurement">The measurement/table name to query</param>
    /// <param name="request">Aggregate query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Aggregated time-series data</returns>
    /// <response code="200">Returns the aggregated data</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost("{measurement}/aggregate")]
    [ProducesResponseType(typeof(TimeSeriesQueryResponse<AggregatedDataPointResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Aggregate(
        string measurement,
        [FromBody] AggregateQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid time range",
                Detail = "EndTime must be greater than StartTime",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // Validate aggregate function
        var validFunctions = new[] { "avg", "sum", "min", "max", "count", "first", "last" };
        if (!validFunctions.Contains(request.AggregateFunction.ToLowerInvariant()))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid aggregate function",
                Detail = $"Valid functions are: {string.Join(", ", validFunctions)}",
                Status = StatusCodes.Status400BadRequest
            });
        }

        _logger.LogInformation(
            "Querying aggregated time-series data for measurement {Measurement} with function {Function}",
            measurement, request.AggregateFunction);

        var result = await _queryService.QueryAggregateAsync(measurement, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get the latest data point for a device
    /// </summary>
    /// <param name="measurement">The measurement/table name</param>
    /// <param name="deviceId">Device identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The latest data point for the device</returns>
    /// <response code="200">Returns the latest data point</response>
    /// <response code="404">If no data found for the device</response>
    [HttpGet("{measurement}/device/{deviceId}/latest")]
    [ProducesResponseType(typeof(TimeSeriesDataPointResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatest(
        string measurement,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Getting latest data for device {DeviceId} in measurement {Measurement}",
            deviceId, measurement);

        var result = await _queryService.GetLatestAsync(measurement, deviceId, cancellationToken);
        
        if (result == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Data not found",
                Detail = $"No data found for device {deviceId}",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Get the latest data points for multiple devices
    /// </summary>
    /// <param name="measurement">The measurement/table name</param>
    /// <param name="deviceIds">List of device identifiers</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dictionary of device ID to latest data point</returns>
    /// <response code="200">Returns the latest data points</response>
    /// <response code="400">If no device IDs provided</response>
    [HttpPost("{measurement}/devices/latest")]
    [ProducesResponseType(typeof(Dictionary<string, TimeSeriesDataPointResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetLatestForDevices(
        string measurement,
        [FromBody] List<string> deviceIds,
        CancellationToken cancellationToken = default)
    {
        if (deviceIds == null || deviceIds.Count == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid request",
                Detail = "At least one device ID is required",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // Limit number of devices to prevent expensive queries
        if (deviceIds.Count > MaxDevicesPerRequest)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Too many devices",
                Detail = $"Maximum {MaxDevicesPerRequest} devices can be queried at once",
                Status = StatusCodes.Status400BadRequest
            });
        }

        _logger.LogInformation(
            "Getting latest data for {DeviceCount} devices in measurement {Measurement}",
            deviceIds.Count, measurement);

        var result = await _queryService.GetLatestForDevicesAsync(measurement, deviceIds, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Simple GET endpoint to query recent data
    /// </summary>
    /// <param name="measurement">The measurement/table name</param>
    /// <param name="deviceId">Optional device ID filter</param>
    /// <param name="hours">Number of hours to look back (default: 24, max: 168)</param>
    /// <param name="limit">Maximum results (default: 100, max: 1000)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Recent time-series data</returns>
    [HttpGet("{measurement}")]
    [ProducesResponseType(typeof(TimeSeriesQueryResponse<TimeSeriesDataPointResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecent(
        string measurement,
        [FromQuery] string? deviceId = null,
        [FromQuery] int hours = 24,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        // Validate and clamp parameters using class constants
        hours = Math.Clamp(hours, 1, MaxLookbackHours);
        limit = Math.Clamp(limit, 1, MaxResultsLimit);

        var request = new TimeSeriesQueryRequest
        {
            StartTime = DateTimeOffset.UtcNow.AddHours(-hours),
            EndTime = DateTimeOffset.UtcNow,
            DeviceId = deviceId,
            Limit = limit,
            PageSize = limit
        };

        var result = await _queryService.QueryAsync(measurement, request, cancellationToken);
        return Ok(result);
    }
}
