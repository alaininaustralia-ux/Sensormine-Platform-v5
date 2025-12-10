using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.TimeSeries;
using System.Text.Json;

namespace Query.API.Controllers;

/// <summary>
/// Query telemetry data by asset ID using data point mappings
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AssetTelemetryController : ControllerBase
{
    private readonly ITimeSeriesRepository _timeSeriesRepository;
    private readonly ILogger<AssetTelemetryController> _logger;
    private readonly HttpClient _digitalTwinClient;

    public AssetTelemetryController(
        ITimeSeriesRepository timeSeriesRepository,
        ILogger<AssetTelemetryController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _timeSeriesRepository = timeSeriesRepository;
        _logger = logger;
        _digitalTwinClient = httpClientFactory.CreateClient("DigitalTwin");
    }

    /// <summary>
    /// Get latest telemetry values for an asset
    /// </summary>
    [HttpGet("{assetId}/latest")]
    public async Task<ActionResult<Dictionary<string, object>>> GetLatestTelemetry(
        Guid assetId,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Get data point mappings for this asset from Digital Twin API
            var mappingsResponse = await _digitalTwinClient.GetAsync(
                $"api/mappings/by-asset/{assetId}",
                cancellationToken);

            if (!mappingsResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get mappings for asset {AssetId}", assetId);
                return NotFound($"Asset {assetId} not found or has no mappings");
            }

            var mappingsJson = await mappingsResponse.Content.ReadAsStringAsync(cancellationToken);
            var mappingsData = JsonSerializer.Deserialize<MappingListResponse>(mappingsJson, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (mappingsData?.Mappings == null || !mappingsData.Mappings.Any())
            {
                return Ok(new Dictionary<string, object>());
            }

            // 2. Group mappings by device (schema_id represents device telemetry)
            var deviceGroups = mappingsData.Mappings
                .GroupBy(m => m.SchemaId)
                .ToList();

            var result = new Dictionary<string, object>();

            // 3. For each device/schema, get latest telemetry and extract mapped fields
            foreach (var deviceGroup in deviceGroups)
            {
                var schemaId = deviceGroup.Key;
                
                // TODO: Get device_id from schema_id mapping
                // For now, we need a way to find devices that use this schema
                // This requires querying Device.API or having a device->schema index
                
                foreach (var mapping in deviceGroup)
                {
                    // Extract field name from JSON path (e.g., "$.temperature" -> "temperature")
                    var fieldName = mapping.JsonPath.TrimStart('$', '.');
                    
                    // Use mapping label as the key (more user-friendly)
                    var key = mapping.Label ?? fieldName;
                    
                    // TODO: Query actual telemetry data
                    // This is a placeholder - actual implementation needs device_id lookup
                    result[key] = new 
                    { 
                        value = (object?)null,
                        unit = mapping.Unit,
                        timestamp = DateTimeOffset.UtcNow,
                        note = "Not implemented - requires device->asset reverse lookup"
                    };
                }
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest telemetry for asset {AssetId}", assetId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get telemetry data aggregated by asset (including descendants)
    /// </summary>
    [HttpGet("by-asset")]
    public async Task<ActionResult<object>> GetTelemetryByAsset(
        [FromQuery] Guid assetId,
        [FromQuery] bool includeDescendants = true,
        [FromQuery] string? fields = null,
        [FromQuery] DateTimeOffset? startTime = null,
        [FromQuery] DateTimeOffset? endTime = null,
        [FromQuery] string aggregation = "avg",
        [FromQuery] string interval = "5m",
        [FromQuery] int limit = 1000,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId = "test-tenant-001",
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Get asset info from Digital Twin API
            var assetResponse = await _digitalTwinClient.GetAsync($"api/assets/{assetId}", cancellationToken);
            if (!assetResponse.IsSuccessStatusCode)
            {
                return NotFound($"Asset {assetId} not found");
            }
            var assetJson = await assetResponse.Content.ReadAsStringAsync(cancellationToken);
            var assetOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var asset = JsonSerializer.Deserialize<Dictionary<string, object>>(assetJson, assetOptions);

            // 2. Get devices mapped to this asset (and descendants if requested)
            var devicesUrl = includeDescendants
                ? $"api/mappings/devices-by-asset/{assetId}?includeDescendants=true"
                : $"api/mappings/devices-by-asset/{assetId}?includeDescendants=false";
            
            var devicesResponse = await _digitalTwinClient.GetAsync(devicesUrl, cancellationToken);
            if (!devicesResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("No devices found for asset {AssetId}", assetId);
                return Ok(new
                {
                    assetId,
                    assetName = asset?.GetValueOrDefault("name")?.ToString() ?? "Unknown",
                    deviceCount = 0,
                    series = new List<object>()
                });
            }

            var devicesJson = await devicesResponse.Content.ReadAsStringAsync(cancellationToken);
            var deviceIds = JsonSerializer.Deserialize<List<string>>(devicesJson) ?? new List<string>();

            if (deviceIds.Count == 0)
            {
                return Ok(new
                {
                    assetId,
                    assetName = asset?.GetValueOrDefault("name")?.ToString() ?? "Unknown",
                    deviceCount = 0,
                    series = new List<object>()
                });
            }

            // 3. Query telemetry for all devices
            var fieldList = string.IsNullOrEmpty(fields) ? null : fields.Split(',').Select(f => f.Trim()).ToList();
            var start = startTime ?? DateTimeOffset.UtcNow.AddHours(-1);
            var end = endTime ?? DateTimeOffset.UtcNow;

            var telemetryData = new Dictionary<string, List<(DateTime timestamp, double value)>>();

            foreach (var deviceId in deviceIds)
            {
                var query = new TimeSeriesQuery
                {
                    StartTime = start,
                    EndTime = end,
                    Filters = new Dictionary<string, string> { ["deviceId"] = deviceId },
                    OrderBy = "time",
                    Limit = limit
                };

                var data = await _timeSeriesRepository.QueryAsync<TimeSeriesData>(
                    "telemetry",
                    query,
                    cancellationToken);

                foreach (var point in data)
                {
                    foreach (var field in point.Values)
                    {
                        if (fieldList == null || fieldList.Contains(field.Key))
                        {
                            if (!telemetryData.ContainsKey(field.Key))
                            {
                                telemetryData[field.Key] = new List<(DateTime, double)>();
                            }
                            if (field.Value is double dval)
                            {
                                telemetryData[field.Key].Add((point.Timestamp.UtcDateTime, dval));
                            }
                        }
                    }
                }
            }

            // 4. Aggregate data by field and time interval
            var series = telemetryData.Select(kvp => new
            {
                field = kvp.Key,
                unit = GetUnitForField(kvp.Key),
                dataPoints = AggregateDataPoints(kvp.Value, interval, aggregation, limit)
            }).ToList();

            return Ok(new
            {
                assetId,
                assetName = asset?.GetValueOrDefault("name")?.ToString() ?? "Unknown",
                deviceCount = deviceIds.Count,
                series
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting telemetry by asset {AssetId}", assetId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get devices with latest telemetry by asset
    /// </summary>
    [HttpGet("devices-with-telemetry/by-asset")]
    public async Task<ActionResult<object>> GetDevicesWithTelemetryByAsset(
        [FromQuery] Guid assetId,
        [FromQuery] bool includeDescendants = true,
        [FromQuery] string? fields = null,
        [FromQuery] int limit = 100,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId = "test-tenant-001",
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Get devices for this asset
            var devicesUrl = includeDescendants
                ? $"api/mappings/devices-by-asset/{assetId}?includeDescendants=true"
                : $"api/mappings/devices-by-asset/{assetId}?includeDescendants=false";
            
            var devicesResponse = await _digitalTwinClient.GetAsync(devicesUrl, cancellationToken);
            if (!devicesResponse.IsSuccessStatusCode)
            {
                return Ok(new { assetId, devices = new List<object>() });
            }

            var devicesJson = await devicesResponse.Content.ReadAsStringAsync(cancellationToken);
            var deviceIds = JsonSerializer.Deserialize<List<string>>(devicesJson) ?? new List<string>();

            var fieldList = string.IsNullOrEmpty(fields) ? null : fields.Split(',').Select(f => f.Trim()).ToList();
            var devices = new List<object>();

            foreach (var deviceId in deviceIds.Take(limit))
            {
                // Get latest telemetry for device
                var query = new TimeSeriesQuery
                {
                    StartTime = DateTimeOffset.UtcNow.AddHours(-24),
                    EndTime = DateTimeOffset.UtcNow,
                    Filters = new Dictionary<string, string> { ["deviceId"] = deviceId },
                    OrderBy = "time DESC",
                    Limit = 1
                };

                var latest = await _timeSeriesRepository.QueryAsync<TimeSeriesData>(
                    "telemetry",
                    query,
                    cancellationToken);

                var latestPoint = latest.FirstOrDefault();
                var telemetryFields = latestPoint?.Values
                    .Where(kvp => fieldList == null || fieldList.Contains(kvp.Key))
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

                devices.Add(new
                {
                    deviceId,
                    name = deviceId, // TODO: Get from Device API
                    deviceTypeName = "Unknown", // TODO: Get from Device API
                    status = "Active",
                    lastSeenAt = latestPoint?.Timestamp,
                    latestTelemetry = latestPoint != null ? new
                    {
                        timestamp = latestPoint.Timestamp,
                        fields = telemetryFields
                    } : null
                });
            }

            return Ok(new { assetId, devices });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting devices with telemetry for asset {AssetId}", assetId);
            return StatusCode(500, "Internal server error");
        }
    }

    private List<object> AggregateDataPoints(
        List<(DateTime timestamp, double value)> points,
        string interval,
        string aggregation,
        int limit)
    {
        if (points.Count == 0) return new List<object>();

        // Parse interval to TimeSpan
        var intervalSpan = ParseInterval(interval);
        
        // Group by time buckets
        var grouped = points
            .GroupBy(p => new DateTime((p.timestamp.Ticks / intervalSpan.Ticks) * intervalSpan.Ticks))
            .OrderBy(g => g.Key)
            .Take(limit);

        return grouped.Select(group =>
        {
            var values = group.Select(p => p.value).ToList();
            var aggregatedValue = aggregation.ToLower() switch
            {
                "sum" => values.Sum(),
                "min" => values.Min(),
                "max" => values.Max(),
                "count" => values.Count,
                _ => values.Average() // default to average
            };

            return (object)new
            {
                timestamp = group.Key,
                value = aggregatedValue,
                count = values.Count,
                min = values.Min(),
                max = values.Max()
            };
        }).ToList();
    }

    private TimeSpan ParseInterval(string interval)
    {
        return interval.ToLower() switch
        {
            "1m" => TimeSpan.FromMinutes(1),
            "5m" => TimeSpan.FromMinutes(5),
            "15m" => TimeSpan.FromMinutes(15),
            "30m" => TimeSpan.FromMinutes(30),
            "1h" => TimeSpan.FromHours(1),
            "6h" => TimeSpan.FromHours(6),
            "12h" => TimeSpan.FromHours(12),
            "1d" => TimeSpan.FromDays(1),
            _ => TimeSpan.FromMinutes(5)
        };
    }

    private string? GetUnitForField(string field)
    {
        // TODO: Get from schema or metadata
        return field.ToLower() switch
        {
            "temperature" => "°C",
            "humidity" => "%",
            "pressure" => "Pa",
            "battery" => "%",
            "voltage" => "V",
            "current" => "A",
            "power" => "W",
            _ => null
        };
    }

    /// <summary>
    /// Get aggregated telemetry for an asset hierarchy (includes child assets)
    /// </summary>
    [HttpGet("{assetId}/aggregated")]
    public async Task<ActionResult<object>> GetAggregatedTelemetry(
        Guid assetId,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromQuery] DateTimeOffset? startTime = null,
        [FromQuery] DateTimeOffset? endTime = null,
        [FromQuery] string aggregation = "average", // average, sum, min, max
        [FromQuery] string interval = "1h", // 1m, 5m, 15m, 1h, 1d
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement hierarchical aggregation using asset rollup configs
        return Ok(new 
        { 
            message = "Not implemented yet - requires AssetRollupData queries",
            assetId,
            aggregation,
            interval
        });
    }
}

// DTOs for Digital Twin API responses
public class MappingListResponse
{
    public List<DataPointMappingDto> Mappings { get; set; } = new();
    public int TotalCount { get; set; }
}

public class DataPointMappingDto
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public Guid SchemaId { get; set; }
    public string SchemaVersion { get; set; } = string.Empty;
    public string JsonPath { get; set; } = string.Empty;
    public Guid AssetId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string AssetPath { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public string AggregationMethod { get; set; } = string.Empty;
    public bool RollupEnabled { get; set; }
    public string? TransformExpression { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
