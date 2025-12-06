namespace Sensormine.Core.Models;

/// <summary>
/// Represents a Device Type template that defines protocols, schemas, and custom fields
/// for standardized device configuration across multiple devices.
/// </summary>
public class DeviceType
{
    /// <summary>
    /// Unique identifier for the device type
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tenant ID for multi-tenancy isolation
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// Name of the device type (e.g., "Temperature Sensor", "Industrial Pump")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the device type
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Primary communication protocol
    /// </summary>
    public DeviceProtocol Protocol { get; set; }

    /// <summary>
    /// Protocol-specific configuration settings
    /// </summary>
    public ProtocolConfig ProtocolConfig { get; set; } = new();

    /// <summary>
    /// Optional reference to a data schema in the Schema Registry
    /// </summary>
    public Guid? SchemaId { get; set; }

    /// <summary>
    /// Navigation property to the Schema
    /// </summary>
    public Schema? Schema { get; set; }

    /// <summary>
    /// Custom metadata field definitions for this device type
    /// </summary>
    public List<CustomFieldDefinition> CustomFields { get; set; } = new();

    /// <summary>
    /// Default alert rule templates for devices of this type
    /// </summary>
    public List<AlertRuleTemplate> AlertTemplates { get; set; } = new();

    /// <summary>
    /// Tags for categorization and filtering
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Whether this device type is active and available for use
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Timestamp when the device type was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the device type was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// User or system that created this device type
    /// </summary>
    public string? CreatedBy { get; set; }
}

/// <summary>
/// Supported device communication protocols
/// </summary>
public enum DeviceProtocol
{
    MQTT,
    HTTP,
    WebSocket,
    OPC_UA,
    Modbus_TCP,
    Modbus_RTU,
    BACnet,
    EtherNetIP
}
