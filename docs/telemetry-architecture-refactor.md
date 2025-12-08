# Telemetry Architecture Refactor Plan

## Overview
Migrate from fixed schema with metric_name rows to JSONB-based flexible schema architecture.

## Current Architecture Issues
1. **Performance**: Each sensor field = separate row (3 fields = 3 rows per timestamp)
2. **Inflexibility**: Adding fields requires coordinating across all layers
3. **Query Complexity**: Must pivot metric_name rows to get multi-field view
4. **Schema Management**: No centralized schema definition

## New Architecture Benefits
✅ Zero database migrations for new fields  
✅ User-configurable schemas per device type  
✅ Fast querying with JSONB + GIN indexes  
✅ Full TimescaleDB compression support  
✅ Clean separation of system vs. custom fields  

---

## Phase 1: Database Schema Changes

### 1.1 New Telemetry Table
```sql
-- File: infrastructure/timescaledb/init-timeseries-schema-v2.sql

CREATE TABLE telemetry_v2 (
    time           TIMESTAMPTZ NOT NULL,
    device_id      TEXT        NOT NULL,
    tenant_id      UUID        NOT NULL,
    device_type    TEXT        NOT NULL,

    -- Static system-level fields (always present)
    battery_level  DOUBLE PRECISION,
    signal_strength DOUBLE PRECISION,
    latitude       DOUBLE PRECISION,
    longitude      DOUBLE PRECISION,
    altitude       DOUBLE PRECISION,

    -- All user-configurable sensor fields
    custom_fields  JSONB NOT NULL,

    -- Metadata
    quality        JSONB,  -- Data quality indicators
    
    PRIMARY KEY (device_id, time)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('telemetry_v2', 'time', if_not_exists => TRUE);

-- Create indexes for performance
CREATE INDEX idx_telemetry_v2_device_time ON telemetry_v2 (device_id, time DESC);
CREATE INDEX idx_telemetry_v2_tenant_time ON telemetry_v2 (tenant_id, time DESC);
CREATE INDEX idx_telemetry_v2_type_time ON telemetry_v2 (device_type, time DESC);

-- GIN index for JSONB queries (critical for performance)
CREATE INDEX idx_telemetry_v2_custom_fields ON telemetry_v2 USING GIN (custom_fields);

-- Enable compression (retain raw data for 7 days, compress older)
ALTER TABLE telemetry_v2 SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('telemetry_v2', INTERVAL '7 days');

-- Retention policy (keep data for 2 years)
SELECT add_retention_policy('telemetry_v2', INTERVAL '2 years');
```

### 1.2 Device Type Schema Table
```sql
CREATE TABLE device_type_schema (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    device_type    TEXT NOT NULL,
    version        INT NOT NULL DEFAULT 1,
    schema_json    JSONB NOT NULL,  -- JSON Schema format
    description    TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    created_by     TEXT,
    
    UNIQUE(tenant_id, device_type, version)
);

CREATE INDEX idx_device_type_schema_tenant ON device_type_schema (tenant_id, device_type);
CREATE INDEX idx_device_type_schema_active ON device_type_schema (tenant_id, device_type, is_active);

-- Example schema format:
/*
{
  "version": "1.0",
  "fields": {
    "temperature": {
      "type": "number",
      "unit": "°C",
      "min": -40,
      "max": 85,
      "required": true
    },
    "humidity": {
      "type": "number",
      "unit": "%",
      "min": 0,
      "max": 100
    },
    "pressure": {
      "type": "number",
      "unit": "hPa"
    },
    "alarm_triggered": {
      "type": "boolean"
    },
    "site_name": {
      "type": "string",
      "maxLength": 100
    }
  },
  "systemFields": ["battery_level", "latitude", "longitude"]
}
*/
```

### 1.3 Device Applied Schema Table
```sql
CREATE TABLE device_applied_schema (
    device_id      TEXT PRIMARY KEY,
    tenant_id      UUID NOT NULL,
    device_type    TEXT NOT NULL,
    schema_version INT NOT NULL,
    applied_schema JSONB NOT NULL,  -- The actual schema in use
    config_json    JSONB,           -- Device-specific overrides
    updated_at     TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (tenant_id, device_type, schema_version) 
        REFERENCES device_type_schema(tenant_id, device_type, version)
);

CREATE INDEX idx_device_applied_schema_tenant ON device_applied_schema (tenant_id);
CREATE INDEX idx_device_applied_schema_type ON device_applied_schema (device_type);
```

---

## Phase 2: Core Model Updates

