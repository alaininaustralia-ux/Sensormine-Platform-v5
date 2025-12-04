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
    /// Device type (e.g., "MQTT_SENSOR", "OPC_UA", "NEXUS_PROBE")
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// Schema identifier for data validation
    /// </summary>
    public string SchemaId { get; set; } = string.Empty;

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
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
}
