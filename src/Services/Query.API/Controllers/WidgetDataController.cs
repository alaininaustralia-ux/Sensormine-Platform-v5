namespace Query.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Query.API.Models;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.Repositories;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Repositories;
using Sensormine.Core.Models;
using Query.API.Services;

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
    private readonly IDeviceRepository _deviceRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly IFieldMappingRepository _fieldMappingRepository;
    private readonly ITenantProvider _tenantProvider;
    private readonly ITelemetryParserService _telemetryParser;
    private readonly ILogger<WidgetDataController> _logger;
    private const string DefaultMeasurement = "telemetry";

    public WidgetDataController(
        ITimeSeriesRepository repository,
        IDeviceRepository deviceRepository,
        IAssetRepository assetRepository,
        IFieldMappingRepository fieldMappingRepository,
        ITenantProvider tenantProvider,
        ITelemetryParserService telemetryParser,
        ILogger<WidgetDataController> logger)
    {
        _repository = repository;
        _deviceRepository = deviceRepository;
        _assetRepository = assetRepository;
        _fieldMappingRepository = fieldMappingRepository;
        _tenantProvider = tenantProvider;
        _telemetryParser = telemetryParser;
        _logger = logger;
    }

    /// <summary>
    /// Get devices with latest telemetry for device list widgets
    /// </summary>
    [HttpGet("device-list")]
    [ProducesResponseType(typeof(DeviceListWidgetResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDeviceList(
        [FromQuery] Guid? deviceTypeId = null,
        [FromQuery] Guid? assetId = null,
        [FromQuery] bool includeStatus = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = _tenantProvider.GetTenantId();

            // Get devices from Device.API (via repository)
            var devices = await _deviceRepository.SearchAsync(
                tenantId,
                deviceTypeId: deviceTypeId,
                status: null,
                searchTerm: null,
                page: page,
                pageSize: pageSize);

            if (!devices.Any())
            {
                return Ok(new DeviceListWidgetResponse
                {
                    Devices = new List<DeviceListWidgetItem>(),
                    TotalCount = 0,
                    Page = page,
                    PageSize = pageSize
                });
            }

            // Get latest telemetry for these devices
            var deviceIds = devices.Select(d => Guid.TryParse(d.DeviceId, out var guid) ? guid : Guid.Empty).Where(g => g != Guid.Empty).ToList();
            var latestTelemetry = await _repository.GetLatestTelemetryForDevicesAsync(
                deviceIds,
                cancellationToken);

            // Combine device metadata with telemetry
            var result = new List<DeviceListWidgetItem>();
            
            foreach (var device in devices)
            {
                var deviceGuidKey = Guid.TryParse(device.DeviceId, out var deviceGuidVal) ? deviceGuidVal : Guid.Empty;
                var telemetryData = deviceGuidKey != Guid.Empty && latestTelemetry.TryGetValue(deviceGuidKey, out var telemetry)
                    ? telemetry
                    : null;

                Dictionary<string, object>? parsedCustomFields = null;
                if (telemetryData != null && telemetryData.CustomFields != null)
                {
                    parsedCustomFields = await _telemetryParser.ParseCustomFieldsAsync(
                        telemetryData.CustomFields,
                        device.DeviceType?.SchemaId,
                        cancellationToken);
                }

                result.Add(new DeviceListWidgetItem
                {
                    Id = device.Id.ToString(),
                    DeviceId = device.DeviceId.ToString(),
                    Name = device.Name,
                    SerialNumber = device.SerialNumber,
                    Status = device.Status,
                    LastSeenAt = device.LastSeenAt?.UtcDateTime,
                    Metadata = device.Metadata?.ToDictionary(kvp => kvp.Key, kvp => (object)kvp.Value),
                    CustomFields = parsedCustomFields ?? new Dictionary<string, object>()
                });
            }

            var totalCount = await _deviceRepository.GetCountAsync(tenantId, deviceTypeId, null);

            return Ok(new DeviceListWidgetResponse
            {
                Devices = result,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching device list for widget");
            return StatusCode(500, new { error = "Failed to fetch device list", message = ex.Message });
        }
    }

    /// <summary>
    /// Get time-series data for chart widgets
    /// </summary>
    [HttpPost("timeseries")]
    [ProducesResponseType(typeof(TimeSeriesWidgetResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimeSeries(
        [FromBody] TimeSeriesWidgetRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = _tenantProvider.GetTenantId();
            var (startTime, endTime) = ParseTimeRange(request.TimeRange, request.StartTime, request.EndTime);

            // Parse device IDs from request
            List<Guid> deviceIds = new();
            if (request.DeviceIds != null && request.DeviceIds.Any())
            {
                foreach (var deviceIdString in request.DeviceIds)
                {
                    if (Guid.TryParse(deviceIdString, out var deviceId))
                    {
                        deviceIds.Add(deviceId);
                    }
                }
            }
            else if (request.DeviceTypeId.HasValue)
            {
                var devices = await _deviceRepository.SearchAsync(
                    tenantId, deviceTypeId: request.DeviceTypeId, status: null, 
                    searchTerm: null, page: 1, pageSize: 100);
                deviceIds = devices.Select(d => d.Id).ToList();
            }

            if (!deviceIds.Any())
            {
                return Ok(new TimeSeriesWidgetResponse
                {
                    Series = new List<TimeSeriesSeriesData>(),
                    TotalPoints = 0,
                    TimeRange = new TimeRangeInfo { Start = startTime, End = endTime }
                });
            }

            var series = new List<TimeSeriesSeriesData>();

            // Query telemetry for each device
            foreach (var deviceId in deviceIds.Take(10))
            {
                var device = await _deviceRepository.GetByIdAsync(deviceId, tenantId);
                if (device == null) continue;

                var filters = new Dictionary<string, object> { ["deviceId"] = deviceId };
                var query = new TimeSeriesQuery
                {
                    StartTime = startTime,
                    EndTime = endTime,
                    Filters = filters,
                    Limit = request.Limit,
                    OrderBy = "timestamp ASC"
                };

                var telemetryData = await _repository.QueryAsync<TimeSeriesDataPointResponse>(
                    DefaultMeasurement, query, cancellationToken);

                _logger.LogInformation(
                    "Query returned {Count} telemetry records for device {DeviceId}",
                    telemetryData.Count(), deviceId);

                if (!telemetryData.Any()) continue;

                // Extract requested fields from telemetry data
                foreach (var field in request.Fields)
                {
                    var dataPoints = new List<TimeSeriesPoint>();
                    
                    foreach (var record in telemetryData)
                    {
                        // Values dictionary contains all fields from custom_fields JSONB
                        if (record.Values != null && record.Values.TryGetValue(field, out var value))
                        {
                            if (value != null)
                            {
                                dataPoints.Add(new TimeSeriesPoint
                                {
                                    Timestamp = record.Timestamp.ToString("o"),
                                    Value = value
                                });
                            }
                        }
                    }

                    if (dataPoints.Any())
                    {
                        series.Add(new TimeSeriesSeriesData
                        {
                            Field = field,
                            FriendlyName = field,
                            DeviceId = deviceId.ToString(),
                            DeviceName = device.Name,
                            DataPoints = dataPoints,
                            Unit = null
                        });
                    }
                }
            }

            _logger.LogInformation(
                "Returning {SeriesCount} series with {TotalPoints} total data points",
                series.Count, series.Sum(s => s.DataPoints.Count));

            return Ok(new TimeSeriesWidgetResponse
            {
                Series = series,
                TotalPoints = series.Sum(s => s.DataPoints.Count),
                TimeRange = new TimeRangeInfo { Start = startTime, End = endTime },
                Aggregation = request.Aggregation != null && request.Aggregation != "none"
                    ? new AggregationInfo
                    {
                        Function = request.Aggregation,
                        Interval = request.AggregationInterval ?? "5m"
                    }
                    : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching time-series data for widget");
            return StatusCode(500, new { error = "Failed to fetch time-series data", message = ex.Message });
        }
    }

    private static (DateTimeOffset startTime, DateTimeOffset endTime) ParseTimeRange(
        string? timeRange, string? startTime, string? endTime)
    {
        if (!string.IsNullOrEmpty(startTime) && !string.IsNullOrEmpty(endTime))
        {
            return (DateTimeOffset.Parse(startTime), DateTimeOffset.Parse(endTime));
        }

        var now = DateTimeOffset.UtcNow;
        return timeRange switch
        {
            "last-1h" => (now.AddHours(-1), now),
            "last-6h" => (now.AddHours(-6), now),
            "last-24h" => (now.AddHours(-24), now),
            "last-7d" => (now.AddDays(-7), now),
            "last-30d" => (now.AddDays(-30), now),
            _ => (now.AddHours(-24), now) // Default to last 24 hours
        };
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
            var filters = new Dictionary<string, object>();
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
                    DeviceId = d.DeviceId.ToString(),
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
            var filters = new Dictionary<string, object>();
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
                    DeviceId = d.DeviceId.ToString(),
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

            var filters = new Dictionary<string, object>();
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
                var fieldFilters = new Dictionary<string, object>(filters)
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

            var filters = new Dictionary<string, object>();
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

// ============================================
// Device List Widget Models
// ============================================

public class DeviceListWidgetResponse
{
    public List<DeviceListWidgetItem> Devices { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class DeviceListWidgetItem
{
    public string Id { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? Status { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public Dictionary<string, object> CustomFields { get; set; } = new();
}

// ============================================
// Time-Series Chart Widget Models
// ============================================

public class TimeSeriesWidgetRequest
{
    public Guid? DeviceTypeId { get; set; }
    public Guid? AssetId { get; set; }
    public List<string>? DeviceIds { get; set; }
    public List<string> Fields { get; set; } = new();
    public string? TimeRange { get; set; } // 'last-1h', 'last-24h', etc.
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Aggregation { get; set; } // 'none', 'avg', 'sum', etc.
    public string? AggregationInterval { get; set; } // '1m', '5m', etc.
    public int Limit { get; set; } = 1000;
}

public class TimeSeriesWidgetResponse
{
    public List<TimeSeriesSeriesData> Series { get; set; } = new();
    public int TotalPoints { get; set; }
    public TimeRangeInfo TimeRange { get; set; } = new();
    public AggregationInfo? Aggregation { get; set; }
}

public class TimeSeriesSeriesData
{
    public string Field { get; set; } = string.Empty;
    public string? FriendlyName { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public string? Unit { get; set; }
    public List<TimeSeriesPoint> DataPoints { get; set; } = new();
}

public class TimeSeriesPoint
{
    public string Timestamp { get; set; } = string.Empty;
    public object? Value { get; set; }
}

public class AggregationInfo
{
    public string Function { get; set; } = string.Empty;
    public string Interval { get; set; } = string.Empty;
}