### 2.1 Update Sensormine.Core Models
```csharp
// File: src/Shared/Sensormine.Core/Models/TelemetryDataV2.cs

namespace Sensormine.Core.Models;

public class TelemetryDataV2
{
    public DateTimeOffset Time { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    
    // System fields
    public double? BatteryLevel { get; set; }
    public double? SignalStrength { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? Altitude { get; set; }
    
    // All custom sensor fields
    public Dictionary<string, object> CustomFields { get; set; } = new();
    
    // Quality indicators
    public Dictionary<string, string>? Quality { get; set; }
}

// File: src/Shared/Sensormine.Core/Models/DeviceTypeSchema.cs

public class DeviceTypeSchema
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public SchemaDefinition Schema { get; set; } = new();
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class SchemaDefinition
{
    public string Version { get; set; } = "1.0";
    public Dictionary<string, FieldDefinition> Fields { get; set; } = new();
    public List<string> SystemFields { get; set; } = new();
}

public class FieldDefinition
{
    public string Type { get; set; } = "string"; // number, string, boolean, object, array
    public string? Unit { get; set; }
    public double? Min { get; set; }
    public double? Max { get; set; }
    public bool Required { get; set; }
    public int? MaxLength { get; set; }
    public string? Pattern { get; set; }
    public List<string>? Enum { get; set; }
}
```

---

## Phase 3: Ingestion Service Updates

### 3.1 Update TelemetryConsumerService
```csharp
// File: src/Services/Ingestion.Service/Services/TelemetryConsumerServiceV2.cs

public class TelemetryConsumerServiceV2 : BackgroundService
{
    private async Task ProcessMessage(string deviceId, string payload, CancellationToken cancellationToken)
    {
        // 1. Parse payload
        var telemetryData = JsonSerializer.Deserialize<Dictionary<string, object>>(payload);
        
        // 2. Get device metadata (includes device type and schema version)
        var deviceMetadata = await _deviceRepository.GetMetadataAsync(deviceId);
        
        // 3. Get device type schema for validation
        var schema = await _schemaRepository.GetActiveSchemaAsync(
            deviceMetadata.TenantId, 
            deviceMetadata.DeviceType
        );
        
        // 4. Validate payload against schema
        var validationResult = ValidatePayload(telemetryData, schema);
        if (!validationResult.IsValid)
        {
            await SendToDlq(deviceId, payload, validationResult.Errors);
            return;
        }
        
        // 5. Separate system fields from custom fields
        var telemetry = new TelemetryDataV2
        {
            Time = ExtractTimestamp(telemetryData),
            DeviceId = deviceId,
            TenantId = deviceMetadata.TenantId,
            DeviceType = deviceMetadata.DeviceType,
            
            // Extract known system fields
            BatteryLevel = ExtractDouble(telemetryData, "battery_level"),
            SignalStrength = ExtractDouble(telemetryData, "signal_strength"),
            Latitude = ExtractDouble(telemetryData, "latitude"),
            Longitude = ExtractDouble(telemetryData, "longitude"),
            Altitude = ExtractDouble(telemetryData, "altitude"),
            
            // Everything else goes into custom_fields
            CustomFields = ExtractCustomFields(telemetryData, schema.SystemFields)
        };
        
        // 6. Write to TimescaleDB
        await _timeSeriesRepository.WriteAsync("telemetry_v2", telemetry, cancellationToken);
    }
    
    private Dictionary<string, object> ExtractCustomFields(
        Dictionary<string, object> payload, 
        List<string> systemFields)
    {
        var customFields = new Dictionary<string, object>();
        var excludeFields = new HashSet<string>(systemFields) 
        { 
            "timestamp", "time", "device_id", "deviceId" 
        };
        
        foreach (var kvp in payload)
        {
            if (!excludeFields.Contains(kvp.Key))
            {
                customFields[kvp.Key] = kvp.Value;
            }
        }
        
        return customFields;
    }
}
```

---

## Phase 4: Query API Updates

### 4.1 New Query Models
```csharp
// File: src/Services/Query.API/Models/QueryModelsV2.cs

public class TelemetryQueryRequest
{
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string? DeviceId { get; set; }
    public string? DeviceType { get; set; }
    
    // Query specific custom fields
    public List<string>? Fields { get; set; }
    
    // Filter by custom field values
    public Dictionary<string, object>? FieldFilters { get; set; }
    
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
}

public class TelemetryQueryResponse
{
    public List<TelemetryDataPoint> Data { get; set; } = new();
    public PaginationMetadata Pagination { get; set; } = new();
}

public class TelemetryDataPoint
{
    public DateTimeOffset Time { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public Dictionary<string, object> Fields { get; set; } = new();
}
```

### 4.2 Updated Query Controller
```csharp
// File: src/Services/Query.API/Controllers/TelemetryController.cs

[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    [HttpPost("query")]
    public async Task<IActionResult> QueryTelemetry(
        [FromBody] TelemetryQueryRequest request)
    {
        // Build SQL with JSONB field extraction
        var sql = BuildTelemetryQuery(request);
        var results = await _repository.QueryAsync(sql);
        
        return Ok(new TelemetryQueryResponse { Data = results });
    }
    
    private string BuildTelemetryQuery(TelemetryQueryRequest request)
    {
        var sb = new StringBuilder();
        sb.Append("SELECT time, device_id, device_type, ");
        sb.Append("battery_level, latitude, longitude, ");
        
        // Extract requested custom fields
        if (request.Fields?.Any() == true)
        {
            foreach (var field in request.Fields)
            {
                sb.Append($"custom_fields->'{field}' as {field}, ");
            }
        }
        else
        {
            sb.Append("custom_fields, ");
        }
        
        sb.Append("FROM telemetry_v2 WHERE time >= @startTime AND time <= @endTime ");
        
        if (!string.IsNullOrEmpty(request.DeviceId))
            sb.Append("AND device_id = @deviceId ");
            
        // Filter by custom field values
        if (request.FieldFilters?.Any() == true)
        {
            foreach (var filter in request.FieldFilters)
            {
                sb.Append($"AND custom_fields->>'{filter.Key}' = @{filter.Key} ");
            }
        }
        
        sb.Append("ORDER BY time DESC LIMIT @limit OFFSET @offset");
        
        return sb.ToString();
    }
}
```

