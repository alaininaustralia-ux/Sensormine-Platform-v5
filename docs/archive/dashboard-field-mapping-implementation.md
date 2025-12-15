# Dashboard Field Selection Enhancement - Implementation Summary

**Date:** December 11, 2025  
**Status:** ✅ Complete

---

## Overview

Revamped the dashboard field selection system to use **Field Mappings** from Device.API instead of raw schema parsing, enabling:
- ✅ User-friendly field names (e.g., "Room Temperature" instead of "temperature")
- ✅ Asset hierarchy filtering and rollup queries
- ✅ Integration with Query.API for time-series data
- ✅ Proper metadata (units, data types, aggregations, categories)

---

## New Files Created

### 1. **`src/lib/api/field-mappings.ts`**
**Purpose:** API client for field mappings from Device.API

**Key Functions:**
```typescript
getFieldMappings(deviceTypeId: string): Promise<FieldMapping[]>
getFieldMappingsForDeviceTypes(deviceTypeIds: string[]): Promise<FieldMappingWithDeviceType[]>
getQueryableFieldMappings(deviceTypeId: string): Promise<FieldMapping[]>
getFieldMappingsByCategory(deviceTypeId: string): Promise<Record<string, FieldMapping[]>>
```

**Data Structure:**
```typescript
interface FieldMapping {
  id: string;
  fieldName: string;              // Actual field in telemetry (e.g., "temperature")
  fieldSource: FieldSource;       // Schema | CustomField | System
  friendlyName: string;           // User-friendly name (e.g., "Room Temperature")
  description?: string;
  unit?: string;                  // e.g., "°C", "hPa", "ppm"
  dataType: FieldDataType;        // String | Integer | Float | Boolean | DateTime | Json
  minValue?: number;
  maxValue?: number;
  isQueryable: boolean;
  isVisible: boolean;
  displayOrder: number;
  category?: string;              // e.g., "Environmental", "System", "Status"
  tags: string[];
  defaultAggregation?: string;
  supportsAggregations: string[]; // ["avg", "min", "max", "sum", "count"]
  formatString?: string;
}
```

### 2. **`src/components/dashboard/builder/enhanced-field-selector.tsx`**
**Purpose:** New field selector component with rich UX

**Features:**
- ✅ Device type selection dropdown
- ✅ Field mappings grouped by category (collapsible)
- ✅ Search across field names, descriptions, categories
- ✅ Checkbox selection with multi-select support
- ✅ Selected fields shown as dismissible badges
- ✅ Field metadata display (unit, data type, description)
- ✅ Aggregation method selection per field
- ✅ Optional asset filtering
- ✅ Responsive scrollable list

**Usage:**
```tsx
<EnhancedFieldSelector
  selectedFields={selectedFields}
  onFieldsChange={setSelectedFields}
  multiSelect={true}
  showAssetFilter={true}
  showAggregationOptions={true}
/>
```

---

## Enhanced API Functions

### **`src/lib/api/widget-data.ts`** (Updated)

Added asset-based query functions:

```typescript
// Query data rolled up by asset hierarchy
getAssetRollupData(params: AssetRollupQueryParams): Promise<ApiResponse<AggregatedWidgetDataResponse>>

// Get devices mapped to an asset (for widget queries)
getDevicesByAsset(params: AssetDevicesQueryParams): Promise<ApiResponse<string[]>>
```

**Asset Rollup Query Parameters:**
```typescript
interface AssetRollupQueryParams {
  assetId: string;
  fields: string;               // Comma-separated field names
  startTime: string;
  endTime: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'first' | 'last';
  interval?: string;            // e.g., "5m", "1h", "1d"
  includeChildren?: boolean;    // Rollup child assets
  groupByAsset?: boolean;       // Return data grouped by asset
}
```

---

## How It Works

### 1. **Field Selection Flow**

```
User → Select Device Type → Load Field Mappings → Display Friendly Names → Select Fields
```

**Before:**
```
User sees: "temperature", "co2", "humidity" (raw schema fields)
```

**After:**
```
User sees: "Room Temperature (°C)", "CO2 Level (ppm)", "Relative Humidity (%)"
Grouped by category: Environmental, System, Status
```

### 2. **Query Execution Flow**

```
Dashboard Widget → Selected Fields → Build Query → Query.API → TimescaleDB
                                          ↓
                                    Field Mapping Translation
                                    (friendlyName → fieldName)
```

