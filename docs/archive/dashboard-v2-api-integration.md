# Dashboard V2 - Backend API Integration Plan

**Created:** December 10, 2025  
**Status:** Implementation Guide  
**Purpose:** Document existing backend APIs and integration with Dashboard V2

---

## 🎯 Overview

Dashboard V2 frontend integrates with 5 existing backend microservices. All services are fully implemented - no backend development needed. Next.js proxy configuration added to route API calls.

---

## 📡 Backend Services Overview

### 1. Dashboard.API (Port 5298)
**Database:** sensormine_metadata  
**Status:** ✅ Fully Implemented  
**Next.js Proxy:** ✅ Configured (`/api/dashboards/*`)

**Note:** Documentation incorrectly lists port 5299, but actual running port is 5298 (see appsettings.json).

#### Endpoints Used by Dashboard V2:
```
GET    /api/dashboards                 # List user's dashboards
POST   /api/dashboards                 # Create dashboard
GET    /api/dashboards/{id}            # Get dashboard details
PUT    /api/dashboards/{id}            # Update dashboard (auto-save)
DELETE /api/dashboards/{id}            # Delete dashboard
GET    /api/dashboards/search?q={query}&tags={tag}  # Search
GET    /api/dashboards/{id}/subpages   # Get drill-down subpages
POST   /api/dashboards/{parentId}/subpages  # Create subpage
```

#### DTO Compatibility:
```csharp
public class DashboardDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public object Layout { get; set; }        // ✅ Dashboard V2 LayoutConfig
    public object Widgets { get; set; }       // ✅ Dashboard V2 Widget[]
    public string[] Tags { get; set; }
    public string[] SharedWith { get; set; }
    public Guid? ParentDashboardId { get; set; }  // Drill-down support
    public DashboardType Type { get; set; }   // Root, SubPage, Template
    public bool IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
}
```

**Integration Status:**
- ✅ Frontend API client: `lib/api/dashboards-v2.ts` (211 lines)
- ✅ CRUD operations mapped
- ✅ Generic `object` types handle Dashboard V2 complex structures
- 🔜 Test with live backend after dev server restart

---

### 2. Device.API (Port 5293)
**Database:** sensormine_metadata  
**Status:** ✅ Fully Implemented  
**Next.js Proxy:** ✅ Configured (`/api/device/*`, `/api/devicetype/*`)

#### Endpoints for Widget Configuration:

**Device Management:**
```
GET    /api/device                     # List devices (with filtering)
GET    /api/device/{id}                # Get device details
POST   /api/device                     # Create device
PUT    /api/device/{id}                # Update device
DELETE /api/device/{id}                # Delete device
```

**Device Type Management (Key for Field Mappings):**
```
GET    /api/devicetype                 # List device types
GET    /api/devicetype/{id}            # Get device type with field mappings
POST   /api/devicetype                 # Create device type
PUT    /api/devicetype/{id}            # Update device type
GET    /api/devicetype/{id}/fields     # Get field mappings
PUT    /api/devicetype/{id}/fields     # Update field mappings
POST   /api/devicetype/{id}/fields/sync # Sync fields from schema
```

#### Field Mapping Structure:
```csharp
public class FieldMapping
{
    public Guid Id { get; set; }
    public string FieldName { get; set; }          // Schema field name
    public FieldSource FieldSource { get; set; }    // Schema | CustomField | System
    public string FriendlyName { get; set; }       // Display name for UI
    public string? Description { get; set; }
    public string? Unit { get; set; }              // "°C", "kPa", etc.
    public FieldDataType DataType { get; set; }    // Float | Int | String | Bool
    public bool IsQueryable { get; set; }          // Show in field selector
    public bool IsVisible { get; set; }
}
```

**Integration Requirements:**

1. **Widget Configuration Panel - Device Type Selector**
   - Call `GET /api/devicetype` to populate dropdown
   - Display device type name and description
   - Store `deviceTypeId` in widget config