---

## Phase 5: Widget Updates

### 5.1 Update Widget Data Fetching
```typescript
// File: src/Web/sensormine-web/src/lib/api/widget-data.ts

export async function fetchDeviceTypeTelemetry(
  deviceTypeId: string,
  fields: string[],
  timeRange: { start: Date; end: Date }
): Promise<TelemetryDataPoint[]> {
  const response = await queryApiClient.post('/api/Telemetry/query', {
    deviceType: deviceTypeId,
    startTime: timeRange.start.toISOString(),
    endTime: timeRange.end.toISOString(),
    fields: fields, // Request specific fields only
  });
  
  return response.data;
}

// Pivot data for table display
export function pivotTelemetryData(
  data: TelemetryDataPoint[],
  fields: string[]
): TableRow[] {
  return data.map(point => ({
    timestamp: point.time,
    deviceId: point.deviceId,
    ...point.fields, // Custom fields are already in object form
  }));
}
```

---

## Phase 6: Migration Strategy

### 6.1 Data Migration Script
```sql
-- File: infrastructure/timescaledb/migrate-to-v2.sql

-- Migrate existing telemetry data to new structure
INSERT INTO telemetry_v2 (time, device_id, tenant_id, device_type, custom_fields)
SELECT 
    time,
    device_id,
    tenant_id,
    device_type,
    jsonb_object_agg(metric_name, value) as custom_fields
FROM telemetry
GROUP BY time, device_id, tenant_id, device_type;

-- Update system fields if they exist
UPDATE telemetry_v2 t
SET 
    battery_level = (custom_fields->>'battery_level')::double precision,
    latitude = (custom_fields->>'latitude')::double precision,
    longitude = (custom_fields->>'longitude')::double precision
WHERE custom_fields ? 'battery_level' 
   OR custom_fields ? 'latitude' 
   OR custom_fields ? 'longitude';

-- Remove system fields from custom_fields
UPDATE telemetry_v2
SET custom_fields = custom_fields - 'battery_level' - 'latitude' - 'longitude';
```

### 6.2 Rollout Plan
1. **Week 1**: Deploy new tables alongside existing tables
2. **Week 2**: Update Ingestion Service to write to BOTH tables (dual-write)
3. **Week 3**: Update Query API to read from new table
4. **Week 4**: Run migration script for historical data
5. **Week 5**: Switch all services to new tables
6. **Week 6**: Monitor and validate
7. **Week 7**: Deprecate old telemetry table

---

## Phase 7: Continuous Aggregates

### 7.1 Dynamic Aggregate Creation
```sql
-- Create continuous aggregate for specific field
-- This can be done programmatically when user adds a field

CREATE MATERIALIZED VIEW telemetry_temperature_hourly
WITH (timescaledb.continuous) AS
SELECT
    device_id,
    time_bucket('1 hour', time) AS bucket,
    AVG((custom_fields->>'temperature')::double precision) AS avg_temperature,
    MIN((custom_fields->>'temperature')::double precision) AS min_temperature,
    MAX((custom_fields->>'temperature')::double precision) AS max_temperature,
    COUNT(*) as count
FROM telemetry_v2
WHERE custom_fields ? 'temperature'
GROUP BY device_id, bucket;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('telemetry_temperature_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

---

## Summary of Changes

### Backend Services
- ✅ New telemetry_v2 table with JSONB custom_fields
- ✅ device_type_schema table for flexible schema management
- ✅ Updated Ingestion.Service for schema validation
- ✅ Updated Query.API with JSONB querying
- ✅ Schema validation layer

### Frontend
- ✅ Updated widget field extraction (from schema + custom fields)
- ✅ JSONB-aware data fetching
- ✅ No more pivoting required (data already in object form)

### Performance
- ✅ Single row per timestamp (vs. multiple rows per metric)
- ✅ GIN indexes for fast JSONB queries
- ✅ Compression-friendly structure
- ✅ Continuous aggregates support

### Flexibility
- ✅ Zero migrations for new fields
- ✅ User-configurable schemas
- ✅ Per-device schema versioning
- ✅ Dynamic UI generation

---

## Next Steps
1. Review and approve this architecture
2. Create database migration scripts
3. Update core models in Sensormine.Core
4. Update Ingestion.Service
5. Update Query.API
6. Update frontend widgets
7. Test with sample data
8. Execute migration plan
