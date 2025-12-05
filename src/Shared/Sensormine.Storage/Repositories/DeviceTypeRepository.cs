using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Data;

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

    public async Task<DeviceType?> GetByIdAsync(Guid id, Guid tenantId)
    {
        return await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == id && dt.TenantId == tenantId);
    }

    public async Task<(IEnumerable<DeviceType> Items, int TotalCount)> GetAllAsync(
        Guid tenantId,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.DeviceTypes
            .Where(dt => dt.TenantId == tenantId)
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
        await _context.SaveChangesAsync();

        return deviceType;
    }

    public async Task<DeviceType> UpdateAsync(DeviceType deviceType)
    {
        if (deviceType == null)
            throw new ArgumentNullException(nameof(deviceType));

        // Update timestamp
        deviceType.UpdatedAt = DateTime.UtcNow;

        _context.DeviceTypes.Update(deviceType);
        await _context.SaveChangesAsync();

        return deviceType;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        var deviceType = await _context.DeviceTypes
            .FirstOrDefaultAsync(dt => dt.Id == id && dt.TenantId == tenantId);

        if (deviceType == null)
            return false;

        // Soft delete
        deviceType.IsActive = false;
        deviceType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ExistsAsync(string name, Guid tenantId, Guid? excludeId = null)
    {
        var query = _context.DeviceTypes
            .Where(dt => dt.TenantId == tenantId && dt.Name == name);

        if (excludeId.HasValue)
        {
            query = query.Where(dt => dt.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<DeviceType> Items, int TotalCount)> SearchAsync(
        Guid tenantId,
        string? searchTerm = null,
        List<string>? tags = null,
        DeviceProtocol? protocol = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.DeviceTypes
            .Where(dt => dt.TenantId == tenantId);

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
}
