# Query and Database Tier Support Analysis

## Current State Assessment (December 7, 2025)

### ✅ What IS Currently Supported

#### 1. **Aggregation Functions** (Fully Supported)
The database tier supports all required aggregation methods:
- ✅ **avg/average** - Mean value
- ✅ **sum** - Total
- ✅ **min** - Minimum
- ✅ **max** - Maximum
- ✅ **count** - Count of data points
- ✅ **first** - First value (TimescaleDB-specific)
- ✅ **last** - Last value (TimescaleDB-specific)

**Location**: `TimeSeriesQueryBuilder.GetSqlAggregateFunction()`

#### 2. **Time Bucketing** (Fully Supported)
- ✅ Time interval grouping: seconds, minutes, hours, days
- ✅ Auto-parsing of interval strings (`"5m"`, `"1h"`, `"1d"`)
- ✅ TimescaleDB `time_bucket()` function integration

**Location**: `TimeSeriesQueryBuilder.BuildAggregateQuery()`, `WidgetDataController.ParseInterval()`

#### 3. **Data Query Endpoints** (3/3)
- ✅ **/api/widgetdata/realtime** - Latest values (last hour)
- ✅ **/api/widgetdata/historical** - Time-range queries
- ✅ **/api/widgetdata/aggregated** - Aggregated time-series with bucketing

**Location**: `Query.API/Controllers/WidgetDataController.cs`

#### 4. **Field Selection**
- ✅ Comma-separated field names supported
- ✅ Multiple fields can be queried
- ✅ Device ID filtering

#### 5. **Grouping Support**
- ✅ Group by time intervals
- ✅ Group by deviceId
- ✅ Group by tags

---

### ⚠️ Gaps and Enhancements Needed

#### 1. **Multi-Field Aggregation** (Partial Support)
**Current State**: Can query multiple fields, but aggregation endpoint only returns one field at a time

**What's Needed for Widget Requirements**:
```csharp
// Current: Returns single field
GET /api/widgetdata/aggregated?fields=temperature&aggregation=avg

// Needed: Return multiple fields simultaneously
GET /api/widgetdata/aggregated?fields=temperature,humidity,pressure&aggregation=avg

// Should return:
{
  "series": [
    { "field": "temperature", "dataPoints": [...] },
    { "field": "humidity", "dataPoints": [...] },
    { "field": "pressure", "dataPoints": [...] }
  ]
}
```

**Impact**: Chart widgets need this for multi-series display

#### 2. **Percentile Aggregations** (Not Supported)
**Current State**: No support for percentile calculations

**What's Needed**:
- P50 (median)
- P90, P95, P99 for performance monitoring
- TimescaleDB has `percentile_cont()` and `percentile_disc()` functions

**Enhancement**:
```csharp
// Add to GetSqlAggregateFunction:
"p50" or "median" => "percentile_cont(0.5) WITHIN GROUP (ORDER BY {field})",
"p90" => "percentile_cont(0.9) WITHIN GROUP (ORDER BY {field})",
"p95" => "percentile_cont(0.95) WITHIN GROUP (ORDER BY {field})",
"p99" => "percentile_cont(0.99) WITHIN GROUP (ORDER BY {field})",
```

#### 3. **Trend Comparison** (Not Supported)
**Current State**: No built-in support for period-over-period comparison

**What's Needed for KPI Widgets**:
```csharp
GET /api/widgetdata/kpi?field=temperature&aggregation=avg&compareToP previous

// Should return:
{
  "current": { "value": 23.5, "period": "2025-12-07 09:00 - 10:00" },
  "previous": { "value": 22.1, "period": "2025-12-07 08:00 - 09:00" },
  "change": 1.4,
  "percentChange": 6.3
}
```

**Implementation Approach**:
- Execute two queries (current period + comparison period)
- Calculate delta and percentage change
- New endpoint: `/api/widgetdata/kpi` or extend existing with `?includeTrend=true`

#### 4. **Geospatial Queries** (Not Supported)
**Current State**: Database has tags support but no geospatial query functions

**What's Needed for Map Widgets**:
- Store lat/lng in structured format (currently in tags as strings)
- Bounding box queries
- Distance-based filtering
- Clustering aggregation

