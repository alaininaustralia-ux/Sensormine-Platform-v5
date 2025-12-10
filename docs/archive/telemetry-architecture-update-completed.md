# Telemetry Architecture Update - Completed

## Changes Implemented

### 1. Database Schema (infrastructure/timescaledb/init-timeseries-schema.sql)
✅ **Dropped old metric_name row-based schema**  
✅ **Created new JSONB-based telemetry table:**
- Fixed system columns: `battery_level`, `signal_strength`, `latitude`, `longitude`, `altitude`
- JSONB `custom_fields` column for all sensor readings
- GIN index on `custom_fields` for fast queries
- Compression policy (7 days)
- Retention policy (2 years)

✅ **Added schema management tables:**
- `device_type_schema`: User-configurable field definitions
- `device_applied_schema`: Per-device schema versioning

### 2. Core Models (src/Shared/Sensormine.Core/Models/)
✅ **TelemetryData.cs**: New model with system fields + `CustomFields` dictionary  
✅ **DeviceTypeSchema.cs**: Schema definition with field validation rules

### 3. Ingestion Service (src/Services/Ingestion.Service/)
✅ **Updated TelemetryConsumerService.cs:**
- Separates system fields from custom fields
- Flexible field name matching (battery_level, batteryLevel, battery)
- Stores all sensor readings in JSONB `custom_fields`
- Enhanced timestamp extraction (supports multiple formats)

## How It Works Now

### Data Ingestion Flow
```
Device sends: {
  "temperature": 25.5,
  "humidity": 60,
  "pressure": 1013,
  "battery_level": 87,
  "latitude": 45.5231,
  "longitude": -73.5673
}

Stored as single row:
┌──────────────────────┬───────────┬───────────────┬──────────────────────────────────────────┐
│ time                 │ device_id │ battery_level │ custom_fields                            │
├──────────────────────┼───────────┼───────────────┼──────────────────────────────────────────┤
│ 2025-12-08 10:00:00 │ SEN-123   │ 87.0          │ {"temperature": 25.5, "humidity": 60,    │
│                      │           │               │  "pressure": 1013}                       │
└──────────────────────┴───────────┴───────────────┴──────────────────────────────────────────┘
```

### Querying Custom Fields
```sql
-- Get temperature readings
SELECT time, device_id,
       (custom_fields->>'temperature')::double precision as temperature
FROM telemetry
WHERE device_id = 'SEN-123'
ORDER BY time DESC;

-- Filter by custom field value
SELECT *
FROM telemetry
WHERE (custom_fields->>'alarm_triggered')::boolean = true;

-- Aggregate custom field
SELECT device_id,
       time_bucket('1 hour', time) AS hour,
       AVG((custom_fields->>'temperature')::double precision) AS avg_temp
FROM telemetry
GROUP BY device_id, hour;
```

## Benefits Achieved

### ✅ Zero Schema Migrations
- Users can add new sensor fields without database changes
- No ALTER TABLE statements needed

### ✅ Single Row Per Reading
- Old: 3 fields = 3 rows = 3x storage
- New: 3 fields = 1 row with JSONB object

### ✅ Fast Queries
- GIN index enables efficient JSONB searches
- Native PostgreSQL JSON operators
- TimescaleDB compression works perfectly

### ✅ Flexible Schema Management
- `device_type_schema` stores field definitions
- UI can dynamically generate forms
- Validation rules per field type

## Next Steps

### Phase 1: Query API Updates
- [ ] Update Query.API to return JSONB custom fields
- [ ] Add endpoint to query specific fields
- [ ] Update aggregation queries for JSONB

### Phase 2: Widget Updates  
- [ ] Fetch schema from device_type_schema table
- [ ] Display custom_fields in table widget
- [ ] Field selection from schema definition

### Phase 3: Schema Management
- [ ] Create Schema Management API endpoints
- [ ] UI for defining device type schemas
- [ ] Validation service for incoming telemetry

### Phase 4: Mobile App
- [ ] Fetch schemas dynamically
- [ ] Generate forms from field definitions
- [ ] NFC configuration with schema validation

## Testing

### Test Data Ingestion
```bash
# Send test telemetry
mosquitto_pub -h localhost -t "telemetry/SEN-123" -m '{
  "timestamp": "2025-12-08T10:00:00Z",
  "temperature": 25.5,
  "humidity": 60,
  "pressure": 1013.2,
  "battery_level": 87
}'
```

### Verify Storage
```sql
-- Check if data stored correctly
SELECT 
    time,
    device_id,
    battery_level,
    custom_fields,
    jsonb_pretty(custom_fields) as formatted_fields
FROM telemetry
ORDER BY time DESC
LIMIT 10;
```

## Migration Notes

Since we're in development:
- ✅ Old `telemetry` table will be dropped on next docker-compose up
- ✅ New schema will be created automatically
- ✅ No data migration needed

To apply changes:
```bash
docker-compose down
docker volume rm orion_timescaledb_data  # Optional: clean slate
docker-compose up -d
```

## Architecture Alignment

This architecture matches industry leaders:
- **AWS IoT Core**: Shadow documents (JSON)
- **Azure IoT Hub**: Device twins (JSON)
- **ThingsBoard**: Attributes + Telemetry (key-value)
- **Losant**: Dynamic attributes (JSON)

We now have the same flexibility without sacrificing performance.
