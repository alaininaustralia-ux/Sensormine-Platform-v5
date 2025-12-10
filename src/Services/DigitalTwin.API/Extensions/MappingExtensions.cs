using DigitalTwin.API.DTOs;
using Sensormine.Core.Models;

namespace DigitalTwin.API.Extensions;

/// <summary>
/// Extension methods for mapping between domain models and DTOs
/// </summary>
public static class MappingExtensions
{
    /// <summary>
    /// Convert Asset entity to AssetResponse DTO
    /// </summary>
    public static AssetResponse ToResponse(this Asset asset, int childCount = 0, int deviceCount = 0)
    {
        return new AssetResponse
        {
            Id = asset.Id,
            TenantId = asset.TenantId.ToString(),
            ParentId = asset.ParentId,
            Name = asset.Name,
            Description = asset.Description,
            AssetType = asset.AssetType.ToString(),
            Category = asset.Category.ToString(),
            Path = asset.Path,
            Level = asset.Level,
            Metadata = asset.Metadata ?? new Dictionary<string, object>(),
            Location = asset.Location?.ToDto(),
            GeographicData = asset.GeographicData?.ToDto(),
            CadDrawingUrl = asset.CadDrawingUrl,
            Status = asset.Status.ToString(),
            CreatedAt = asset.CreatedAt,
            UpdatedAt = asset.UpdatedAt,
            CreatedBy = asset.CreatedBy,
            UpdatedBy = asset.UpdatedBy,
            ChildCount = childCount,
            DeviceCount = deviceCount,
            CurrentState = asset.CurrentState?.ToResponse()
        };
    }

    /// <summary>
    /// Convert Asset entity to AssetTreeResponse DTO with children
    /// </summary>
    public static AssetTreeResponse ToTreeResponse(this Asset asset, int deviceCount = 0)
    {
        return new AssetTreeResponse
        {
            Id = asset.Id,
            TenantId = asset.TenantId.ToString(),
            ParentId = asset.ParentId,
            Name = asset.Name,
            Description = asset.Description,
            AssetType = asset.AssetType.ToString(),
            Category = asset.Category.ToString(),
            Path = asset.Path,
            Level = asset.Level,
            Metadata = asset.Metadata ?? new Dictionary<string, object>(),
            Location = asset.Location?.ToDto(),
            GeographicData = asset.GeographicData?.ToDto(),
            CadDrawingUrl = asset.CadDrawingUrl,
            Status = asset.Status.ToString(),
            CreatedAt = asset.CreatedAt,
            UpdatedAt = asset.UpdatedAt,
            CreatedBy = asset.CreatedBy,
            UpdatedBy = asset.UpdatedBy,
            ChildCount = asset.Children?.Count ?? 0,
            DeviceCount = deviceCount,
            CurrentState = asset.CurrentState?.ToResponse(),
            Children = asset.Children?.Select(c => c.ToTreeResponse()).ToList() ?? new List<AssetTreeResponse>()
        };
    }

    /// <summary>
    /// Convert GeoLocation to DTO
    /// </summary>
    public static GeoLocationDto? ToDto(this GeoLocation? location)
    {
        if (location == null) return null;

        return new GeoLocationDto
        {
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            Altitude = location.Altitude
        };
    }

    /// <summary>
    /// Convert GeoLocationDto to domain model
    /// </summary>
    public static GeoLocation? ToDomain(this GeoLocationDto? dto)
    {
        if (dto == null) return null;

        return new GeoLocation
        {
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Altitude = dto.Altitude
        };
    }

    /// <summary>
    /// Convert GeographicData to DTO
    /// </summary>
    public static GeographicDataDto? ToDto(this GeographicData? data)
    {
        if (data == null) return null;

        return new GeographicDataDto
        {
            Country = data.Country,
            State = data.State,
            Council = data.Council,
            City = data.City,
            Geofence = data.Geofence?.ToDto()
        };
    }

    /// <summary>
    /// Convert GeographicDataDto to domain model
    /// </summary>
    public static GeographicData? ToDomain(this GeographicDataDto? dto)
    {
        if (dto == null) return null;

        return new GeographicData
        {
            Country = dto.Country,
            State = dto.State,
            Council = dto.Council,
            City = dto.City,
            Geofence = dto.Geofence?.ToDomain()
        };
    }

