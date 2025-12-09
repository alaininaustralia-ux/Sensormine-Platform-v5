namespace Sensormine.Core.Models;

/// <summary>
/// Configuration for hierarchical data rollup from child to parent assets
/// </summary>
public class AssetRollupConfig : BaseEntity
{
    /// <summary>
    /// Asset ID this rollup configuration belongs to
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// Asset navigation property
    /// </summary>
    public virtual Asset Asset { get; set; } = null!;

    /// <summary>
    /// Name of the metric to roll up
    /// </summary>
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Aggregation method for rollup
    /// </summary>
    public AggregationMethod AggregationMethod { get; set; }

    /// <summary>
    /// How often to compute the rollup
    /// </summary>
    public TimeSpan RollupInterval { get; set; } = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Whether to include child assets in rollup
    /// </summary>
    public bool IncludeChildren { get; set; } = true;

    /// <summary>
    /// Weight factor for weighted averages
    /// </summary>
    public decimal WeightFactor { get; set; } = 1.0m;

    /// <summary>
    /// Optional filter expression to select which children to include
    /// </summary>
    public string? FilterExpression { get; set; }
}
