namespace Sensormine.Mobile.Maui.Models;

/// <summary>
/// Represents a device type template in the SensorMine platform
/// </summary>
public class DeviceType
{
    /// <summary>
    /// Unique identifier for the device type
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Device type name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the device type
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Primary protocol (MQTT, HTTP, WebSocket, etc.)
    /// </summary>
    public string Protocol { get; set; } = string.Empty;

    /// <summary>
    /// Protocol-specific configuration (JSON)
    /// </summary>
    public string? ProtocolConfig { get; set; }

    /// <summary>
    /// Assigned schema ID
    /// </summary>
    public Guid? SchemaId { get; set; }

    /// <summary>
    /// Custom field definitions (JSON array)
    /// </summary>
    public List<CustomFieldDefinition>? CustomFields { get; set; }

    /// <summary>
    /// Alert rule templates (JSON array)
    /// </summary>
    public string? AlertTemplates { get; set; }

    /// <summary>
    /// Tags for categorization
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// When the device type was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the device type was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Tenant ID for multi-tenancy
    /// </summary>
    public Guid TenantId { get; set; }
}

/// <summary>
/// Custom field definition for device types
/// </summary>
public class CustomFieldDefinition
{
    /// <summary>
    /// Field name (used as key in CustomFieldValues)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Display label
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Field type (Text, Number, Boolean, Date, DateTime, Select, MultiSelect, Email, URL)
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Default value
    /// </summary>
    public string? DefaultValue { get; set; }

    /// <summary>
    /// Whether the field is required
    /// </summary>
    public bool Required { get; set; }

    /// <summary>
    /// Validation rules (JSON)
    /// </summary>
    public string? ValidationRules { get; set; }

    /// <summary>
    /// Help text or tooltip
    /// </summary>
    public string? HelpText { get; set; }

    /// <summary>
    /// Options for Select/MultiSelect fields
    /// </summary>
    public List<string>? Options { get; set; }
}