**Database Enhancement**:
```sql
-- Add geometry column to telemetry table
ALTER TABLE telemetry ADD COLUMN location geography(POINT,4326);

-- Create spatial index
CREATE INDEX idx_telemetry_location ON telemetry USING GIST (location);

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
```

**API Enhancement**:
```csharp
GET /api/widgetdata/geo?bounds=lat1,lng1,lat2,lng2&fields=temperature
GET /api/widgetdata/geo?center=lat,lng&radius=1000&fields=temperature
```

#### 5. **Categorical Grouping** (Not Supported)
**Current State**: Can group by tags, but no dedicated categorical aggregation

**What's Needed for Pie/Bar Charts**:
```csharp
GET /api/widgetdata/categorical?groupBy=deviceType&valueField=count&aggregation=sum

// Should return:
{
  "categories": [
    { "name": "Temperature Sensor", "value": 45 },
    { "name": "Humidity Sensor", "value": 32 },
    { "name": "Pressure Sensor", "value": 18 }
  ]
}
```

#### 6. **Device List Query** (Fully Supported via Device API)
**Current State**: Device API handles this separately
- ✅ `/api/Device` returns paginated device list
- ✅ Filtering by status, type, location
- ✅ No additional query tier needed

#### 7. **Query Response Caching** (Not Implemented)
**Current State**: No caching layer

**What's Needed**:
- Redis cache for frequently accessed aggregations
- Cache key based on query parameters
- TTL based on data freshness requirements
- Cache invalidation on new data ingestion

---

## Implementation Priority

### Phase 1: Essential for Current Widgets (High Priority)
1. **Multi-field aggregation in single request** ⭐
   - Required for Chart widgets to display multiple series
   - Estimate: 2-4 hours
   
2. **Trend comparison for KPI widgets** ⭐
   - Required for KPI card trend indicators
   - Estimate: 4-6 hours

### Phase 2: Enhanced Analytics (Medium Priority)
3. **Percentile aggregations**
   - Useful for performance monitoring
   - Estimate: 2-3 hours

4. **Categorical grouping endpoint**
   - Required for future Pie/Bar chart widgets
   - Estimate: 3-4 hours

### Phase 3: Advanced Features (Lower Priority)
5. **Geospatial queries with PostGIS**
   - Required for Map widget clustering/heatmaps
   - Estimate: 8-12 hours (includes schema migration)

6. **Query result caching**
   - Performance optimization
   - Estimate: 4-6 hours

---

## Recommended Immediate Actions

### 1. Enhance Aggregated Endpoint for Multi-Field Support

**File**: `src/Services/Query.API/Controllers/WidgetDataController.cs`

```csharp
[HttpGet("aggregated")]
public async Task<IActionResult> GetAggregated(
    [FromQuery] string fields,  // "temperature,humidity,pressure"
    [FromQuery] string startTime,
    [FromQuery] string endTime,
    [FromQuery] string aggregation = "avg",
    [FromQuery] string? interval = "5m",
    [FromQuery] string? deviceIds = null,
    CancellationToken cancellationToken = default)
{
    var fieldList = fields.Split(',', StringSplitOptions.RemoveEmptyEntries);
    var series = new List<AggregatedSeries>();
    
    // Query each field separately (parallel if needed)
    foreach (var field in fieldList)
    {
        var query = new AggregateQuery { /* ... */ };
        var result = await _repository.QueryAggregateAsync<AggregatedDataPointResponse>(
            DefaultMeasurement, query, cancellationToken);
        
        series.Add(new AggregatedSeries
        {
            Field = field,
            DataPoints = result.Select(d => new AggregatedDataPoint
            {
                Timestamp = d.Timestamp ?? DateTimeOffset.UtcNow,
                Value = d.Value ?? 0m,
                Count = d.Count
            }).ToList()
        });
    }
    
    return Ok(new AggregatedWidgetDataResponse
    {
        Series = series,
        // ... other properties
    });
}
```

### 2. Add KPI Endpoint with Trend Support

**New File**: `src/Services/Query.API/Controllers/KpiDataController.cs`