2. **Field Mapping UI (Story 4.2)**
   - Call `GET /api/devicetype/{id}/fields` to get available fields
   - Build field selector with:
     - Friendly names (e.g., "Temperature" instead of "temp_sensor_1")
     - Units in labels (e.g., "Temperature (°C)")
     - Data types for validation
   - Filter by `IsQueryable = true`
   - Drag-and-drop field selection for chart widgets

3. **Device List Widget**
   - Call `GET /api/device?deviceTypeId={typeId}` to filter devices
   - Display device name, status, last seen
   - Click device → filter other widgets (master-detail)

**Implementation Plan:**
- ✅ API client stub exists in `lib/api/config.ts`
- 🔜 Create `lib/api/deviceTypes.ts` with typed endpoints
- 🔜 Update ConfigurationPanel to call Device.API
- 🔜 Implement field mapping drag-and-drop UI
- 🔜 Update DeviceListWidget to fetch real devices

---

### 3. Query.API (Port 5079)
**Database:** sensormine_timeseries  
**Status:** ✅ Fully Implemented  
**Next.js Proxy:** ✅ Configured (`/api/query/*`)

#### Endpoints for Widget Data:

**Widget-Optimized Endpoints:**
```
GET    /api/widgetdata/realtime        # Latest values (last hour)
  Query params: fields, deviceIds, limit
  
GET    /api/widgetdata/historical      # Time-series data
  Query params: fields, deviceIds, startTime, endTime, interval
  
GET    /api/widgetdata/latest          # Latest value per device
  Query params: deviceIds, fields
```

**Advanced Time-Series Queries:**
```
POST   /api/timeseries/{measurement}/query  # Generic query with filters
POST   /api/timeseries/{measurement}/aggregate  # Aggregations (avg, sum, min, max)
GET    /api/timeseries/devices/{id}/latest  # Latest telemetry for device
GET    /api/timeseries/devices/{id}/history # Historical data
```

**KPI Endpoints:**
```
GET    /api/kpidata/summary            # Summary KPIs (count, avg, min, max)
GET    /api/kpidata/trend              # Trend analysis (increase/decrease %)
```

**Asset-Based Queries:**
```
POST   /api/assettelemetry/query       # Query by asset hierarchy
  Body: { assetId, aggregationMethod, startTime, endTime }
```

#### Query Request Format:
```typescript
interface TimeSeriesQueryRequest {
  startTime: string;          // ISO 8601
  endTime: string;            // ISO 8601
  deviceIds?: string[];       // Filter by devices
  fields?: string[];          // Fields to retrieve
  aggregation?: {
    function: 'avg' | 'sum' | 'min' | 'max' | 'count';
    interval: '1m' | '5m' | '15m' | '1h' | '1d';
  };
  limit?: number;
  orderBy?: string;
}
```

#### Response Format:
```typescript
interface WidgetDataResponse {
  timestamp: string;
  dataPoints: Array<{
    deviceId: string;
    timestamp: string;
    values: Record<string, number>;  // field → value
  }>;
  count: number;
}
```

**Integration Requirements:**

1. **TimeSeriesChartWidget Data Binding**
   - Call `GET /api/widgetdata/historical` with time range
   - Map response to Recharts data format
   - Handle aggregation intervals (1m, 5m, 15m, 1h, 1d)
   - Auto-refresh every N seconds based on widget config

2. **KPI Card Widget**
   - Call `GET /api/kpidata/summary` for current value
   - Call `GET /api/kpidata/trend` for comparison value and % change
   - Color thresholds based on value ranges

3. **Data Table Widget**
   - Call `GET /api/widgetdata/realtime?limit=100` for recent data
   - Display in shadcn/ui table
   - Sort, filter, pagination

4. **Real-Time Updates**
   - Implement polling (every 5-30 seconds based on config)
   - Use `onRefresh()` callback in widget props
   - Show loading skeleton during refresh

**Implementation Plan:**
- ✅ API client stub exists in `lib/api/config.ts`
- 🔜 Create `lib/api/widgetData.ts` with typed endpoints
- 🔜 Replace mock data in TimeSeriesChartWidget
- 🔜 Implement auto-refresh logic with intervals
- 🔜 Add data caching layer (React Query or SWR)
- 🔜 Handle loading/error states

---

