namespace Sensormine.Core.Models;

/// <summary>
/// Defines a custom metadata field for a device type
/// </summary>
public class CustomFieldDefinition
{
    /// <summary>
    /// Unique field name (used as key in data storage)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Display label for the field in UI
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Data type of the field
    /// </summary>
    public CustomFieldType Type { get; set; }

    /// <summary>
    /// Whether this field is required during device registration
    /// </summary>
    public bool Required { get; set; }

    /// <summary>
    /// Default value for the field
    /// </summary>
    public object? DefaultValue { get; set; }

    /// <summary>
    /// Validation rules for the field
    /// </summary>
    public ValidationRules? ValidationRules { get; set; }

    /// <summary>
    /// Help text or tooltip description
    /// </summary>
    public string? HelpText { get; set; }

    /// <summary>
    /// Options for dropdown/list field types
    /// </summary>
    public List<string>? Options { get; set; }

    /// <summary>
    /// Order in which this field appears in forms
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Conditional visibility rule (optional)
    /// Example: "otherField == 'value'"
    /// </summary>
    public string? VisibilityCondition { get; set; }
}

/// <summary>
/// Supported custom field data types
/// </summary>
public enum CustomFieldType
{
    Text,
    Number,
    Boolean,
    Date,
    Dropdown,
    Email,
    URL,
    Phone,
    TextArea
}

/// <summary>
/// Validation rules for custom fields
/// </summary>
public class ValidationRules
{
    // Text validation
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Pattern { get; set; } // Regex pattern

    // Number validation
    public double? Min { get; set; }
    public double? Max { get; set; }
    public double? Step { get; set; }

    // Date validation
    public DateTime? MinDate { get; set; }
    public DateTime? MaxDate { get; set; }

    // Custom validation message
    public string? ErrorMessage { get; set; }
}
