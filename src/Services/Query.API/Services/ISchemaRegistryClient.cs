using Sensormine.Core.Models;

namespace Query.API.Services;

/// <summary>
/// HTTP client interface for SchemaRegistry.API
/// </summary>
public interface ISchemaRegistryClient
{
    /// <summary>
    /// Get schema by ID
    /// </summary>
    Task<SchemaDto?> GetSchemaByIdAsync(Guid schemaId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Schema DTO from SchemaRegistry.API
/// </summary>
public class SchemaDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TenantId { get; set; }
    public SchemaVersionDetailDto? CurrentVersion { get; set; }
}

/// <summary>
/// Schema version detail DTO
/// </summary>
public class SchemaVersionDetailDto
{
    public Guid Id { get; set; }
    public Guid SchemaId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string JsonSchema { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
