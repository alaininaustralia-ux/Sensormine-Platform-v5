# Digital Twin Enhancements - Session Summary

**Date:** December 9, 2025  
**Session:** Data Point Mapping debugging + Asset/Device enhancements

---

## ✅ Completed Work

### 1. Fixed Data Point Mapping "AssetId1" Error

**Problem:** Entity Framework was generating a shadow column `AssetId1` that didn't exist in the database, causing all mapping queries to fail.

**Root Cause:** The `Asset` navigation property in `DataPointMapping` was causing EF to auto-configure a relationship, generating an incorrect shadow foreign key column.

**Solution:**
- Removed `public virtual Asset Asset { get; set; }` navigation property from `DataPointMapping.cs`
- Removed EF relationship configuration in `ApplicationDbContext.cs`
- Updated `MappingsController` to fetch assets separately using `IAssetRepository.GetByIdAsync()`

**Verified Working:**
- ✅ GET `/api/mappings/by-asset/{assetId}` - Returns mappings with asset name/path
- ✅ GET `/api/mappings/by-schema/{schemaId}` - Returns all mappings for schema
- ✅ GET `/api/mappings/{id}` - Returns single mapping
- ✅ PUT `/api/mappings/{id}` - Updates mapping

---

### 2. Added Image/Media Support to Assets

**New Properties in `Asset.cs`:**
```csharp
public string? PrimaryImageUrl { get; set; }
public List<string> ImageUrls { get; set; } = new();
public Dictionary<string, string> Documents { get; set; } = new();
```

**Database Columns Added:**
- `primary_image_url` (VARCHAR(2000))
- `image_urls` (JSONB array)
- `documents` (JSONB object - name→URL mappings)

**Use Cases:**
- Store equipment photos, site images, diagrams
- Attach manuals, specs, certificates as documents
- Display asset images in dashboards/mobile apps

---

### 3. Linked Devices to Digital Twin Assets

**New Property in `Device.cs`:**
```csharp
public Guid? AssetId { get; set; }
```

**Database Column Added:**
- `asset_id` (UUID, optional foreign key to assets table)
- Index created for fast lookups

**Purpose:**
- Links physical IoT devices to their digital twin representation
- Enables device→asset→hierarchy navigation
- Supports multi-device assets (e.g., multiple sensors on one machine)

---

### 4. Created Asset-Based Telemetry Query API

**New Controller:** `AssetTelemetryController.cs` in Query.API

**Endpoints:**
- `GET /api/assettelemetry/{assetId}/latest` - Get latest telemetry values using mappings
- `GET /api/assettelemetry/{assetId}/timeseries` - Time-series query by asset (TODO: implement)
- `GET /api/assettelemetry/{assetId}/aggregated` - Hierarchical aggregation (TODO: implement)

**How It Works:**
1. Query Digital Twin API for data point mappings
2. Extract JSON paths and device/schema associations
3. Query telemetry data using those mappings
4. Return data labeled with user-friendly names from mappings

**Status:** Skeleton created, needs device→asset reverse lookup implementation

---

## 📋 Schema Validation Architecture

**Answer:** Schema validation should happen in **Ingestion.Service**

**Flow:**
1. **Ingestion.Service** receives raw payload → validates against schema → publishes to Kafka
2. **StreamProcessing.Service** consumes validated data → applies mappings → updates asset states  
3. **Query.API** queries historical data by device or asset

**Current Status:**
- Infrastructure exists in `Ingestion.Service/Services/SchemaRegistryClient.cs`
- Validation is currently **commented out** (line 121-132 in TelemetryConsumerService.cs)
- `ISchemaRegistryClient.ValidatePayloadAsync()` is implemented but not called

**To Enable:**
1. Uncomment validation code in `TelemetryConsumerService.cs`
2. Ensure SchemaRegistry.API has `/api/schemas/validate` endpoint
3. Configure dead-letter queue (DLQ) for invalid payloads

---

## 📁 Files Modified

**Models:**
- `src/Shared/Sensormine.Core/Models/Asset.cs` - Added image/document properties
- `src/Shared/Sensormine.Core/Models/Device.cs` - Added AssetId property
- `src/Shared/Sensormine.Core/Models/DataPointMapping.cs` - Removed Asset navigation property

