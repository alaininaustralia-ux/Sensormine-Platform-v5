using Sensormine.Core.Models;

namespace DigitalTwin.API.DTOs;

/// <summary>
/// Request model for creating a new asset
/// </summary>
public class CreateAssetRequest
{
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public string Category { get; set; } = "Equipment";
    public Dictionary<string, object>? Metadata { get; set; }
    public GeoLocationDto? Location { get; set; }
    public GeographicDataDto? GeographicData { get; set; }
    public string? CadDrawingUrl { get; set; }
    public string Status { get; set; } = "Active";
}

/// <summary>
/// Request model for updating an existing asset
/// </summary>
public class UpdateAssetRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public GeoLocationDto? Location { get; set; }
    public GeographicDataDto? GeographicData { get; set; }
    public string? CadDrawingUrl { get; set; }
    public string? Status { get; set; }
}

/// <summary>
/// Request model for moving an asset in the hierarchy
/// </summary>
public class MoveAssetRequest
{
    public Guid? NewParentId { get; set; }
}

/// <summary>
/// Response model for asset information
/// </summary>
public class AssetResponse
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public int Level { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public GeoLocationDto? Location { get; set; }
    public GeographicDataDto? GeographicData { get; set; }
    public string? CadDrawingUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public int ChildCount { get; set; }
    public int DeviceCount { get; set; }
    public AssetStateResponse? CurrentState { get; set; }
}

/// <summary>
/// Response model for asset with children
/// </summary>
public class AssetTreeResponse : AssetResponse
{
    public List<AssetTreeResponse> Children { get; set; } = new();
}

/// <summary>
/// Geographic location DTO
/// </summary>
public class GeoLocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
}

/// <summary>
/// Geographic data DTO for geography-type assets
/// </summary>
public class GeographicDataDto
{
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? Council { get; set; }
    public string? City { get; set; }
    public GeofenceDataDto? Geofence { get; set; }
}

/// <summary>
/// Geofence definition DTO
/// </summary>
public class GeofenceDataDto
{
    public string Type { get; set; } = "Polygon";
    public List<GeoLocationDto> Coordinates { get; set; } = new();
    public double? Radius { get; set; }
}

/// <summary>
/// List response with pagination
/// </summary>
public class AssetListResponse
{
    public List<AssetResponse> Assets { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
}
