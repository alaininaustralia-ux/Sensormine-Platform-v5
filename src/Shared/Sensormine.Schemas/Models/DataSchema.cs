namespace Sensormine.Schemas.Models;

/// <summary>
/// Schema definition for data validation
/// </summary>
public class DataSchema
{
    /// <summary>
    /// Unique schema identifier
    /// </summary>
    public string SchemaId { get; set; } = string.Empty;

    /// <summary>
    /// Schema name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Schema version
    /// </summary>
    public string Version { get; set; } = "1.0.0";

    /// <summary>
    /// Schema description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Schema type (e.g., "JSON_SCHEMA", "AVRO", "PROTOBUF")
    /// </summary>
    public string SchemaType { get; set; } = "JSON_SCHEMA";

    /// <summary>
    /// Schema definition (JSON Schema, Avro schema, etc.)
    /// </summary>
    public string Definition { get; set; } = string.Empty;

    /// <summary>
    /// Tenant identifier
    /// </summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Schema metadata
    /// </summary>
    public Dictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// Whether this schema is active
    /// </summary>
    public bool IsActive { get; set; } = true;
}
