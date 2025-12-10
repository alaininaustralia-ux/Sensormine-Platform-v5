namespace Sensormine.Core.DTOs;

/// <summary>
/// Query parameters for asset-based telemetry requests
/// </summary>
public class AssetTelemetryQuery
{
    /// <summary>
    /// Asset ID to query telemetry for
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// Include telemetry from descendant assets
    /// </summary>
    public bool IncludeDescendants { get; set; } = true;

    /// <summary>
    /// Specific telemetry field names to retrieve
    /// </summary>
    public List<string>? Fields { get; set; }

    /// <summary>
    /// Start time for time range query (ISO 8601)
    /// </summary>
    public DateTime? StartTime { get; set; }

    /// <summary>
    /// End time for time range query (ISO 8601)
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Aggregation method (avg, sum, min, max, count)
    /// </summary>
    public string Aggregation { get; set; } = "avg";

    /// <summary>
    /// Time interval for aggregation (1m, 5m, 15m, 1h, 1d)
    /// </summary>
    public string Interval { get; set; } = "5m";

    /// <summary>
    /// Maximum number of data points to return
    /// </summary>
    public int Limit { get; set; } = 1000;
}

/// <summary>
/// Response containing aggregated telemetry data for an asset
/// </summary>
public class AssetTelemetryResponse
{
    /// <summary>
    /// Asset ID
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// Asset name
    /// </summary>
    public string AssetName { get; set; } = string.Empty;

    /// <summary>
    /// Number of devices contributing to the data
    /// </summary>
    public int DeviceCount { get; set; }

    /// <summary>
    /// Time series data by field
    /// </summary>
    public List<TelemetrySeriesData> Series { get; set; } = new();
}

/// <summary>
/// Time series data for a single telemetry field
/// </summary>
public class TelemetrySeriesData
{
    /// <summary>
    /// Field name
    /// </summary>
    public string Field { get; set; } = string.Empty;

    /// <summary>
    /// Unit of measurement
    /// </summary>
    public string? Unit { get; set; }

    /// <summary>
    /// Aggregated data points
    /// </summary>
    public List<AggregatedDataPoint> DataPoints { get; set; } = new();
}

/// <summary>
/// Single aggregated data point
/// </summary>
public class AggregatedDataPoint
{
    /// <summary>
    /// Timestamp of the data point
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Aggregated value
    /// </summary>
    public double Value { get; set; }

    /// <summary>
    /// Number of raw values aggregated
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// Minimum value in the aggregation period
    /// </summary>
    public double? Min { get; set; }

    /// <summary>
    /// Maximum value in the aggregation period
    /// </summary>
    public double? Max { get; set; }
}

/// <summary>
/// Query parameters for devices with telemetry by asset
/// </summary>
public class AssetDevicesQuery
{
    /// <summary>
    /// Asset ID
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// Include devices from descendant assets
    /// </summary>
    public bool IncludeDescendants { get; set; } = true;

    /// <summary>
    /// Optional field filter for telemetry
    /// </summary>
    public List<string>? Fields { get; set; }

    /// <summary>
    /// Maximum number of devices to return
    /// </summary>
    public int Limit { get; set; } = 100;
}

/// <summary>
/// Response containing devices with latest telemetry for an asset
/// </summary>
public class AssetDevicesResponse
{
    /// <summary>
    /// Asset ID
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// List of devices with their latest telemetry
    /// </summary>
    public List<DeviceWithLatestTelemetry> Devices { get; set; } = new();
}

/// <summary>
/// Device information with latest telemetry data
/// </summary>
public class DeviceWithLatestTelemetry
{
    /// <summary>
    /// Device ID
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Device name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Device type name
    /// </summary>
    public string DeviceTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Device status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Last seen timestamp
    /// </summary>
    public DateTime? LastSeenAt { get; set; }

    /// <summary>
    /// Latest telemetry data
    /// </summary>
    public LatestTelemetryData? LatestTelemetry { get; set; }
}

/// <summary>
/// Latest telemetry data for a device
/// </summary>
public class LatestTelemetryData
{
    /// <summary>
    /// Telemetry timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Field values
    /// </summary>
    public Dictionary<string, object> Fields { get; set; } = new();
}