```csharp
[ApiController]
[Route("api/kpidata")]
public class KpiDataController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetKpiWithTrend(
        [FromQuery] string field,
        [FromQuery] string aggregation = "avg",
        [FromQuery] int periodHours = 24,
        [FromQuery] bool includeTrend = true,
        [FromQuery] string? deviceIds = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var currentStart = now.AddHours(-periodHours);
        
        // Query current period
        var currentQuery = new AggregateQuery
        {
            StartTime = currentStart,
            EndTime = now,
            AggregateFunction = aggregation,
            // ... filters
        };
        var currentResult = await QuerySingleValue(currentQuery, field, cancellationToken);
        
        var response = new KpiDataResponse
        {
            CurrentValue = currentResult.Value,
            CurrentPeriod = new TimeRangeInfo { Start = currentStart, End = now }
        };
        
        if (includeTrend)
        {
            // Query previous period
            var previousStart = currentStart.AddHours(-periodHours);
            var previousQuery = new AggregateQuery
            {
                StartTime = previousStart,
                EndTime = currentStart,
                AggregateFunction = aggregation,
                // ... filters
            };
            var previousResult = await QuerySingleValue(previousQuery, field, cancellationToken);
            
            response.PreviousValue = previousResult.Value;
            response.PreviousPeriod = new TimeRangeInfo { Start = previousStart, End = currentStart };
            response.Change = currentResult.Value - previousResult.Value;
            response.PercentChange = previousResult.Value != 0 
                ? (response.Change / previousResult.Value) * 100 
                : 0;
        }
        
        return Ok(response);
    }
}

public class KpiDataResponse
{
    public decimal CurrentValue { get; set; }
    public TimeRangeInfo CurrentPeriod { get; set; }
    public decimal? PreviousValue { get; set; }
    public TimeRangeInfo? PreviousPeriod { get; set; }
    public decimal? Change { get; set; }
    public decimal? PercentChange { get; set; }
}
```

---

## Database Schema Status

### Current Schema (Narrow Format - ✅ Good)
```sql
CREATE TABLE telemetry (
    time TIMESTAMPTZ NOT NULL,
    device_id TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    metric_name TEXT NOT NULL,  -- "temperature", "humidity", etc.
    value NUMERIC,
    unit TEXT,
    tags JSONB,
    metadata JSONB
);

CREATE INDEX idx_telemetry_time ON telemetry (time DESC);
CREATE INDEX idx_telemetry_device_time ON telemetry (device_id, time DESC);
CREATE INDEX idx_telemetry_metric ON telemetry (metric_name);
```

**Strengths**:
- ✅ Supports flexible field names (any metric via metric_name)
- ✅ Efficient time-series indexing
- ✅ TimescaleDB hypertable ready
- ✅ Multi-tenancy support

**Limitations**:
- ⚠️ No geospatial column (lat/lng in tags as strings)
- ⚠️ Querying multiple metrics requires multiple rows/queries

### Recommended Schema Enhancement

```sql
-- Add geospatial support
ALTER TABLE telemetry ADD COLUMN location geography(POINT,4326);
CREATE INDEX idx_telemetry_location ON telemetry USING GIST (location);

-- Add GIN index for faster tag queries
CREATE INDEX idx_telemetry_tags ON telemetry USING GIN (tags);

-- Consider adding materialized views for common aggregations
CREATE MATERIALIZED VIEW daily_device_stats AS
SELECT 
    date_trunc('day', time) as day,
    device_id,
    metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as count
FROM telemetry
GROUP BY date_trunc('day', time), device_id, metric_name;

CREATE UNIQUE INDEX ON daily_device_stats (day, device_id, metric_name);
```

---

## Conclusion

### ✅ **Good News**
The current query and database tier provides **solid foundation** for most widget requirements:
- All basic aggregation functions supported
- Time bucketing works well
- Multi-field queries possible (just need API enhancement)
- Database schema is flexible and scalable

### 🔧 **Immediate Work Needed** (4-8 hours)
1. Update aggregated endpoint to return multiple fields in one request
2. Add KPI endpoint with trend comparison
3. Test with frontend widget field configurations

### 📋 **Future Enhancements** (Phase 2-3)
4. Percentile aggregations
5. Categorical grouping endpoint
6. Geospatial queries (PostGIS)
7. Query result caching

### 💡 **Recommendation**
The current implementation **can support** the widget field configurations created in the frontend. The main gap is **multi-field aggregation in single request** which is straightforward to add. The database tier is well-architected and ready to scale with future requirements.

**Next Step**: Implement Phase 1 enhancements (multi-field + trend comparison) to fully support all current widget types.
