namespace Sensormine.Storage.Interfaces;

/// <summary>
/// Time-series database repository
/// </summary>
public interface ITimeSeriesRepository
{
    /// <summary>
    /// Write time-series data points
    /// </summary>
    Task WriteAsync<T>(string measurement, T data, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Write batch of time-series data points
    /// </summary>
    Task WriteBatchAsync<T>(string measurement, IEnumerable<T> data, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Query time-series data with filters
    /// </summary>
    Task<IEnumerable<T>> QueryAsync<T>(string measurement, TimeSeriesQuery query, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Query aggregated data
    /// </summary>
    Task<IEnumerable<T>> QueryAggregateAsync<T>(string measurement, AggregateQuery query, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Get latest telemetry for multiple devices
    /// </summary>
    Task<Dictionary<string, LatestTelemetryData>> GetLatestTelemetryForDevicesAsync(IEnumerable<string> deviceIds, CancellationToken cancellationToken = default);
}

/// <summary>
/// Latest telemetry data with timestamp
/// </summary>
public class LatestTelemetryData
{
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> CustomFields { get; set; } = new();
}

/// <summary>
/// Time-series query parameters
/// </summary>
public class TimeSeriesQuery
{
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public Dictionary<string, string>? Filters { get; set; }
    public int? Limit { get; set; }
    public string? OrderBy { get; set; }
}

/// <summary>
/// Aggregate query parameters
/// </summary>
public class AggregateQuery : TimeSeriesQuery
{
    public string AggregateFunction { get; set; } = "avg"; // avg, sum, min, max, count
    public TimeSpan? GroupByInterval { get; set; }
    public string[]? GroupByFields { get; set; }
}
