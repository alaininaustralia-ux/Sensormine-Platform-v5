namespace DigitalTwin.API.DTOs;

/// <summary>
/// Response model for asset state
/// </summary>
public class AssetStateResponse
{
    public Guid AssetId { get; set; }
    public Dictionary<string, object> State { get; set; } = new();
    public Dictionary<string, object> CalculatedMetrics { get; set; } = new();
    public string AlarmStatus { get; set; } = "Ok";
    public int AlarmCount { get; set; }
    public DateTimeOffset LastUpdateTime { get; set; }
    public string? LastUpdateDeviceId { get; set; }
}

/// <summary>
/// Request to update asset state
/// </summary>
public class UpdateAssetStateRequest
{
    public Dictionary<string, object> State { get; set; } = new();
    public string? DeviceId { get; set; }
}

/// <summary>
/// Request for bulk state query
/// </summary>
public class BulkStateRequest
{
    public List<Guid> AssetIds { get; set; } = new();
}

/// <summary>
/// Response for bulk state query
/// </summary>
public class BulkStateResponse
{
    public Dictionary<Guid, AssetStateResponse> States { get; set; } = new();
}

/// <summary>
/// Asset rollup response
/// </summary>
public class AssetRollupResponse
{
    public Guid AssetId { get; set; }
    public string MetricName { get; set; } = string.Empty;
    public double? Value { get; set; }
    public int SampleCount { get; set; }
    public DateTimeOffset Time { get; set; }
    public Dictionary<Guid, double?> ChildValues { get; set; } = new();
}
