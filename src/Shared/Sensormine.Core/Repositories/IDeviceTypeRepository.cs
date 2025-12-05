using Sensormine.Core.Models;

namespace Sensormine.Core.Repositories;

/// <summary>
/// Repository interface for Device Type operations
/// </summary>
public interface IDeviceTypeRepository
{
    /// <summary>
    /// Gets a device type by ID
    /// </summary>
    /// <param name="id">Device type ID</param>
    /// <param name="tenantId">Tenant ID for multi-tenancy isolation</param>
    /// <returns>Device type or null if not found</returns>
    Task<DeviceType?> GetByIdAsync(Guid id, Guid tenantId);

    /// <summary>
    /// Gets all device types for a tenant with pagination
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>Paginated list of device types</returns>
    Task<(IEnumerable<DeviceType> Items, int TotalCount)> GetAllAsync(
        Guid tenantId, 
        int page = 1, 
        int pageSize = 20);

    /// <summary>
    /// Creates a new device type
    /// </summary>
    /// <param name="deviceType">Device type to create</param>
    /// <returns>Created device type with generated ID</returns>
    Task<DeviceType> CreateAsync(DeviceType deviceType);

    /// <summary>
    /// Updates an existing device type
    /// </summary>
    /// <param name="deviceType">Device type with updated values</param>
    /// <returns>Updated device type</returns>
    Task<DeviceType> UpdateAsync(DeviceType deviceType);

    /// <summary>
    /// Deletes a device type (soft delete)
    /// </summary>
    /// <param name="id">Device type ID</param>
    /// <param name="tenantId">Tenant ID for multi-tenancy isolation</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteAsync(Guid id, Guid tenantId);

    /// <summary>
    /// Checks if a device type with the given name already exists for the tenant
    /// </summary>
    /// <param name="name">Device type name</param>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="excludeId">Optional ID to exclude from check (for updates)</param>
    /// <returns>True if exists</returns>
    Task<bool> ExistsAsync(string name, Guid tenantId, Guid? excludeId = null);

    /// <summary>
    /// Searches device types by name and/or tags
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="searchTerm">Search term for name/description</param>
    /// <param name="tags">Filter by tags</param>
    /// <param name="protocol">Filter by protocol</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <returns>Filtered device types</returns>
    Task<(IEnumerable<DeviceType> Items, int TotalCount)> SearchAsync(
        Guid tenantId,
        string? searchTerm = null,
        List<string>? tags = null,
        DeviceProtocol? protocol = null,
        int page = 1,
        int pageSize = 20);
}