### 4. DigitalTwin.API (Port 5297)
**Database:** sensormine_metadata  
**Status:** ✅ Fully Implemented  
**Next.js Proxy:** ✅ Configured (`/api/assets/*`)

#### Endpoints for Asset Hierarchy:

**Asset Management:**
```
GET    /api/assets                     # List all assets (paginated)
GET    /api/assets/{id}                # Get asset details
GET    /api/assets/{id}/tree           # Get asset with children (recursive)
GET    /api/assets/{id}/children       # Get immediate children
GET    /api/assets/roots               # Get root-level assets
POST   /api/assets                     # Create asset
PUT    /api/assets/{id}                # Update asset
DELETE /api/assets/{id}                # Delete asset
```

**Device Mapping:**
```
GET    /api/assets/{id}/devices        # Get devices associated with asset
POST   /api/assets/{id}/mappings       # Map device data point to asset
GET    /api/datapointmappings/{assetId} # Get data point mappings
```

#### Asset Structure:
```csharp
public class Asset
{
    public Guid Id { get; set; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }  // Site, Building, Floor, Zone, Equipment
    public int Level { get; set; }    // Depth in hierarchy
    public string Path { get; set; }  // Materialized path for queries
    public string? Icon { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public List<Asset>? Children { get; set; }
}
```

#### Data Point Mapping:
```csharp
public class DataPointMapping
{
    public Guid AssetId { get; set; }
    public Guid DeviceId { get; set; }
    public string DataPointName { get; set; }
    public string AggregationMethod { get; set; }  // avg, sum, min, max, last
}
```

**Integration Requirements:**

1. **DigitalTwinTreeWidget**
   - Call `GET /api/assets/roots` to get top-level assets
   - Call `GET /api/assets/{id}/children` to expand nodes
   - OR call `GET /api/assets/{id}/tree` for full tree (performance trade-off)
   - Display hierarchy with icons and levels
   - Click asset → filter dashboard by asset

2. **Asset-Based Filtering**
   - When user selects asset in tree, emit event via event bus
   - Other widgets listen for `assetSelected` event
   - Update widget queries to include `assetId` filter
   - Query.API supports asset-based queries: `POST /api/assettelemetry/query`

3. **Device-to-Asset Context**
   - When displaying device data, show parent asset
   - Call `GET /api/assets/{id}` to get asset name and path
   - Breadcrumb navigation (Site > Building > Floor > Equipment > Device)

**Implementation Plan:**
- ✅ DigitalTwinTreeWidget placeholder exists
- 🔜 Create `lib/api/assets.ts` with typed endpoints
- 🔜 Implement tree data loading (incremental or full)
- 🔜 Add asset icon mapping (Site → Building, Equipment → Gear, etc.)
- 🔜 Implement asset selection event propagation
- 🔜 Update Query.API calls to include asset filter

---

### 5. Preferences.API (Port 5296)
**Database:** sensormine_metadata  
**Status:** ✅ Fully Implemented  
**Next.js Proxy:** 🔜 Need to add (`/api/preferences/*`)

#### Endpoints:
```
GET    /api/userpreferences            # Get user preferences
PUT    /api/userpreferences            # Update preferences
DELETE /api/userpreferences            # Reset to defaults
```

#### Preference Structure:
```csharp
public class UserPreferenceDto
{
    public string UserId { get; set; }
    public DisplayPreferences Display { get; set; }
    public NotificationPreferences Notifications { get; set; }
    public DashboardPreferences Dashboard { get; set; }  // ⭐ Dashboard-specific
    public DataPreferences Data { get; set; }
    public FavoritesDto Favorites { get; set; }          // ⭐ Favorite dashboards
    public List<RecentItem> RecentlyViewed { get; set; } // ⭐ Recently viewed
    public List<Bookmark> Bookmarks { get; set; }        // ⭐ Dashboard bookmarks
    public List<PageHistoryItem> PageHistory { get; set; }
}

public class DashboardPreferences
{
    public string DefaultView { get; set; }       // Grid | List
    public int AutoRefreshInterval { get; set; }  // Seconds
    public bool ShowGridLines { get; set; }
    public string? LastViewedDashboardId { get; set; }
}
```

