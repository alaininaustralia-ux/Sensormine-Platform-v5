using Sensormine.Core.Models;

namespace Device.API.DTOs;

/// <summary>
/// Response model for Device Type information
/// </summary>
public class DeviceTypeResponse
{
    /// <summary>
    /// Unique identifier for the device type
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tenant identifier
    /// </summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// Name of the device type
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the device type
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Communication protocol used by devices of this type
    /// </summary>
    public DeviceProtocol Protocol { get; set; }

    /// <summary>
    /// Protocol-specific configuration
    /// </summary>
    public ProtocolConfig ProtocolConfig { get; set; } = new();

    /// <summary>
    /// Schema ID for data validation
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
    public bool IsActive { get; set; }

    /// <summary>
    /// UTC timestamp when the device type was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// UTC timestamp when the device type was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// User ID who created this device type
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Maps from DeviceType domain model to DeviceTypeResponse DTO
    /// </summary>
    public static DeviceTypeResponse FromEntity(DeviceType entity)
    {
        return new DeviceTypeResponse
        {
            Id = entity.Id,
            TenantId = entity.TenantId.ToString(),
            Name = entity.Name,
            Description = entity.Description,
            Protocol = entity.Protocol,
            ProtocolConfig = entity.ProtocolConfig,
            SchemaId = entity.SchemaId,
            CustomFields = entity.CustomFields ?? new List<CustomFieldDefinition>(),
            AlertTemplates = entity.AlertTemplates ?? new List<AlertRuleTemplate>(),
            Tags = entity.Tags ?? new List<string>(),
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            CreatedBy = entity.CreatedBy
        };
    }
}
