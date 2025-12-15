using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Data;
using System.Text.Json;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository implementation for Device Type operations
/// </summary>
public class DeviceTypeRepository : IDeviceTypeRepository
{
    private readonly ApplicationDbContext _context;

    public DeviceTypeRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<DeviceType?> GetByIdAsync(Guid id, string tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new ArgumentNullException(nameof(tenantId), "Tenant ID cannot be null or empty");

        var tenantGuid = Guid.Parse(tenantId);
        return await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == id && dt.TenantId == tenantGuid);
    }

    public async Task<(IEnumerable<DeviceType> Items, int TotalCount)> GetAllAsync(
        string tenantId,
        int page = 1,
        int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new ArgumentNullException(nameof(tenantId), "Tenant ID cannot be null or empty");

        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.DeviceTypes
            .Where(dt => dt.TenantId == tenantGuid)
            .OrderBy(dt => dt.Name);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<DeviceType> CreateAsync(DeviceType deviceType)
    {
        if (deviceType == null)
            throw new ArgumentNullException(nameof(deviceType));

        // Set timestamps
        deviceType.CreatedAt = DateTime.UtcNow;
        deviceType.UpdatedAt = DateTime.UtcNow;

        // Ensure lists are initialized
        deviceType.CustomFields ??= new List<CustomFieldDefinition>();
        deviceType.AlertTemplates ??= new List<AlertRuleTemplate>();
        deviceType.Tags ??= new List<string>();

        _context.DeviceTypes.Add(deviceType);
        
        // Create initial version snapshot (version 1)
        await CreateVersionSnapshotAsync(deviceType, "Initial version", deviceType.CreatedBy ?? "system");

        // Create initial audit log
        var newValue = JsonSerializer.Serialize(deviceType);
        await CreateAuditLogAsync(deviceType, "Created", null, newValue, "Device Type created", deviceType.CreatedBy ?? "system");

        await _context.SaveChangesAsync();

        return deviceType;
    }

    public async Task<DeviceType> UpdateAsync(DeviceType deviceType)
    {
        if (deviceType == null)
            throw new ArgumentNullException(nameof(deviceType));

        // Get the current state for versioning and audit
        var currentState = await _context.DeviceTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(dt => dt.Id == deviceType.Id);

        string? oldValue = null;
        string? newValue = null;
        if (currentState != null)
        {
            // Serialize BEFORE attaching to context to avoid circular references
            oldValue = JsonSerializer.Serialize(currentState);
            newValue = JsonSerializer.Serialize(deviceType);
        }

        // Update timestamp
        deviceType.UpdatedAt = DateTime.UtcNow;

        // Update the entity in the context
        _context.DeviceTypes.Update(deviceType);
        
        // Create version snapshot and audit log (these will be saved together)
        if (currentState != null)
        {
            await CreateVersionSnapshotAsync(deviceType, "Device Type updated", deviceType.CreatedBy ?? "system");
            await CreateAuditLogAsync(deviceType, "Updated", oldValue, newValue, null, deviceType.CreatedBy ?? "system");
        }

        // Save all changes (device type, version, and audit log) in one transaction
        await _context.SaveChangesAsync();

        return deviceType;
    }

    public async Task<bool> DeleteAsync(Guid id, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var deviceType = await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == id && dt.TenantId == tenantGuid);

        if (deviceType == null)
            return false;

        // Soft delete
        deviceType.IsActive = false;
        deviceType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ExistsAsync(string name, string tenantId, Guid? excludeId = null)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.DeviceTypes
            .Where(dt => dt.TenantId == tenantGuid && dt.Name == name);

        if (excludeId.HasValue)
        {
            query = query.Where(dt => dt.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<DeviceType> Items, int TotalCount)> SearchAsync(
        string tenantId,
        string? searchTerm = null,
        List<string>? tags = null,
        DeviceProtocol? protocol = null,
        int page = 1,
        int pageSize = 20)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.DeviceTypes
            .Where(dt => dt.TenantId == tenantGuid);

        // Apply search term filter (search in name and description)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower();
            query = query.Where(dt =>
                dt.Name.ToLower().Contains(lowerSearchTerm) ||
                (dt.Description != null && dt.Description.ToLower().Contains(lowerSearchTerm)));
        }

        // Apply protocol filter
        if (protocol.HasValue)
        {
            query = query.Where(dt => dt.Protocol == protocol.Value);
        }

        // Apply tags filter (device type must have at least one of the specified tags)
        if (tags != null && tags.Any())
        {
            // PostgreSQL array overlap operator
            query = query.Where(dt => dt.Tags.Any(tag => tags.Contains(tag)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(dt => dt.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<List<DeviceTypeVersion>> GetVersionHistoryAsync(Guid deviceTypeId, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        // Verify the device type belongs to the tenant
        var deviceType = await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == deviceTypeId && dt.TenantId == tenantGuid);

        if (deviceType == null)
            throw new InvalidOperationException($"Device type {deviceTypeId} not found for tenant {tenantId}");

        return await _context.DeviceTypeVersions
            .Where(v => v.DeviceTypeId == deviceTypeId)
            .OrderByDescending(v => v.Version)
            .ToListAsync();
    }

    public async Task<DeviceType> RollbackToVersionAsync(Guid deviceTypeId, int version, string tenantId, string userId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        // Get the device type and verify ownership
        var deviceType = await _context.DeviceTypes
            .IgnoreQueryFilters() // Include soft-deleted items
            .FirstOrDefaultAsync(dt => dt.Id == deviceTypeId && dt.TenantId == tenantGuid);

        if (deviceType == null)
            throw new InvalidOperationException($"Device type {deviceTypeId} not found");

        // Get the version to rollback to
        var targetVersion = await _context.DeviceTypeVersions
            .FirstOrDefaultAsync(v => v.DeviceTypeId == deviceTypeId && v.Version == version);

        if (targetVersion == null)
            throw new InvalidOperationException($"Version {version} not found for device type {deviceTypeId}");

        // Store current state for audit log
        var oldValue = JsonSerializer.Serialize(deviceType);

        // Deserialize the version data
        var restoredData = JsonSerializer.Deserialize<DeviceType>(targetVersion.VersionData);
        if (restoredData == null)
            throw new InvalidOperationException($"Failed to deserialize version {version} data");

        // Apply the restored data (keeping the same ID and timestamps)
        deviceType.Name = restoredData.Name;
        deviceType.Description = restoredData.Description;
        deviceType.Protocol = restoredData.Protocol;
        deviceType.ProtocolConfig = restoredData.ProtocolConfig;
        deviceType.SchemaId = restoredData.SchemaId;
        deviceType.CustomFields = restoredData.CustomFields;
        deviceType.AlertTemplates = restoredData.AlertTemplates;
        deviceType.Tags = restoredData.Tags;
        deviceType.IsActive = true; // Reactivate if it was soft-deleted
        deviceType.UpdatedAt = DateTime.UtcNow;

        // Create a new version snapshot for this rollback
        await CreateVersionSnapshotAsync(deviceType, $"Rolled back to version {version}", userId);

        // Create audit log entry
        await CreateAuditLogAsync(deviceType, "Rollback", oldValue, JsonSerializer.Serialize(deviceType), 
            $"Rolled back to version {version}", userId);

        await _context.SaveChangesAsync();

        return deviceType;
    }

    public async Task<DeviceTypeUsageStatistics> GetUsageStatisticsAsync(Guid deviceTypeId, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        // Verify the device type belongs to the tenant
        var deviceType = await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == deviceTypeId && dt.TenantId == tenantGuid);

        if (deviceType == null)
            throw new InvalidOperationException($"Device type {deviceTypeId} not found for tenant {tenantId}");

        // TODO: When Device table is implemented, query actual device counts
        // For now, return mock data
        return new DeviceTypeUsageStatistics
        {
            DeviceTypeId = deviceTypeId,
            TotalDeviceCount = 0,
            ActiveDeviceCount = 0,
            InactiveDeviceCount = 0,
            LastUsedAt = null,
            CalculatedAt = DateTime.UtcNow
        };
    }

    public async Task<(List<DeviceTypeAuditLog> Items, int TotalCount)> GetAuditLogsAsync(
        Guid deviceTypeId,
        string tenantId,
        int page = 1,
        int pageSize = 20)
    {
        var tenantGuid = Guid.Parse(tenantId);
        // Verify the device type belongs to the tenant
        var deviceType = await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == deviceTypeId && dt.TenantId == tenantGuid);

        if (deviceType == null)
            throw new InvalidOperationException($"Device type {deviceTypeId} not found for tenant {tenantId}");

        var query = _context.DeviceTypeAuditLogs
            .Where(log => log.DeviceTypeId == deviceTypeId && log.TenantId == tenantGuid)
            .OrderByDescending(log => log.Timestamp);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<DeviceTypeUpdateValidationResult> ValidateUpdateAsync(
        Guid deviceTypeId,
        DeviceType proposedUpdate,
        string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var result = new DeviceTypeUpdateValidationResult
        {
            IsValid = true
        };

        // Get the current device type
        var currentDeviceType = await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == deviceTypeId && dt.TenantId == tenantGuid);

        if (currentDeviceType == null)
            throw new InvalidOperationException($"Device type {deviceTypeId} not found");

        // Check for protocol change (breaking change)
        if (currentDeviceType.Protocol != proposedUpdate.Protocol)
        {
            result.IsValid = false;
            result.BreakingChanges.Add($"Protocol change from {currentDeviceType.Protocol} to {proposedUpdate.Protocol} requires device reconfiguration");
        }

        // Check for schema change (potential breaking change)
        if (currentDeviceType.SchemaId != proposedUpdate.SchemaId)
        {
            result.Warnings.Add("Schema change detected. Verify that existing device data is compatible with the new schema.");
        }

        // Check for required custom field additions
        var newRequiredFields = proposedUpdate.CustomFields
            .Where(pf => pf.Required)
            .Where(pf => !currentDeviceType.CustomFields.Any(cf => cf.Name == pf.Name))
            .ToList();

        if (newRequiredFields.Any())
        {
            result.IsValid = false;
            result.BreakingChanges.Add($"Added {newRequiredFields.Count} new required custom field(s). Existing devices need values for: {string.Join(", ", newRequiredFields.Select(f => f.Name))}");
        }

        // Check for custom field type changes
        var typeChangedFields = proposedUpdate.CustomFields
            .Where(pf => currentDeviceType.CustomFields.Any(cf => cf.Name == pf.Name && cf.Type != pf.Type))
            .ToList();

        if (typeChangedFields.Any())
        {
            result.Warnings.Add($"Custom field type changed for: {string.Join(", ", typeChangedFields.Select(f => f.Name))}. Data migration may be required.");
        }

        // Check for removed custom fields with data
        var removedFields = currentDeviceType.CustomFields
            .Where(cf => !proposedUpdate.CustomFields.Any(pf => pf.Name == cf.Name))
            .ToList();

        if (removedFields.Any())
        {
            result.Warnings.Add($"Removed custom field(s): {string.Join(", ", removedFields.Select(f => f.Name))}. Existing data will be preserved but not visible.");
        }

        // Get affected device count (TODO: replace with actual query when Device table exists)
        result.AffectedDeviceCount = 0; // Mock value

        // Add recommended actions
        if (!result.IsValid)
        {
            result.RecommendedActions.Add("Review all breaking changes before proceeding");
            result.RecommendedActions.Add("Consider creating a new Device Type instead of modifying this one");
            
            if (result.AffectedDeviceCount > 0)
            {
                result.RecommendedActions.Add($"Update or reconfigure {result.AffectedDeviceCount} affected device(s)");
            }
        }

        if (result.Warnings.Any())
        {
            result.RecommendedActions.Add("Test the changes with a sample device before rolling out to all devices");
        }

        return result;
    }

    // Helper method to create version snapshots
    private async Task CreateVersionSnapshotAsync(DeviceType deviceType, string changeSummary, string userId)
    {
        // Get the current max version number
        var maxVersion = await _context.DeviceTypeVersions
            .Where(v => v.DeviceTypeId == deviceType.Id)
            .Select(v => (int?)v.Version)
            .MaxAsync() ?? 0;

        var version = new DeviceTypeVersion
        {
            Id = Guid.NewGuid(),
            DeviceTypeId = deviceType.Id,
            Version = maxVersion + 1,
            VersionData = JsonSerializer.Serialize(deviceType),
            ChangeSummary = changeSummary,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.DeviceTypeVersions.Add(version);
    }

    // Helper method to create audit log entries
    private async Task CreateAuditLogAsync(
        DeviceType deviceType,
        string action,
        string? oldValue,
        string? newValue,
        string? changeSummary,
        string userId)
    {
        var auditLog = new DeviceTypeAuditLog
        {
            Id = Guid.NewGuid(),
            DeviceTypeId = deviceType.Id,
            TenantId = deviceType.TenantId,
            Action = action,
            OldValue = oldValue,
            NewValue = newValue,
            ChangeSummary = changeSummary,
            Timestamp = DateTime.UtcNow,
            UserId = userId
        };

        _context.DeviceTypeAuditLogs.Add(auditLog);
        await Task.CompletedTask; // Keep method async for consistency
    }
}
