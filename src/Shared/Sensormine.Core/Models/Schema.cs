namespace Sensormine.Core.Models;

/// <summary>
/// Represents a schema definition for data validation
/// </summary>
public class Schema : BaseEntity
{
    /// <summary>
    /// Schema name (unique per tenant)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Schema description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// User who created the schema
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// User who last updated the schema
    /// </summary>
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Soft delete flag
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// Soft delete timestamp
    /// </summary>
    public DateTimeOffset? DeletedAt { get; set; }

    /// <summary>
    /// Schema versions (version history)
    /// </summary>
    public virtual ICollection<SchemaVersion> Versions { get; set; } = new List<SchemaVersion>();
}
