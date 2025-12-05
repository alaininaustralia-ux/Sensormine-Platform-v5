namespace Sensormine.Core.Models;

/// <summary>
/// Represents an audit log entry for Device Type changes
/// </summary>
public class DeviceTypeAuditLog
{
    /// <summary>
    /// Unique identifier for this audit log entry
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Reference to the Device Type that was modified
    /// </summary>
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Tenant ID for multi-tenancy isolation
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// Type of action performed (Created, Updated, SchemaChanged, Deleted, Rollback)
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// JSON representation of the previous state (for updates)
    /// </summary>
    public string? OldValue { get; set; }

    /// <summary>
    /// JSON representation of the new state
    /// </summary>
    public string? NewValue { get; set; }

    /// <summary>
    /// Human-readable summary of the changes
    /// </summary>
    public string? ChangeSummary { get; set; }

    /// <summary>
    /// Timestamp when this action occurred
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// User ID who performed this action
    /// </summary>
    public string UserId { get; set; } = string.Empty;
}
