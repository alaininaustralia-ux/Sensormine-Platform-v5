using Sensormine.MCP.Server.Models;

namespace Sensormine.MCP.Server.Services;

/// <summary>
/// Interface for MCP resource providers
/// </summary>
public interface IResourceProvider
{
    Task<ListResourcesResponse> ListResourcesAsync(string? uriPattern, CancellationToken cancellationToken);
    Task<ReadResourceResponse> ReadResourceAsync(string uri, CancellationToken cancellationToken);
}

/// <summary>
/// Interface for MCP tool handlers
/// </summary>
public interface IToolHandler
{
    string ToolName { get; }
    string Description { get; }
    object InputSchema { get; }
    Task<CallToolResponse> ExecuteAsync(object parameters, string tenantId, CancellationToken cancellationToken);
}

/// <summary>
/// Interface for service clients
/// </summary>
public interface IDeviceApiClient
{
    Task<DeviceListResponse> GetDevicesAsync(string tenantId, DeviceQueryParams? queryParams = null, CancellationToken cancellationToken = default);
    Task<DeviceResponse> GetDeviceAsync(string tenantId, string deviceId, CancellationToken cancellationToken = default);
}

public interface IQueryApiClient
{
    Task<TelemetryResponse> QueryTelemetryAsync(string tenantId, TelemetryQueryRequest request, CancellationToken cancellationToken = default);
    Task<LatestTelemetryResponse> GetLatestTelemetryAsync(string tenantId, string deviceId, CancellationToken cancellationToken = default);
}

public interface IDigitalTwinApiClient
{
    Task<AssetListResponse> GetAssetsAsync(string tenantId, AssetQueryParams? queryParams = null, CancellationToken cancellationToken = default);
    Task<AssetResponse> GetAssetAsync(string tenantId, string assetId, CancellationToken cancellationToken = default);
    Task<AssetTreeResponse> GetAssetTreeAsync(string tenantId, string assetId, CancellationToken cancellationToken = default);
}

// Response models (simplified - these would match your existing API responses)
public class DeviceListResponse
{
    public List<DeviceDto> Devices { get; set; } = new();
    public int TotalCount { get; set; }
}

public class DeviceDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public string? Status { get; set; }
    public object? Location { get; set; }
    public DateTimeOffset? LastSeenAt { get; set; }
    public Dictionary<string, object>? CustomFieldValues { get; set; }
}

public class DeviceResponse
{
    public DeviceDto Device { get; set; } = new();
}

public class DeviceQueryParams
{
    public string? DeviceTypeId { get; set; }
    public string? Status { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; } = 100;
}

public class TelemetryResponse
{
    public List<TelemetryDataPoint> Data { get; set; } = new();
}

public class TelemetryDataPoint
{
    public DateTimeOffset Timestamp { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public Dictionary<string, object> Values { get; set; } = new();
}

public class LatestTelemetryResponse
{
    public DateTimeOffset? Timestamp { get; set; }
    public Dictionary<string, object> Values { get; set; } = new();
}

public class TelemetryQueryRequest
{
    public List<string> DeviceIds { get; set; } = new();
    public List<string>? Fields { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string? Aggregation { get; set; }
    public string? Interval { get; set; }
}

public class AssetListResponse
{
    public List<AssetDto> Assets { get; set; } = new();
    public int TotalCount { get; set; }
}

public class AssetDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ParentId { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public int Level { get; set; }
    public int ChildCount { get; set; }
    public int DeviceCount { get; set; }
}

public class AssetResponse
{
    public AssetDto Asset { get; set; } = new();
}

public class AssetTreeResponse
{
    public AssetDto Asset { get; set; } = new();
    public List<AssetTreeResponse> Children { get; set; } = new();
}

public class AssetQueryParams
{
    public string? ParentId { get; set; }
    public string? AssetType { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; } = 100;
}
