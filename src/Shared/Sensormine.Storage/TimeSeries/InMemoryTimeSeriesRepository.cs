namespace Sensormine.Storage.TimeSeries;

using Sensormine.Storage.Interfaces;

/// <summary>
/// In-memory implementation of time-series repository for testing and development
/// </summary>
public class InMemoryTimeSeriesRepository : ITimeSeriesRepository
{
    private readonly Dictionary<string, List<TimeSeriesDataPoint>> _measurements = new();
    private readonly string _tenantId;
    private readonly object _lock = new();

    public InMemoryTimeSeriesRepository(string tenantId)
    {
        _tenantId = tenantId ?? throw new ArgumentNullException(nameof(tenantId));
    }

    /// <inheritdoc />
    public Task WriteAsync<T>(string measurement, T data, CancellationToken cancellationToken = default) where T : class
    {
        var dataPoint = ConvertToDataPoint(data);
        
        lock (_lock)
        {
            if (!_measurements.TryGetValue(measurement, out var list))
            {
                list = new List<TimeSeriesDataPoint>();
                _measurements[measurement] = list;
            }
            list.Add(dataPoint);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task WriteBatchAsync<T>(string measurement, IEnumerable<T> data, CancellationToken cancellationToken = default) where T : class
    {
        var dataPoints = data.Select(ConvertToDataPoint).ToList();
        
        lock (_lock)
        {
            if (!_measurements.TryGetValue(measurement, out var list))
            {
                list = new List<TimeSeriesDataPoint>();
                _measurements[measurement] = list;
            }
            list.AddRange(dataPoints);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IEnumerable<T>> QueryAsync<T>(string measurement, TimeSeriesQuery query, CancellationToken cancellationToken = default) where T : class
    {
        List<TimeSeriesDataPoint> results;
        
        lock (_lock)
        {
            if (!_measurements.TryGetValue(measurement, out var list))
            {
                return Task.FromResult<IEnumerable<T>>(Enumerable.Empty<T>());
            }

            results = list
                .Where(d => d.TenantId == _tenantId)
                .Where(d => d.Timestamp >= query.StartTime && d.Timestamp <= query.EndTime)
                .Where(d => MatchesFilters(d, query.Filters))
                .OrderByDescending(d => d.Timestamp)
                .ToList();

            if (query.Limit.HasValue)
            {
                results = results.Take(query.Limit.Value).ToList();
            }
        }

        return Task.FromResult(ConvertResults<T>(results));
    }

    /// <inheritdoc />
    public Task<IEnumerable<T>> QueryAggregateAsync<T>(string measurement, AggregateQuery query, CancellationToken cancellationToken = default) where T : class
    {
        // Get the value field to aggregate
        var valueField = "value";
        if (query.Filters != null && query.Filters.TryGetValue("_field", out var field))
        {
            valueField = field?.ToString() ?? "value";
            var newFilters = new Dictionary<string, object>(query.Filters);
            newFilters.Remove("_field");
            query.Filters = newFilters;
        }

        List<AggregateResult> results;
        
        lock (_lock)
        {
            if (!_measurements.TryGetValue(measurement, out var list))
            {
                return Task.FromResult<IEnumerable<T>>(Enumerable.Empty<T>());
            }

            var filteredData = list
                .Where(d => d.TenantId == _tenantId)
                .Where(d => d.Timestamp >= query.StartTime && d.Timestamp <= query.EndTime)
                .Where(d => MatchesFilters(d, query.Filters))
                .ToList();

            results = AggregateData(filteredData, query, valueField);
        }

        return Task.FromResult(ConvertAggregateResults<T>(results));
    }

    private List<AggregateResult> AggregateData(List<TimeSeriesDataPoint> data, AggregateQuery query, string valueField)
    {
        var results = new List<AggregateResult>();

        // Group by time bucket if interval specified
        IEnumerable<IGrouping<object, TimeSeriesDataPoint>> groups;

        if (query.GroupByInterval.HasValue)
        {
            var interval = query.GroupByInterval.Value;
            groups = data.GroupBy(d => 
            {
                var bucketTicks = d.Timestamp.UtcTicks - (d.Timestamp.UtcTicks % interval.Ticks);
                return (object)new DateTimeOffset(bucketTicks, TimeSpan.Zero);
            });
        }
        else if (query.GroupByFields?.Any(f => f.Equals("deviceId", StringComparison.OrdinalIgnoreCase)) == true)
        {
            groups = data.GroupBy(d => (object)d.DeviceId);
        }
        else
        {
            // Single aggregate over all data
            groups = new[] { data.GroupBy(d => (object)"all").First() };
        }

        foreach (var group in groups)
        {
            var values = group
                .Where(d => d.Values.ContainsKey(valueField))
                .Select(d => Convert.ToDecimal(d.Values[valueField]))
                .ToList();

            if (!values.Any())
                continue;

            var result = new AggregateResult
            {
                Count = values.Count
            };

            if (group.Key is DateTimeOffset bucket)
            {
                result.Bucket = bucket.UtcDateTime;
            }
            else if (group.Key is string deviceId && deviceId != "all" && Guid.TryParse(deviceId, out var deviceGuid))
            {
                result.DeviceId = deviceGuid;
            }

            result.Value = query.AggregateFunction.ToLowerInvariant() switch
            {
                "sum" => values.Sum(),
                "min" => values.Min(),
                "max" => values.Max(),
                "count" => values.Count,
                "avg" or "average" or _ => values.Average()
            };

            results.Add(result);
        }

        return results.OrderBy(r => r.Bucket).ToList();
    }

    private bool MatchesFilters(TimeSeriesDataPoint dataPoint, Dictionary<string, object>? filters)
    {
        if (filters == null || filters.Count == 0)
            return true;

        foreach (var filter in filters)
        {
            if (filter.Key.Equals("deviceId", StringComparison.OrdinalIgnoreCase))
            {
                var filterValueStr = filter.Value is Guid guidValue ? guidValue.ToString() : filter.Value?.ToString();
                if (dataPoint.DeviceId != filterValueStr)
                    return false;
            }
            else if (filter.Key.StartsWith("tag.", StringComparison.OrdinalIgnoreCase))
            {
                var tagKey = filter.Key[4..];
                var filterValueStr = filter.Value?.ToString();
                if (dataPoint.Tags == null || !dataPoint.Tags.TryGetValue(tagKey, out var tagValue) || tagValue != filterValueStr)
                    return false;
            }
            else
            {
                var filterValueStr = filter.Value?.ToString();
                if (!dataPoint.Values.TryGetValue(filter.Key, out var value) || value?.ToString() != filterValueStr)
                    return false;
            }
        }

        return true;
    }

    private TimeSeriesDataPoint ConvertToDataPoint<T>(T data) where T : class
    {
        if (data is Core.Models.TimeSeriesData tsData)
        {
            return new TimeSeriesDataPoint
            {
                DeviceId = tsData.DeviceId.ToString(),
                TenantId = _tenantId,
                Timestamp = tsData.Timestamp,
                Values = tsData.Values,
                Quality = tsData.Quality,
                Tags = tsData.Tags
            };
        }

        // Default conversion
        return new TimeSeriesDataPoint
        {
            DeviceId = "unknown",
            TenantId = _tenantId,
            Timestamp = DateTimeOffset.UtcNow,
            Values = new Dictionary<string, object> { ["value"] = data }
        };
    }

    private static IEnumerable<T> ConvertResults<T>(List<TimeSeriesDataPoint> results) where T : class
    {
        if (typeof(T) == typeof(Core.Models.TimeSeriesData))
        {
            return results.Select(r => new Core.Models.TimeSeriesData
            {
                DeviceId = Guid.Parse(r.DeviceId),
                TenantId = Guid.Parse(r.TenantId),
                Timestamp = r.Timestamp,
                Values = r.Values,
                Quality = r.Quality,
                Tags = r.Tags
            }).Cast<T>();
        }

        return Enumerable.Empty<T>();
    }

    private static IEnumerable<T> ConvertAggregateResults<T>(List<AggregateResult> results) where T : class
    {
        if (typeof(T) == typeof(AggregateResult))
            return results.Cast<T>();

        return Enumerable.Empty<T>();
    }

    /// <inheritdoc />
    public Task<Dictionary<Guid, LatestTelemetryData>> GetLatestTelemetryForDevicesAsync(
        IEnumerable<Guid> deviceIds, 
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<Guid, LatestTelemetryData>();
        var deviceIdList = deviceIds.ToList();

        if (!deviceIdList.Any())
            return Task.FromResult(result);

        lock (_lock)
        {
            if (!_measurements.TryGetValue("telemetry", out var list))
            {
                return Task.FromResult(result);
            }

            // Get latest telemetry for each device
            foreach (var deviceId in deviceIdList)
            {
                // DeviceId is stored as string internally, convert to compare
                var deviceIdStr = deviceId.ToString();
                var latest = list
                    .Where(d => d.TenantId == _tenantId && d.DeviceId == deviceIdStr)
                    .OrderByDescending(d => d.Timestamp)
                    .FirstOrDefault();

                if (latest != null)
                {
                    result[deviceId] = new LatestTelemetryData
                    {
                        Timestamp = latest.Timestamp.UtcDateTime,
                        CustomFields = new Dictionary<string, object>(latest.Values)
                    };
                }
            }
        }

        return Task.FromResult(result);
    }

    /// <summary>
    /// Clear all data (for testing)
    /// </summary>
    public void Clear()
    {
        lock (_lock)
        {
            _measurements.Clear();
        }
    }

    /// <summary>
    /// Get count of data points for a measurement (for testing)
    /// </summary>
    public int GetCount(string measurement)
    {
        lock (_lock)
        {
            return _measurements.TryGetValue(measurement, out var list) ? list.Count : 0;
        }
    }

    private class TimeSeriesDataPoint
    {
        public string DeviceId { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public DateTimeOffset Timestamp { get; set; }
        public Dictionary<string, object> Values { get; set; } = new();
        public Dictionary<string, string>? Quality { get; set; }
        public Dictionary<string, string>? Tags { get; set; }
    }
}
