namespace Query.API.Models;

/// <summary>
/// Request model for time-series data queries
/// </summary>
public class TimeSeriesQueryRequest
{
    /// <summary>
    /// Start of the time range (ISO 8601 format)
    /// </summary>
    public DateTimeOffset StartTime { get; set; }

    /// <summary>
    /// End of the time range (ISO 8601 format)
    /// </summary>
    public DateTimeOffset EndTime { get; set; }

    /// <summary>
    /// Optional device ID filter
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Optional location filter (lat,lng,radius)
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Optional custom field filters (key=value pairs)
    /// </summary>
    public Dictionary<string, string>? Filters { get; set; }

    /// <summary>
    /// Maximum number of results to return
    /// </summary>
    public int? Limit { get; set; }

    /// <summary>
    /// Page number for pagination (1-based)
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Results per page (default 100, max 1000)
    /// </summary>
    public int PageSize { get; set; } = 100;

    /// <summary>
    /// Field to sort by (default: timestamp)
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort direction (asc or desc)
    /// </summary>
    public string SortDirection { get; set; } = "desc";
}

/// <summary>
/// Request model for aggregated time-series queries
/// </summary>
public class AggregateQueryRequest : TimeSeriesQueryRequest
{
    /// <summary>
    /// Aggregation function (avg, sum, min, max, count)
    /// </summary>
    public string AggregateFunction { get; set; } = "avg";

    /// <summary>
    /// Field name to aggregate on
    /// </summary>
    public string Field { get; set; } = "value";

    /// <summary>
    /// Time interval for grouping (e.g., "1m", "1h", "1d")
    /// Examples: 1s, 5m, 1h, 1d
    /// </summary>
    public string? GroupByInterval { get; set; }

    /// <summary>
    /// Additional fields to group by (e.g., "deviceId")
    /// </summary>
    public List<string>? GroupByFields { get; set; }
}

/// <summary>
/// Response model for time-series queries
/// </summary>
public class TimeSeriesQueryResponse<T>
{
    /// <summary>
    /// Query results
    /// </summary>
    public List<T> Data { get; set; } = new();

    /// <summary>
    /// Pagination metadata
    /// </summary>
    public PaginationMetadata Pagination { get; set; } = new();

    /// <summary>
    /// Query metadata
    /// </summary>
    public QueryMetadata Metadata { get; set; } = new();
}

/// <summary>
/// Pagination information
/// </summary>
public class PaginationMetadata
{
    /// <summary>
    /// Current page number
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items (if available)
    /// </summary>
    public int? TotalItems { get; set; }

    /// <summary>
    /// Total number of pages (if available)
    /// </summary>
    public int? TotalPages { get; set; }

    /// <summary>
    /// Whether there are more results
    /// </summary>
    public bool HasMore { get; set; }
}

/// <summary>
/// Query execution metadata
/// </summary>
public class QueryMetadata
{
    /// <summary>
    /// Time taken to execute the query (ms)
    /// </summary>
    public long ExecutionTimeMs { get; set; }

    /// <summary>
    /// Queried time range start
    /// </summary>
    public DateTimeOffset StartTime { get; set; }

    /// <summary>
    /// Queried time range end
    /// </summary>
    public DateTimeOffset EndTime { get; set; }

    /// <summary>
    /// Number of results returned
    /// </summary>
    public int ResultCount { get; set; }

    /// <summary>
    /// Applied filters
    /// </summary>
    public Dictionary<string, string>? AppliedFilters { get; set; }
}

/// <summary>
/// Time-series data point response
/// </summary>
public class TimeSeriesDataPointResponse
{
    /// <summary>
    /// Device identifier
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp of the measurement
    /// </summary>
    public DateTimeOffset Timestamp { get; set; }

    /// <summary>
    /// Measurement values
    /// </summary>
    public Dictionary<string, object> Values { get; set; } = new();

    /// <summary>
    /// Quality indicators
    /// </summary>
    public Dictionary<string, string>? Quality { get; set; }

    /// <summary>
    /// Tags for filtering
    /// </summary>
    public Dictionary<string, string>? Tags { get; set; }
}

/// <summary>
/// Aggregated data point response
/// </summary>
public class AggregatedDataPointResponse
{
    /// <summary>
    /// Time bucket (for time-grouped aggregations)
    /// </summary>
    public DateTimeOffset? Timestamp { get; set; }

    /// <summary>
    /// Device ID (for device-grouped aggregations)
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Aggregated value
    /// </summary>
    public decimal? Value { get; set; }

    /// <summary>
    /// Number of data points in aggregation
    /// </summary>
    public long Count { get; set; }

    /// <summary>
    /// Aggregation function used
    /// </summary>
    public string AggregateFunction { get; set; } = string.Empty;

    /// <summary>
    /// Unit of the aggregated value (if available)
    /// </summary>
    public string? Unit { get; set; }

    /// <summary>
    /// Additional group values
    /// </summary>
    public Dictionary<string, string>? GroupValues { get; set; }
}
