using Sensormine.Core.Models;

namespace Sensormine.Storage.Interfaces;

/// <summary>
/// Repository interface for Asset operations
/// </summary>
public interface IAssetRepository
{
    // Basic CRUD
    Task<Asset?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<List<Asset>> GetAllAsync(string tenantId, int skip = 0, int take = 100, CancellationToken cancellationToken = default);
    Task<Asset> CreateAsync(Asset asset, CancellationToken cancellationToken = default);
    Task<Asset> UpdateAsync(Asset asset, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    
    // Hierarchical queries
    Task<List<Asset>> GetChildrenAsync(Guid parentId, string tenantId, CancellationToken cancellationToken = default);
    Task<List<Asset>> GetDescendantsAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default);
    Task<List<Asset>> GetAncestorsAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default);
    Task<List<Asset>> GetRootAssetsAsync(string tenantId, CancellationToken cancellationToken = default);
    
    // Search and filter
    Task<List<Asset>> SearchAsync(string tenantId, string? searchTerm = null, AssetType? assetType = null, 
        AssetStatus? status = null, int skip = 0, int take = 100, CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(string tenantId, AssetType? assetType = null, AssetStatus? status = null, 
        CancellationToken cancellationToken = default);
    
    // Move operations
    Task<Asset> MoveAssetAsync(Guid assetId, Guid? newParentId, string tenantId, CancellationToken cancellationToken = default);
    
    // State operations
    Task<AssetState?> GetStateAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default);
    Task UpdateStateAsync(AssetState state, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, AssetState>> GetBulkStatesAsync(List<Guid> assetIds, string tenantId, CancellationToken cancellationToken = default);
    
    // Device count
    Task<int> GetDeviceCountAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, int>> GetBulkDeviceCountsAsync(List<Guid> assetIds, string tenantId, CancellationToken cancellationToken = default);
    
    // Path utilities
    Task<string> GetPathNamesAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default);
}
