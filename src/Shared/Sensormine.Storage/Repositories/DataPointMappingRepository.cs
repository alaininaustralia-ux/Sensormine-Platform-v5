using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;
using Sensormine.Storage.Interfaces;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository implementation for DataPointMapping operations
/// </summary>
public class DataPointMappingRepository : IDataPointMappingRepository
{
    private readonly ApplicationDbContext _context;

    public DataPointMappingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DataPointMapping?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.DataPointMappings
            .AsNoTracking()
            .IgnoreAutoIncludes()
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantGuid, cancellationToken);
    }

    public async Task<List<DataPointMapping>> GetBySchemaIdAsync(Guid schemaId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.DataPointMappings
            .AsNoTracking()
            .IgnoreAutoIncludes()
            .Where(m => m.SchemaId == schemaId && m.TenantId == tenantGuid)
            .OrderBy(m => m.Label)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<DataPointMapping>> GetByAssetIdAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.DataPointMappings
            .AsNoTracking()
            .IgnoreAutoIncludes()
            .Where(m => m.AssetId == assetId && m.TenantId == tenantGuid)
            .OrderBy(m => m.Label)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<DataPointMapping>> GetByDeviceIdAsync(string deviceId, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        // Get device to find its schema
        var device = await _context.Devices
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId && d.TenantId == tenantGuid, cancellationToken);

        if (device == null)
            return new List<DataPointMapping>();

        return await GetBySchemaIdAsync(device.DeviceTypeId, tenantId, cancellationToken);
    }

    public async Task<DataPointMapping> CreateAsync(DataPointMapping mapping, CancellationToken cancellationToken = default)
    {
        // Validate asset exists
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == mapping.AssetId && a.TenantId == mapping.TenantId, cancellationToken);

        if (asset == null)
            throw new ArgumentException($"Asset {mapping.AssetId} not found");

        // Check for duplicates
        var existing = await _context.DataPointMappings
            .FirstOrDefaultAsync(m => 
                m.SchemaId == mapping.SchemaId && 
                m.JsonPath == mapping.JsonPath && 
                m.TenantId == mapping.TenantId,
                cancellationToken);

        if (existing != null)
            throw new InvalidOperationException($"Mapping already exists for schema {mapping.SchemaId} and path {mapping.JsonPath}");

        _context.DataPointMappings.Add(mapping);
        await _context.SaveChangesAsync(cancellationToken);
        return mapping;
    }

    public async Task<DataPointMapping> UpdateAsync(DataPointMapping mapping, CancellationToken cancellationToken = default)
    {
        mapping.UpdatedAt = DateTimeOffset.UtcNow;
        _context.DataPointMappings.Update(mapping);
        await _context.SaveChangesAsync(cancellationToken);
        return mapping;
    }

    public async Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var mapping = await _context.DataPointMappings
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantGuid, cancellationToken);

        if (mapping != null)
        {
            _context.DataPointMappings.Remove(mapping);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ValidateMappingAsync(DataPointMapping mapping, CancellationToken cancellationToken = default)
    {
        // Validate asset exists
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == mapping.AssetId && a.TenantId == mapping.TenantId, cancellationToken);

        if (asset == null)
            return false;

        // TODO: Validate schema exists via SchemaRegistry.API service call
        // Schema validation skipped for now since schemas are in separate database
        // var schema = await _context.Schemas
        //     .FirstOrDefaultAsync(s => s.Id == mapping.SchemaId && s.TenantId == mapping.TenantId, cancellationToken);
        // if (schema == null)
        //     return false;

        // Validate JsonPath format
        if (string.IsNullOrWhiteSpace(mapping.JsonPath) || !mapping.JsonPath.StartsWith("$."))
            return false;

        // Validate label
        if (string.IsNullOrWhiteSpace(mapping.Label))
            return false;

        // Check for duplicates (if creating new)
        if (mapping.Id == Guid.Empty)
        {
            var existing = await _context.DataPointMappings
                .FirstOrDefaultAsync(m => 
                    m.SchemaId == mapping.SchemaId && 
                    m.JsonPath == mapping.JsonPath && 
                    m.TenantId == mapping.TenantId,
                    cancellationToken);

            if (existing != null)
                return false;
        }

        return true;
    }
}