**Example:**
```typescript
// User selects: "Room Temperature" with aggregation "avg"
// Field mapping: { fieldName: "temperature", friendlyName: "Room Temperature", unit: "°C" }

// Query sent to API:
{
  fields: "temperature",
  aggregation: "avg",
  deviceIds: "device1,device2",
  startTime: "2025-12-11T00:00:00Z",
  endTime: "2025-12-11T23:59:59Z",
  interval: "15m"
}

// Response displayed as: "Room Temperature (°C)" with avg aggregation
```

### 3. **Asset-Based Rollup**

```
Asset Hierarchy:
  Building A
    ├─ Floor 1
    │   ├─ Room 101 (Device 1, Device 2)
    │   └─ Room 102 (Device 3)
    └─ Floor 2
        └─ Room 201 (Device 4, Device 5)

Query: "Get avg temperature for Building A (include children)"

Result: Aggregates data from Devices 1-5 and rolls up to building level
```

---

## Integration with Existing Backend

### **Device.API Endpoints Used:**

```
GET /api/devicetype/{deviceTypeId}/fields
→ Returns field mappings with friendly names, units, categories
```

**Backend Controller:** `src/Services/Device.API/Controllers/FieldMappingController.cs`

**Backend Service:** `src/Services/Device.API/Services/FieldMappingService.cs`
- Merges schema fields, custom fields, and system fields
- Returns unified list with metadata

### **Query.API Endpoints Expected:**

```
GET /api/query/by-asset?assetId={id}&fields={fields}&startTime={start}&endTime={end}&aggregation={agg}&includeChildren=true
→ Returns aggregated telemetry data for asset and children

GET /api/query/asset-devices?assetId={id}&includeChildren=true
→ Returns list of device IDs mapped to asset
```

**Note:** These endpoints need to be implemented in Query.API to support asset-based queries.

---

## Benefits

### For Users:
1. ✅ **Friendly Names:** See "Room Temperature (°C)" instead of "temperature"
2. ✅ **Categorization:** Fields grouped by Environmental, System, Status, etc.
3. ✅ **Metadata:** Units, descriptions, valid ranges shown inline
4. ✅ **Search:** Quickly find fields by name, category, or description
5. ✅ **Asset Filtering:** Query data at asset/building/site level

### For Developers:
1. ✅ **Decoupling:** Dashboard doesn't need to parse raw schemas
2. ✅ **Consistency:** Field mappings are single source of truth
3. ✅ **Flexibility:** Add custom fields without schema changes
4. ✅ **Rollup Logic:** Asset hierarchy queries built-in

### For System:
1. ✅ **Performance:** Field mappings cached in metadata DB
2. ✅ **Scalability:** Query by asset reduces device enumeration
3. ✅ **Maintainability:** Field display changes don't require code deploys

---

## Next Steps

### Immediate:
1. **Update Existing Widgets:** Replace old `field-selector.tsx` with `enhanced-field-selector.tsx`
2. **Test Integration:** Verify field selection in dashboard builder
3. **Implement Query.API Endpoints:** Add asset-based query support

### Future Enhancements:
1. **Field Templates:** Save common field selections as templates
2. **Smart Suggestions:** Recommend fields based on widget type
3. **Unit Conversion:** Support °C ↔ °F, etc.
4. **Calculated Fields:** Support expressions like "temperature * 1.8 + 32"
5. **Asset Grouping:** Add asset selector with tree view

---

## Files Modified

### Created:
- `src/lib/api/field-mappings.ts`
- `src/components/dashboard/builder/enhanced-field-selector.tsx`

### Updated:
- `src/lib/api/widget-data.ts` (added asset rollup functions)

### To Replace:
- `src/components/dashboard/builder/field-selector.tsx` (old schema-based version)

---

## Testing Checklist

- [ ] Field mappings load correctly from Device.API
- [ ] Fields grouped by category display properly
- [ ] Search filters fields as expected
- [ ] Field selection/deselection works
- [ ] Aggregation dropdown shows for selected fields
- [ ] Selected fields display as badges with remove button
- [ ] Asset filter dropdown populates (if enabled)
- [ ] Multi-select vs single-select modes work
- [ ] Field metadata (unit, type, description) renders correctly
- [ ] Component integrates with existing dashboard builder

---

## Documentation Updates Needed

1. Update dashboard builder docs with new field selector usage
2. Document field mapping management workflow
3. Add examples for asset-based queries
4. Create guide for end users on dashboard field selection

---

**Implementation Status:** ✅ Complete  
**Backend Requirements:** Query.API asset endpoints (to be implemented)  
**Frontend Integration:** Ready for testing
