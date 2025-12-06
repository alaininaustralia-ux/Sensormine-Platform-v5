namespace Sensormine.Core.Models;

/// <summary>
/// Represents a device in the system
/// </summary>
public class Device : BaseEntity
{
    /// <summary>
    /// Unique device identifier (from hardware)
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable device name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Device Type ID (foreign key to DeviceType)
    /// </summary>
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Navigation property to Device Type
    /// </summary>
    public DeviceType? DeviceType { get; set; }

    /// <summary>
    /// Serial number or hardware identifier
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Custom field values specific to this device (based on Device Type custom fields)
    /// </summary>
    public Dictionary<string, object> CustomFieldValues { get; set; } = new();

    /// <summary>
    /// Device location coordinates
    /// </summary>
    public Location? Location { get; set; }

    /// <summary>
    /// Device metadata as key-value pairs
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();

    /// <summary>
    /// Device status (e.g., "Active", "Inactive", "Maintenance")
    /// </summary>
    public string Status { get; set; } = "Active";

    /// <summary>
    /// Last time the device sent data
    /// </summary>
    public DateTimeOffset? LastSeenAt { get; set; }
}

/// <summary>
/// Geographic location
/// </summary>
public class Location
{
    /// <summary>
    /// Latitude coordinate
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Longitude coordinate
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Altitude in meters (optional)
    /// </summary>
    public double? Altitude { get; set; }
}
