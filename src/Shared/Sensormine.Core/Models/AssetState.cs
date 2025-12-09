namespace Sensormine.Core.Models;

/// <summary>
/// Represents the current state of an asset in the digital twin
/// </summary>
public class AssetState
{
    /// <summary>
    /// Asset ID (primary key and foreign key)
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// Asset navigation property
    /// </summary>
    public virtual Asset Asset { get; set; } = null!;

    /// <summary>
    /// Tenant ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// Current state values as key-value pairs
    /// </summary>
    public Dictionary<string, object> State { get; set; } = new();

    /// <summary>
    /// Calculated metrics (uptime, OEE, availability, etc.)
    /// </summary>
    public Dictionary<string, object> CalculatedMetrics { get; set; } = new();

    /// <summary>
    /// Current alarm status
    /// </summary>
    public AlarmStatus AlarmStatus { get; set; } = AlarmStatus.Ok;

    /// <summary>
    /// Number of active alarms
    /// </summary>
    public int AlarmCount { get; set; }

    /// <summary>
    /// Timestamp of last state update
    /// </summary>
    public DateTimeOffset LastUpdateTime { get; set; }

    /// <summary>
    /// Device ID that provided the last update
    /// </summary>
    public string? LastUpdateDeviceId { get; set; }
}

/// <summary>
/// Alarm status levels
/// </summary>
public enum AlarmStatus
{
    Ok,
    Warning,
    Critical
}
