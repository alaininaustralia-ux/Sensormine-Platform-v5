namespace Sensormine.Core.Models;

/// <summary>
/// Represents a triggered alert instance
/// </summary>
public class AlertInstance : BaseEntity
{
    /// <summary>
    /// Reference to the alert rule that triggered this instance
    /// </summary>
    public Guid AlertRuleId { get; set; }

    /// <summary>
    /// Navigation property to the alert rule
    /// </summary>
    public AlertRule? AlertRule { get; set; }

    /// <summary>
    /// Device that triggered the alert
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// Navigation property to the device
    /// </summary>
    public Device? Device { get; set; }

    /// <summary>
    /// Alert severity (copied from rule, but can be overridden by condition level)
    /// </summary>
    public AlertSeverity Severity { get; set; }

    /// <summary>
    /// Alert status
    /// </summary>
    public AlertStatus Status { get; set; } = AlertStatus.Active;

    /// <summary>
    /// Alert message describing what triggered the alert
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Detailed information about which condition triggered
    /// </summary>
    public string Details { get; set; } = string.Empty;

    /// <summary>
    /// Field values at the time of alert (for debugging)
    /// </summary>
    public Dictionary<string, object> FieldValues { get; set; } = new();

    /// <summary>
    /// When the alert was triggered
    /// </summary>
    public DateTimeOffset TriggeredAt { get; set; }

    /// <summary>
    /// When the alert was acknowledged
    /// </summary>
    public DateTimeOffset? AcknowledgedAt { get; set; }

    /// <summary>
    /// User who acknowledged the alert
    /// </summary>
    public string? AcknowledgedBy { get; set; }

    /// <summary>
    /// Acknowledgment notes
    /// </summary>
    public string? AcknowledgmentNotes { get; set; }

    /// <summary>
    /// When the alert was resolved
    /// </summary>
    public DateTimeOffset? ResolvedAt { get; set; }

    /// <summary>
    /// How the alert was resolved
    /// </summary>
    public string? ResolutionNotes { get; set; }

    /// <summary>
    /// Whether this alert has been escalated
    /// </summary>
    public bool IsEscalated { get; set; } = false;

    /// <summary>
    /// When the alert was escalated
    /// </summary>
    public DateTimeOffset? EscalatedAt { get; set; }

    /// <summary>
    /// Number of notifications sent for this alert
    /// </summary>
    public int NotificationCount { get; set; } = 0;

    /// <summary>
    /// Last notification sent time
    /// </summary>
    public DateTimeOffset? LastNotificationAt { get; set; }
}

/// <summary>
/// Alert instance status
/// </summary>
public enum AlertStatus
{
    /// <summary>
    /// Alert is active and not yet acknowledged
    /// </summary>
    Active,

    /// <summary>
    /// Alert has been acknowledged but not resolved
    /// </summary>
    Acknowledged,

    /// <summary>
    /// Alert has been resolved
    /// </summary>
    Resolved,

    /// <summary>
    /// Alert was suppressed (maintenance window, etc.)
    /// </summary>
    Suppressed
}
