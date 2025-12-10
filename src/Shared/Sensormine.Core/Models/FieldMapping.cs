namespace Sensormine.Core.Models;

/// <summary>
/// Represents a field mapping that combines schema fields, custom fields, and system fields
/// with user-friendly names for dashboard design and query operations
/// </summary>
public class FieldMapping : BaseEntity
{
    /// <summary>
    /// Device Type ID this field belongs to
    /// </summary>
    public Guid DeviceTypeId { get; set; }

    /// <summary>
    /// Navigation property to Device Type
    /// </summary>
    public DeviceType? DeviceType { get; set; }

    /// <summary>
    /// The actual field name in telemetry data (e.g., "temperature", "co2", "customField1")
    /// </summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// Source of the field: 'schema', 'custom_field', or 'system'
    /// </summary>
    public FieldSource FieldSource { get; set; }

    /// <summary>
    /// User-friendly display name (e.g., "Room Temperature", "CO2 Level")
    /// </summary>
    public string FriendlyName { get; set; } = string.Empty;

    /// <summary>
    /// Field description for tooltips and help text
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Unit of measurement (e.g., "°C", "hPa", "%", "ppm")
    /// </summary>
    public string? Unit { get; set; }

    /// <summary>
    /// Data type of the field
    /// </summary>
    public FieldDataType DataType { get; set; }

    /// <summary>
    /// Minimum value for numeric fields (for validation and display)
    /// </summary>
    public double? MinValue { get; set; }

    /// <summary>
    /// Maximum value for numeric fields (for validation and display)
    /// </summary>
    public double? MaxValue { get; set; }

    /// <summary>
    /// Whether this field can be used in queries and dashboards
    /// </summary>
    public bool IsQueryable { get; set; } = true;

    /// <summary>
    /// Whether this field is visible in UI
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// Display order for UI (lower numbers appear first)
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Category for grouping related fields (e.g., "Environmental", "System", "Status")
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Additional tags for filtering and categorization
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Default aggregation method for time-series queries (avg, sum, min, max, count, last)
    /// </summary>
    public string? DefaultAggregation { get; set; }

    /// <summary>
    /// List of supported aggregation methods
    /// </summary>
    public List<string> SupportsAggregations { get; set; } = new() { "avg", "min", "max", "count", "last" };

    /// <summary>
    /// Format string for display (e.g., "0.00" for 2 decimals, "0,0.0" for thousands)
    /// </summary>
    public string? FormatString { get; set; }

    /// <summary>
    /// User or system that created this mapping
    /// </summary>
    public string? CreatedBy { get; set; }
}

/// <summary>
/// Source of a field in the field mapping system
/// </summary>
public enum FieldSource
{
    /// <summary>
    /// Field comes from the device's schema (SchemaRegistry)
    /// </summary>
    Schema,

    /// <summary>
    /// Field is a custom field defined in the DeviceType
    /// </summary>
    CustomField,

    /// <summary>
    /// Field is a built-in system field (batteryLevel, signalStrength, etc.)
    /// </summary>
    System
}

/// <summary>
/// Data type of a field for query and display purposes
/// </summary>
public enum FieldDataType
{
    /// <summary>
    /// Numeric value (integer or floating point)
    /// </summary>
    Number,
    
    /// <summary>
    /// Text string value
    /// </summary>
    String,
    
    /// <summary>
    /// Boolean true/false value
    /// </summary>
    Boolean,
    
    /// <summary>
    /// Timestamp or date value
    /// </summary>
    Timestamp,
    
    /// <summary>
    /// JSON object value
    /// </summary>
    Object,
    
    /// <summary>
    /// Array of values
    /// </summary>
    Array
}
