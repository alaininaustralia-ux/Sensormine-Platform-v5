using System.ComponentModel.DataAnnotations;

namespace Device.API.DTOs;

/// <summary>
/// Request to register a new device
/// </summary>
public class CreateDeviceRequest
{
    /// <summary>
    /// Unique device identifier (from hardware)
    /// </summary>
    [Required]
    [StringLength(200)]
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable device name
    /// </summary>
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Device Type ID (required)
    /// </summary>
    [Required]
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Serial number or hardware identifier
    /// </summary>
    [StringLength(100)]
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Custom field values specific to this device (based on Device Type custom fields)
    /// </summary>
    public Dictionary<string, object> CustomFieldValues { get; set; } = new();

    /// <summary>
    /// Device location coordinates
    /// </summary>
    public LocationDto? Location { get; set; }

    /// <summary>
    /// Device metadata as key-value pairs
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();

    /// <summary>
    /// Device status (e.g., "Active", "Inactive", "Maintenance")
    /// </summary>
    [StringLength(50)]
    public string Status { get; set; } = "Active";
}

/// <summary>
/// Request to update device information
/// </summary>
public class UpdateDeviceRequest
{
    /// <summary>
    /// Human-readable device name
    /// </summary>
    [StringLength(255)]
    public string? Name { get; set; }

    /// <summary>
    /// Custom field values specific to this device
    /// </summary>
    public Dictionary<string, object>? CustomFieldValues { get; set; }

    /// <summary>
    /// Device location coordinates
    /// </summary>
    public LocationDto? Location { get; set; }

    /// <summary>
    /// Device metadata as key-value pairs
    /// </summary>
    public Dictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// Device status
    /// </summary>
    [StringLength(50)]
    public string? Status { get; set; }
}

/// <summary>
/// Device response with full details including Device Type
/// </summary>
public class DeviceResponse
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid DeviceTypeId { get; set; }
    public string? DeviceTypeName { get; set; }
    public string? SerialNumber { get; set; }
    public Dictionary<string, object> CustomFieldValues { get; set; } = new();
    public LocationDto? Location { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? LastSeenAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Schema information from Device Type
    public Guid? SchemaId { get; set; }
    public string? SchemaName { get; set; }
}

/// <summary>
/// Location DTO
/// </summary>
public class LocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
}

/// <summary>
/// Bulk device registration request
/// </summary>
public class BulkDeviceRegistrationRequest
{
    /// <summary>
    /// Device Type ID for all devices in the bulk
    /// </summary>
    [Required]
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// List of devices to register
    /// </summary>
    [Required]
    public List<CreateDeviceRequest> Devices { get; set; } = new();
}

/// <summary>
/// Bulk registration result
/// </summary>
public class BulkDeviceRegistrationResult
{
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<DeviceRegistrationError> Errors { get; set; } = new();
    public List<DeviceResponse> SuccessfulDevices { get; set; } = new();
}

/// <summary>
/// Device registration error
/// </summary>
public class DeviceRegistrationError
{
    public string DeviceId { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public Dictionary<string, List<string>> ValidationErrors { get; set; } = new();
}

/// <summary>
/// Device list response with pagination
/// </summary>
public class DeviceListResponse
{
    public List<DeviceResponse> Devices { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

/// <summary>
/// Device query parameters
/// </summary>
public class DeviceQueryParameters
{
    public Guid? DeviceTypeId { get; set; }
    public string? Status { get; set; }
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
