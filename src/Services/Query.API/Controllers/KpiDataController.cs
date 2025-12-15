namespace Query.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Query.API.Models;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.Repositories;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Repositories;

/// <summary>
/// Controller for KPI widget-specific data queries with trend comparison
/// Provides endpoints optimized for KPI cards with period-over-period analysis
/// Supports single devices, device types, and asset filtering
/// </summary>
[ApiController]
[Route("api/kpidata")]
[Produces("application/json")]
public class KpiDataController : ControllerBase
{
    private readonly ITimeSeriesRepository _repository;
    private readonly IDeviceRepository _deviceRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly ITenantProvider _tenantProvider;
    private readonly ILogger<KpiDataController> _logger;
    private const string DefaultMeasurement = "telemetry";

    public KpiDataController(
        ITimeSeriesRepository repository,
        IDeviceRepository deviceRepository,
        IAssetRepository assetRepository,
        ITenantProvider tenantProvider,
        ILogger<KpiDataController> logger)
    {
        _repository = repository;
        _deviceRepository = deviceRepository;
        _assetRepository = assetRepository;
        _tenantProvider = tenantProvider;
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
            var filters = new Dictionary<string, object>();
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
            query.Filters = new Dictionary<string, object>();
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
    /// Get KPI value for widget configuration
    /// Supports single device, device type, and asset filtering
    /// </summary>
    [HttpPost("widget")]
    [ProducesResponseType(typeof(KpiDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetKpiForWidget(
        [FromBody] KpiWidgetQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate request
            if (string.IsNullOrWhiteSpace(request.FieldName))
            {
                return BadRequest(new { error = "FieldName is required" });
            }

            if (string.IsNullOrWhiteSpace(request.SourceType))
            {
                return BadRequest(new { error = "SourceType is required" });
            }

            var tenantId = _tenantProvider.GetTenantId();

            // Determine which devices to query
            List<Guid> deviceIds;
            
            if (request.SourceType == "device")
            {
                // Single device
                if (request.DeviceId == null)
                {
                    return BadRequest(new { error = "DeviceId is required for sourceType=device" });
                }
                deviceIds = new List<Guid> { request.DeviceId.Value };
            }
            else if (request.SourceType == "deviceType")
            {
                // All devices of type
                if (request.DeviceTypeId == null)
                {
                    return BadRequest(new { error = "DeviceTypeId is required for sourceType=deviceType" });
                }

                // Get all devices of this type
                var devices = await _deviceRepository.SearchAsync(
                    tenantId.ToString(),
                    deviceTypeId: request.DeviceTypeId.Value,
                    status: null,
                    searchTerm: null,
                    page: 1,
                    pageSize: 10000); // Get all devices

                deviceIds = devices
                    .Select(d => Guid.TryParse(d.DeviceId, out var guid) ? guid : Guid.Empty)
                    .Where(g => g != Guid.Empty)
                    .ToList();

                if (!deviceIds.Any())
                {
                    return Ok(new KpiDataResponse
                    {
                        Field = request.FieldName,
                        Aggregation = request.Aggregation ?? "avg",
                        CurrentValue = 0,
                        CurrentCount = 0,
                        CurrentPeriod = new TimeRangeInfo
                        {
                            Start = GetStartTime(request.TimeRange ?? "last-24h"),
                            End = DateTimeOffset.UtcNow
                        }
                    });
                }
            }
            else
            {
                return BadRequest(new { error = $"Invalid sourceType: {request.SourceType}" });
            }

            // Apply asset filtering if specified
            if (request.AssetId != null)
            {
                var deviceIdsInAsset = await GetDeviceIdsUnderAsset(request.AssetId.Value, tenantId);
                deviceIds = deviceIds.Intersect(deviceIdsInAsset).ToList();

                if (!deviceIds.Any())
                {
                    return Ok(new KpiDataResponse
                    {
                        Field = request.FieldName,
                        Aggregation = request.Aggregation ?? "avg",
                        CurrentValue = 0,
                        CurrentCount = 0,
                        CurrentPeriod = new TimeRangeInfo
                        {
                            Start = GetStartTime(request.TimeRange ?? "last-24h"),
                            End = DateTimeOffset.UtcNow
                        }
                    });
                }
            }

            // Calculate time ranges
            var now = DateTimeOffset.UtcNow;
            var currentStart = GetStartTime(request.TimeRange ?? "last-24h");
            var aggregateFunction = MapAggregationFunction(request.Aggregation ?? "avg");

            // Query current period - aggregate across all filtered devices
            var currentValue = await QueryAggregatedValue(
                deviceIds,
                request.FieldName,
                aggregateFunction,
                currentStart,
                now,
                cancellationToken);

            var response = new KpiDataResponse
            {
                Field = request.FieldName,
                Aggregation = request.Aggregation ?? "avg",
                CurrentValue = currentValue.Value,
                CurrentCount = currentValue.Count,
                CurrentPeriod = new TimeRangeInfo
                {
                    Start = currentStart,
                    End = now
                }
            };

            // Calculate trend if requested
            if (request.ShowTrend)
            {
                var trendPeriodHours = GetTrendPeriodHours(request.TrendPeriod ?? "day");
                var previousStart = currentStart.AddHours(-trendPeriodHours);
                var previousEnd = currentStart;

                var previousValue = await QueryAggregatedValue(
                    deviceIds,
                    request.FieldName,
                    aggregateFunction,
                    previousStart,
                    previousEnd,
                    cancellationToken);

                response.PreviousValue = previousValue.Value;
                response.PreviousCount = previousValue.Count;
                response.PreviousPeriod = new TimeRangeInfo
                {
                    Start = previousStart,
                    End = previousEnd
                };

                // Calculate change metrics
                if (previousValue.Value != 0)
                {
                    var change = currentValue.Value - previousValue.Value;
                    response.Change = change;
                    response.PercentChange = Math.Round((change / Math.Abs(previousValue.Value)) * 100, 2);
                }
                else if (currentValue.Value != 0)
                {
                    response.Change = currentValue.Value;
                    response.PercentChange = null;
                }
            }

            // Get sparkline data if requested
            if (request.ShowSparkline)
            {
                // Get data points for mini chart (last 10-20 points)
                var sparklineQuery = new AggregateQuery
                {
                    StartTime = currentStart,
                    EndTime = now,
                    Filters = new Dictionary<string, object> 
                    { 
                        { "_field", request.FieldName }
                    },
                    AggregateFunction = aggregateFunction,
                    GroupByInterval = ParseInterval(CalculateSparklineInterval(currentStart, now))
                };

                // Query each device and combine results
                var sparklineData = new List<decimal>();
                foreach (var deviceId in deviceIds)
                {
                    sparklineQuery.Filters["deviceId"] = deviceId.ToString();
                    var points = await _repository.QueryAggregateAsync<AggregatedDataPointResponse>(
                        DefaultMeasurement,
                        sparklineQuery,
                        cancellationToken);
                    
                    sparklineData.AddRange(points.Where(p => p.Value.HasValue).Select(p => p.Value!.Value));
                }

                response.SparklineData = sparklineData.Take(20).ToList();
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching KPI data for widget");
            return StatusCode(500, new { error = "Failed to fetch KPI data", message = ex.Message });
        }
    }

    /// <summary>
    /// Get device IDs that are associated with an asset (and its children)
    /// </summary>
    private async Task<List<Guid>> GetDeviceIdsUnderAsset(Guid assetId, string tenantId)
    {
        // This would need to query the asset hierarchy and get all devices
        // For now, return empty list - needs implementation
        _logger.LogWarning("Asset filtering not yet fully implemented for KPI widgets");
        return new List<Guid>();
    }

    /// <summary>
    /// Query aggregated value across multiple devices
    /// </summary>
    private async Task<(decimal Value, long Count)> QueryAggregatedValue(
        List<Guid> deviceIds,
        string field,
        string aggregateFunction,
        DateTimeOffset startTime,
        DateTimeOffset endTime,
        CancellationToken cancellationToken)
    {
        decimal totalValue = 0;
        long totalCount = 0;

        foreach (var deviceId in deviceIds)
        {
            var query = new AggregateQuery
            {
                StartTime = startTime,
                EndTime = endTime,
                Filters = new Dictionary<string, object>
                {
                    { "deviceId", deviceId.ToString() },
                    { "_field", field }
                },
                AggregateFunction = aggregateFunction,
                GroupByInterval = null
            };

            var result = await _repository.QueryAggregateAsync<AggregatedDataPointResponse>(
                DefaultMeasurement,
                query,
                cancellationToken);

            var dataPoint = result.FirstOrDefault();
            if (dataPoint != null && dataPoint.Value.HasValue)
            {
                var value = dataPoint.Value.Value;
                if (aggregateFunction == "sum" || aggregateFunction == "count")
                {
                    totalValue += value;
                }
                else if (aggregateFunction == "avg")
                {
                    // For average, we need to weight by count
                    totalValue += value * (dataPoint.Count > 0 ? dataPoint.Count : 1);
                    totalCount += dataPoint.Count > 0 ? dataPoint.Count : 1;
                }
                else
                {
                    // For min/max/last, take the extreme value
                    if (totalCount == 0 || 
                        (aggregateFunction == "min" && value < totalValue) ||
                        (aggregateFunction == "max" && value > totalValue) ||
                        aggregateFunction == "last")
                    {
                        totalValue = value;
                    }
                }
                
                if (aggregateFunction != "avg")
                {
                    totalCount += dataPoint.Count;
                }
            }
        }

        // For average, divide by total count
        if (aggregateFunction == "avg" && totalCount > 0)
        {
            totalValue = totalValue / totalCount;
        }

        return (totalValue, totalCount);
    }

    /// <summary>
    /// Convert time range string to start time
    /// </summary>
    private static DateTimeOffset GetStartTime(string timeRange)
    {
        var now = DateTimeOffset.UtcNow;
        return timeRange switch
        {
            "current" => now.AddMinutes(-1),
            "last-1h" => now.AddHours(-1),
            "last-6h" => now.AddHours(-6),
            "last-24h" => now.AddHours(-24),
            "last-7d" => now.AddDays(-7),
            "last-30d" => now.AddDays(-30),
            _ => now.AddHours(-24)
        };
    }

    /// <summary>
    /// Convert trend period to hours
    /// </summary>
    private static int GetTrendPeriodHours(string trendPeriod)
    {
        return trendPeriod switch
        {
            "hour" => 1,
            "day" => 24,
            "week" => 168,
            "month" => 720,
            _ => 24
        };
    }

    /// <summary>
    /// Calculate sparkline interval based on time range
    /// </summary>
    private static string CalculateSparklineInterval(DateTimeOffset start, DateTimeOffset end)
    {
        var duration = end - start;
        if (duration.TotalHours <= 1)
            return "5m";
        if (duration.TotalHours <= 6)
            return "15m";
        if (duration.TotalHours <= 24)
            return "1h";
        if (duration.TotalDays <= 7)
            return "6h";
        return "1d";
    }

    /// <summary>
    /// Parse interval string to TimeSpan
    /// </summary>
    private static TimeSpan? ParseInterval(string interval)
    {
        return interval switch
        {
            "1m" => TimeSpan.FromMinutes(1),
            "5m" => TimeSpan.FromMinutes(5),
            "15m" => TimeSpan.FromMinutes(15),
            "1h" => TimeSpan.FromHours(1),
            "6h" => TimeSpan.FromHours(6),
            "1d" => TimeSpan.FromDays(1),
            _ => null
        };
    }

    /// <summary>
    /// Map frontend aggregation names to backend function names
    /// </summary>
    private static string MapAggregationFunction(string aggregation)
    {
        return aggregation.ToLowerInvariant() switch
        {
            "current" or "last" => "last",
            "avg" or "average" => "avg",
            "sum" or "total" => "sum",
            "min" or "minimum" => "min",
            "max" or "maximum" => "max",
            "count" => "count",
            _ => "avg"
        };
    }
}
