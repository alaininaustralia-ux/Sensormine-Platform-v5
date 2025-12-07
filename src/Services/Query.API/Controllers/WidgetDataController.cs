namespace Query.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Query.API.Models;
using Sensormine.Storage.Interfaces;

/// <summary>
/// Controller for widget-specific data queries
/// Provides simplified endpoints optimized for dashboard widgets
/// </summary>
[ApiController]
[Route("api/widgetdata")]
[Produces("application/json")]
public class WidgetDataController : ControllerBase
{
    private readonly ITimeSeriesRepository _repository;
    private readonly ILogger<WidgetDataController> _logger;
    private const string DefaultMeasurement = "telemetry";

    public WidgetDataController(
        ITimeSeriesRepository repository,
        ILogger<WidgetDataController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get real-time data (latest values) for widgets
    /// Returns the most recent data points from the last hour
    /// </summary>
    /// <param name="fields">Comma-separated field names to retrieve (e.g., "temperature,humidity")</param>
    /// <param name="deviceIds">Optional comma-separated device IDs to filter by</param>
    /// <param name="limit">Maximum number of data points to return (default: 100)</param>
    [HttpGet("realtime")]
    [ProducesResponseType(typeof(WidgetDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRealtime(
        [FromQuery] string? fields = null,
        [FromQuery] string? deviceIds = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate limit
            if (limit <= 0 || limit > 1000)
            {
                return BadRequest(new { error = "Limit must be between 1 and 1000" });
            }

            // Parse deviceIds filter
            var filters = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(deviceIds))
            {
                // For now, only support single device ID (can be enhanced for multiple)
                var deviceIdList = deviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (deviceIdList.Length > 0)
                {
                    filters["deviceId"] = deviceIdList[0];
                }
            }

            // Query last hour of data
            var query = new TimeSeriesQuery
            {
                StartTime = DateTimeOffset.UtcNow.AddHours(-1),
                EndTime = DateTimeOffset.UtcNow,
                Filters = filters.Count > 0 ? filters : null,
                Limit = limit,
                OrderBy = "timestamp DESC"
            };

            var result = await _repository.QueryAsync<TimeSeriesDataPointResponse>(DefaultMeasurement, query, cancellationToken);

            // Transform to widget-friendly format
            var response = new WidgetDataResponse
            {
                Timestamp = DateTimeOffset.UtcNow,
                DataPoints = result.Select(d => new WidgetDataPoint
                {
                    DeviceId = d.DeviceId,
                    Timestamp = d.Timestamp,
                    Values = d.Values
                }).ToList(),
                Count = result.Count()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching realtime widget data");
            return StatusCode(500, new { error = "Failed to fetch data", message = ex.Message });
        }
    }

    /// <summary>
    /// Get historical time-series data for widget
    /// Returns data over a specified time range
    /// </summary>
    /// <summary>
    /// Get historical time-series data for widget
    /// Returns data over a specified time range
    /// </summary>
    [HttpGet("historical")]
    [ProducesResponseType(typeof(WidgetDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetHistorical(
        [FromQuery] string fields,
        [FromQuery] string startTime,
        [FromQuery] string endTime,
        [FromQuery] string? deviceIds = null,
        [FromQuery] int limit = 1000,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var filters = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(deviceIds))
            {
                var deviceIdList = deviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (deviceIdList.Length > 0)
                {
                    filters["deviceId"] = deviceIdList[0];
                }
            }

            var query = new TimeSeriesQuery
            {
                StartTime = DateTimeOffset.Parse(startTime),
                EndTime = DateTimeOffset.Parse(endTime),
                Filters = filters.Count > 0 ? filters : null,
                Limit = limit,
                OrderBy = "timestamp ASC"
            };

            var result = await _repository.QueryAsync<TimeSeriesDataPointResponse>(DefaultMeasurement, query, cancellationToken);

            var response = new WidgetDataResponse
            {
                Timestamp = DateTimeOffset.UtcNow,
                DataPoints = result.Select(d => new WidgetDataPoint
                {
                    DeviceId = d.DeviceId,
                    Timestamp = d.Timestamp,
                    Values = d.Values
                }).ToList(),
                Count = result.Count(),
                TimeRange = new TimeRangeInfo
                {
                    Start = query.StartTime,
                    End = query.EndTime
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching historical widget data");
            return StatusCode(500, new { error = "Failed to fetch data", message = ex.Message });
        }
    }

    /// <summary>
    /// Get aggregated data for widget
    /// Returns aggregated values over time intervals
    /// Supports multiple fields in a single request for multi-series charts
    /// </summary>
    [HttpGet("aggregated")]
    [ProducesResponseType(typeof(AggregatedWidgetDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAggregated(
        [FromQuery] string fields,
        [FromQuery] string startTime,
        [FromQuery] string endTime,
        [FromQuery] string aggregation = "avg",
        [FromQuery] string? interval = "5m",
        [FromQuery] string? deviceIds = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var fieldList = fields.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                  .Select(f => f.Trim())
                                  .Where(f => !string.IsNullOrEmpty(f))
                                  .ToArray();
            
            if (fieldList.Length == 0)
            {
                return BadRequest(new { error = "At least one field is required" });
            }

            var filters = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(deviceIds))
            {
                var deviceIdList = deviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (deviceIdList.Length > 0)
                {
                    filters["deviceId"] = deviceIdList[0];
                }
            }

            // Parse interval string to TimeSpan (e.g., "5m" -> 5 minutes)
            TimeSpan? groupInterval = null;
            if (!string.IsNullOrWhiteSpace(interval))
            {
                groupInterval = ParseInterval(interval);
            }

            var start = DateTimeOffset.Parse(startTime);
            var end = DateTimeOffset.Parse(endTime);

            // Query each field separately and aggregate results
            var series = new List<AggregatedSeries>();
            
            foreach (var field in fieldList)
            {
                var fieldFilters = new Dictionary<string, string>(filters)
                {
                    ["_field"] = field
                };

                var query = new AggregateQuery
                {
                    StartTime = start,
                    EndTime = end,
                    Filters = fieldFilters,
                    AggregateFunction = aggregation,
                    GroupByInterval = groupInterval
                };

                try
                {
                    var result = await _repository.QueryAggregateAsync<AggregatedDataPointResponse>(
                        DefaultMeasurement, query, cancellationToken);

                    series.Add(new AggregatedSeries
                    {
                        Field = field,
                        DataPoints = result.Select(d => new AggregatedDataPoint
                        {
                            Timestamp = d.Timestamp ?? DateTimeOffset.UtcNow,
                            Value = d.Value ?? 0m,
                            Count = d.Count
                        }).ToList()
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to query field {Field}, skipping", field);
                    // Continue with other fields
                }
            }

            var response = new AggregatedWidgetDataResponse
            {
                Timestamp = DateTimeOffset.UtcNow,
                Aggregation = aggregation,
                Interval = interval ?? "raw",
                Series = series,
                TimeRange = new TimeRangeInfo
                {
                    Start = start,
                    End = end
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching aggregated widget data");
            return StatusCode(500, new { error = "Failed to fetch data", message = ex.Message });
        }
    }

    /// <summary>
    /// Get categorical aggregation for pie/bar charts
    /// Groups data by a categorical field and aggregates values
    /// </summary>
    /// <param name="groupBy">Field to group by (e.g., "deviceType", "location", "status")</param>
    /// <param name="valueField">Field to aggregate (e.g., "count", "temperature")</param>
    /// <param name="aggregation">Aggregation function (sum, avg, min, max, count)</param>
    /// <param name="startTime">Start of time range</param>
    /// <param name="endTime">End of time range</param>
    /// <param name="deviceIds">Optional device filter</param>
    /// <param name="limit">Maximum number of categories to return (default: 20)</param>
    [HttpGet("categorical")]
    [ProducesResponseType(typeof(CategoricalDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCategorical(
        [FromQuery] string groupBy,
        [FromQuery] string valueField = "value",
        [FromQuery] string aggregation = "count",
        [FromQuery] string? startTime = null,
        [FromQuery] string? endTime = null,
        [FromQuery] string? deviceIds = null,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(groupBy))
            {
                return BadRequest(new { error = "groupBy parameter is required" });
            }

            var filters = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(deviceIds))
            {
                var deviceIdList = deviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (deviceIdList.Length > 0)
                {
                    filters["deviceId"] = deviceIdList[0];
                }
            }

            var start = string.IsNullOrWhiteSpace(startTime) 
                ? DateTimeOffset.UtcNow.AddDays(-7) 
                : DateTimeOffset.Parse(startTime);
            var end = string.IsNullOrWhiteSpace(endTime) 
                ? DateTimeOffset.UtcNow 
                : DateTimeOffset.Parse(endTime);

            // Query with grouping by the specified field
            var query = new AggregateQuery
            {
                StartTime = start,
                EndTime = end,
                Filters = filters,
                AggregateFunction = aggregation,
                GroupByFields = new string[] { groupBy },
                GroupByInterval = null // No time bucketing for categorical
            };

            var result = await _repository.QueryAggregateAsync<AggregatedDataPointResponse>(
                DefaultMeasurement, query, cancellationToken);

            // Transform to categorical format
            var categories = result
                .Where(d => d.GroupValues != null && d.GroupValues.ContainsKey(groupBy))
                .GroupBy(d => d.GroupValues![groupBy])
                .Select(g => new CategoryDataPoint
                {
                    Name = g.Key,
                    Value = g.Sum(d => d.Value ?? 0m),
                    Count = g.Sum(d => d.Count)
                })
                .OrderByDescending(c => c.Value)
                .Take(limit)
                .ToList();

            // Calculate percentages
            var total = categories.Sum(c => c.Value);
            if (total > 0)
            {
                foreach (var category in categories)
                {
                    category.Percentage = Math.Round((category.Value / total) * 100, 2);
                }
            }

            var response = new CategoricalDataResponse
            {
                GroupByField = groupBy,
                ValueField = valueField,
                Aggregation = aggregation,
                Categories = categories,
                TimeRange = new TimeRangeInfo
                {
                    Start = start,
                    End = end
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching categorical widget data");
            return StatusCode(500, new { error = "Failed to fetch data", message = ex.Message });
        }
    }

    private static TimeSpan ParseInterval(string interval)
    {
        // Parse intervals like "5m", "1h", "30s", "1d"
        if (string.IsNullOrWhiteSpace(interval)) return TimeSpan.FromMinutes(5);
        
        var unit = interval[^1];
        var value = int.Parse(interval[..^1]);
        
        return unit switch
        {
            's' => TimeSpan.FromSeconds(value),
            'm' => TimeSpan.FromMinutes(value),
            'h' => TimeSpan.FromHours(value),
            'd' => TimeSpan.FromDays(value),
            _ => TimeSpan.FromMinutes(5)
        };
    }
}

/// <summary>
/// Widget-friendly data response
/// </summary>
public class WidgetDataResponse
{
    public DateTimeOffset Timestamp { get; set; }
    public List<WidgetDataPoint> DataPoints { get; set; } = new();
    public int Count { get; set; }
    public TimeRangeInfo? TimeRange { get; set; }
}

/// <summary>
/// Single data point for widget
/// </summary>
public class WidgetDataPoint
{
    public string DeviceId { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public Dictionary<string, object> Values { get; set; } = new();
}

/// <summary>
/// Aggregated data response for widgets
/// </summary>
public class AggregatedWidgetDataResponse
{
    public DateTimeOffset Timestamp { get; set; }
    public string Aggregation { get; set; } = string.Empty;
    public string Interval { get; set; } = string.Empty;
    public List<AggregatedSeries> Series { get; set; } = new();
    public TimeRangeInfo? TimeRange { get; set; }
}

/// <summary>
/// Time series of aggregated data
/// </summary>
public class AggregatedSeries
{
    public string Field { get; set; } = string.Empty;
    public List<AggregatedDataPoint> DataPoints { get; set; } = new();
}

/// <summary>
/// Aggregated data point
/// </summary>
public class AggregatedDataPoint
{
    public DateTimeOffset Timestamp { get; set; }
    public decimal Value { get; set; }
    public long Count { get; set; }
}
