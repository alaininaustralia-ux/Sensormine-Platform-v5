using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;
using Sensormine.Storage.Interfaces;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository for Schema entity operations
/// </summary>
public class SchemaRepository : ISchemaRepository
{
    private readonly ApplicationDbContext _context;

    public SchemaRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Schema> CreateAsync(Schema schema, CancellationToken cancellationToken = default)
    {
        if (schema == null)
            throw new ArgumentNullException(nameof(schema));

        schema.CreatedAt = DateTimeOffset.UtcNow;
        _context.Schemas.Add(schema);
        await _context.SaveChangesAsync(cancellationToken);
        return schema;
    }

    public async Task<Schema?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Schemas
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId, cancellationToken);
    }

    public async Task<Schema?> GetByNameAsync(string name, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Schemas
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Name == name && s.TenantId == tenantId, cancellationToken);
    }

    public async Task<List<Schema>> ListAsync(
        string tenantId,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        return await _context.Schemas
            .Include(s => s.Versions)
            .Where(s => s.TenantId == tenantId)
            .OrderByDescending(s => s.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAsync(string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Schemas
            .Where(s => s.TenantId == tenantId)
            .CountAsync(cancellationToken);
    }

    public async Task<Schema> UpdateAsync(Schema schema, CancellationToken cancellationToken = default)
    {
        if (schema == null)
            throw new ArgumentNullException(nameof(schema));

        schema.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Schemas.Update(schema);
        await _context.SaveChangesAsync(cancellationToken);
        return schema;
    }

    public async Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var schema = await GetByIdAsync(id, tenantId, cancellationToken);
        if (schema == null)
            throw new InvalidOperationException($"Schema with ID {id} not found for tenant {tenantId}");

        // Soft delete
        schema.IsDeleted = true;
        schema.DeletedAt = DateTimeOffset.UtcNow;
        schema.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<SchemaVersion> CreateVersionAsync(SchemaVersion version, CancellationToken cancellationToken = default)
    {
        if (version == null)
            throw new ArgumentNullException(nameof(version));

        version.CreatedAt = DateTimeOffset.UtcNow;
        _context.SchemaVersions.Add(version);
        await _context.SaveChangesAsync(cancellationToken);
        return version;
    }

    public async Task<SchemaVersion?> GetVersionAsync(Guid schemaId, string version, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.SchemaVersions
            .Include(v => v.Schema)
            .FirstOrDefaultAsync(v => 
                v.SchemaId == schemaId && 
                v.Version == version && 
                v.TenantId == tenantId, 
                cancellationToken);
    }

    public async Task<SchemaVersion?> GetDefaultVersionAsync(Guid schemaId, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.SchemaVersions
            .Include(v => v.Schema)
            .FirstOrDefaultAsync(v => 
                v.SchemaId == schemaId && 
                v.TenantId == tenantId && 
                v.IsDefault, 
                cancellationToken);
    }

    public async Task<SchemaVersion> UpdateVersionAsync(SchemaVersion version, CancellationToken cancellationToken = default)
    {
        if (version == null)
            throw new ArgumentNullException(nameof(version));

        _context.SchemaVersions.Update(version);
        await _context.SaveChangesAsync(cancellationToken);
        return version;
    }

    public async Task SetDefaultVersionAsync(Guid schemaId, Guid versionId, string tenantId, CancellationToken cancellationToken = default)
    {
        // Clear existing default
        var existingDefaults = await _context.SchemaVersions
            .Where(v => v.SchemaId == schemaId && v.TenantId == tenantId && v.IsDefault)
            .ToListAsync(cancellationToken);

        foreach (var existing in existingDefaults)
        {
            existing.IsDefault = false;
        }

        // Set new default
        var newDefault = await _context.SchemaVersions
            .FirstOrDefaultAsync(v => 
                v.Id == versionId &&
                v.SchemaId == schemaId && 
                v.TenantId == tenantId, 
                cancellationToken);

        if (newDefault == null)
            throw new InvalidOperationException($"Version with ID {versionId} not found for schema {schemaId}");

        newDefault.IsDefault = true;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<SchemaVersion>> ListVersionsAsync(Guid schemaId, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.SchemaVersions
            .Where(v => v.SchemaId == schemaId && v.TenantId == tenantId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