    /// <summary>
    /// Convert GeofenceData to DTO
    /// </summary>
    public static GeofenceDataDto? ToDto(this GeofenceData? data)
    {
        if (data == null) return null;

        return new GeofenceDataDto
        {
            Type = data.Type,
            Coordinates = data.Coordinates?.Select(c => c.ToDto()).Where(c => c != null).Cast<GeoLocationDto>().ToList() ?? new List<GeoLocationDto>(),
            Radius = data.Radius
        };
    }

    /// <summary>
    /// Convert GeofenceDataDto to domain model
    /// </summary>
    public static GeofenceData? ToDomain(this GeofenceDataDto? dto)
    {
        if (dto == null) return null;

        return new GeofenceData
        {
            Type = dto.Type,
            Coordinates = dto.Coordinates?.Select(c => c.ToDomain()).Where(c => c != null).Cast<GeoLocation>().ToList() ?? new List<GeoLocation>(),
            Radius = dto.Radius
        };
    }

    /// <summary>
    /// Convert AssetState entity to AssetStateResponse DTO
    /// </summary>
    public static AssetStateResponse ToResponse(this AssetState state)
    {
        return new AssetStateResponse
        {
            AssetId = state.AssetId,
            State = state.State ?? new Dictionary<string, object>(),
            CalculatedMetrics = state.CalculatedMetrics ?? new Dictionary<string, object>(),
            AlarmStatus = state.AlarmStatus.ToString(),
            AlarmCount = state.AlarmCount,
            LastUpdateTime = state.LastUpdateTime,
            LastUpdateDeviceId = state.LastUpdateDeviceId
        };
    }

    /// <summary>
    /// Convert DataPointMapping entity to MappingResponse DTO
    /// </summary>
    public static MappingResponse ToResponse(this DataPointMapping mapping, string assetName, string assetPath)
    {
        return new MappingResponse
        {
            Id = mapping.Id,
            TenantId = mapping.TenantId.ToString(),
            SchemaId = mapping.SchemaId,
            SchemaVersion = mapping.SchemaVersion,
            JsonPath = mapping.JsonPath,
            AssetId = mapping.AssetId,
            AssetName = assetName,
            AssetPath = assetPath,
            Label = mapping.Label,
            Description = mapping.Description,
            Unit = mapping.Unit,
            AggregationMethod = mapping.AggregationMethod.ToString(),
            RollupEnabled = mapping.RollupEnabled,
            TransformExpression = mapping.TransformExpression,
            Metadata = mapping.Metadata ?? new Dictionary<string, object>(),
            CreatedAt = mapping.CreatedAt,
            UpdatedAt = mapping.UpdatedAt
        };
    }

    /// <summary>
    /// Parse AssetType from string
    /// </summary>
    public static AssetType ParseAssetType(string assetType)
    {
        if (string.IsNullOrWhiteSpace(assetType))
        {
            return AssetType.Equipment; // Default to Equipment if not specified
        }
        return Enum.Parse<AssetType>(assetType, ignoreCase: true);
    }

    /// <summary>
    /// Parse AssetStatus from string
    /// </summary>
    public static AssetStatus ParseAssetStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return AssetStatus.Active; // Default to Active if not specified
        }
        return Enum.Parse<AssetStatus>(status, ignoreCase: true);
    }

    /// <summary>
    /// Parse AssetCategory from string
    /// </summary>
    public static AssetCategory ParseAssetCategory(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return AssetCategory.Equipment; // Default to Equipment if not specified
        }
        return Enum.Parse<AssetCategory>(category, ignoreCase: true);
    }

    /// <summary>
    /// Parse AggregationMethod from string
    /// </summary>
    public static AggregationMethod ParseAggregationMethod(string method)
    {
        return Enum.Parse<AggregationMethod>(method, ignoreCase: true);
    }

    /// <summary>
    /// Parse AlarmStatus from string
    /// </summary>
    public static AlarmStatus ParseAlarmStatus(string status)
    {
        return Enum.Parse<AlarmStatus>(status, ignoreCase: true);
    }
}
