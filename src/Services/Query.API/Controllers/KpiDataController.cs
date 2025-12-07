namespace Query.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Query.API.Models;
using Sensormine.Storage.Interfaces;

/// <summary>
/// Controller for KPI widget-specific data queries with trend comparison
/// Provides endpoints optimized for KPI cards with period-over-period analysis
/// </summary>
[ApiController]
[Route("api/kpidata")]
[Produces("application/json")]
public class KpiDataController : ControllerBase
{
    private readonly ITimeSeriesRepository _repository;
    private readonly ILogger<KpiDataController> _logger;
    private const string DefaultMeasurement = "telemetry";

    public KpiDataController(
        ITimeSeriesRepository repository,
        ILogger<KpiDataController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get KPI value with optional trend comparison to previous period
    /// Calculates change and percentage change between current and previous period
    /// </summary>
    /// <param name="field">Field name to aggregate (e.g., "temperature")</param>
    /// <param name="aggregation">Aggregation function (current, avg, sum, min, max, count)</param>
    /// <param name="periodHours">Duration of the current period in hours (default: 24)</param>
    /// <param name="includeTrend">Whether to include trend comparison (default: true)</param>
    /// <param name="comparisonType">Type of comparison: previous (same duration before) or historical (same time period in past)</param>
    /// <param name="deviceIds">Optional comma-separated device IDs to filter by</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(KpiDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetKpiWithTrend(
        [FromQuery] string field,
        [FromQuery] string aggregation = "avg",
        [FromQuery] int periodHours = 24,
        [FromQuery] bool includeTrend = true,
        [FromQuery] string comparisonType = "previous",
        [FromQuery] string? deviceIds = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate inputs
            if (string.IsNullOrWhiteSpace(field))
            {
                return BadRequest(new { error = "Field parameter is required" });
            }

            if (periodHours <= 0 || periodHours > 8760) // Max 1 year
            {
                return BadRequest(new { error = "Period must be between 1 and 8760 hours" });
            }

            // Parse device filters
            var filters = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(deviceIds))
            {
                var deviceIdList = deviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (deviceIdList.Length > 0)
                {
                    filters["deviceId"] = deviceIdList[0];
                }
            }

            var now = DateTimeOffset.UtcNow;
            var currentStart = now.AddHours(-periodHours);

            // Map aggregation type
            var aggregateFunction = MapAggregationFunction(aggregation);

            // Query current period
            var currentQuery = new AggregateQuery
            {
                StartTime = currentStart,
                EndTime = now,
                Filters = filters.Count > 0 ? filters : null,
                AggregateFunction = aggregateFunction,
                GroupByInterval = null // No time bucketing, just single aggregate
            };

            var currentResult = await QuerySingleValue(currentQuery, field, cancellationToken);

            var response = new KpiDataResponse
            {
                Field = field,
                Aggregation = aggregation,
                CurrentValue = currentResult.Value,
                CurrentCount = currentResult.Count,
                CurrentPeriod = new TimeRangeInfo
                {
                    Start = currentStart,
                    End = now
                }
            };

            // Calculate trend if requested
            if (includeTrend)
            {
                var previousStart = currentStart.AddHours(-periodHours);
                var previousEnd = currentStart;

                var previousQuery = new AggregateQuery
                {
                    StartTime = previousStart,
                    EndTime = previousEnd,
                    Filters = filters.Count > 0 ? filters : null,
                    AggregateFunction = aggregateFunction,
                    GroupByInterval = null
                };

                var previousResult = await QuerySingleValue(previousQuery, field, cancellationToken);

                response.PreviousValue = previousResult.Value;
                response.PreviousCount = previousResult.Count;
                response.PreviousPeriod = new TimeRangeInfo
                {
                    Start = previousStart,
                    End = previousEnd
                };

                // Calculate change metrics
                if (previousResult.Value != 0)
                {
                    var change = currentResult.Value - previousResult.Value;
                    response.Change = change;
                    response.PercentChange = Math.Round((change / Math.Abs(previousResult.Value)) * 100, 2);
                }
                else if (currentResult.Value != 0)
                {
                    // Previous was zero, current is not - consider this significant increase
                    response.Change = currentResult.Value;
                    response.PercentChange = null; // Cannot calculate percentage from zero
                }
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching KPI data with trend");
            return StatusCode(500, new { error = "Failed to fetch KPI data", message = ex.Message });
        }
    }

    /// <summary>
    /// Query a single aggregated value
    /// </summary>
    private async Task<(decimal Value, long Count)> QuerySingleValue(
        AggregateQuery query,
        string field,
        CancellationToken cancellationToken)
    {
        // Add field filter - use _field key which the repository looks for
        if (query.Filters == null)
        {
            query.Filters = new Dictionary<string, string>();
        }
        query.Filters["_field"] = field;

        var result = await _repository.QueryAggregateAsync<AggregatedDataPointResponse>(
            DefaultMeasurement,
            query,
            cancellationToken);

        var dataPoint = result.FirstOrDefault();
        return (dataPoint?.Value ?? 0m, dataPoint?.Count ?? 0);
    }

    /// <summary>
    /// Map frontend aggregation names to backend function names
    /// </summary>
    private static string MapAggregationFunction(string aggregation)
    {
        return aggregation.ToLowerInvariant() switch
        {
            "current" => "last", // Get most recent value
            "avg" or "average" => "avg",
            "sum" or "total" => "sum",
            "min" or "minimum" => "min",
            "max" or "maximum" => "max",
            "count" => "count",
            _ => "avg"
        };
    }
}
