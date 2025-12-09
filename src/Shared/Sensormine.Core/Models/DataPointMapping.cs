namespace Sensormine.Core.Models;

/// <summary>
/// Maps a data point from a device schema to an asset in the digital twin
/// </summary>
public class DataPointMapping : BaseEntity
{
    /// <summary>
    /// Schema ID this mapping belongs to
    /// </summary>
    public Guid SchemaId { get; set; }

    /// <summary>
    /// Schema version
    /// </summary>
    public string SchemaVersion { get; set; } = string.Empty;

    /// <summary>
    /// JSONPath expression to extract data point (e.g., $.temperature)
    /// </summary>
    public string JsonPath { get; set; } = string.Empty;

    /// <summary>
    /// Target asset ID
    /// </summary>
    public Guid AssetId { get; set; }

    // Navigation property removed - causing EF to generate AssetId1 shadow column
    // Use manual joins or IgnoreAutoIncludes() if needed
    // public virtual Asset Asset { get; set; } = null!;

    /// <summary>
    /// Human-readable label for this data point
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Description/documentation for this data point
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Unit of measurement (e.g., °C, kW, rpm)
    /// </summary>
    public string? Unit { get; set; }

    /// <summary>
    /// Aggregation method for rollup calculations
    /// </summary>
    public AggregationMethod AggregationMethod { get; set; } = AggregationMethod.Last;

    /// <summary>
    /// Whether to include this data point in parent rollups
    /// </summary>
    public bool RollupEnabled { get; set; } = true;

    /// <summary>
    /// Optional transform expression (JavaScript or SQL)
    /// </summary>
    public string? TransformExpression { get; set; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Aggregation methods for data rollup
/// </summary>
public enum AggregationMethod
{
    Last,
    Average,
    Sum,
    Min,
    Max,
    Count
}
