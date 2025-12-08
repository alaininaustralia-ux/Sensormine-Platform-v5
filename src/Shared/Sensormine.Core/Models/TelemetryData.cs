namespace Sensormine.Core.Models;

/// <summary>
/// Represents a telemetry data point with flexible JSONB custom fields
/// </summary>
public class TelemetryData
{
    /// <summary>
    /// Timestamp of the measurement
    /// </summary>
    public DateTimeOffset Time { get; set; }

    /// <summary>
    /// Device identifier
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Tenant identifier
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// Device type identifier
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    // System-level fields (fixed columns for common IoT data)
    
    /// <summary>
    /// Battery level percentage (0-100)
    /// </summary>
    public double? BatteryLevel { get; set; }

    /// <summary>
    /// Signal strength (RSSI or similar)
    /// </summary>
    public double? SignalStrength { get; set; }

    /// <summary>
    /// GPS Latitude
    /// </summary>
    public double? Latitude { get; set; }

    /// <summary>
    /// GPS Longitude
    /// </summary>
    public double? Longitude { get; set; }

    /// <summary>
    /// Altitude in meters
    /// </summary>
    public double? Altitude { get; set; }

    // Dynamic fields
    
    /// <summary>
    /// All user-configurable sensor fields (temperature, humidity, pressure, etc.)
    /// Stored as JSONB in database for flexibility
    /// </summary>
    public Dictionary<string, object> CustomFields { get; set; } = new();

    /// <summary>
    /// Data quality indicators
    /// </summary>
    public Dictionary<string, string>? Quality { get; set; }
}
