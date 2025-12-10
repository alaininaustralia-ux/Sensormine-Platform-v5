using Sensormine.Core.Models;

namespace Device.API.DTOs;

/// <summary>
/// Response DTO for field mapping information
/// </summary>
public class FieldMappingResponse
{
    public Guid Id { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string FieldSource { get; set; } = string.Empty; // Schema, CustomField, System
    public string FriendlyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public string DataType { get; set; } = "String";
    public double? MinValue { get; set; }
    public double? MaxValue { get; set; }
    public bool IsQueryable { get; set; }
    public bool IsVisible { get; set; }
    public int DisplayOrder { get; set; }
    public string? Category { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? DefaultAggregation { get; set; }
    public List<string> SupportsAggregations { get; set; } = new();
    public string? FormatString { get; set; }

    public static FieldMappingResponse FromEntity(FieldMapping entity)
    {
        return new FieldMappingResponse
        {
            Id = entity.Id,
            FieldName = entity.FieldName,
            FieldSource = entity.FieldSource.ToString(),
            FriendlyName = entity.FriendlyName,
            Description = entity.Description,
            Unit = entity.Unit,
            DataType = entity.DataType.ToString(),
            MinValue = entity.MinValue,
            MaxValue = entity.MaxValue,
            IsQueryable = entity.IsQueryable,
            IsVisible = entity.IsVisible,
            DisplayOrder = entity.DisplayOrder,
            Category = entity.Category,
            Tags = entity.Tags,
            DefaultAggregation = entity.DefaultAggregation,
            SupportsAggregations = entity.SupportsAggregations,
            FormatString = entity.FormatString
        };
    }
}

/// <summary>
/// Request DTO for creating or updating a field mapping
/// </summary>
public class FieldMappingRequest
{
    public string FieldName { get; set; } = string.Empty;
    public string FriendlyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public double? MinValue { get; set; }
    public double? MaxValue { get; set; }
    public bool IsQueryable { get; set; } = true;
    public bool IsVisible { get; set; } = true;
    public int DisplayOrder { get; set; }
    public string? Category { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? DefaultAggregation { get; set; }
    public List<string> SupportsAggregations { get; set; } = new() { "avg", "min", "max", "count", "last" };
    public string? FormatString { get; set; }
}

/// <summary>
/// Bulk update request for field mappings
/// </summary>
public class BulkUpdateFieldMappingsRequest
{
    public List<FieldMappingRequest> FieldMappings { get; set; } = new();
}
