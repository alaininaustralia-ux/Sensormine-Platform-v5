# Schema & Field Mapping Implementation Verification

**Date:** December 12, 2025  
**Status:** ✅ Partial Implementation / ⚠️ Needs Fixes

---

## 🔍 Verification Results

### ✅ **IMPLEMENTED:**

#### 1. Field Mapping Repository Exists
- **Location:** `Sensormine.Core/Repositories/IFieldMappingRepository.cs`
- **Methods:** GetByDeviceTypeIdAsync, GetByIdAsync, GetByFieldNameAsync, CreateAsync, etc.
- **Status:** ✅ Interface defined

#### 2. Device.API Returns Field Mappings
- **File:** `Device.API/DTOs/DeviceDTOs.cs` (line 122)
- **Response DTO:**
  ```csharp
  public class DeviceResponse
  {
      // ... other properties
      public List<FieldMappingDto>? FieldMappings { get; set; }
  }
  ```
- **Population:** DeviceController.cs line 721 - `FieldMappings = fieldMappingDtos`
- **Status:** ✅ Device API includes field mappings in responses

#### 3. Field Mapping Service Available
- **File:** `Device.API/Controllers/FieldMappingController.cs`
- **Endpoints:**
  - `GET /api/devicetype/{deviceTypeId}/fields` - Get field mappings
  - `PUT /api/devicetype/{deviceTypeId}/fields` - Update field mappings
  - `POST /api/devicetype/{deviceTypeId}/fields/sync` - Sync from schema
- **Status:** ✅ Full CRUD API for field mappings

---

### ❌ **NOT IMPLEMENTED:**

#### 1. Query.API Does NOT Use Field Mappings
- **File:** `Query.API/Controllers/WidgetDataController.cs`
- **Current Code:** No reference to `IFieldMappingRepository`
- **Missing:**
  ```csharp
  // MISSING: Field mapping lookup
  var fieldMappings = await _fieldMappingRepository.GetByDeviceTypeIdAsync(device.DeviceTypeId);
  
  // MISSING: Dynamic JSONB extraction using jsonPath
  foreach (var field in request.Fields)
  {
      var mapping = fieldMappings.FirstOrDefault(m => m.FieldName == field);
      if (mapping?.JsonPath != null)
      {
          // Use mapping.JsonPath to build SQL: custom_fields #>> '{path,to,field}'
      }
  }
  ```
- **Impact:** ⚠️ **CRITICAL** - Queries cannot extract data from JSONB payloads
- **Status:** ❌ Query.API is NOT using field mappings

#### 2. Query.API Missing Field Mapping Injection
- **File:** `Query.API/Program.cs`
- **Current:** No `AddScoped<IFieldMappingRepository>`
- **Required:**
  ```csharp
  builder.Services.AddScoped<IFieldMappingRepository, FieldMappingRepository>();
  ```
- **Status:** ❌ Repository not registered in DI container

#### 3. Telemetry Data Has Double JSON Encoding
- **Database:** `sensormine_timeseries.telemetry`
- **Issue:** `custom_fields` contains JSON string instead of JSON object
  ```json
  // CURRENT (WRONG):
  "customFields": "{\"temperature\":-33.90,\"humidity\":14.34}"
  
  // EXPECTED:
  "customFields": {"temperature":-33.90,"humidity":14.34}
  ```
- **Impact:** JSONB operators cannot directly query nested values
- **Root Cause:** Ingestion.Service is double-encoding JSON
- **Status:** ❌ Data format incompatible with JSONB queries

---

## 🔧 Required Fixes

### Fix 1: Add Field Mapping Repository to Query.API

**File:** `Query.API/Program.cs`

```csharp
// After line 82 (after AssetRepository registration):
builder.Services.AddScoped<IFieldMappingRepository, FieldMappingRepository>();
```

### Fix 2: Inject Field Mapping Repository into WidgetDataController

**File:** `Query.API/Controllers/WidgetDataController.cs`

