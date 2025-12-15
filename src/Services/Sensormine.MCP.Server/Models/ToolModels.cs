namespace Sensormine.MCP.Server.Models;

/// <summary>
/// Query Devices Tool Request
/// </summary>
public class QueryDevicesRequest
{
    public string TenantId { get; set; } = string.Empty;
    public DeviceFilters? Filters { get; set; }
    public int Limit { get; set; } = 100;
    public string SortBy { get; set; } = "name";
}

public class DeviceFilters
{
    public string? DeviceType { get; set; }
    public LocationFilter? Location { get; set; }
    public string? Status { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
}

public class LocationFilter
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double RadiusKm { get; set; }
}

/// <summary>
/// Query Telemetry Tool Request
/// </summary>
public class QueryTelemetryRequest
{
    public List<string> DeviceIds { get; set; } = new();
    public List<string>? Fields { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string? Aggregation { get; set; }
    public string? Interval { get; set; }
}

/// <summary>
/// Query Asset Hierarchy Tool Request
/// </summary>
public class QueryAssetHierarchyRequest
{
    public string TenantId { get; set; } = string.Empty;
    public string? RootAssetId { get; set; }
    public bool IncludeDevices { get; set; } = true;
    public bool IncludeMetrics { get; set; } = false;
    public int MaxDepth { get; set; } = 10;
}

/// <summary>
/// Detect Anomalies Tool Request
/// </summary>
public class DetectAnomaliesRequest
{
    public string DeviceId { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string Method { get; set; } = "z-score";
    public double Threshold { get; set; } = 3.0;
}

/// <summary>
/// Analyze Trends Tool Request
/// </summary>
public class AnalyzeTrendsRequest
{
    public List<string> DeviceIds { get; set; } = new();
    public string Field { get; set; } = string.Empty;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public List<string> Analysis { get; set; } = new() { "trend" };
}

/// <summary>
/// Calculate KPIs Tool Request
/// </summary>
public class CalculateKpisRequest
{
    public KpiScope Scope { get; set; } = new();
    public List<string> Kpis { get; set; } = new();
    public TimeRange TimeRange { get; set; } = new();
}

public class KpiScope
{
    public string Type { get; set; } = "device"; // device, asset, tenant
    public string Id { get; set; } = string.Empty;
}

public class TimeRange
{
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
}
