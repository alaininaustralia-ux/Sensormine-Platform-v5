using System.ComponentModel.DataAnnotations;
using Sensormine.Core.Models;

namespace Device.API.DTOs;

/// <summary>
/// Request model for creating or updating a Device Type
/// </summary>
public class DeviceTypeRequest
{
    /// <summary>
    /// Name of the device type (unique per tenant)
    /// </summary>
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 255 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the device type
    /// </summary>
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    /// <summary>
    /// Communication protocol used by devices of this type
    /// </summary>
    [Required(ErrorMessage = "Protocol is required")]
    public DeviceProtocol Protocol { get; set; }

    /// <summary>
    /// Protocol-specific configuration
    /// </summary>
    [Required(ErrorMessage = "Protocol configuration is required")]
    public ProtocolConfig ProtocolConfig { get; set; } = new();

    /// <summary>
    /// Schema ID for data validation (optional)
    /// </summary>
    public Guid? SchemaId { get; set; }

    /// <summary>
    /// Custom field definitions for additional metadata
    /// </summary>
    public List<CustomFieldDefinition> CustomFields { get; set; } = new();

    /// <summary>
    /// Alert rule templates for this device type
    /// </summary>
    public List<AlertRuleTemplate> AlertTemplates { get; set; } = new();

    /// <summary>
    /// Tags for categorization and filtering
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Whether this device type is active
    /// </summary>
    public bool IsActive { get; set; } = true;
}
