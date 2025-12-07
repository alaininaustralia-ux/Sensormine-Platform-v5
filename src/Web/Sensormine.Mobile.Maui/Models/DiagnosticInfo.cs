namespace Sensormine.Mobile.Maui.Models;

/// <summary>
/// Represents diagnostic information read from a device via NFC
/// </summary>
public class DiagnosticInfo
{
    /// <summary>
    /// Device ID
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Battery level percentage (0-100)
    /// </summary>
    public int? BatteryLevel { get; set; }

    /// <summary>
    /// Battery voltage in volts
    /// </summary>
    public double? BatteryVoltage { get; set; }

    /// <summary>
    /// Last broadcast timestamp
    /// </summary>
    public DateTime? LastBroadcastTime { get; set; }

    /// <summary>
    /// Signal strength (RSSI in dBm)
    /// </summary>
    public int? SignalStrength { get; set; }

    /// <summary>
    /// Sensor statuses
    /// </summary>
    public Dictionary<string, SensorStatus>? SensorStatuses { get; set; }

    /// <summary>
    /// Configuration integrity checksum
    /// </summary>
    public string? ConfigChecksum { get; set; }

    /// <summary>
    /// Error codes
    /// </summary>
    public List<string>? ErrorCodes { get; set; }

    /// <summary>
    /// Warning messages
    /// </summary>
    public List<string>? Warnings { get; set; }

    /// <summary>
    /// Uptime in seconds
    /// </summary>
    public long? UptimeSeconds { get; set; }

    /// <summary>
    /// Memory usage percentage
    /// </summary>
    public int? MemoryUsage { get; set; }

    /// <summary>
    /// CPU usage percentage
    /// </summary>
    public int? CpuUsage { get; set; }

    /// <summary>
    /// When the diagnostic was read
    /// </summary>
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Low battery threshold percentage (configurable via app settings)
    /// </summary>
    public const int LowBatteryThreshold = 20;

    /// <summary>
    /// Overall health status
    /// </summary>
    public HealthStatus OverallHealth
    {
        get
        {
            // Has errors
            if (ErrorCodes?.Any() == true)
                return HealthStatus.Error;

            // Low battery (configurable threshold)
            if (BatteryLevel.HasValue && BatteryLevel < LowBatteryThreshold)
                return HealthStatus.Warning;

            // Any sensor errors
            if (SensorStatuses?.Any(s => s.Value == SensorStatus.Error) == true)
                return HealthStatus.Error;

            // Any sensor warnings
            if (SensorStatuses?.Any(s => s.Value == SensorStatus.Offline) == true)
                return HealthStatus.Warning;

            // Has warnings
            if (Warnings?.Any() == true)
                return HealthStatus.Warning;

            return HealthStatus.Healthy;
        }
    }

    /// <summary>
    /// Formats uptime as human-readable string
    /// </summary>
    public string FormattedUptime
    {
        get
        {
            if (!UptimeSeconds.HasValue)
                return "Unknown";

            var timespan = TimeSpan.FromSeconds(UptimeSeconds.Value);
            
            if (timespan.TotalDays >= 1)
                return $"{(int)timespan.TotalDays}d {timespan.Hours}h";
            
            if (timespan.TotalHours >= 1)
                return $"{(int)timespan.TotalHours}h {timespan.Minutes}m";
            
            return $"{(int)timespan.TotalMinutes}m {timespan.Seconds}s";
        }
    }
}

/// <summary>
/// Sensor status enumeration
/// </summary>
public enum SensorStatus
{
    Operational,
    Warning,
    Error,
    Offline
}

/// <summary>
/// Overall health status
/// </summary>
public enum HealthStatus
{
    Healthy,
    Warning,
    Error,
    Unknown
}
