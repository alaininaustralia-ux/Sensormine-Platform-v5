using Sensormine.Core.Models;

namespace Sensormine.Storage.Interfaces;

/// <summary>
/// Repository interface for schema management
/// </summary>
public interface ISchemaRepository
{
    // Schema CRUD
    Task<Schema> CreateAsync(Schema schema, CancellationToken cancellationToken = default);
    Task<Schema?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<Schema?> GetByNameAsync(string name, string tenantId, CancellationToken cancellationToken = default);
    Task<List<Schema>> ListAsync(string tenantId, int skip = 0, int take = 50, CancellationToken cancellationToken = default);
    Task<int> CountAsync(string tenantId, CancellationToken cancellationToken = default);
    Task<Schema> UpdateAsync(Schema schema, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);

    // Version management
    Task<SchemaVersion> CreateVersionAsync(SchemaVersion version, CancellationToken cancellationToken = default);
    Task<SchemaVersion?> GetVersionAsync(Guid schemaId, string version, string tenantId, CancellationToken cancellationToken = default);
    Task<SchemaVersion?> GetDefaultVersionAsync(Guid schemaId, string tenantId, CancellationToken cancellationToken = default);
    Task<List<SchemaVersion>> ListVersionsAsync(Guid schemaId, string tenantId, CancellationToken cancellationToken = default);
    Task<SchemaVersion> UpdateVersionAsync(SchemaVersion version, CancellationToken cancellationToken = default);
    Task SetDefaultVersionAsync(Guid schemaId, Guid versionId, string tenantId, CancellationToken cancellationToken = default);
}
