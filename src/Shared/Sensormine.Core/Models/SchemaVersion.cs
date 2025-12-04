namespace Sensormine.Core.Models;

/// <summary>
/// Represents a specific version of a schema
/// </summary>
public class SchemaVersion : BaseEntity
{
    /// <summary>
    /// Parent schema ID
    /// </summary>
    public Guid SchemaId { get; set; }

    /// <summary>
    /// Parent schema navigation property
    /// </summary>
    public virtual Schema Schema { get; set; } = null!;

    /// <summary>
    /// Semantic version (major.minor.patch)
    /// </summary>
    public string Version { get; set; } = "1.0.0";

    /// <summary>
    /// JSON Schema definition (JSON Schema draft 7 format)
    /// </summary>
    public string JsonSchema { get; set; } = string.Empty;

    /// <summary>
    /// Schema status
    /// </summary>
    public SchemaStatus Status { get; set; } = SchemaStatus.Draft;

    /// <summary>
    /// Indicates if this is the default version for the schema
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// User who created this version
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Device types that use this schema version
    /// </summary>
    public List<string> DeviceTypes { get; set; } = new();

    /// <summary>
    /// Additional metadata (JSON)
    /// </summary>
    public string? Metadata { get; set; }
}
