namespace Sensormine.Storage.TimeSeries;

using System.Data;
using System.Text.Json;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;

/// <summary>
/// TimescaleDB implementation of the time-series repository
/// </summary>
public class TimescaleDbRepository : ITimeSeriesRepository, IDisposable
{
    private readonly IDbConnection _connection;
    private readonly string _tenantId;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _disposed;

    /// <summary>
    /// Default table name for time-series data
    /// </summary>
    public const string DefaultTableName = "telemetry_data";

    public TimescaleDbRepository(IDbConnection connection, string tenantId)
    {
        _connection = connection ?? throw new ArgumentNullException(nameof(connection));
        _tenantId = tenantId ?? throw new ArgumentNullException(nameof(tenantId));
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    /// <inheritdoc />
    public async Task WriteAsync<T>(string measurement, T data, CancellationToken cancellationToken = default) where T : class
    {
        var timeSeriesData = ConvertToTimeSeriesData(data);
        await WriteTimeSeriesDataAsync(measurement, timeSeriesData, cancellationToken);
    }

    /// <inheritdoc />
    public async Task WriteBatchAsync<T>(string measurement, IEnumerable<T> data, CancellationToken cancellationToken = default) where T : class
    {
        var timeSeriesDataList = data.Select(ConvertToTimeSeriesData).ToList();
        
        foreach (var batch in timeSeriesDataList.Chunk(1000))
        {
            foreach (var item in batch)
            {
                cancellationToken.ThrowIfCancellationRequested();
                await WriteTimeSeriesDataAsync(measurement, item, cancellationToken);
            }
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<T>> QueryAsync<T>(string measurement, TimeSeriesQuery query, CancellationToken cancellationToken = default) where T : class
    {
        var tableName = GetTableName(measurement);
        var sql = TimeSeriesQueryBuilder.BuildSelectQuery(tableName, query, _tenantId, out var parameters);

        var results = new List<TimeSeriesData>();
        
        using var command = _connection.CreateCommand();
        command.CommandText = sql;
        
        foreach (var param in parameters)
        {
            var dbParam = command.CreateParameter();
            dbParam.ParameterName = param.Key;
            dbParam.Value = param.Value;
            command.Parameters.Add(dbParam);
        }

        EnsureConnectionOpen();

        using var reader = await ExecuteReaderAsync(command, cancellationToken);
        while (await ReadAsync(reader, cancellationToken))
        {
            var item = new TimeSeriesData
            {
                DeviceId = reader.GetString(reader.GetOrdinal("DeviceId")),
                TenantId = reader.GetGuid(reader.GetOrdinal("TenantId")).ToString(),
                Timestamp = reader.GetDateTime(reader.GetOrdinal("Timestamp")),
                Values = DeserializeJson<Dictionary<string, object>>(reader, "Values") ?? new(),
                Quality = DeserializeJson<Dictionary<string, string>>(reader, "Quality"),
                Tags = DeserializeJson<Dictionary<string, string>>(reader, "Tags")
            };
            results.Add(item);
        }

        return ConvertResults<T>(results);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<T>> QueryAggregateAsync<T>(string measurement, AggregateQuery query, CancellationToken cancellationToken = default) where T : class
    {
        // For aggregate queries, we need to specify which value field to aggregate
        // Default to "value" if not specified in filters
        var valueField = "value";
        if (query.Filters != null && query.Filters.TryGetValue("_field", out var field))
        {
            valueField = field;
            query.Filters.Remove("_field");
        }

        var tableName = GetTableName(measurement);
        var sql = TimeSeriesQueryBuilder.BuildAggregateQuery(tableName, query, _tenantId, valueField, out var parameters);

        var results = new List<AggregateResult>();
        
        using var command = _connection.CreateCommand();
        command.CommandText = sql;
        
        foreach (var param in parameters)
        {
            var dbParam = command.CreateParameter();
            dbParam.ParameterName = param.Key;
            dbParam.Value = param.Value;
            command.Parameters.Add(dbParam);
        }

        EnsureConnectionOpen();

        using var reader = await ExecuteReaderAsync(command, cancellationToken);
        while (await ReadAsync(reader, cancellationToken))
        {
            var result = new AggregateResult
            {
                Count = reader.GetInt64(reader.GetOrdinal("Count"))
            };

            // Try to read the Value field
            var valueOrdinal = reader.GetOrdinal("Value");
            if (!reader.IsDBNull(valueOrdinal))
            {
                result.Value = reader.GetDecimal(valueOrdinal);
            }

            // Try to read bucket if it exists
            try
            {
                var bucketOrdinal = reader.GetOrdinal("bucket");
                if (!reader.IsDBNull(bucketOrdinal))
                {
                    result.Bucket = reader.GetDateTime(bucketOrdinal);
                }
            }
            catch (IndexOutOfRangeException)
            {
                // bucket column doesn't exist, which is fine
            }

            // Try to read DeviceId if it exists
            try
            {
                var deviceOrdinal = reader.GetOrdinal("DeviceId");
                if (!reader.IsDBNull(deviceOrdinal))
                {
                    result.DeviceId = reader.GetString(deviceOrdinal);
                }
            }
            catch (IndexOutOfRangeException)
            {
                // DeviceId column doesn't exist, which is fine
            }

            results.Add(result);
        }

        return ConvertAggregateResults<T>(results);
    }

    private async Task WriteTimeSeriesDataAsync(string measurement, TimeSeriesData data, CancellationToken cancellationToken)
    {
        var tableName = GetTableName(measurement);
        var sql = TimeSeriesQueryBuilder.BuildInsertQuery(tableName);

        EnsureConnectionOpen();

        // Write one row per metric
        foreach (var kvp in data.Values)
        {
            using var command = _connection.CreateCommand();
            command.CommandText = sql;

            AddParameter(command, "@timestamp", data.Timestamp.UtcDateTime);
            AddParameter(command, "@deviceId", data.DeviceId);
            AddParameter(command, "@tenantId", _tenantId);
            AddParameter(command, "@metricName", kvp.Key);
            
            // Convert value to double
            double value = kvp.Value switch
            {
                double d => d,
                float f => f,
                int i => i,
                long l => l,
                decimal dec => (double)dec,
                string s when double.TryParse(s, out var parsed) => parsed,
                _ => 0.0
            };
            
            AddParameter(command, "@value", value);
            AddParameter(command, "@unit", null);  // TODO: Extract unit from schema
            AddParameter(command, "@tags", data.Tags != null ? JsonSerializer.Serialize(data.Tags, _jsonOptions) : null);
            AddParameter(command, "@metadata", data.Quality != null ? JsonSerializer.Serialize(data.Quality, _jsonOptions) : null);

            await ExecuteNonQueryAsync(command, cancellationToken);
        }
    }

    private static string GetTableName(string measurement)
    {
        // Use the shared sanitization method from TimeSeriesQueryBuilder
        var sanitized = TimeSeriesQueryBuilder.SanitizeIdentifier(measurement);
        return string.IsNullOrEmpty(sanitized) ? DefaultTableName : sanitized;
    }

    private void EnsureConnectionOpen()
    {
        if (_connection.State != ConnectionState.Open)
        {
            _connection.Open();
        }
    }

    private static void AddParameter(IDbCommand command, string name, object? value)
    {
        var param = command.CreateParameter();
        param.ParameterName = name;
        param.Value = value ?? DBNull.Value;
        command.Parameters.Add(param);
    }

    private T? DeserializeJson<T>(IDataReader reader, string columnName) where T : class
    {
        try
        {
            var ordinal = reader.GetOrdinal(columnName);
            if (reader.IsDBNull(ordinal))
                return null;

            var json = reader.GetString(ordinal);
            return JsonSerializer.Deserialize<T>(json, _jsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private TimeSeriesData ConvertToTimeSeriesData<T>(T data) where T : class
    {
        if (data is TimeSeriesData tsData)
            return tsData;

        // Convert generic object to TimeSeriesData
        var json = JsonSerializer.Serialize(data, _jsonOptions);
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, _jsonOptions);

        var result = new TimeSeriesData
        {
            TenantId = _tenantId,
            Timestamp = DateTimeOffset.UtcNow
        };

        if (dict != null)
        {
            foreach (var kvp in dict)
            {
                switch (kvp.Key.ToLowerInvariant())
                {
                    case "deviceid":
                        result.DeviceId = kvp.Value.GetString() ?? string.Empty;
                        break;
                    case "timestamp":
                        if (kvp.Value.TryGetDateTimeOffset(out var ts))
                            result.Timestamp = ts;
                        break;
                    case "tenantid":
                        // Use the injected tenant ID
                        break;
                    case "quality":
                        result.Quality = JsonSerializer.Deserialize<Dictionary<string, string>>(kvp.Value.GetRawText(), _jsonOptions);
                        break;
                    case "tags":
                        result.Tags = JsonSerializer.Deserialize<Dictionary<string, string>>(kvp.Value.GetRawText(), _jsonOptions);
                        break;
                    default:
                        result.Values[kvp.Key] = ConvertJsonElementToObject(kvp.Value);
                        break;
                }
            }
        }

        return result;
    }

    private static object ConvertJsonElementToObject(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? string.Empty,
            JsonValueKind.Number when element.TryGetInt64(out var l) => l,
            JsonValueKind.Number when element.TryGetDouble(out var d) => d,
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => (object)DBNull.Value,
            _ => element.GetRawText()
        };
    }

    private static IEnumerable<T> ConvertResults<T>(List<TimeSeriesData> results) where T : class
    {
        if (typeof(T) == typeof(TimeSeriesData))
            return (IEnumerable<T>)(object)results;

        // For other types, serialize and deserialize
        var json = JsonSerializer.Serialize(results);
        return JsonSerializer.Deserialize<List<T>>(json) ?? new List<T>();
    }

    private static IEnumerable<T> ConvertAggregateResults<T>(List<AggregateResult> results) where T : class
    {
        if (typeof(T) == typeof(AggregateResult))
            return (IEnumerable<T>)(object)results;

        // For other types, serialize and deserialize
        var json = JsonSerializer.Serialize(results);
        return JsonSerializer.Deserialize<List<T>>(json) ?? new List<T>();
    }

    // Async wrappers for IDbCommand (since IDbCommand doesn't have async methods)
    private static Task<IDataReader> ExecuteReaderAsync(IDbCommand command, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(command.ExecuteReader());
    }

    private static Task<int> ExecuteNonQueryAsync(IDbCommand command, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(command.ExecuteNonQuery());
    }

    private static Task<bool> ReadAsync(IDataReader reader, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(reader.Read());
    }

    /// <summary>
    /// Dispose of resources
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Dispose pattern implementation
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;

        if (disposing)
        {
            _connection?.Dispose();
        }

        _disposed = true;
    }
}

/// <summary>
/// Result of an aggregate query
/// </summary>
public class AggregateResult
{
    /// <summary>
    /// Time bucket for time-grouped aggregations
    /// </summary>
    public DateTime? Bucket { get; set; }

    /// <summary>
    /// Device ID if grouped by device
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Aggregated value
    /// </summary>
    public decimal? Value { get; set; }

    /// <summary>
    /// Number of data points in this aggregation
    /// </summary>
    public long Count { get; set; }

    /// <summary>
    /// Additional group-by field values
    /// </summary>
    public Dictionary<string, string>? GroupValues { get; set; }
}
