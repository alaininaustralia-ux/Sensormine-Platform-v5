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
    Task<DeviceType?> GetByIdAsync(Guid id, string tenantId);

    /// <summary>
    /// Gets all device types for a tenant with pagination
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>Paginated list of device types</returns>
    Task<(IEnumerable<DeviceType> Items, int TotalCount)> GetAllAsync(
        string tenantId, 
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
    Task<bool> DeleteAsync(Guid id, string tenantId);

    /// <summary>
    /// Checks if a device type with the given name already exists for the tenant
    /// </summary>
    /// <param name="name">Device type name</param>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="excludeId">Optional ID to exclude from check (for updates)</param>
    /// <returns>True if exists</returns>
    Task<bool> ExistsAsync(string name, string tenantId, Guid? excludeId = null);

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
        string tenantId,
        string? searchTerm = null,
        List<string>? tags = null,
        DeviceProtocol? protocol = null,
        int page = 1,
        int pageSize = 20);

    /// <summary>
    /// Gets the version history for a device type
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <param name="tenantId">Tenant ID for security</param>
    /// <returns>List of versions ordered by version number descending</returns>
    Task<List<DeviceTypeVersion>> GetVersionHistoryAsync(Guid deviceTypeId, string tenantId);

    /// <summary>
    /// Rolls back a device type to a previous version
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <param name="version">Version number to rollback to</param>
    /// <param name="tenantId">Tenant ID for security</param>
    /// <param name="userId">User performing the rollback</param>
    /// <returns>Updated device type</returns>
    Task<DeviceType> RollbackToVersionAsync(Guid deviceTypeId, int version, string tenantId, string userId);

    /// <summary>
    /// Gets usage statistics for a device type
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <param name="tenantId">Tenant ID for security</param>
    /// <returns>Usage statistics</returns>
    Task<DeviceTypeUsageStatistics> GetUsageStatisticsAsync(Guid deviceTypeId, string tenantId);

    /// <summary>
    /// Gets audit log entries for a device type
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <param name="tenantId">Tenant ID for security</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <returns>Paginated audit log entries</returns>
    Task<(List<DeviceTypeAuditLog> Items, int TotalCount)> GetAuditLogsAsync(
        Guid deviceTypeId, 
        string tenantId,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Validates a device type update for breaking changes
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <param name="proposedUpdate">Proposed device type changes</param>
    /// <param name="tenantId">Tenant ID for security</param>
    /// <returns>Validation result with warnings and affected device count</returns>
    Task<DeviceTypeUpdateValidationResult> ValidateUpdateAsync(
        Guid deviceTypeId,
        DeviceType proposedUpdate,
        string tenantId);
}
