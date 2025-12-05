namespace Sensormine.Core.Models;

/// <summary>
/// Represents a version snapshot of a Device Type configuration
/// </summary>
public class DeviceTypeVersion
{
    /// <summary>
    /// Unique identifier for this version record
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Reference to the Device Type this version belongs to
    /// </summary>
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Auto-incremented version number (1, 2, 3, ...)
    /// </summary>
    public int Version { get; set; }

    /// <summary>
    /// JSON snapshot of the complete DeviceType at this version
    /// </summary>
    public string VersionData { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable description of what changed in this version
    /// </summary>
    public string? ChangeSummary { get; set; }

    /// <summary>
    /// Timestamp when this version was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// User or system that created this version
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;
}
