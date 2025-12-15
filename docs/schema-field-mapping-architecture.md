# Schema & Field Mapping Architecture

**Last Updated:** December 12, 2025  
**Status:** Design Documentation & Implementation Verification

---

## 🎯 Overview

The Sensormine Platform uses a **schema-driven approach** where device types define the structure of telemetry payloads, and field mappings provide human-readable names and query paths for extracting data from JSONB storage.

---

## 🏗️ Architecture Components

### 1. JSON Schema (Schema Registry)
**Purpose:** Defines the structure and validation rules for device telemetry payloads

**Storage:** `sensormine_metadata.schemas` table

**Example:**
```json
{
  "type": "object",
  "properties": {
    "temperature": {"type": "number"},
    "humidity": {"type": "number"},
    "pressure": {"type": "number"},
    "timestamp": {"type": "string", "format": "date-time"}
  },
  "required": ["temperature", "timestamp"]
}
```

### 2. Field Mappings (Device Type)
**Purpose:** Maps schema fields to human-readable names and defines query paths

**Storage:** `sensormine_metadata.field_mappings` table

**Example:**
```json
{
  "id": "uuid",
  "deviceTypeId": "uuid",
  "fieldName": "temperature",
  "fieldSource": "Schema",
  "friendlyName": "Temperature (°C)",
  "description": "Ambient temperature reading",
  "unit": "°C",
  "dataType": "Float",
  "jsonPath": "$.temperature",
  "isQueryable": true,
  "isVisible": true
}
```

### 3. Telemetry Storage (TimescaleDB)
**Purpose:** Stores raw telemetry data as JSONB for flexible schema

**Storage:** `sensormine_timeseries.telemetry` table

**Schema:**
```sql
CREATE TABLE telemetry (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(255) NOT NULL,  -- Hardware ID (e.g., "DEV-039")
    tenant_id UUID NOT NULL,
    device_type VARCHAR(255),
    custom_fields JSONB,  -- Raw payload stored as JSONB
    battery_level FLOAT,
    signal_strength FLOAT,
    latitude FLOAT,
    longitude FLOAT,
    altitude FLOAT,
    quality VARCHAR(50),
    PRIMARY KEY (time, device_id)
);
```

**Example Data:**
```json
{
  "time": "2025-12-11T21:04:43Z",
  "device_id": "DEV-039",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "custom_fields": {
    "time": "2025-12-11T21:04:42.915Z",
    "deviceType": "",
    "batteryLevel": 19.29,
    "customFields": "{\"temperature\":-33.90,\"humidity\":14.34,\"dewPoint\":69.10,\"heatIndex\":33.49}",
    "signalStrength": {}
  }
}
```

---

## 🔄 Query Process Flow

### Step 1: Frontend Requests Time-Series Data
```typescript
// Frontend: TimeSeriesChart.tsx
const response = await getTimeSeriesForWidget({
  deviceIds: ["b87e7ec8-6718-4e5f-8bc3-1b9130d8ab6e"],
  fields: ["temperature", "humidity"],
  timeRange: "last-24h"
});
```

### Step 2: Query.API Receives Request
**Endpoint:** `POST /api/widgetdata/timeseries`  
**Controller:** `WidgetDataController.GetTimeSeries()`

### Step 3: Lookup Device Metadata
**Database:** `sensormine_metadata` (via `IDeviceRepository`)

```csharp
// Query.API/Controllers/WidgetDataController.cs
var device = await _deviceRepository.GetByIdAsync(deviceId, tenantId);
// Returns: Device with DeviceTypeId
```

### Step 4: Lookup Field Mappings
**Database:** `sensormine_metadata.field_mappings`  
**Expected Behavior:** Query should retrieve field mappings for the device type

```csharp
// EXPECTED (needs verification):
var fieldMappings = await _fieldMappingRepository.GetByDeviceTypeIdAsync(device.DeviceTypeId);
// Returns: List of FieldMapping objects with jsonPath, friendlyName, etc.
```

### Step 5: Build Dynamic SQL Query
**Database:** `sensormine_timeseries` (via `ITimeSeriesRepository`)

**Expected Query Construction:**
```csharp
// For each field in request.Fields:
foreach (var field in request.Fields)
{
    // Find the field mapping
    var mapping = fieldMappings.FirstOrDefault(m => m.FieldName == field);
    
    if (mapping != null && mapping.IsQueryable)
    {
        // Use jsonPath from mapping to extract data from JSONB
        var jsonPath = mapping.JsonPath; // e.g., "$.temperature"
        
        // Build SQL: custom_fields->>'temperature' AS temperature
        // Or if nested: custom_fields->'customFields'->>'temperature'
    }
}
```

**Generated SQL (Expected):**
```sql
SELECT 
    time,
    device_id,
    custom_fields->>'temperature' AS temperature,
    custom_fields->>'humidity' AS humidity
FROM telemetry
WHERE device_id = 'DEV-039'
  AND tenant_id = '00000000-0000-0000-0000-000000000001'
  AND time BETWEEN '2025-12-11 00:00:00' AND '2025-12-12 00:00:00'
ORDER BY time ASC;
```

