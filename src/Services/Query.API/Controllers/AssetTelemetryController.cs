using Microsoft.AspNetCore.Mvc;
using Sensormine.Storage.Interfaces;
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
    /// Get time-series telemetry for an asset
    /// </summary>
    [HttpGet("{assetId}/timeseries")]
    public async Task<ActionResult<object>> GetTimeSeriesTelemetry(
        Guid assetId,
        [FromQuery] DateTimeOffset? startTime,
        [FromQuery] DateTimeOffset? endTime,
        [FromQuery] string? dataPoints, // Comma-separated list of data point labels
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement time-series query with aggregation based on mapping rollup settings
        return Ok(new 
        { 
            message = "Not implemented yet",
            assetId,
            startTime,
            endTime,
            dataPoints = dataPoints?.Split(',').Select(s => s.Trim()).ToList()
        });
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
