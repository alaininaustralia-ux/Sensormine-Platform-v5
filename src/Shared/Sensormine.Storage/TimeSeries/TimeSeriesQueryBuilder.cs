namespace Sensormine.Storage.TimeSeries;

using Sensormine.Storage.Interfaces;

/// <summary>
/// Builds SQL queries for TimescaleDB time-series operations
/// </summary>
public class TimeSeriesQueryBuilder
{
    /// <summary>
    /// Builds a SELECT query for time-series data with filters
    /// </summary>
    public static string BuildSelectQuery(
        string tableName,
        TimeSeriesQuery query,
        string tenantId,
        out Dictionary<string, object> parameters)
    {
        parameters = new Dictionary<string, object>
        {
            ["@tenantId"] = tenantId,
            ["@startTime"] = query.StartTime,
            ["@endTime"] = query.EndTime
        };

        var sql = $@"
SELECT 
    device_id AS DeviceId,
    tenant_id AS TenantId,
    timestamp AS Timestamp,
    values AS Values,
    quality AS Quality,
    tags AS Tags
FROM {tableName}
WHERE tenant_id = @tenantId
    AND timestamp >= @startTime
    AND timestamp <= @endTime";

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
                    sql += $"\n    AND device_id = {paramName}";
                }
                else if (filter.Key.StartsWith("tag.", StringComparison.OrdinalIgnoreCase))
                {
                    var tagKey = filter.Key[4..]; // Remove "tag." prefix
                    sql += $"\n    AND tags ->> '{tagKey}' = {paramName}";
                }
                else
                {
                    sql += $"\n    AND values ->> '{filter.Key}' = {paramName}";
                }
                
                parameters[paramName] = filter.Value;
                filterIndex++;
            }
        }

        // Add ordering
        var orderBy = string.IsNullOrEmpty(query.OrderBy) ? "timestamp" : query.OrderBy;
        sql += $"\nORDER BY {orderBy} DESC";

        // Add limit
        if (query.Limit.HasValue)
        {
            sql += $"\nLIMIT {query.Limit.Value}";
        }

        return sql;
    }

    /// <summary>
    /// Builds an aggregate query for time-series data
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
        var valueExpression = $"(values ->> '{valueField}')::numeric";

        var selectClause = new List<string>();
        var groupByClause = new List<string>();

        // Time bucket if interval specified
        if (query.GroupByInterval.HasValue)
        {
            var interval = FormatInterval(query.GroupByInterval.Value);
            selectClause.Add($"time_bucket('{interval}', timestamp) AS bucket");
            groupByClause.Add("time_bucket('" + interval + "', timestamp)");
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
                else if (field.StartsWith("tag.", StringComparison.OrdinalIgnoreCase))
                {
                    var tagKey = field[4..];
                    selectClause.Add($"tags ->> '{tagKey}' AS \"{tagKey}\"");
                    groupByClause.Add($"tags ->> '{tagKey}'");
                }
            }
        }

        // Add aggregate column
        selectClause.Add($"{aggregateFunction}({valueExpression}) AS Value");
        selectClause.Add($"COUNT(*) AS Count");

        var sql = $@"
SELECT 
    {string.Join(",\n    ", selectClause)}
FROM {tableName}
WHERE tenant_id = @tenantId
    AND timestamp >= @startTime
    AND timestamp <= @endTime";

        // Add filters
        if (query.Filters != null && query.Filters.Count > 0)
        {
            var filterIndex = 0;
            foreach (var filter in query.Filters)
            {
                var paramName = $"@filter{filterIndex}";
                
                if (filter.Key.Equals("deviceId", StringComparison.OrdinalIgnoreCase))
                {
                    sql += $"\n    AND device_id = {paramName}";
                }
                else if (filter.Key.StartsWith("tag.", StringComparison.OrdinalIgnoreCase))
                {
                    var tagKey = filter.Key[4..];
                    sql += $"\n    AND tags ->> '{tagKey}' = {paramName}";
                }
                else
                {
                    sql += $"\n    AND values ->> '{filter.Key}' = {paramName}";
                }
                
                parameters[paramName] = filter.Value;
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
    /// Builds an INSERT statement for time-series data
    /// </summary>
    public static string BuildInsertQuery(string tableName)
    {
        return $@"
INSERT INTO {tableName} (device_id, tenant_id, timestamp, values, quality, tags)
VALUES (@deviceId, @tenantId, @timestamp, @values::jsonb, @quality::jsonb, @tags::jsonb)";
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
}
