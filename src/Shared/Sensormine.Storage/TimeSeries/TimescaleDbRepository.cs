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
                TenantId = reader.GetGuid(reader.GetOrdinal("TenantId")),
                Timestamp = reader.GetDateTime(reader.GetOrdinal("Timestamp")),
                Values = new Dictionary<string, object>()
            };

            // Read JSONB custom_fields as Values
            var valuesJson = DeserializeJson<Dictionary<string, object>>(reader, "Values");
            if (valuesJson != null)
            {
                foreach (var kvp in valuesJson)
                {
                    item.Values[kvp.Key] = kvp.Value;
                }
            }

            // Add system fields to Values if present
            try
            {
                var batteryOrdinal = reader.GetOrdinal("battery_level");
                if (!reader.IsDBNull(batteryOrdinal))
                {
                    item.Values["battery_level"] = reader.GetDouble(batteryOrdinal);
                }
            }
            catch { /* Field doesn't exist */ }

            try
            {
                var signalOrdinal = reader.GetOrdinal("signal_strength");
                if (!reader.IsDBNull(signalOrdinal))
                {
                    item.Values["signal_strength"] = reader.GetDouble(signalOrdinal);
                }
            }
            catch { /* Field doesn't exist */ }

            item.Quality = DeserializeJson<Dictionary<string, string>>(reader, "Quality");
            
            // Add device_type as tag
            try
            {
                var deviceTypeOrdinal = reader.GetOrdinal("device_type");
                if (!reader.IsDBNull(deviceTypeOrdinal))
                {
                    item.Tags = new Dictionary<string, string>
                    {
                        ["device_type"] = reader.GetString(deviceTypeOrdinal)
                    };
                }
            }
            catch { /* Field doesn't exist */ }

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
                // PostgreSQL stores as double precision, convert to decimal
                result.Value = Convert.ToDecimal(reader.GetDouble(valueOrdinal));
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
        
        // Convert TimeSeriesData to TelemetryData for new JSONB schema
        var telemetryData = ConvertToTelemetryData(data);
        
        // Set tenant context for Row Level Security using the tenant ID from the data
        await SetTenantContextAsync(telemetryData.TenantId.ToString(), isServiceAccount: true, cancellationToken);
        
        var sql = TimeSeriesQueryBuilder.BuildInsertQuery(tableName);

        EnsureConnectionOpen();

        // Write single row with JSONB custom_fields
        using var command = _connection.CreateCommand();
        command.CommandText = sql;

        AddParameter(command, "@timestamp", telemetryData.Time.UtcDateTime);
        AddParameter(command, "@deviceId", telemetryData.DeviceId);
        AddParameter(command, "@tenantId", telemetryData.TenantId.ToString());
        AddParameter(command, "@deviceType", telemetryData.DeviceType);
        
        // System fields
        AddParameter(command, "@batteryLevel", telemetryData.BatteryLevel);
        AddParameter(command, "@signalStrength", telemetryData.SignalStrength);
        AddParameter(command, "@latitude", telemetryData.Latitude);
        AddParameter(command, "@longitude", telemetryData.Longitude);
        AddParameter(command, "@altitude", telemetryData.Altitude);
        
        // JSONB fields
        AddParameter(command, "@customFields", 
            telemetryData.CustomFields.Count > 0 
                ? JsonSerializer.Serialize(telemetryData.CustomFields, _jsonOptions) 
                : "{}");
        AddParameter(command, "@quality", 
            telemetryData.Quality != null 
                ? JsonSerializer.Serialize(telemetryData.Quality, _jsonOptions) 
                : null);

        await ExecuteNonQueryAsync(command, cancellationToken);
    }
    
    private async Task SetTenantContextAsync(string tenantId, bool isServiceAccount, CancellationToken cancellationToken)
    {
        EnsureConnectionOpen();
        
        // Set PostgreSQL session variables for Row Level Security
        using var command = _connection.CreateCommand();
        command.CommandText = $@"
            SET app.current_tenant_id = '{tenantId}';
            SET app.is_service_account = '{isServiceAccount}';
        ";
        await ExecuteNonQueryAsync(command, cancellationToken);
    }

    private static string GetTableName(string measurement)
    {
        // Use the shared sanitization method from TimeSeriesQueryBuilder
        var sanitized = TimeSeriesQueryBuilder.SanitizeIdentifier(measurement);
        return string.IsNullOrEmpty(sanitized) ? DefaultTableName : sanitized;
    }

    private void EnsureConnectionOpen()
    {
        if (_connection.State == ConnectionState.Closed)
        {
            _connection.Open();
        }
        else if (_connection.State == ConnectionState.Broken)
        {
            _connection.Close();
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
            TenantId = Guid.Parse(_tenantId), // Default, will be overwritten if provided in data
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
                        // Preserve the tenant ID from the data if provided
                        var tenantIdStr = kvp.Value.GetString();
                        if (!string.IsNullOrEmpty(tenantIdStr) && Guid.TryParse(tenantIdStr, out var tenantGuid))
                            result.TenantId = tenantGuid;
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
            // Don't dispose the connection - it's managed by the DI container
            // Just ensure it's closed if we opened it
            if (_connection?.State == ConnectionState.Open)
            {
                _connection.Close();
            }
        }

        _disposed = true;
    }

    /// <summary>
    /// Convert TimeSeriesData to TelemetryData for JSONB schema
    /// </summary>
    private static TelemetryData ConvertToTelemetryData(TimeSeriesData data)
    {
        var telemetry = new TelemetryData
        {
            Time = data.Timestamp,
            DeviceId = data.DeviceId,
            TenantId = data.TenantId,
            DeviceType = data.Tags?.GetValueOrDefault("device_type") ?? "unknown",
            CustomFields = new Dictionary<string, object>()
        };

        // Extract system fields from values if they exist
        if (data.Values.TryGetValue("battery_level", out var batteryLevel) && batteryLevel is double battery)
        {
            telemetry.BatteryLevel = battery;
        }
        if (data.Values.TryGetValue("signal_strength", out var signalStrength) && signalStrength is double signal)
        {
            telemetry.SignalStrength = signal;
        }
        if (data.Values.TryGetValue("latitude", out var latitude) && latitude is double lat)
        {
            telemetry.Latitude = lat;
        }
        if (data.Values.TryGetValue("longitude", out var longitude) && longitude is double lng)
        {
            telemetry.Longitude = lng;
        }
        if (data.Values.TryGetValue("altitude", out var altitude) && altitude is double alt)
        {
            telemetry.Altitude = alt;
        }

        // Add all non-system fields to CustomFields
        var systemFields = new HashSet<string> 
        { 
            "battery_level", "signal_strength", "latitude", "longitude", "altitude" 
        };

        foreach (var kvp in data.Values.Where(kvp => !systemFields.Contains(kvp.Key)))
        {
            telemetry.CustomFields[kvp.Key] = kvp.Value;
        }

        // Copy quality metadata
        if (data.Quality != null)
        {
            foreach (var kvp in data.Quality)
            {
                telemetry.CustomFields[$"quality_{kvp.Key}"] = kvp.Value;
            }
        }

        return telemetry;
    }

    /// <inheritdoc />
    public async Task<Dictionary<string, LatestTelemetryData>> GetLatestTelemetryForDevicesAsync(
        IEnumerable<string> deviceIds, 
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, LatestTelemetryData>();
        var deviceIdList = deviceIds.ToList();

        if (!deviceIdList.Any())
            return result;

        // Build SQL to get the latest telemetry for each device using DISTINCT ON
        var sql = @"
            SELECT DISTINCT ON (device_id) 
                device_id,
                time,
                custom_fields
            FROM telemetry
            WHERE tenant_id = @tenantId
                AND device_id = ANY(@deviceIds)
            ORDER BY device_id, time DESC";

        using var command = _connection.CreateCommand();
        command.CommandText = sql;

        var tenantParam = command.CreateParameter();
        tenantParam.ParameterName = "@tenantId";
        tenantParam.Value = Guid.Parse(_tenantId);
        command.Parameters.Add(tenantParam);

        var deviceIdsParam = command.CreateParameter();
        deviceIdsParam.ParameterName = "@deviceIds";
        deviceIdsParam.Value = deviceIdList.ToArray();
        command.Parameters.Add(deviceIdsParam);

        EnsureConnectionOpen();

        using var reader = await ExecuteReaderAsync(command, cancellationToken);
        while (await ReadAsync(reader, cancellationToken))
        {
            var deviceId = reader.GetString(reader.GetOrdinal("device_id"));
            var timestamp = reader.GetDateTime(reader.GetOrdinal("time"));
            var customFields = DeserializeJson<Dictionary<string, object>>(reader, "custom_fields") 
                ?? new Dictionary<string, object>();

            result[deviceId] = new LatestTelemetryData
            {
                Timestamp = timestamp,
                CustomFields = customFields
            };
        }

        return result;
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
