using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;
using Sensormine.Storage.Interfaces;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository implementation for Asset operations with LTREE support
/// </summary>
public class AssetRepository : IAssetRepository
{
    private readonly ApplicationDbContext _context;

    public AssetRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Asset?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Assets
            .Include(a => a.CurrentState)
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantGuid, cancellationToken);
    }

    public async Task<List<Asset>> GetAllAsync(string tenantId, int skip = 0, int take = 100, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Assets
            .Include(a => a.CurrentState)
            .Where(a => a.TenantId == tenantGuid)
            .OrderBy(a => a.Path)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<Asset> CreateAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        // Set path and level based on parent
        if (asset.ParentId.HasValue)
        {
            var parent = await _context.Assets.FindAsync(new object[] { asset.ParentId.Value }, cancellationToken);
            if (parent == null)
                throw new ArgumentException($"Parent asset {asset.ParentId} not found");

            asset.Path = $"{parent.Path}.{asset.Id}";
            asset.Level = parent.Level + 1;
        }
        else
        {
            asset.Path = asset.Id.ToString();
            asset.Level = 0;
        }

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);
        return asset;
    }

    public async Task<Asset> UpdateAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        asset.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Assets.Update(asset);
        await _context.SaveChangesAsync(cancellationToken);
        return asset;
    }

    public async Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantGuid, cancellationToken);

        if (asset != null)
        {
            _context.Assets.Remove(asset);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<Asset>> GetChildrenAsync(Guid parentId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Assets
            .Include(a => a.CurrentState)
            .Where(a => a.ParentId == parentId && a.TenantId == tenantGuid)
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Asset>> GetDescendantsAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId && a.TenantId == tenantGuid, cancellationToken);

        if (asset == null)
            return new List<Asset>();

        // Use raw SQL for LTREE queries - PostgreSQL specific
        var sql = @"
            SELECT * FROM assets
            WHERE tenant_id = {0}::uuid
            AND path <@ {1}::ltree
            AND id != {2}
            ORDER BY path";

        return await _context.Assets
            .FromSqlRaw(sql, tenantId, asset.Path, assetId)
            .Include(a => a.CurrentState)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Asset>> GetAncestorsAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId && a.TenantId == tenantGuid, cancellationToken);

        if (asset == null)
            return new List<Asset>();

        // Use raw SQL for LTREE queries
        var sql = @"
            SELECT * FROM assets
            WHERE tenant_id = {0}::uuid
            AND path @> {1}::ltree
            AND id != {2}
            ORDER BY path";

        return await _context.Assets
            .FromSqlRaw(sql, tenantId, asset.Path, assetId)
            .Include(a => a.CurrentState)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Asset>> GetRootAssetsAsync(string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Assets
            .Include(a => a.CurrentState)
            .Where(a => a.TenantId == tenantGuid && a.ParentId == null)
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Asset>> SearchAsync(string tenantId, string? searchTerm = null, AssetType? assetType = null, AssetStatus? status = null, int skip = 0, int take = 100, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.Assets
            .Include(a => a.CurrentState)
            .Where(a => a.TenantId == tenantGuid);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(a => 
                a.Name.Contains(searchTerm) || 
                (a.Description != null && a.Description.Contains(searchTerm)));
        }

        if (assetType.HasValue)
        {
            query = query.Where(a => a.AssetType == assetType.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        return await query
            .OrderBy(a => a.Name)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountAsync(string tenantId, AssetType? assetType = null, AssetStatus? status = null, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.Assets.Where(a => a.TenantId == tenantGuid);

        if (assetType.HasValue)
        {
            query = query.Where(a => a.AssetType == assetType.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<Asset> MoveAssetAsync(Guid assetId, Guid? newParentId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId && a.TenantId == tenantGuid, cancellationToken);

        if (asset == null)
            throw new ArgumentException($"Asset {assetId} not found");

        // Validate new parent exists and is not a descendant
        if (newParentId.HasValue)
        {
            var newParent = await _context.Assets
                .FirstOrDefaultAsync(a => a.Id == newParentId.Value && a.TenantId == tenantGuid, cancellationToken);

            if (newParent == null)
                throw new ArgumentException($"Parent asset {newParentId} not found");

            // Check if new parent is a descendant
            if (newParent.Path.StartsWith(asset.Path))
                throw new InvalidOperationException("Cannot move asset to one of its descendants");

            asset.ParentId = newParentId;
            asset.Path = $"{newParent.Path}.{asset.Id}";
            asset.Level = newParent.Level + 1;
        }
        else
        {
            asset.ParentId = null;
            asset.Path = asset.Id.ToString();
            asset.Level = 0;
        }

        // Update all descendant paths
        var descendants = await GetDescendantsAsync(assetId, tenantId, cancellationToken: cancellationToken);
        foreach (var descendant in descendants)
        {
            var relativePath = descendant.Path.Substring(asset.Path.Length);
            descendant.Path = asset.Path + relativePath;
            descendant.Level = asset.Path.Split('.').Length - 1 + relativePath.Split('.', StringSplitOptions.RemoveEmptyEntries).Length;
        }

        asset.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return asset;
    }

    public async Task<AssetState?> GetStateAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.AssetStates
            .FirstOrDefaultAsync(s => s.AssetId == assetId && s.Asset!.TenantId == tenantGuid, cancellationToken);
    }

    public async Task UpdateStateAsync(AssetState state, CancellationToken cancellationToken = default)
    {
        var existing = await _context.AssetStates
            .FirstOrDefaultAsync(s => s.AssetId == state.AssetId, cancellationToken);

        if (existing == null)
        {
            _context.AssetStates.Add(state);
        }
        else
        {
            existing.State = state.State;
            existing.CalculatedMetrics = state.CalculatedMetrics;
            existing.AlarmStatus = state.AlarmStatus;
            existing.AlarmCount = state.AlarmCount;
            existing.LastUpdateTime = state.LastUpdateTime;
            existing.LastUpdateDeviceId = state.LastUpdateDeviceId;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Dictionary<Guid, AssetState>> GetBulkStatesAsync(List<Guid> assetIds, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var states = await _context.AssetStates
            .Where(s => assetIds.Contains(s.AssetId) && s.Asset!.TenantId == tenantGuid)
            .ToListAsync(cancellationToken);

        return states.ToDictionary(s => s.AssetId, s => s);
    }

    public async Task<int> GetDeviceCountAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        
        // Count devices directly assigned to this asset
        var count = await _context.Devices
            .Where(d => d.AssetId == assetId && d.TenantId == tenantGuid)
            .CountAsync(cancellationToken);

        return count;
    }

    /// <summary>
    /// Get device counts for multiple assets in a single query
    /// </summary>
    public async Task<Dictionary<Guid, int>> GetBulkDeviceCountsAsync(List<Guid> assetIds, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        
        // Group by asset ID and count devices
        var counts = await _context.Devices
            .Where(d => d.AssetId.HasValue && assetIds.Contains(d.AssetId.Value) && d.TenantId == tenantGuid)
            .GroupBy(d => d.AssetId!.Value)
            .Select(g => new { AssetId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AssetId, x => x.Count, cancellationToken);

        // Add zero counts for assets with no devices
        foreach (var assetId in assetIds)
        {
            if (!counts.ContainsKey(assetId))
            {
                counts[assetId] = 0;
            }
        }

        return counts;
    }

    /// <summary>
    /// Get human-readable path (names) for an asset by traversing ancestors
    /// </summary>
    public async Task<string> GetPathNamesAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId && a.TenantId == tenantGuid, cancellationToken);

        if (asset == null)
            return string.Empty;

        // Get all ancestor IDs from the path
        var pathIds = asset.Path.Split('.', StringSplitOptions.RemoveEmptyEntries)
            .Select(id => Guid.Parse(id))
            .ToList();

        // Fetch all assets in the path in one query
        var pathAssets = await _context.Assets
            .Where(a => pathIds.Contains(a.Id) && a.TenantId == tenantGuid)
            .OrderBy(a => a.Level)
            .Select(a => a.Name)
            .ToListAsync(cancellationToken);

        // Join with " > "
        return string.Join(" > ", pathAssets);
    }
}
