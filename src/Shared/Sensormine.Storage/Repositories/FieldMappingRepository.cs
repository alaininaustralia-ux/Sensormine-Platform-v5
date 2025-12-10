using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository implementation for Field Mapping operations
/// </summary>
public class FieldMappingRepository : IFieldMappingRepository
{
    private readonly ApplicationDbContext _context;

    public FieldMappingRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<FieldMapping>> GetByDeviceTypeIdAsync(Guid deviceTypeId, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.FieldMappings
            .Where(fm => fm.DeviceTypeId == deviceTypeId && fm.TenantId == tenantGuid)
            .OrderBy(fm => fm.DisplayOrder)
            .ThenBy(fm => fm.FriendlyName)
            .ToListAsync();
    }

    public async Task<FieldMapping?> GetByIdAsync(Guid id, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.FieldMappings
            .FirstOrDefaultAsync(fm => fm.Id == id && fm.TenantId == tenantGuid);
    }

    public async Task<FieldMapping?> GetByFieldNameAsync(Guid deviceTypeId, string fieldName, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.FieldMappings
            .FirstOrDefaultAsync(fm => 
                fm.DeviceTypeId == deviceTypeId && 
                fm.FieldName == fieldName && 
                fm.TenantId == tenantGuid);
    }

    public async Task<FieldMapping> CreateAsync(FieldMapping fieldMapping)
    {
        fieldMapping.Id = Guid.NewGuid();
        fieldMapping.CreatedAt = DateTime.UtcNow;
        fieldMapping.UpdatedAt = DateTime.UtcNow;

        _context.FieldMappings.Add(fieldMapping);
        await _context.SaveChangesAsync();

        return fieldMapping;
    }

    public async Task<FieldMapping> UpdateAsync(FieldMapping fieldMapping)
    {
        fieldMapping.UpdatedAt = DateTime.UtcNow;

        _context.FieldMappings.Update(fieldMapping);
        await _context.SaveChangesAsync();

        return fieldMapping;
    }

    public async Task<bool> DeleteAsync(Guid id, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var fieldMapping = await _context.FieldMappings
            .FirstOrDefaultAsync(fm => fm.Id == id && fm.TenantId == tenantGuid);

        if (fieldMapping == null)
            return false;

        _context.FieldMappings.Remove(fieldMapping);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<FieldMapping>> CreateManyAsync(IEnumerable<FieldMapping> fieldMappings)
    {
        var mappings = fieldMappings.ToList();
        var now = DateTime.UtcNow;

        foreach (var mapping in mappings)
        {
            mapping.Id = Guid.NewGuid();
            mapping.CreatedAt = now;
            mapping.UpdatedAt = now;
        }

        _context.FieldMappings.AddRange(mappings);
        await _context.SaveChangesAsync();

        return mappings;
    }

    public async Task<IEnumerable<FieldMapping>> UpdateManyAsync(IEnumerable<FieldMapping> fieldMappings)
    {
        var mappings = fieldMappings.ToList();
        var now = DateTime.UtcNow;

        foreach (var mapping in mappings)
        {
            mapping.UpdatedAt = now;
        }

        _context.FieldMappings.UpdateRange(mappings);
        await _context.SaveChangesAsync();

        return mappings;
    }

    public async Task<bool> DeleteByDeviceTypeIdAsync(Guid deviceTypeId, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var fieldMappings = await _context.FieldMappings
            .Where(fm => fm.DeviceTypeId == deviceTypeId && fm.TenantId == tenantGuid)
            .ToListAsync();

        if (!fieldMappings.Any())
            return false;

        _context.FieldMappings.RemoveRange(fieldMappings);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ExistsAsync(Guid deviceTypeId, string fieldName, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.FieldMappings
            .AnyAsync(fm => 
                fm.DeviceTypeId == deviceTypeId && 
                fm.FieldName == fieldName && 
                fm.TenantId == tenantGuid);
    }
}
