# Query API Field Mapping Integration Example

## Overview
This document shows how Query API should use field mappings to resolve friendly names to TimescaleDB columns.

## Architecture

```
User Query (Friendly Names)
    ↓
Query API receives request
    ↓
Fetch field mappings for device type
    ↓
Resolve friendly names → actual field names
    ↓
Build TimescaleDB query
    ↓
Execute query
    ↓
Return results with friendly names
```

## Implementation Example

### 1. Query Request DTO

```csharp
// Query.API/DTOs/QueryRequest.cs
public class QueryRequest
{
    public Guid DeviceTypeId { get; set; }
    public List<string> Fields { get; set; } = new();  // Friendly names or field names
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Aggregation { get; set; }
    public string? Interval { get; set; }
    public Dictionary<string, object>? Filters { get; set; }
}
```

### 2. Field Mapping Service

```csharp
// Query.API/Services/FieldMappingResolver.cs
public interface IFieldMappingResolver
{
    Task<List<ResolvedField>> ResolveFieldsAsync(Guid deviceTypeId, List<string> friendlyNamesOrFieldNames);
}

public class ResolvedField
{
    public string FriendlyName { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public FieldSource Source { get; set; }
    public FieldDataType DataType { get; set; }
    public string? Unit { get; set; }
    public string? DefaultAggregation { get; set; }
    
    // SQL column mapping
    public string GetColumnExpression()
    {
        return Source switch
        {
            FieldSource.System => FieldName,  // Direct column: battery_level, signal_strength
            FieldSource.Schema => FieldName,  // Direct column from schema: temperature, pressure
            FieldSource.CustomField => $"custom_fields->'{FieldName}'",  // JSONB path
            _ => FieldName
        };
    }
}

public class FieldMappingResolver : IFieldMappingResolver
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FieldMappingResolver> _logger;
    
    public FieldMappingResolver(HttpClient httpClient, ILogger<FieldMappingResolver> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }
    
    public async Task<List<ResolvedField>> ResolveFieldsAsync(Guid deviceTypeId, List<string> fieldsToResolve)
    {
        // Fetch field mappings from Device.API
        var response = await _httpClient.GetAsync($"/api/devicetype/{deviceTypeId}/fields");
        response.EnsureSuccessStatusCode();
        
        var fieldMappings = await response.Content.ReadFromJsonAsync<List<FieldMapping>>();
        
        var resolved = new List<ResolvedField>();
        
        foreach (var field in fieldsToResolve)
        {
            // Try to match by friendly name first, then by field name
            var mapping = fieldMappings?.FirstOrDefault(f => 
                f.FriendlyName.Equals(field, StringComparison.OrdinalIgnoreCase) ||
                f.FieldName.Equals(field, StringComparison.OrdinalIgnoreCase));
            
            if (mapping != null)
            {
                resolved.Add(new ResolvedField
                {
                    FriendlyName = mapping.FriendlyName,
                    FieldName = mapping.FieldName,
                    Source = mapping.FieldSource,
                    DataType = mapping.DataType,
                    Unit = mapping.Unit,
                    DefaultAggregation = mapping.DefaultAggregation
                });
                
                _logger.LogDebug("Resolved field: '{Input}' → '{FieldName}' ({Source})", 
                    field, mapping.FieldName, mapping.Source);
            }
            else
            {
                _logger.LogWarning("Could not resolve field: {Field}", field);
                throw new ArgumentException($"Unknown field: {field}");
            }
        }
        
        return resolved;
    }
}
```

### 3. Query Service with Field Mapping

```csharp
// Query.API/Services/QueryService.cs
public class QueryService : IQueryService
{
    private readonly ITimeSeriesRepository _timeSeriesRepo;
    private readonly IFieldMappingResolver _fieldResolver;
    private readonly ILogger<QueryService> _logger;
    
    public async Task<QueryResult> ExecuteQueryAsync(QueryRequest request)
    {
        // 1. Resolve field names
        var resolvedFields = await _fieldResolver.ResolveFieldsAsync(
            request.DeviceTypeId, 
            request.Fields
        );
        
        // 2. Build SQL query
        var sql = BuildQuery(request, resolvedFields);
        
        _logger.LogInformation("Executing query: {SQL}", sql);
        
        // 3. Execute query
        var results = await _timeSeriesRepo.ExecuteQueryAsync(sql);
        
        // 4. Transform results (use friendly names)
        return TransformResults(results, resolvedFields);
    }
    
    private string BuildQuery(QueryRequest request, List<ResolvedField> fields)
    {
        var selectColumns = fields.Select(f => BuildSelectExpression(f, request.Aggregation)).ToList();
        selectColumns.Insert(0, "time_bucket($1, timestamp) AS time");
        
        var whereConditions = new List<string>
        {
            "device_type_id = $2",
            "timestamp >= $3",
            "timestamp <= $4"
        };
        
        var sql = $@"
            SELECT {string.Join(", ", selectColumns)}
            FROM telemetry_data
            WHERE {string.Join(" AND ", whereConditions)}
            GROUP BY time
            ORDER BY time DESC
        ";
        
        return sql;
    }
    
    private string BuildSelectExpression(ResolvedField field, string? aggregation)
    {
        var columnExpr = field.GetColumnExpression();
        var agg = aggregation ?? field.DefaultAggregation ?? "last";
        
        return field.Source switch
        {
            FieldSource.CustomField => $"{agg}(({columnExpr})::numeric) AS {field.FieldName}",
            _ => $"{agg}({columnExpr}) AS {field.FieldName}"
        };
    }
    
    private QueryResult TransformResults(IEnumerable<dynamic> results, List<ResolvedField> fields)
    {
        return new QueryResult
        {
            Fields = fields.Select(f => new FieldInfo
            {
                Name = f.FriendlyName,  // Use friendly name in response
                OriginalName = f.FieldName,
                DataType = f.DataType.ToString(),
                Unit = f.Unit
            }).ToList(),
            Data = results.Select(r => TransformRow(r, fields)).ToList()
        };
    }
}
```

