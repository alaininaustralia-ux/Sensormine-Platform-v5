namespace Sensormine.Storage.TimeSeries;

using Sensormine.Storage.Interfaces;
using System.Text.RegularExpressions;

/// <summary>
/// Builds SQL queries for TimescaleDB time-series operations
/// </summary>
public partial class TimeSeriesQueryBuilder
{
    /// <summary>
    /// Allowed column names for ORDER BY clause
    /// </summary>
    private static readonly HashSet<string> AllowedOrderByColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "time", "device_id", "tenant_id"
    };

    /// <summary>
    /// Builds a SELECT query for time-series data with filters (JSONB custom_fields schema)
    /// </summary>
    public static string BuildSelectQuery(
        string tableName,
        TimeSeriesQuery query,
        string tenantId,
        out Dictionary<string, object> parameters)
    {
        parameters = new Dictionary<string, object>
        {
            ["@tenantId"] = Guid.Parse(tenantId), // Parse string to Guid for proper UUID parameter type
            ["@startTime"] = query.StartTime,
            ["@endTime"] = query.EndTime
        };

        // Query JSONB custom_fields directly
        var sql = $@"
SELECT 
    device_id AS DeviceId,
    tenant_id AS TenantId,
    time AS Timestamp,
    device_type,
    battery_level,
    signal_strength,
    latitude,
    longitude,
    altitude,
    custom_fields AS Values,
    quality AS Quality
FROM {tableName}
WHERE tenant_id = @tenantId::uuid
    AND time >= @startTime
    AND time <= @endTime";

        // Add filters
        if (query.Filters != null && query.Filters.Count > 0)
        {
            var filterIndex = 0;
            foreach (var filter in query.Filters)
            {
                var paramName = $"@filter{filterIndex}";
                
                // Handle special filter cases
                if (filter.Key.Equals("deviceId", StringComparison.OrdinalIgnoreCase))
                {
                    sql += $"\n    AND device_id = {paramName}::uuid";
                }
                else if (filter.Key.Equals("deviceType", StringComparison.OrdinalIgnoreCase))
                {
                    sql += $"\n    AND device_type = {paramName}";
                }
                else
                {
                    // Filter by JSONB field in custom_fields
                    var fieldName = SanitizeIdentifier(filter.Key);
                    sql += $"\n    AND custom_fields ? '{fieldName}'";
                    // If we want to filter by value too:
                    // sql += $"\n    AND custom_fields ->> '{fieldName}' = {paramName}";
                }
                
                parameters[paramName] = filter.Value;
                filterIndex++;
            }
        }

        // Add ordering - only allow whitelisted columns
        var orderBy = string.IsNullOrEmpty(query.OrderBy) ? "time" : query.OrderBy;
        if (!AllowedOrderByColumns.Contains(orderBy))
        {
            orderBy = "time"; // Default to safe column
        }
        sql += $"\nORDER BY {orderBy} DESC";

        // Add limit
        if (query.Limit.HasValue)
        {
            sql += $"\nLIMIT {query.Limit.Value}";
        }

        return sql;
    }

    /// <summary>
    /// Builds an aggregate query for time-series data (JSONB custom_fields schema)
    /// </summary>
    public static string BuildAggregateQuery(
        string tableName,
        AggregateQuery query,
        string tenantId,
        string valueField,
        out Dictionary<string, object> parameters)
    {
        parameters = new Dictionary<string, object>
        {
            ["@tenantId"] = tenantId,
            ["@startTime"] = query.StartTime,
            ["@endTime"] = query.EndTime
        };

        var aggregateFunction = GetSqlAggregateFunction(query.AggregateFunction);
        
        // For JSONB custom_fields, extract the field value and cast to numeric
        var fieldName = SanitizeIdentifier(valueField);
        var valueExpression = $"(custom_fields ->> '{fieldName}')::double precision";

        var selectClause = new List<string>();
        var groupByClause = new List<string>();

        // Time bucket if interval specified
        if (query.GroupByInterval.HasValue)
        {
            var interval = FormatInterval(query.GroupByInterval.Value);
            selectClause.Add($"time_bucket('{interval}', time) AS bucket");
            groupByClause.Add("time_bucket('" + interval + "', time)");
        }

        // Additional group by fields
        if (query.GroupByFields != null && query.GroupByFields.Length > 0)
        {
            foreach (var field in query.GroupByFields)
            {
                if (field.Equals("deviceId", StringComparison.OrdinalIgnoreCase))
                {
                    selectClause.Add("device_id AS DeviceId");
                    groupByClause.Add("device_id");
                }
                else if (field.Equals("deviceType", StringComparison.OrdinalIgnoreCase))
                {
                    selectClause.Add("device_type AS DeviceType");
                    groupByClause.Add("device_type");
                }
            }
        }

        // Add aggregate column - handle percentile functions specially
        if (aggregateFunction.Contains("percentile_cont"))
        {
            // Replace the value placeholder in percentile functions
            var percentileFunc = aggregateFunction.Replace("value", valueExpression);
            selectClause.Add($"{percentileFunc} AS Value");
        }
        else
        {
            selectClause.Add($"{aggregateFunction}({valueExpression}) AS Value");
        }
        selectClause.Add($"COUNT(*) AS Count");

        var sql = $@"
SELECT 
    {string.Join(",\n    ", selectClause)}
FROM {tableName}
WHERE tenant_id = @tenantId::uuid
    AND time >= @startTime
    AND time <= @endTime
    AND custom_fields ? '{fieldName}'";

        // Add filters
        if (query.Filters != null && query.Filters.Count > 0)
        {
            var filterIndex = 0;
            foreach (var filter in query.Filters)
            {
                var paramName = $"@filter{filterIndex}";
                
                if (filter.Key.Equals("deviceId", StringComparison.OrdinalIgnoreCase))
                {
                    sql += $"\n    AND device_id = {paramName}::uuid";
                    // Parse string to Guid for proper UUID parameter type
                    if (filter.Value is string strValue && Guid.TryParse(strValue, out var guidValue))
                    {
                        parameters[paramName] = guidValue;
                    }
                    else
                    {
                        parameters[paramName] = filter.Value;
                    }
                }
                else if (filter.Key.Equals("deviceType", StringComparison.OrdinalIgnoreCase))
                {
                    sql += $"\n    AND device_type = {paramName}";
                    parameters[paramName] = filter.Value;
                }
                else
                {
                    parameters[paramName] = filter.Value;
                }
                
                filterIndex++;
            }
        }

        // Add GROUP BY
        if (groupByClause.Count > 0)
        {
            sql += $"\nGROUP BY {string.Join(", ", groupByClause)}";
        }

        // Add ORDER BY
        if (query.GroupByInterval.HasValue)
        {
            sql += "\nORDER BY bucket ASC";
        }

        // Add limit
        if (query.Limit.HasValue)
        {
            sql += $"\nLIMIT {query.Limit.Value}";
        }

        return sql;
    }

    /// <summary>
    /// Builds an INSERT statement for time-series data (JSONB schema)
    /// </summary>
    public static string BuildInsertQuery(string tableName)
    {
        return $@"
INSERT INTO {tableName} (
    time, device_id, tenant_id, device_type,
    battery_level, signal_strength, latitude, longitude, altitude,
    custom_fields, quality
)
VALUES (
    @timestamp, @deviceId, @tenantId::uuid, @deviceType,
    @batteryLevel, @signalStrength, @latitude, @longitude, @altitude,
    @customFields::jsonb, @quality::jsonb
)";
    }

    private static string GetSqlAggregateFunction(string function)
    {
        return function.ToLowerInvariant() switch
        {
            "avg" or "average" => "AVG",
            "sum" => "SUM",
            "min" => "MIN",
            "max" => "MAX",
            "count" => "COUNT",
            "first" => "first",  // TimescaleDB specific
            "last" => "last",    // TimescaleDB specific
            "median" or "p50" => "percentile_cont(0.5) WITHIN GROUP (ORDER BY value)",  // PostgreSQL percentile
            "p90" => "percentile_cont(0.9) WITHIN GROUP (ORDER BY value)",
            "p95" => "percentile_cont(0.95) WITHIN GROUP (ORDER BY value)",
            "p99" => "percentile_cont(0.99) WITHIN GROUP (ORDER BY value)",
            "p99.9" => "percentile_cont(0.999) WITHIN GROUP (ORDER BY value)",
            _ => "AVG"
        };
    }

    private static string FormatInterval(TimeSpan interval)
    {
        if (interval.TotalDays >= 1)
            return $"{(int)interval.TotalDays} day";
        if (interval.TotalHours >= 1)
            return $"{(int)interval.TotalHours} hour";
        if (interval.TotalMinutes >= 1)
            return $"{(int)interval.TotalMinutes} minute";
        return $"{(int)interval.TotalSeconds} second";
    }

    /// <summary>
    /// Sanitizes an identifier (field name, tag key) to prevent SQL injection.
    /// Only allows letters, numbers, and underscores.
    /// </summary>
    public static string SanitizeIdentifier(string identifier)
    {
        if (string.IsNullOrEmpty(identifier))
            return string.Empty;
        
        // Only allow alphanumeric characters and underscores
        var sanitized = IdentifierRegex().Replace(identifier, string.Empty);
        
        // Ensure it doesn't start with a number
        if (sanitized.Length > 0 && char.IsDigit(sanitized[0]))
        {
            sanitized = "_" + sanitized;
        }
        
        return sanitized;
    }

    [GeneratedRegex(@"[^a-zA-Z0-9_]")]
    private static partial Regex IdentifierRegex();
}