```csharp
// Add to constructor parameters (line 28):
private readonly IFieldMappingRepository _fieldMappingRepository;

public WidgetDataController(
    ITimeSeriesRepository repository,
    IDeviceRepository deviceRepository,
    IAssetRepository assetRepository,
    ITenantProvider tenantProvider,
    ITelemetryParserService telemetryParser,
    IFieldMappingRepository fieldMappingRepository,  // ADD THIS
    ILogger<WidgetDataController> logger)
{
    // ... existing assignments
    _fieldMappingRepository = fieldMappingRepository;
}
```

### Fix 3: Use Field Mappings in GetTimeSeries Method

**File:** `Query.API/Controllers/WidgetDataController.cs`  
**Location:** Around line 185-227

```csharp
// After getting device info (line 187):
var device = await _deviceRepository.GetByIdAsync(dbId, tenantId.ToString());
if (device != null)
{
    deviceLookup[dbId] = (device.DeviceId, device.Name);
    
    // ADD THIS: Get field mappings for device type
    if (!fieldMappingsCache.ContainsKey(device.DeviceTypeId))
    {
        var mappings = await _fieldMappingRepository.GetByDeviceTypeIdAsync(
            device.DeviceTypeId, 
            tenantId.ToString());
        fieldMappingsCache[device.DeviceTypeId] = mappings.ToList();
    }
}

// Then in the field loop (line 205+):
foreach (var field in request.Fields)
{
    // ADD THIS: Find the field mapping
    var mapping = fieldMappingsCache.Values
        .SelectMany(m => m)
        .FirstOrDefault(m => m.FieldName == field);
    
    if (mapping == null || !mapping.IsQueryable)
    {
        _logger.LogWarning("Field {Field} not found or not queryable", field);
        continue;
    }
    
    // Use mapping.JsonPath to extract from custom_fields
    var jsonPath = mapping.JsonPath ?? $"$.{field}";
    
    // Build query with JSON extraction
    // e.g., custom_fields #>> '{customFields, temperature}'
}
```

### Fix 4: Fix Double JSON Encoding in Ingestion

**File:** `Ingestion.Service/TelemetryIngestionHandler.cs`  
**Problem:** Converting already-serialized JSON to string again

**Solution:** Ensure `customFields` is stored as JSONB object, not string:
```csharp
// When building telemetry record:
custom_fields = new
{
    time = timestamp,
    deviceType = deviceType,
    batteryLevel = batteryLevel,
    customFields = customFieldsObject,  // Object, not JsonSerializer.Serialize(customFieldsObject)
    signalStrength = signalStrength
}
```

---

## 📊 Data Structure Analysis

### Current Telemetry Table Structure
```sql
SELECT 
    time,
    device_id,
    custom_fields
FROM telemetry 
WHERE device_id = 'DEV-039' 
LIMIT 1;
```

**Result:**
```json
{
  "time": "2025-12-11T21:04:43Z",
  "device_id": "DEV-039",
  "custom_fields": {
    "time": "2025-12-11T21:04:42.915Z",
    "deviceType": "",
    "batteryLevel": 19.29,
    "customFields": "{\"temperature\":-33.90,...}",  // ← STRING (WRONG!)
    "signalStrength": {}
  }
}
```

**Problem:** The `customFields` key contains a JSON **string** instead of a JSON **object**.

### Expected Structure After Fix
```json
{
  "time": "2025-12-11T21:04:43Z",
  "device_id": "DEV-039",
  "custom_fields": {
    "time": "2025-12-11T21:04:42.915Z",
    "deviceType": "",
    "batteryLevel": 19.29,
    "customFields": {                           // ← OBJECT (CORRECT!)
      "temperature": -33.90,
      "humidity": 14.34,
      "dewPoint": 69.10,
      "heatIndex": 33.49
    },
    "signalStrength": {}
  }
}
```

### PostgreSQL JSONB Query Examples

**With Correct Structure:**
```sql
-- Extract temperature directly
SELECT 
    time,
    custom_fields #>> '{customFields, temperature}' AS temperature
FROM telemetry
WHERE device_id = 'DEV-039';
```