### 4. Query Controller

```csharp
// Query.API/Controllers/QueryController.cs
[ApiController]
[Route("api/query")]
public class QueryController : ControllerBase
{
    private readonly IQueryService _queryService;
    
    [HttpPost]
    public async Task<ActionResult<QueryResult>> ExecuteQuery([FromBody] QueryRequest request)
    {
        try
        {
            var result = await _queryService.ExecuteQueryAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Query execution failed");
            return StatusCode(500, new { message = "Query execution failed" });
        }
    }
}
```

## Example Usage

### Request with Friendly Names

```json
POST /api/query
{
  "deviceTypeId": "guid-here",
  "fields": ["Battery Percentage", "Ambient Temperature", "Location"],
  "startTime": "2025-12-09T00:00:00Z",
  "endTime": "2025-12-10T00:00:00Z",
  "aggregation": "avg",
  "interval": "1h"
}
```

### Field Resolution

```
Battery Percentage  → battery_level (System)
Ambient Temperature → custom_fields->'temperature' (CustomField)
Location            → custom_fields->'location' (CustomField)
```

### Generated SQL

```sql
SELECT 
    time_bucket('1 hour', timestamp) AS time,
    avg(battery_level) AS battery_level,
    avg((custom_fields->'temperature')::numeric) AS temperature,
    last((custom_fields->'location')::text) AS location
FROM telemetry_data
WHERE device_type_id = $1
  AND timestamp >= $2
  AND timestamp <= $3
GROUP BY time
ORDER BY time DESC
```

### Response with Friendly Names

```json
{
  "fields": [
    {
      "name": "Battery Percentage",
      "originalName": "battery_level",
      "dataType": "Number",
      "unit": "%"
    },
    {
      "name": "Ambient Temperature",
      "originalName": "temperature",
      "dataType": "Number",
      "unit": "°C"
    }
  ],
  "data": [
    {
      "time": "2025-12-10T00:00:00Z",
      "Battery Percentage": 85.5,
      "Ambient Temperature": 22.3,
      "Location": "Warehouse A"
    }
  ]
}
```

## Dashboard Widget Integration

```typescript
// Dashboard designer - Widget configuration
const widget = {
  type: 'line-chart',
  deviceTypeId: 'guid-here',
  fields: ['Battery Percentage', 'Signal Strength'],  // User-friendly names
  aggregation: 'avg',
  interval: '15m',
  timeRange: '24h'
};

// Frontend sends query with friendly names
const queryRequest = {
  deviceTypeId: widget.deviceTypeId,
  fields: widget.fields,
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date().toISOString(),
  aggregation: widget.aggregation,
  interval: widget.interval
};

const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(queryRequest)
});

const data = await response.json();

// Chart displays using friendly names
chart.xAxis.title = 'Time';
chart.series = data.fields.map(field => ({
  name: field.name,  // "Battery Percentage"
  data: data.data.map(row => ({
    x: row.time,
    y: row[field.name]
  })),
  unit: field.unit  // "%"
}));
```

## Benefits

1. **User-Friendly**: Users query with "Battery Percentage" instead of "battery_level"
2. **Flexible**: Works with schema fields, custom fields, and system fields
3. **Consistent**: Same naming across Device API, Query API, and Dashboard
4. **Maintainable**: Field mappings updated in one place (Device.API)
5. **Type-Safe**: Query API validates field existence via mappings
6. **Performance**: Field mappings cached by device type ID

## Caching Strategy

```csharp
public class CachedFieldMappingResolver : IFieldMappingResolver
{
    private readonly IFieldMappingResolver _inner;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(15);
    
    public async Task<List<ResolvedField>> ResolveFieldsAsync(Guid deviceTypeId, List<string> fields)
    {
        var cacheKey = $"field-mappings:{deviceTypeId}";
        
        if (!_cache.TryGetValue(cacheKey, out List<FieldMapping>? mappings))
        {
            // Fetch from Device.API
            var allFields = await _inner.ResolveFieldsAsync(deviceTypeId, fields);
            
            // Cache for 15 minutes
            _cache.Set(cacheKey, allFields, _cacheExpiration);
            
            return allFields;
        }
        
        return ResolveFromCache(mappings, fields);
    }
}
```

## Error Handling

```csharp
// Unknown field
if (mapping == null)
{
    throw new ArgumentException(
        $"Field '{field}' not found for device type {deviceTypeId}. " +
        "Available fields: " + string.Join(", ", fieldMappings.Select(f => f.FriendlyName))
    );
}

// Non-queryable field
if (!mapping.IsQueryable)
{
    throw new ArgumentException(
        $"Field '{field}' is not queryable. Mark it as queryable in device type settings."
    );
}
```

## Testing

```csharp
[Fact]
public async Task ResolveFields_WithFriendlyNames_ReturnsCorrectMapping()
{
    // Arrange
    var deviceTypeId = Guid.NewGuid();
    var fields = new List<string> { "Battery Percentage", "Temperature" };
    
    // Act
    var resolved = await _resolver.ResolveFieldsAsync(deviceTypeId, fields);
    
    // Assert
    Assert.Equal(2, resolved.Count);
    Assert.Equal("battery_level", resolved[0].FieldName);
    Assert.Equal(FieldSource.System, resolved[0].Source);
    Assert.Equal("temperature", resolved[1].FieldName);
}
```
