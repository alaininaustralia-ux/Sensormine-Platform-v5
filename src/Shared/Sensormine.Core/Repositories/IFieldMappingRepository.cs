using Sensormine.Core.Models;

namespace Sensormine.Core.Repositories;

/// <summary>
/// Repository interface for Field Mapping operations
/// </summary>
public interface IFieldMappingRepository
{
    /// <summary>
    /// Get all field mappings for a device type
    /// </summary>
    Task<IEnumerable<FieldMapping>> GetByDeviceTypeIdAsync(Guid deviceTypeId, string tenantId);

    /// <summary>
    /// Get a specific field mapping by ID
    /// </summary>
    Task<FieldMapping?> GetByIdAsync(Guid id, string tenantId);

    /// <summary>
    /// Get a field mapping by device type and field name
    /// </summary>
    Task<FieldMapping?> GetByFieldNameAsync(Guid deviceTypeId, string fieldName, string tenantId);

    /// <summary>
    /// Create a new field mapping
    /// </summary>
    Task<FieldMapping> CreateAsync(FieldMapping fieldMapping);

    /// <summary>
    /// Update an existing field mapping
    /// </summary>
    Task<FieldMapping> UpdateAsync(FieldMapping fieldMapping);

    /// <summary>
    /// Delete a field mapping
    /// </summary>
    Task<bool> DeleteAsync(Guid id, string tenantId);

    /// <summary>
    /// Bulk create field mappings
    /// </summary>
    Task<IEnumerable<FieldMapping>> CreateManyAsync(IEnumerable<FieldMapping> fieldMappings);

    /// <summary>
    /// Bulk update field mappings
    /// </summary>
    Task<IEnumerable<FieldMapping>> UpdateManyAsync(IEnumerable<FieldMapping> fieldMappings);

    /// <summary>
    /// Delete all field mappings for a device type
    /// </summary>
    Task<bool> DeleteByDeviceTypeIdAsync(Guid deviceTypeId, string tenantId);

    /// <summary>
    /// Check if a field mapping exists
    /// </summary>
    Task<bool> ExistsAsync(Guid deviceTypeId, string fieldName, string tenantId);
}