### Step 6: Return Formatted Results
```json
{
  "series": [
    {
      "field": "temperature",
      "deviceId": "b87e7ec8-6718-4e5f-8bc3-1b9130d8ab6e",
      "deviceName": "Temperature-Industrial-PT100",
      "dataPoints": [
        {"timestamp": "2025-12-11T21:04:43Z", "value": -33.90},
        {"timestamp": "2025-12-11T21:04:37Z", "value": -29.26}
      ]
    }
  ],
  "totalPoints": 2
}
```

---

## 🔍 Current Implementation Issues

### Issue 1: Double JSON Encoding
**Problem:** Data is stored as JSON string inside JSON object
```json
"customFields": "{\"temperature\":-33.90,\"humidity\":14.34}"  // STRING, not object
```

**Expected:**
```json
"customFields": {"temperature":-33.90,"humidity":14.34}  // OBJECT
```

**Impact:** JSONB operators can't directly query the nested data

### Issue 2: Query API Not Using Field Mappings
**Problem:** `WidgetDataController` doesn't reference field mappings

**Current Code:** Lines 205-227 in `WidgetDataController.cs` shows no field mapping lookup

**Expected:** Should query field mappings to build dynamic JSONB extraction

### Issue 3: Device List Missing Field Mappings
**Problem:** `GET /api/devices` may not return field mappings in response

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Temperature Sensor",
  "deviceTypeId": "uuid",
  "fieldMappings": [
    {
      "fieldName": "temperature",
      "friendlyName": "Temperature (°C)",
      "jsonPath": "$.temperature",
      "dataType": "Float",
      "unit": "°C"
    }
  ]
}
```

---

## ✅ Verification Checklist

- [ ] **Schema Registry:** Schemas exist for device types
- [ ] **Field Mappings:** Device types have field mappings with jsonPath
- [ ] **Device.API:** Returns field mappings in device/device type responses
- [ ] **Query.API:** Queries field mappings before building time-series queries
- [ ] **Query.API:** Uses jsonPath from field mappings to extract JSONB data
- [ ] **Ingestion:** Stores data as proper JSONB (not double-encoded strings)
- [ ] **Frontend:** Displays field mappings to users

---

## 🛠️ Required Fixes

### 1. Fix Double JSON Encoding in Ingestion
**File:** `Ingestion.Service/TelemetryIngestionHandler.cs`

### 2. Add Field Mapping Repository to Query.API
**File:** `Query.API/Program.cs`
```csharp
builder.Services.AddScoped<IFieldMappingRepository, FieldMappingRepository>();
```

### 3. Use Field Mappings in Query Construction
**File:** `Query.API/Controllers/WidgetDataController.cs`
```csharp
// Step 1: Get field mappings for device type
var fieldMappings = await _fieldMappingRepository.GetByDeviceTypeIdAsync(device.DeviceTypeId);

// Step 2: Build JSONB extraction based on jsonPath
foreach (var field in request.Fields)
{
    var mapping = fieldMappings.FirstOrDefault(m => m.FieldName == field);
    if (mapping?.JsonPath != null)
    {
        // Use mapping.JsonPath to extract from custom_fields JSONB
    }
}
```

### 4. Return Field Mappings in Device API
**File:** `Device.API/Controllers/DeviceController.cs`
```csharp
public async Task<DeviceResponse> GetDevice(Guid id)
{
    var device = await _repository.GetByIdAsync(id, tenantId);
    var fieldMappings = await _fieldMappingRepository.GetByDeviceTypeIdAsync(device.DeviceTypeId);
    
    return new DeviceResponse
    {
        // ... device properties
        FieldMappings = fieldMappings
    };
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Schema    │ (JSON Schema definition)
│  Registry   │
└──────┬──────┘
       │ defines structure
       ▼
┌─────────────┐
│ Device Type │ (has SchemaId)
└──────┬──────┘
       │ has multiple
       ▼
┌─────────────┐
│   Field     │ (fieldName, jsonPath, friendlyName)
│  Mappings   │
└──────┬──────┘
       │ used by
       ▼
┌─────────────┐       ┌──────────────┐
│  Query.API  │──────>│ TimescaleDB  │
│             │       │  (JSONB)     │
│ Extracts    │<──────│ custom_fields│
│ using       │       └──────────────┘
│ jsonPath    │
└─────────────┘
```

---

## 🎯 Success Criteria

1. ✅ Field mappings define how to extract data from JSONB payloads
2. ✅ Query.API uses field mappings to build dynamic queries
3. ✅ Device API returns field mappings with device/device type data
4. ✅ No double JSON encoding in telemetry storage
5. ✅ Frontend can query any field defined in field mappings
6. ✅ New device types can be added without code changes

---

**Next Steps:**
1. Verify current implementation against this design
2. Identify gaps in code
3. Implement missing field mapping lookups
4. Fix JSONB data structure issues
5. Test end-to-end query flow
