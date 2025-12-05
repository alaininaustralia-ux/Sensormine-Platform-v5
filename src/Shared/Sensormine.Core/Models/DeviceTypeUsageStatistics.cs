namespace Sensormine.Core.Models;

/// <summary>
/// Usage statistics for a Device Type
/// </summary>
public class DeviceTypeUsageStatistics
{
    /// <summary>
    /// Device Type ID
    /// </summary>
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Total number of devices using this type
    /// </summary>
    public int TotalDeviceCount { get; set; }

    /// <summary>
    /// Number of active devices
    /// </summary>
    public int ActiveDeviceCount { get; set; }

    /// <summary>
    /// Number of inactive devices
    /// </summary>
    public int InactiveDeviceCount { get; set; }

    /// <summary>
    /// Date when this device type was last used to register a device
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// Timestamp when these statistics were calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}
