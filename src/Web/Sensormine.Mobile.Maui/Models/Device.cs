namespace Sensormine.Mobile.Maui.Models;

/// <summary>
/// Represents a device instance in the SensorMine platform
/// </summary>
public class Device
{
    /// <summary>
    /// Unique identifier for the device
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Hardware device ID (from NFC tag or serial number)
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable device name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Device type identifier
    /// </summary>
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Device type reference
    /// </summary>
    public DeviceType? DeviceType { get; set; }

    /// <summary>
    /// Serial number from manufacturer
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Current device status
    /// </summary>
    public DeviceStatus Status { get; set; }

    /// <summary>
    /// Firmware version
    /// </summary>
    public string? FirmwareVersion { get; set; }

    /// <summary>
    /// Hardware revision
    /// </summary>
    public string? HardwareVersion { get; set; }

    /// <summary>
    /// Custom field values (JSON)
    /// </summary>
    public Dictionary<string, object>? CustomFieldValues { get; set; }

    /// <summary>
    /// Device location
    /// </summary>
    public Location? Location { get; set; }

    /// <summary>
    /// Current configuration (JSON)
    /// </summary>
    public string? Configuration { get; set; }

    /// <summary>
    /// When the device was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the device was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// When the device was last seen online
    /// </summary>
    public DateTime? LastSeenAt { get; set; }

    /// <summary>
    /// Tenant ID for multi-tenancy
    /// </summary>
    public Guid TenantId { get; set; }
}

/// <summary>
/// Device status enumeration
/// </summary>
public enum DeviceStatus
{
    Active,
    Inactive,
    Maintenance,
    Error,
    Offline
}
