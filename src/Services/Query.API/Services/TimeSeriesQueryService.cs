namespace Query.API.Services;

using Query.API.Models;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.TimeSeries;
using System.Diagnostics;
using System.Text.RegularExpressions;

/// <summary>
/// Service interface for time-series queries
/// </summary>
public interface ITimeSeriesQueryService
{
    /// <summary>
    /// Query time-series data with filters and pagination
    /// </summary>
    Task<TimeSeriesQueryResponse<TimeSeriesDataPointResponse>> QueryAsync(
        string measurement,
        TimeSeriesQueryRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Query aggregated time-series data
    /// </summary>
    Task<TimeSeriesQueryResponse<AggregatedDataPointResponse>> QueryAggregateAsync(
        string measurement,
        AggregateQueryRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the latest value for a device
    /// </summary>
    Task<TimeSeriesDataPointResponse?> GetLatestAsync(
        string measurement,
        Guid deviceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get data for multiple devices
    /// </summary>
    Task<Dictionary<Guid, TimeSeriesDataPointResponse>> GetLatestForDevicesAsync(
        string measurement,
        IEnumerable<Guid> deviceIds,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Implementation of time-series query service
/// </summary>
public partial class TimeSeriesQueryService : ITimeSeriesQueryService
{
    private readonly ITimeSeriesRepository _repository;

    private const int MaxPageSize = 1000;
    private const int DefaultPageSize = 100;

    public TimeSeriesQueryService(ITimeSeriesRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    /// <inheritdoc />
    public async Task<TimeSeriesQueryResponse<TimeSeriesDataPointResponse>> QueryAsync(
        string measurement,
        TimeSeriesQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        // Validate and normalize request
        var pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);
        var page = Math.Max(1, request.Page);
        var offset = (page - 1) * pageSize;

        // Build query parameters
        var query = new TimeSeriesQuery
        {
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Filters = BuildFilters(request),
            Limit = pageSize + 1, // Fetch one extra to determine if there are more results
            OrderBy = request.SortBy ?? "timestamp"
        };

        // Execute query
        var results = await _repository.QueryAsync<TimeSeriesData>(measurement, query, cancellationToken);
        var resultList = results.ToList();

        // Determine if there are more results
        var hasMore = resultList.Count > pageSize;
        if (hasMore)
        {
            resultList = resultList.Take(pageSize).ToList();
        }

        stopwatch.Stop();

        // Map to response
        var dataPoints = resultList.Select(MapToResponse).ToList();

        return new TimeSeriesQueryResponse<TimeSeriesDataPointResponse>
        {
            Data = dataPoints,
            Pagination = new PaginationMetadata
            {
                Page = page,
                PageSize = pageSize,
                HasMore = hasMore
            },
            Metadata = new QueryMetadata
            {
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                ResultCount = dataPoints.Count,
                AppliedFilters = query.Filters
            }
        };
    }

    /// <inheritdoc />
    public async Task<TimeSeriesQueryResponse<AggregatedDataPointResponse>> QueryAggregateAsync(
        string measurement,
        AggregateQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        // Validate aggregate function
        var aggregateFunction = ValidateAggregateFunction(request.AggregateFunction);

        // Build aggregate query
        var query = new AggregateQuery
        {
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Filters = BuildFilters(request),
            AggregateFunction = aggregateFunction,
            GroupByInterval = ParseInterval(request.GroupByInterval),
            GroupByFields = request.GroupByFields?.ToArray(),
            Limit = request.Limit
        };

        // Add field to filters for aggregate
        query.Filters ??= new Dictionary<string, object>();
        query.Filters["_field"] = request.Field;

        // Execute query
        var results = await _repository.QueryAggregateAsync<AggregateResult>(measurement, query, cancellationToken);
        var resultList = results.ToList();

        stopwatch.Stop();

        // Map to response
        var dataPoints = resultList.Select(r => MapAggregateToResponse(r, aggregateFunction)).ToList();

        // Validate page size
        var pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);

        return new TimeSeriesQueryResponse<AggregatedDataPointResponse>
        {
            Data = dataPoints,
            Pagination = new PaginationMetadata
            {
                Page = request.Page,
                PageSize = pageSize,
                HasMore = false // Aggregate queries typically return all results
            },
            Metadata = new QueryMetadata
            {
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                ResultCount = dataPoints.Count,
                AppliedFilters = query.Filters
            }
        };
    }

    /// <inheritdoc />
    public async Task<TimeSeriesDataPointResponse?> GetLatestAsync(
        string measurement,
        Guid deviceId,
        CancellationToken cancellationToken = default)
    {
        var query = new TimeSeriesQuery
        {
            StartTime = DateTimeOffset.UtcNow.AddDays(-30),
            EndTime = DateTimeOffset.UtcNow,
            Filters = new Dictionary<string, object> { ["deviceId"] = deviceId },
            Limit = 1,
            OrderBy = "timestamp"
        };

        var results = await _repository.QueryAsync<TimeSeriesData>(measurement, query, cancellationToken);
        var result = results.FirstOrDefault();

        return result != null ? MapToResponse(result) : null;
    }

    /// <inheritdoc />
    public async Task<Dictionary<Guid, TimeSeriesDataPointResponse>> GetLatestForDevicesAsync(
        string measurement,
        IEnumerable<Guid> deviceIds,
        CancellationToken cancellationToken = default)
    {
        var results = new Dictionary<Guid, TimeSeriesDataPointResponse>();
        
        foreach (var deviceId in deviceIds)
        {
            var latest = await GetLatestAsync(measurement, deviceId, cancellationToken);
            if (latest != null)
            {
                results[deviceId] = latest;
            }
        }

        return results;
    }

    private static Dictionary<string, object>? BuildFilters(TimeSeriesQueryRequest request)
    {
        var filters = new Dictionary<string, object>();

        if (request.DeviceId.HasValue)
        {
            filters["deviceId"] = request.DeviceId.Value;
        }

        if (request.Filters != null)
        {
            foreach (var filter in request.Filters)
            {
                filters[filter.Key] = filter.Value;
            }
        }

        return filters.Count > 0 ? filters : null;
    }

    private static string ValidateAggregateFunction(string function)
    {
        var validFunctions = new[] { "avg", "sum", "min", "max", "count", "first", "last" };
        var normalized = function.ToLowerInvariant();
        
        return validFunctions.Contains(normalized) ? normalized : "avg";
    }

    private static TimeSpan? ParseInterval(string? interval)
    {
        if (string.IsNullOrEmpty(interval))
            return null;

        // Parse intervals like "1m", "5m", "1h", "1d"
        var match = IntervalRegex().Match(interval);
        if (!match.Success)
            return null;

        // Safely parse the numeric value
        if (!int.TryParse(match.Groups[1].Value, out var value))
            return null;
            
        var unit = match.Groups[2].Value.ToLowerInvariant();

        return unit switch
        {
            "s" => TimeSpan.FromSeconds(value),
            "m" => TimeSpan.FromMinutes(value),
            "h" => TimeSpan.FromHours(value),
            "d" => TimeSpan.FromDays(value),
            _ => null
        };
    }

    private static TimeSeriesDataPointResponse MapToResponse(TimeSeriesData data)
    {
        return new TimeSeriesDataPointResponse
        {
            DeviceId = data.DeviceId,
            Timestamp = data.Timestamp,
            Values = data.Values,
            Quality = data.Quality,
            Tags = data.Tags
        };
    }

    private static AggregatedDataPointResponse MapAggregateToResponse(AggregateResult result, string aggregateFunction)
    {
        return new AggregatedDataPointResponse
        {
            Timestamp = result.Bucket.HasValue ? new DateTimeOffset(result.Bucket.Value, TimeSpan.Zero) : null,
            DeviceId = result.DeviceId,
            Value = result.Value,
            Count = result.Count,
            AggregateFunction = aggregateFunction,
            GroupValues = result.GroupValues
        };
    }

    [GeneratedRegex(@"^(\d+)([smhd])$", RegexOptions.IgnoreCase)]
    private static partial Regex IntervalRegex();
}