**Integration Requirements:**

1. **Dashboard List Page**
   - Load user preferences to determine default view (grid/list)
   - Show recently viewed dashboards at top
   - Star/unstar for favorites
   - Persist view preference on change

2. **Auto-Refresh Settings**
   - Get `AutoRefreshInterval` from preferences
   - Apply to all widgets on dashboard
   - Allow per-dashboard override

3. **Recent & Favorites**
   - When opening dashboard, add to recently viewed
   - Update `LastViewedDashboardId`
   - Display favorites in sidebar or quick access

**Implementation Plan:**
- 🔜 Add `/api/preferences/*` to next.config.ts proxy
- 🔜 Create `lib/api/preferences.ts` with typed endpoints
- 🔜 Load preferences on dashboard list page mount
- 🔜 Implement favorite toggle button
- 🔜 Track recently viewed dashboards
- 🔜 Persist auto-refresh interval preference

---

## 🔄 Cross-Service Integration Patterns

### Pattern 1: Device Type → Field Mappings → Time-Series Data

**User Flow:**
1. User selects device type in widget configuration
2. Frontend calls Device.API to get field mappings
3. User selects fields from friendly names
4. Widget queries Query.API with selected fields
5. Query.API returns time-series data
6. Widget renders chart/table/KPI

**Implementation:**
```typescript
// 1. Load device types
const deviceTypes = await fetchDeviceTypes();

// 2. Load field mappings for selected type
const fields = await fetchFieldMappings(deviceTypeId);

// 3. Build field selector UI
const fieldOptions = fields
  .filter(f => f.isQueryable)
  .map(f => ({
    value: f.fieldName,
    label: `${f.friendlyName}${f.unit ? ` (${f.unit})` : ''}`,
    dataType: f.dataType
  }));

// 4. Query time-series data with selected fields
const data = await fetchWidgetData({
  deviceIds: selectedDeviceIds,
  fields: selectedFields.map(f => f.fieldName),
  startTime, endTime, interval
});
```

### Pattern 2: Asset Hierarchy → Device Filter → Data Aggregation

**User Flow:**
1. User expands asset tree and selects asset (e.g., "Building A")
2. Widget emits `assetSelected` event via event bus
3. All widgets on dashboard listen for event
4. Widgets update queries to include asset filter
5. Query.API aggregates data from all devices under asset

**Implementation:**
```typescript
// In DigitalTwinTreeWidget
const handleAssetSelect = (assetId: string) => {
  dashboardStore.publishWidgetEvent({
    widgetId: widget.id,
    eventType: 'assetSelected',
    data: { assetId, assetName, assetPath }
  });
};

// In TimeSeriesChartWidget
useEffect(() => {
  const unsubscribe = dashboardStore.subscribeToWidgetEvents(widget.id, (event) => {
    if (event.eventType === 'assetSelected') {
      setAssetFilter(event.data.assetId);
      refreshData(); // Re-query with asset filter
    }
  });
  return unsubscribe;
}, [widget.id]);

// Query with asset filter
const data = await fetchAssetTelemetry({
  assetId: assetFilter,
  aggregationMethod: 'avg',
  startTime, endTime
});
```

### Pattern 3: Dashboard → Drill-Down → Subpage

**User Flow:**
1. User clicks device in DeviceListWidget
2. Widget emits `deviceClicked` event
3. Dashboard checks if drill-down configured
4. Create subpage dashboard with device context
5. Load subpage dashboard using Dashboard.API

**Implementation:**
```typescript
// In DeviceListWidget
const handleDeviceClick = (deviceId: string) => {
  if (widget.config.drillDownDashboardId) {
    // Navigate to drill-down subpage
    router.push(`/dashboards-v2/${widget.config.drillDownDashboardId}?deviceId=${deviceId}`);
  } else {
    // Emit event for other widgets to filter
    dashboardStore.publishWidgetEvent({
      widgetId: widget.id,
      eventType: 'deviceSelected',
      data: { deviceId }
    });
  }
};

// Create subpage with device context
const createDrillDownSubpage = async (parentId: string, deviceId: string) => {
  const subpage = await createDashboard({
    name: `Device Details - ${deviceName}`,
    parentDashboardId: parentId,
    type: 'SubPage',
    layout: { /* ... */ },
    widgets: [
      { type: 'kpi', config: { deviceId } },
      { type: 'chart', config: { deviceId, fields: ['temperature'] } }
    ]
  });
};
```

