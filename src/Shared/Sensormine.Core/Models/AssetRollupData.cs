namespace Sensormine.Core.Models;

/// <summary>
/// Pre-computed rollup data for asset metrics
/// </summary>
public class AssetRollupData
{
    /// <summary>
    /// Asset ID
    /// </summary>
    public Guid AssetId { get; set; }

    /// <summary>
    /// Tenant ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// Metric name
    /// </summary>
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Time bucket for this rollup
    /// </summary>
    public DateTimeOffset Time { get; set; }

    /// <summary>
    /// Aggregated value
    /// </summary>
    public double? Value { get; set; }

    /// <summary>
    /// Number of samples included in aggregation
    /// </summary>
    public int SampleCount { get; set; }

    /// <summary>
    /// Additional metadata about the rollup
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}