**Current Structure (Requires Double Parsing):**
```sql
-- Must parse the JSON string first (inefficient)
SELECT 
    time,
    (custom_fields #>> '{customFields}')::jsonb ->> 'temperature' AS temperature
FROM telemetry
WHERE device_id = 'DEV-039';
```

---

## ✅ Test Cases After Fix

### Test 1: Device API Returns Field Mappings
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5293/api/Device/b87e7ec8-6718-4e5f-8bc3-1b9130d8ab6e" `
    -Headers @{"X-Tenant-Id"="00000000-0000-0000-0000-000000000001"}

# Verify fieldMappings array exists
$response.fieldMappings | Should -Not -BeNullOrEmpty

# Verify contains temperature field
$tempMapping = $response.fieldMappings | Where-Object { $_.fieldName -eq "temperature" }
$tempMapping.jsonPath | Should -Be "$.customFields.temperature"
$tempMapping.friendlyName | Should -Be "Temperature (°C)"
```

### Test 2: Query API Uses Field Mappings
```powershell
$body = @{
    deviceIds = @("b87e7ec8-6718-4e5f-8bc3-1b9130d8ab6e")
    fields = @("temperature", "humidity")
    timeRange = "last-24h"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5079/api/widgetdata/timeseries" `
    -Method POST -Body $body -ContentType "application/json" `
    -Headers @{"X-Tenant-Id"="00000000-0000-0000-0000-000000000001"}

# Verify data returned
$response.series.Count | Should -BeGreaterThan 0
$response.totalPoints | Should -BeGreaterThan 0

# Verify temperature series exists
$tempSeries = $response.series | Where-Object { $_.field -eq "temperature" }
$tempSeries.dataPoints.Count | Should -BeGreaterThan 0
```

### Test 3: JSONB Data Structure Correct
```sql
-- Verify custom_fields.customFields is an object
SELECT 
    jsonb_typeof(custom_fields -> 'customFields') AS field_type
FROM telemetry
WHERE device_id = 'DEV-039'
LIMIT 1;

-- Expected: field_type = 'object'
-- Current: field_type = 'string' ❌
```

---

## 📋 Implementation Checklist

- [x] **Field Mapping Repository** - Defined in Sensormine.Core
- [x] **Device.API Returns Field Mappings** - DeviceResponse includes FieldMappings
- [x] **Field Mapping CRUD API** - FieldMappingController endpoints available
- [ ] **Query.API Registers Repository** - IFieldMappingRepository not in DI
- [ ] **Query.API Injects Repository** - WidgetDataController missing dependency
- [ ] **Query.API Uses Field Mappings** - GetTimeSeries doesn't lookup mappings
- [ ] **Query.API Builds Dynamic Queries** - No JSONB extraction with jsonPath
- [ ] **Ingestion Fixes Double Encoding** - custom_fields.customFields is string
- [ ] **End-to-End Test** - Dashboard widgets display chart data

---

## 🎯 Priority

1. **HIGH:** Fix double JSON encoding in Ingestion.Service (blocks all queries)
2. **HIGH:** Add Field Mapping Repository to Query.API DI container
3. **HIGH:** Implement field mapping lookup in WidgetDataController
4. **MEDIUM:** Build dynamic JSONB queries using jsonPath
5. **LOW:** Add comprehensive test cases

---

## 📚 Related Documentation

- [Schema & Field Mapping Architecture](./schema-field-mapping-architecture.md) - Design document
- [DATABASE.md](./DATABASE.md) - Database schema details
- [APPLICATION.md](./APPLICATION.md) - Service architecture

---

**Status Summary:**  
✅ **Device.API:** Fully implements field mapping storage and retrieval  
❌ **Query.API:** Does NOT use field mappings for queries (CRITICAL FIX NEEDED)  
❌ **Ingestion:** Double JSON encoding breaks JSONB queries (CRITICAL FIX NEEDED)