---

## 🧪 Testing Plan

### Phase 1: CRUD Operations (Dashboard.API)
✅ Frontend proxy configured  
🔜 Restart Next.js dev server  
🔜 Test dashboard creation via browser  
🔜 Test auto-save (PUT on widget changes)  
🔜 Test dashboard deletion  
🔜 Test search with tags  

### Phase 2: Field Mappings (Device.API)
🔜 Create `lib/api/deviceTypes.ts`  
🔜 Load device types in ConfigurationPanel  
🔜 Display field mappings with friendly names  
🔜 Implement field drag-and-drop selector  
🔜 Save selected fields to widget config  

### Phase 3: Live Data (Query.API)
🔜 Create `lib/api/widgetData.ts`  
🔜 Replace mock data in TimeSeriesChartWidget  
🔜 Test real-time data loading  
🔜 Implement auto-refresh polling  
🔜 Test aggregation intervals  
🔜 Test KPI calculations  

### Phase 4: Asset Hierarchy (DigitalTwin.API)
🔜 Create `lib/api/assets.ts`  
🔜 Load asset tree in DigitalTwinTreeWidget  
🔜 Test tree expansion/collapse  
🔜 Implement asset selection event  
🔜 Test cross-widget filtering by asset  

### Phase 5: User Preferences (Preferences.API)
🔜 Add proxy configuration  
🔜 Create `lib/api/preferences.ts`  
🔜 Load preferences on dashboard list page  
🔜 Implement favorites toggle  
🔜 Track recently viewed  
🔜 Persist auto-refresh settings  

---

## 📊 Progress Tracking

**Story Completion:**
- ✅ Story 4.1: Dashboard CRUD & Layout (34 points)
- 🟡 Story 4.2: Data Source & Field Binding (21 points) - Needs Device.API integration
- ✅ Story 4.3: Time-Series Charts (13 points) - Mock data works, needs Query.API
- ✅ Story 4.4: KPI Cards & Gauges (8 points) - Mock data works, needs Query.API
- ✅ Story 4.5: Device Lists & Data Tables (13 points) - Mock data works, needs Device.API
- 🟡 Story 4.6: Map Widgets (21 points) - Placeholder exists, needs Leaflet
- 🟡 Story 4.7: Digital Twin Tree & 3D (34 points) - Tree placeholder exists, needs DigitalTwin.API
- 🔴 Story 4.8: Widget Interactions & Linking (21 points) - Event bus exists, needs implementation
- 🔴 Story 4.9: Templates & Reusability (13 points) - Backend supports, needs frontend
- 🔴 Story 4.10: Publishing & Permissions (13 points) - Backend supports, needs frontend
- 🔴 Story 4.11: Runtime Optimization (13 points) - Caching, refresh, performance

**Total Points:** 196  
**Completed:** ~70 points (36%)  
**In Progress:** ~60 points (31%)  
**Remaining:** ~66 points (33%)

---

## 🚀 Next Steps

1. **Restart Next.js dev server** (proxy config takes effect)
2. **Test Dashboard CRUD with live backend** (browser automation)
3. **Create API client files**:
   - `lib/api/deviceTypes.ts`
   - `lib/api/widgetData.ts`
   - `lib/api/assets.ts`
   - `lib/api/preferences.ts`
4. **Integrate Device.API** for field mappings (Story 4.2)
5. **Integrate Query.API** for live widget data (Stories 4.3, 4.4, 4.5)
6. **Integrate DigitalTwin.API** for asset hierarchy (Story 4.7)
7. **Complete remaining stories** (4.8, 4.9, 4.10, 4.11)
8. **Performance testing and optimization**

---

**Last Updated:** December 10, 2025  
**Owner:** Platform Team  
**Status:** Ready for Implementation

