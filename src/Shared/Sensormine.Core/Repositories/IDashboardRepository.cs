using Sensormine.Core.Models;

namespace Sensormine.Core.Repositories;

/// <summary>
/// Repository interface for Dashboard entity
/// </summary>
public interface IDashboardRepository
{
    /// <summary>
    /// Get dashboard by ID for a specific tenant
    /// </summary>
    Task<Dashboard?> GetByIdAsync(Guid id, string tenantId);

    /// <summary>
    /// Get all dashboards for a specific user and tenant
    /// </summary>
    Task<IEnumerable<Dashboard>> GetByUserIdAsync(string userId, string tenantId);

    /// <summary>
    /// Get all dashboards for a tenant (admin/shared view)
    /// </summary>
    Task<IEnumerable<Dashboard>> GetByTenantAsync(string tenantId, int skip = 0, int take = 50);

    /// <summary>
    /// Create a new dashboard
    /// </summary>
    Task<Dashboard> CreateAsync(Dashboard dashboard);

    /// <summary>
    /// Update an existing dashboard
    /// </summary>
    Task<Dashboard> UpdateAsync(Dashboard dashboard);

    /// <summary>
    /// Delete a dashboard (soft delete)
    /// </summary>
    Task<bool> DeleteAsync(Guid id, string tenantId);

    /// <summary>
    /// Search dashboards by name or tags
    /// </summary>
    Task<IEnumerable<Dashboard>> SearchAsync(string tenantId, string? searchTerm = null, string[]? tags = null);
}
