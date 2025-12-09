namespace Sensormine.Core.Models;

/// <summary>
/// Time-series data point
/// </summary>
public class TimeSeriesData
{
    /// <summary>
    /// Device identifier
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Tenant identifier
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// Timestamp of the measurement
    /// </summary>
    public DateTimeOffset Timestamp { get; set; }

    /// <summary>
    /// Measurement values as key-value pairs
    /// </summary>
    public Dictionary<string, object> Values { get; set; } = new();

    /// <summary>
    /// Quality indicators or flags
    /// </summary>
    public Dictionary<string, string>? Quality { get; set; }

    /// <summary>
    /// Tags for filtering and grouping
    /// </summary>
    public Dictionary<string, string>? Tags { get; set; }
}
