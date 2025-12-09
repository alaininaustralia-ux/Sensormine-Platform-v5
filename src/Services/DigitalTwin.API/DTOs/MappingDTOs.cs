namespace DigitalTwin.API.DTOs;

/// <summary>
/// Request model for creating a data point mapping
/// </summary>
public class CreateMappingRequest
{
    public Guid SchemaId { get; set; }
    public string SchemaVersion { get; set; } = string.Empty;
    public string JsonPath { get; set; } = string.Empty;
    public Guid AssetId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public string AggregationMethod { get; set; } = "Last";
    public bool RollupEnabled { get; set; } = true;
    public string? TransformExpression { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Request model for updating a data point mapping
/// </summary>
public class UpdateMappingRequest
{
    public string? Label { get; set; }
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public string? AggregationMethod { get; set; }
    public bool? RollupEnabled { get; set; }
    public string? TransformExpression { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Response model for data point mapping
/// </summary>
public class MappingResponse
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public Guid SchemaId { get; set; }
    public string SchemaVersion { get; set; } = string.Empty;
    public string JsonPath { get; set; } = string.Empty;
    public Guid AssetId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string AssetPath { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public string AggregationMethod { get; set; } = string.Empty;
    public bool RollupEnabled { get; set; }
    public string? TransformExpression { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

/// <summary>
/// List response for mappings
/// </summary>
public class MappingListResponse
{
    public List<MappingResponse> Mappings { get; set; } = new();
    public int TotalCount { get; set; }
}

/// <summary>
/// Validation result for mapping
/// </summary>
public class MappingValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
