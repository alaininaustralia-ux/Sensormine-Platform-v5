namespace Sensormine.Core.DTOs;

/// <summary>
/// Request to create or update a field mapping
/// </summary>
public record FieldMappingRequest
{
    public required string FieldName { get; init; }
    public required string FieldSource { get; init; } // "schema", "custom_field", or "system"
    public required string FriendlyName { get; init; }
    public string? Description { get; init; }
    public string? Unit { get; init; }
    public required string DataType { get; init; }
    public double? MinValue { get; init; }
    public double? MaxValue { get; init; }
    public bool IsQueryable { get; init; } = true;
    public bool IsVisible { get; init; } = true;
    public int DisplayOrder { get; init; } = 0;
    public string? Category { get; init; }
    public List<string>? Tags { get; init; }
    public string? DefaultAggregation { get; init; }
    public List<string>? SupportsAggregations { get; init; }
    public string? FormatString { get; init; }
}

/// <summary>
/// Response model for field mapping
/// </summary>
public record FieldMappingResponse
{
    public required Guid Id { get; init; }
    public required Guid DeviceTypeId { get; init; }
    public required string FieldName { get; init; }
    public required string FieldSource { get; init; }
    public required string FriendlyName { get; init; }
    public string? Description { get; init; }
    public string? Unit { get; init; }
    public required string DataType { get; init; }
    public double? MinValue { get; init; }
    public double? MaxValue { get; init; }
    public bool IsQueryable { get; init; }
    public bool IsVisible { get; init; }
    public int DisplayOrder { get; init; }
    public string? Category { get; init; }
    public List<string> Tags { get; init; } = new();
    public string? DefaultAggregation { get; init; }
    public List<string> SupportsAggregations { get; init; } = new();
    public string? FormatString { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

/// <summary>
/// Combined field information from schema and device type
/// Includes all queryable fields for a device type
/// </summary>
public record DeviceFieldsResponse
{
    public required Guid DeviceTypeId { get; init; }
    public required string DeviceTypeName { get; init; }
    public Guid? SchemaId { get; init; }
    public string? SchemaName { get; init; }
    public required List<FieldMappingResponse> Fields { get; init; }
    public required FieldsSummary Summary { get; init; }
}

/// <summary>
/// Summary statistics about device fields
/// </summary>
public record FieldsSummary
{
    public int TotalFields { get; init; }
    public int SchemaFields { get; init; }
    public int CustomFields { get; init; }
    public int SystemFields { get; init; }
    public int QueryableFields { get; init; }
    public List<string> Categories { get; init; } = new();
}

/// <summary>
/// Request to auto-generate field mappings from schema
/// </summary>
public record GenerateFieldMappingsRequest
{
    public required Guid DeviceTypeId { get; init; }
    public bool OverwriteExisting { get; init; } = false;
}

/// <summary>
/// Response after generating field mappings
/// </summary>
public record GenerateFieldMappingsResponse
{
    public int Created { get; init; }
    public int Updated { get; init; }
    public int Skipped { get; init; }
    public List<string> Errors { get; init; } = new();
}