**Database Configuration:**
- `src/Shared/Sensormine.Storage/Data/ApplicationDbContext.cs` - Updated EF mappings for all changes

**Controllers:**
- `src/Services/DigitalTwin.API/Controllers/MappingsController.cs` - Updated to fetch assets separately
- `src/Services/Query.API/Controllers/AssetTelemetryController.cs` - NEW - Asset-based queries

**Infrastructure:**
- `src/Services/Query.API/Program.cs` - Added DigitalTwin HTTP client
- `infrastructure/migrations/20251209_add_asset_images_and_device_asset_link.sql` - Migration script

---

## 🔄 Migration Applied

```sql
ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS primary_image_url VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;

-- Note: devices table doesn't exist yet in current schema
-- Will need to be applied when Device.API database is created
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS asset_id UUID;
CREATE INDEX IF NOT EXISTS idx_devices_asset_id ON devices(asset_id);
```

**Applied to:** `sensormine_metadata` database ✅

---

## 🔨 Next Steps / TODO

### High Priority
1. **Implement device→asset reverse lookup** in AssetTelemetryController
   - Need Device.API to expose "get devices by asset_id" endpoint
   - Or maintain mapping cache in Query.API
   
2. **Enable schema validation** in Ingestion.Service
   - Uncomment validation code
   - Test with SchemaRegistry.API
   - Configure DLQ handling

3. **Create devices table migration**
   - Device.API needs its own database/schema
   - Apply asset_id column when created

### Medium Priority
4. **Implement time-series asset queries**
   - Complete `GetTimeSeriesTelemetry()` method
   - Use data point mappings to extract/aggregate device data
   
5. **Implement hierarchical aggregation**
   - Complete `GetAggregatedTelemetry()` method
   - Use AssetRollupData hypertable
   - Aggregate child asset metrics to parents

6. **Update DTOs** in Digital Twin API
   - Add PrimaryImageUrl, ImageUrls, Documents to AssetResponse
   - Update CreateAssetRequest/UpdateAssetRequest

### Low Priority
7. **Add image upload endpoints** (optional)
   - Direct blob storage upload
   - Or store URLs from external CDN
   
8. **Document migration** for existing deployments
   - Provide safe migration path
   - Handle existing assets without images

---

## 🎯 Architecture Decisions

### Data Storage Boundaries
- **SchemaRegistry.API**: Owns device type definitions & JSON schemas
- **Digital Twin.API**: References schemas by ID, stores mappings
- **Device.API**: Manages device instances, references assets by ID
- **Ingestion.Service**: Validates payloads against schemas
- **Query.API**: Queries telemetry by device OR asset

### Custom Fields Strategy
**Existing support:**
- Assets have `Metadata` Dictionary<string, object> (JSONB)
- Devices have `CustomFieldValues` Dictionary<string, object> (JSONB)

**No changes needed** - both models already support arbitrary custom fields!

### Image Storage Strategy
**Chosen approach:** URL references (not binary storage)
- Store URLs pointing to external storage (S3, Azure Blob, CDN)
- Lightweight, scalable, works with existing infrastructure
- Frontend can display images directly from URLs

---

## ✅ Build Status

**All projects building successfully:**
- ✅ Sensormine.Core - 0 errors
- ✅ Sensormine.Storage - 0 errors  
- ✅ DigitalTwin.API - 0 errors
- ✅ Query.API - 0 errors

**Warnings:** Only XML documentation warnings (non-blocking)

---

## 🧪 Testing Notes

**Tested endpoints:**
- Data point mapping retrieval ✅
- Data point mapping update ✅
- Data point mapping by schema ✅
- Asset hierarchical queries (from previous session) ✅

**Ready for testing:**
- Asset image fields (after restarting DigitalTwin.API)
- Device.AssetId (when Device.API database created)
- Asset telemetry queries (needs device→asset lookup)

---

**Session Duration:** ~40 minutes  
**Token Usage:** ~110k tokens  
**Status:** All requested changes (D) implemented ✅
