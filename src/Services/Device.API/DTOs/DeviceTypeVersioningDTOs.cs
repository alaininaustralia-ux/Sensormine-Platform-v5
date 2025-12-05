using Sensormine.Core.Models;

namespace Device.API.DTOs;

/// <summary>
/// Response DTO for Device Type version information
/// </summary>
public class DeviceTypeVersionResponse
{
    public int Version { get; set; }
    public string ChangeSummary { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;

    public static DeviceTypeVersionResponse FromEntity(DeviceTypeVersion version)
    {
        return new DeviceTypeVersionResponse
        {
            Version = version.Version,
            ChangeSummary = version.ChangeSummary ?? string.Empty,
            CreatedAt = version.CreatedAt,
            CreatedBy = version.CreatedBy
        };
    }
}

/// <summary>
/// Response DTO for Device Type audit log entry
/// </summary>
public class DeviceTypeAuditLogResponse
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? ChangeSummary { get; set; }
    public DateTime Timestamp { get; set; }
    public string UserId { get; set; } = string.Empty;

    public static DeviceTypeAuditLogResponse FromEntity(DeviceTypeAuditLog log)
    {
        return new DeviceTypeAuditLogResponse
        {
            Id = log.Id,
            Action = log.Action,
            ChangeSummary = log.ChangeSummary,
            Timestamp = log.Timestamp,
            UserId = log.UserId
        };
    }
}

/// <summary>
/// Response DTO for Device Type usage statistics
/// </summary>
public class DeviceTypeUsageStatisticsResponse
{
    public int TotalDeviceCount { get; set; }
    public int ActiveDeviceCount { get; set; }
    public int InactiveDeviceCount { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public static DeviceTypeUsageStatisticsResponse FromEntity(DeviceTypeUsageStatistics stats)
    {
        return new DeviceTypeUsageStatisticsResponse
        {
            TotalDeviceCount = stats.TotalDeviceCount,
            ActiveDeviceCount = stats.ActiveDeviceCount,
            InactiveDeviceCount = stats.InactiveDeviceCount,
            LastUsedAt = stats.LastUsedAt
        };
    }
}

/// <summary>
/// Response DTO for Device Type update validation
/// </summary>
public class DeviceTypeUpdateValidationResponse
{
    public bool IsValid { get; set; }
    public List<string> BreakingChanges { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public int AffectedDeviceCount { get; set; }
    public List<string> RecommendedActions { get; set; } = new();

    public static DeviceTypeUpdateValidationResponse FromEntity(DeviceTypeUpdateValidationResult result)
    {
        return new DeviceTypeUpdateValidationResponse
        {
            IsValid = result.IsValid,
            BreakingChanges = result.BreakingChanges,
            Warnings = result.Warnings,
            AffectedDeviceCount = result.AffectedDeviceCount,
            RecommendedActions = result.RecommendedActions
        };
    }
}

/// <summary>
/// Request DTO for rollback to a specific version
/// </summary>
public class RollbackDeviceTypeRequest
{
    public int Version { get; set; }
}

/// <summary>
/// Paginated response for audit logs
/// </summary>
public class DeviceTypeAuditLogListResponse
{
    public List<DeviceTypeAuditLogResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
