namespace Sensormine.Core.Models;

/// <summary>
/// Represents a user-configurable schema for a device type
/// </summary>
public class DeviceTypeSchema
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public SchemaDefinition Schema { get; set; } = new();
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>
/// Schema definition with field specifications
/// </summary>
public class SchemaDefinition
{
    public string Version { get; set; } = "1.0";
    
    /// <summary>
    /// User-defined fields with their types and validation rules
    /// </summary>
    public Dictionary<string, FieldDefinition> Fields { get; set; } = new();
    
    /// <summary>
    /// List of system field names (battery_level, latitude, etc.)
    /// </summary>
    public List<string> SystemFields { get; set; } = new()
    {
        "battery_level",
        "signal_strength",
        "latitude",
        "longitude",
        "altitude"
    };
}

/// <summary>
/// Field definition with type and validation constraints
/// </summary>
public class FieldDefinition
{
    /// <summary>
    /// Field data type: number, string, boolean, object, array
    /// </summary>
    public string Type { get; set; } = "string";
    
    /// <summary>
    /// Display label for UI
    /// </summary>
    public string? Label { get; set; }
    
    /// <summary>
    /// Unit of measurement (e.g., "°C", "%", "hPa")
    /// </summary>
    public string? Unit { get; set; }
    
    /// <summary>
    /// Minimum value for number types
    /// </summary>
    public double? Min { get; set; }
    
    /// <summary>
    /// Maximum value for number types
    /// </summary>
    public double? Max { get; set; }
    
    /// <summary>
    /// Whether this field is required
    /// </summary>
    public bool Required { get; set; }
    
    /// <summary>
    /// Maximum length for string types
    /// </summary>
    public int? MaxLength { get; set; }
    
    /// <summary>
    /// Regex pattern for string validation
    /// </summary>
    public string? Pattern { get; set; }
    
    /// <summary>
    /// Allowed values for enum types
    /// </summary>
    public List<string>? Enum { get; set; }
    
    /// <summary>
    /// Help text or description
    /// </summary>
    public string? Description { get; set; }
}

/// <summary>
/// Per-device applied schema with optional overrides
/// </summary>
public class DeviceAppliedSchema
{
    public string DeviceId { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public int SchemaVersion { get; set; }
    public SchemaDefinition AppliedSchema { get; set; } = new();
    
    /// <summary>
    /// Device-specific configuration overrides
    /// </summary>
    public Dictionary<string, object>? ConfigJson { get; set; }
    
    public DateTime UpdatedAt { get; set; }
}
