using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using DigitalTwin.API.DTOs;
using DigitalTwin.API.Extensions;

namespace DigitalTwin.API.Controllers;

/// <summary>
/// API controller for managing digital twin assets
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly IAssetRepository _assetRepository;
    private readonly ILogger<AssetsController> _logger;

    public AssetsController(IAssetRepository assetRepository, ILogger<AssetsController> logger)
    {
        _assetRepository = assetRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get an asset by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssetResponse>> GetAsset(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var asset = await _assetRepository.GetByIdAsync(id, tenantId);
        if (asset == null)
            return NotFound();

        var childCount = (await _assetRepository.GetChildrenAsync(id, tenantId)).Count;
        return Ok(asset.ToResponse(childCount));
    }

    /// <summary>
    /// Get all assets with pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<AssetListResponse>> GetAssets(
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var assets = await _assetRepository.GetAllAsync(tenantId, skip, take);
        var totalCount = await _assetRepository.GetCountAsync(tenantId);

        return Ok(new AssetListResponse
        {
            Assets = assets.Select(a => a.ToResponse()).ToList(),
            TotalCount = totalCount,
            Skip = skip,
            Take = take
        });
    }

    /// <summary>
    /// Get root-level assets (no parent)
    /// </summary>
    [HttpGet("roots")]
    public async Task<ActionResult<List<AssetResponse>>> GetRootAssets([FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var assets = await _assetRepository.GetRootAssetsAsync(tenantId);
        return Ok(assets.Select(a => a.ToResponse()).ToList());
    }

    /// <summary>
    /// Get asset with full hierarchy tree
    /// </summary>
    [HttpGet("{id}/tree")]
    public async Task<ActionResult<AssetTreeResponse>> GetAssetTree(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var asset = await _assetRepository.GetByIdAsync(id, tenantId);
        if (asset == null)
            return NotFound();

        // Load children recursively
        asset.Children = (await _assetRepository.GetChildrenAsync(id, tenantId)).ToList();
        foreach (var child in asset.Children)
        {
            await LoadChildrenRecursively(child, tenantId);
        }

        return Ok(asset.ToTreeResponse());
    }

    /// <summary>
    /// Get immediate children of an asset
    /// </summary>
    [HttpGet("{id}/children")]
    public async Task<ActionResult<List<AssetResponse>>> GetChildren(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var assets = await _assetRepository.GetChildrenAsync(id, tenantId);
        return Ok(assets.Select(a => a.ToResponse()).ToList());
    }

    /// <summary>
    /// Get all descendants (children, grandchildren, etc.) of an asset
    /// </summary>
    [HttpGet("{id}/descendants")]
    public async Task<ActionResult<List<AssetResponse>>> GetDescendants(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var assets = await _assetRepository.GetDescendantsAsync(id, tenantId);
        return Ok(assets.Select(a => a.ToResponse()).ToList());
    }

    /// <summary>
    /// Get all ancestors (parent, grandparent, etc.) of an asset
    /// </summary>
    [HttpGet("{id}/ancestors")]
    public async Task<ActionResult<List<AssetResponse>>> GetAncestors(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var assets = await _assetRepository.GetAncestorsAsync(id, tenantId);
        return Ok(assets.Select(a => a.ToResponse()).ToList());
    }

    /// <summary>
    /// Search assets by name, type, or status
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<AssetListResponse>> SearchAssets(
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? assetType = null,
        [FromQuery] string? status = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        AssetType? parsedAssetType = string.IsNullOrWhiteSpace(assetType) 
            ? null 
            : MappingExtensions.ParseAssetType(assetType);

        AssetStatus? parsedStatus = string.IsNullOrWhiteSpace(status) 
            ? null 
            : MappingExtensions.ParseAssetStatus(status);

        var assets = await _assetRepository.SearchAsync(tenantId, searchTerm, parsedAssetType, parsedStatus, skip, take);
        var totalCount = await _assetRepository.GetCountAsync(tenantId, parsedAssetType, parsedStatus);

        return Ok(new AssetListResponse
        {
            Assets = assets.Select(a => a.ToResponse()).ToList(),
            TotalCount = totalCount,
            Skip = skip,
            Take = take
        });
    }

    /// <summary>
    /// Create a new asset
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AssetResponse>> CreateAsset(
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] CreateAssetRequest request)
    {
        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.Parse(tenantId),
            ParentId = request.ParentId,
            Name = request.Name,
            Description = request.Description,
            AssetType = MappingExtensions.ParseAssetType(request.AssetType),
            Metadata = request.Metadata ?? new Dictionary<string, object>(),
            Location = request.Location?.ToDomain(),
            Status = MappingExtensions.ParseAssetStatus(request.Status),
            CreatedAt = DateTimeOffset.UtcNow
        };

        var created = await _assetRepository.CreateAsync(asset);
        return CreatedAtAction(nameof(GetAsset), new { id = created.Id, tenantId }, created.ToResponse());
    }

    /// <summary>
    /// Update an existing asset
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AssetResponse>> UpdateAsset(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] UpdateAssetRequest request)
    {
        var asset = await _assetRepository.GetByIdAsync(id, tenantId);
        if (asset == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name))
            asset.Name = request.Name;

        if (request.Description != null)
            asset.Description = request.Description;

        if (request.Metadata != null)
            asset.Metadata = request.Metadata;

        if (request.Location != null)
            asset.Location = request.Location.ToDomain();

        if (!string.IsNullOrWhiteSpace(request.Status))
            asset.Status = MappingExtensions.ParseAssetStatus(request.Status);

        var updated = await _assetRepository.UpdateAsync(asset);
        return Ok(updated.ToResponse());
    }

    /// <summary>
    /// Move an asset to a new parent
    /// </summary>
    [HttpPost("{id}/move")]
    public async Task<ActionResult<AssetResponse>> MoveAsset(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] MoveAssetRequest request)
    {
        try
        {
            var moved = await _assetRepository.MoveAssetAsync(id, request.NewParentId, tenantId);
            return Ok(moved.ToResponse());
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete an asset
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsset(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        await _assetRepository.DeleteAsync(id, tenantId);
        return NoContent();
    }

    /// <summary>
    /// Get the current state of an asset
    /// </summary>
    [HttpGet("{id}/state")]
    public async Task<ActionResult<AssetStateResponse>> GetAssetState(Guid id, [FromHeader(Name = "X-Tenant-Id")] string tenantId)
    {
        var state = await _assetRepository.GetStateAsync(id, tenantId);
        if (state == null)
            return NotFound();

        return Ok(state.ToResponse());
    }

    /// <summary>
    /// Update the state of an asset
    /// </summary>
    [HttpPost("{id}/state")]
    public async Task<IActionResult> UpdateAssetState(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] UpdateAssetStateRequest request)
    {
        var state = new AssetState
        {
            AssetId = id,
            State = request.State,
            LastUpdateTime = DateTimeOffset.UtcNow,
            LastUpdateDeviceId = request.DeviceId
        };

        await _assetRepository.UpdateStateAsync(state);
        return NoContent();
    }

    /// <summary>
    /// Get states for multiple assets in one call
    /// </summary>
    [HttpPost("states/bulk")]
    public async Task<ActionResult<BulkStateResponse>> GetBulkStates(
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromBody] BulkStateRequest request)
    {
        var states = await _assetRepository.GetBulkStatesAsync(request.AssetIds, tenantId);
        
        return Ok(new BulkStateResponse
        {
            States = states.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.ToResponse())
        });
    }

    private async Task LoadChildrenRecursively(Asset asset, string tenantId)
    {
        asset.Children = (await _assetRepository.GetChildrenAsync(asset.Id, tenantId)).ToList();
        foreach (var child in asset.Children)
        {
            await LoadChildrenRecursively(child, tenantId);
        }
    }
}
