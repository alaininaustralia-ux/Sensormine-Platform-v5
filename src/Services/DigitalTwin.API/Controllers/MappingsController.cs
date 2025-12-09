using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using DigitalTwin.API.DTOs;
using DigitalTwin.API.Extensions;

namespace DigitalTwin.API.Controllers;

/// <summary>
/// API controller for managing data point mappings
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MappingsController : ControllerBase
{
    private readonly IDataPointMappingRepository _mappingRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly ILogger<MappingsController> _logger;

    public MappingsController(
        IDataPointMappingRepository mappingRepository,
        IAssetRepository assetRepository,
        ILogger<MappingsController> logger)
    {
        _mappingRepository = mappingRepository;
        _assetRepository = assetRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get a mapping by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<MappingResponse>> GetMapping(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var mapping = await _mappingRepository.GetByIdAsync(id, tenantId);
        if (mapping == null)
            return NotFound();

        var asset = await _assetRepository.GetByIdAsync(mapping.AssetId, tenantId);
        return Ok(mapping.ToResponse(asset?.Name ?? "", asset?.Path ?? ""));
    }

    /// <summary>
    /// Get all mappings for a schema
    /// </summary>
    [HttpGet("by-schema/{schemaId}")]
    public async Task<ActionResult<MappingListResponse>> GetBySchema(
        Guid schemaId,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var mappings = await _mappingRepository.GetBySchemaIdAsync(schemaId, tenantId);
        
        // Fetch assets for all mappings
        var assetIds = mappings.Select(m => m.AssetId).Distinct().ToList();
        var assets = new Dictionary<Guid, Asset>();
        foreach (var assetId in assetIds)
        {
            var asset = await _assetRepository.GetByIdAsync(assetId, tenantId);
            if (asset != null)
                assets[assetId] = asset;
        }
        
        return Ok(new MappingListResponse
        {
            Mappings = mappings.Select(m => {
                assets.TryGetValue(m.AssetId, out var asset);
                return m.ToResponse(asset?.Name ?? "", asset?.Path ?? "");
            }).ToList(),
            TotalCount = mappings.Count
        });
    }

    /// <summary>
    /// Get all mappings for an asset
    /// </summary>
    [HttpGet("by-asset/{assetId}")]
    public async Task<ActionResult<MappingListResponse>> GetByAsset(
        Guid assetId,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var mappings = await _mappingRepository.GetByAssetIdAsync(assetId, tenantId);
        var asset = await _assetRepository.GetByIdAsync(assetId, tenantId);

        return Ok(new MappingListResponse
        {
            Mappings = mappings.Select(m => m.ToResponse(asset?.Name ?? "", asset?.Path ?? "")).ToList(),
            TotalCount = mappings.Count
        });
    }

    /// <summary>
    /// Get all mappings for a device
    /// </summary>
    [HttpGet("by-device/{deviceId}")]
    public async Task<ActionResult<MappingListResponse>> GetByDevice(
        string deviceId,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var mappings = await _mappingRepository.GetByDeviceIdAsync(deviceId, tenantId);
        
        // Fetch assets for all mappings
        var assetIds = mappings.Select(m => m.AssetId).Distinct().ToList();
        var assets = new Dictionary<Guid, Asset>();
        foreach (var assetId in assetIds)
        {
            var asset = await _assetRepository.GetByIdAsync(assetId, tenantId);
            if (asset != null)
                assets[assetId] = asset;
        }
        
        return Ok(new MappingListResponse
        {
            Mappings = mappings.Select(m => {
                assets.TryGetValue(m.AssetId, out var asset);
                return m.ToResponse(asset?.Name ?? "", asset?.Path ?? "");
            }).ToList(),
            TotalCount = mappings.Count
        });
    }

    /// <summary>
    /// Create a new data point mapping
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MappingResponse>> CreateMapping(
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] CreateMappingRequest request)
    {
        var mapping = new DataPointMapping
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            SchemaId = request.SchemaId,
            SchemaVersion = request.SchemaVersion,
            JsonPath = request.JsonPath,
            AssetId = request.AssetId,
            Label = request.Label,
            Description = request.Description,
            Unit = request.Unit,
            AggregationMethod = MappingExtensions.ParseAggregationMethod(request.AggregationMethod),
            RollupEnabled = request.RollupEnabled,
            TransformExpression = request.TransformExpression,
            Metadata = request.Metadata ?? new Dictionary<string, object>(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        // Validate before creating
        var isValid = await _mappingRepository.ValidateMappingAsync(mapping);
        if (!isValid)
        {
            return BadRequest(new { error = "Mapping validation failed" });
        }

        try
        {
            var created = await _mappingRepository.CreateAsync(mapping);
            var asset = await _assetRepository.GetByIdAsync(created.AssetId, tenantId);
            
            return CreatedAtAction(
                nameof(GetMapping), 
                new { id = created.Id, tenantId }, 
                created.ToResponse(asset?.Name ?? "", asset?.Path ?? ""));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating mapping");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing mapping
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<MappingResponse>> UpdateMapping(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] UpdateMappingRequest request)
    {
        var mapping = await _mappingRepository.GetByIdAsync(id, tenantId);
        if (mapping == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Label))
            mapping.Label = request.Label;

        if (request.Description != null)
            mapping.Description = request.Description;

        if (request.Unit != null)
            mapping.Unit = request.Unit;

        if (request.AggregationMethod != null)
            mapping.AggregationMethod = MappingExtensions.ParseAggregationMethod(request.AggregationMethod);

        if (request.RollupEnabled.HasValue)
            mapping.RollupEnabled = request.RollupEnabled.Value;

        if (request.TransformExpression != null)
            mapping.TransformExpression = request.TransformExpression;

        if (request.Metadata != null)
            mapping.Metadata = request.Metadata;

        var updated = await _mappingRepository.UpdateAsync(mapping);
        var asset = await _assetRepository.GetByIdAsync(updated.AssetId, tenantId);
        
        return Ok(updated.ToResponse(asset?.Name ?? "", asset?.Path ?? ""));
    }

    /// <summary>
    /// Delete a mapping
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMapping(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        await _mappingRepository.DeleteAsync(id, tenantId);
        return NoContent();
    }

    /// <summary>
    /// Validate a mapping without creating it
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<MappingValidationResult>> ValidateMapping(
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] CreateMappingRequest request)
    {
        var mapping = new DataPointMapping
        {
            TenantId = Guid.Parse(tenantId),
            SchemaId = request.SchemaId,
            SchemaVersion = request.SchemaVersion,
            JsonPath = request.JsonPath,
            AssetId = request.AssetId,
            Label = request.Label,
            Description = request.Description,
            Unit = request.Unit,
            AggregationMethod = MappingExtensions.ParseAggregationMethod(request.AggregationMethod),
            RollupEnabled = request.RollupEnabled,
            TransformExpression = request.TransformExpression
        };

        var isValid = await _mappingRepository.ValidateMappingAsync(mapping);
        
        return Ok(new MappingValidationResult
        {
            IsValid = isValid,
            Errors = isValid ? new List<string>() : new List<string> { "Validation failed" }
        });
    }
}
