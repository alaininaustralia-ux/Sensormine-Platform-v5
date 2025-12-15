# Dashboard V2 - Status & Implementation Plan

**Last Updated:** December 11, 2025  
**Current Phase:** Backend Integration & Widget Configuration

---

## 📊 Story Completion Status

### Epic 4: Dashboard Designer V2 (196 Total Story Points)

| Story | Points | Status | Completion | Notes |
|-------|--------|--------|------------|-------|
| **4.1 Dashboard CRUD & Layout** | 34 | ✅ Complete | 100% | List, create, design page, mode switching, drag-and-drop layout |
| **4.2 Data Source & Field Binding** | 21 | 🟡 Partial | 30% | Configuration panel exists, needs Device Type API integration |
| **4.3 Time-Series Charts** | 13 | ✅ Complete | 100% | 5 chart types, multi-series, Recharts integration |
| **4.4 KPI Cards & Gauges** | 8 | ✅ Complete | 100% | KPI with trend, gauge widget |
| **4.5 Device Lists & Data Tables** | 13 | 🟡 Partial | 50% | UI complete, needs live data from Device/Query APIs |
| **4.6 Map Widgets** | 21 | 🔴 Not Started | 0% | Placeholder exists, needs Leaflet integration |
| **4.7 Digital Twin Tree & 3D** | 34 | 🟡 Partial | 20% | Placeholder exists, needs DigitalTwin API integration |
| **4.8 Widget Interactions & Linking** | 21 | 🔴 Not Started | 0% | Event bus exists, needs widget implementation |
| **4.9 Templates & Reusability** | 13 | 🔴 Not Started | 0% | Backend supports templates |
| **4.10 Publishing & Permissions** | 13 | 🔴 Not Started | 0% | Backend supports sharing |
| **4.11 Runtime Optimization** | 13 | 🔴 Not Started | 0% | Performance tuning |

### Summary
- **✅ Completed:** 55 points (28%)
- **🟡 In Progress:** 47 points (24%)
- **🔴 Remaining:** 94 points (48%)

---

## 🔄 Recent Bug Fixes (Dec 11, 2025)

### Fixed Issues:
1. **Settings Property Access Error** ✅
   - Made `Dashboard.settings` optional in type definition
   - Added optional chaining in design page: `currentDashboard?.settings?.autoRefresh`
   - Backend doesn't return settings field, frontend now handles gracefully

2. **Dashboard List Not Loading** 🟡 (Partially Fixed)
   - Issue: Dashboard list page shows "No dashboards found" after creation
   - Root Cause: Page has comment `// In real app, call API here` - never loads from backend
   - Status: Dashboard was successfully created and saved in backend
   - **TODO:** Add `loadDashboards()` method to store and call from page

3. **Proxy Configuration** ✅
   - All 11 API routes configured in next.config.ts
   - Dashboard.API port corrected to 5298
   - Tenant ID format fixed in backend (GUID parsing)

---

## 🎯 Current Priority: Widget Configuration UX

### Required Changes:

#### 1. Widget Header Icons (High Priority)
**Current State:** Configuration panel opens when clicking widget  
**Required State:**
- **Configure Icon:** Cog icon (⚙️) in widget header → Opens side configuration panel
- **Delete Icon:** Trash icon (🗑️) in widget header → Deletes widget (with confirmation)
- **Drag Handle:** Icon in header for drag-and-drop reordering
- **Status Icons:** Connection status, data loading indicator

**Files to Modify:**
- `src/Web/sensormine-web/src/components/dashboard-v2/WidgetRenderer.tsx`
- `src/Web/sensormine-web/src/components/dashboard-v2/WidgetHeader.tsx` (create)

#### 2. Configuration Panel - Widget-Specific (High Priority)
**Current State:** Generic 3-tab panel (Data/Appearance/Behavior)  
**Required State:**
- Different configuration UI for each widget type
- Start with Device List Widget configuration
- Configuration options vary by widget capabilities

**Widget Type Configurations:**

**Device List Widget Config:**
```typescript
interface DeviceListConfig {
  // Data Tab
  deviceTypeId?: string;          // Select from DeviceType API
  digitalTwinNodeId?: string;     // Select from DigitalTwin hierarchy
  fields: FieldSelection[];       // From DeviceType field mappings
  includeStatus: boolean;         // Show online/offline/alarm
  includeCustomFields: string[];  // From DeviceType custom fields
  
  // Appearance Tab
  showHeader: boolean;
  showPagination: boolean;
  rowsPerPage: number;
  compactMode: boolean;
  
  // Behavior Tab
  enableSelection: boolean;       // Master-detail pattern
  onRowClick: 'select' | 'navigate' | 'none';
  drillDownDashboardId?: string;
}
```

**Time-Series Chart Config:**
```typescript
interface TimeSeriesChartConfig {
  // Data Tab
  deviceTypeId?: string;
  digitalTwinNodeId?: string;
  series: SeriesConfig[];         // Each series = 1 field
  timeRange: TimeRange;
  aggregation: AggregationConfig;
  
  // Appearance Tab
  chartType: 'line' | 'bar' | 'area' | 'scatter' | 'step';
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  
  // Behavior Tab
  enableZoom: boolean;
  enablePan: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}
```

#### 3. Device Type Field Selection UI
**Requirements:**
- Dropdown: Select Device Type (from `/api/devicetype`)
- Display: Device type name, description, device count
- On Selection: Load field mappings (`/api/devicetype/{id}/fields`)
- Field List: Show all queryable fields with:
  - ✓ Checkbox for selection
  - Friendly name (bold)
  - Schema field name (gray, small)
  - Data type badge (number, string, boolean)
  - Unit (if applicable)
  - Sample value from live data
- Drag-and-drop to reorder selected fields
- Filter: Show only `isQueryable: true` fields

---

## 🏗️ Implementation Plan

### Phase 1: Load Dashboard List (Immediate)
**Duration:** 1 hour  
**Story:** Fix dashboard list loading

1. Add `loadDashboards()` to dashboard-v2-store.ts
2. Call GET `/api/dashboards` with X-Tenant-Id header
3. Update `dashboards` state with response
4. Call from page useEffect on mount
5. Test: Create dashboard → Navigate to list → See dashboard

**Files:**
- `src/Web/sensormine-web/src/lib/stores/dashboard-v2-store.ts`
- `src/Web/sensormine-web/src/app/dashboards-v2/page.tsx`

---

### Phase 2: Widget Header with Actions (High Priority)
**Duration:** 3 hours  
**Story:** 4.1 (remaining configuration UX)

#### Step 1: Create WidgetHeader Component
```tsx
// src/Web/sensormine-web/src/components/dashboard-v2/WidgetHeader.tsx
interface WidgetHeaderProps {
  widget: Widget;
  mode: 'view' | 'design' | 'configure';
  onConfigure: () => void;
  onDelete: () => void;
}
```

**Features:**
- Title (editable in design mode)
- Status indicator (connected, loading, error)
- Action icons (visible in design mode):
  - ⚙️ Configure → Opens side panel
  - 🗑️ Delete → Confirmation dialog
  - ⋮ More menu → Duplicate, export data
- Drag handle for reordering

#### Step 2: Update WidgetRenderer
- Add WidgetHeader to all widgets
- Pass callbacks for configure and delete
- Show/hide action icons based on mode

#### Step 3: Configure Button Behavior
- Click cog icon → Call `setSelectedWidgetForConfig(widget.id)` in store
- Store state `selectedWidgetForConfig: string | null`
- ConfigurationPanel visibility: `selectedWidgetForConfig !== null`
- Close panel: Set to null

**Files:**
- `src/Web/sensormine-web/src/components/dashboard-v2/WidgetHeader.tsx` (create)
- `src/Web/sensormine-web/src/components/dashboard-v2/WidgetRenderer.tsx`
- `src/Web/sensormine-web/src/lib/stores/dashboard-v2-store.ts`
- `src/Web/sensormine-web/src/app/dashboards-v2/[id]/design/page.tsx`

---

### Phase 3: Device Type API Integration (High Priority)
**Duration:** 4 hours  
**Story:** 4.2 (Data Source Selection)

#### Step 1: Create DeviceType API Client
```tsx
// src/Web/sensormine-web/src/lib/api/deviceTypes.ts
export async function getDeviceTypes(): Promise<DeviceType[]>
export async function getDeviceType(id: string): Promise<DeviceType>
export async function getFieldMappings(deviceTypeId: string): Promise<FieldMapping[]>
export async function syncFieldsFromSchema(deviceTypeId: string): Promise<void>
```

#### Step 2: Create Device Type Selector Component
```tsx
// src/Web/sensormine-web/src/components/dashboard-v2/config/DeviceTypeSelector.tsx
interface DeviceTypeSelectorProps {
  value?: string;
  onChange: (deviceTypeId: string) => void;
}
```

**UI:**
- Combobox/Select with search
- Each option shows:
  - Device type name
  - Description (gray text)
  - Device count badge
- On selection: Emit deviceTypeId

#### Step 3: Create Field Mapping Selector
```tsx
// src/Web/sensormine-web/src/components/dashboard-v2/config/FieldMappingSelector.tsx
interface FieldMappingSelectorProps {
  deviceTypeId: string;
  selectedFields: string[];
  onChange: (fieldNames: string[]) => void;
  multiSelect?: boolean;
}
```

**UI:**
- Load field mappings from API when deviceTypeId changes
- Filter: Only show `isQueryable: true` fields
- List with checkboxes (multi-select) or radio buttons (single-select)
- Each field shows:
  - ✓ Checkbox
  - Friendly name (bold)
  - Schema field name (gray)
  - Data type badge
  - Unit (if applicable)
- Selected fields highlighted
- Drag-and-drop to reorder (using dnd-kit)

**Backend Endpoints:**
```
GET /api/devicetype → List all device types
GET /api/devicetype/{id} → Get device type details
GET /api/devicetype/{id}/fields → Get field mappings
```

**Files:**
- `src/Web/sensormine-web/src/lib/api/deviceTypes.ts` (create)
- `src/Web/sensormine-web/src/lib/types/device-types.ts` (create)
- `src/Web/sensormine-web/src/components/dashboard-v2/config/DeviceTypeSelector.tsx` (create)
- `src/Web/sensormine-web/src/components/dashboard-v2/config/FieldMappingSelector.tsx` (create)

---

### Phase 4: Digital Twin Hierarchy Selector (High Priority)
**Duration:** 3 hours  
**Story:** 4.2 + 4.7 (Partial)

#### Step 1: Create Asset API Client
```tsx
// src/Web/sensormine-web/src/lib/api/assets.ts
export async function getRootAssets(): Promise<Asset[]>
export async function getAssetChildren(parentId: string): Promise<Asset[]>
export async function getAssetTree(assetId: string): Promise<AssetTree>
export async function getAssetDevices(assetId: string): Promise<Device[]>
```

#### Step 2: Create Asset Tree Selector Component
```tsx
// src/Web/sensormine-web/src/components/dashboard-v2/config/AssetTreeSelector.tsx
interface AssetTreeSelectorProps {
  value?: string; // Selected asset ID
  onChange: (assetId?: string) => void;
}
```

**UI:**
- Tree view with expand/collapse nodes
- Load children on expand (lazy loading)
- Icons by asset type (Site, Building, Floor, Equipment)
- Single selection with radio button
- Breadcrumb shows selected path
- "Clear Selection" button

**Backend Endpoints:**
```
GET /api/assets/roots → Get root assets
GET /api/assets/{id}/children → Get child assets
GET /api/assets/{id} → Get asset details
```

**Files:**
- `src/Web/sensormine-web/src/lib/api/assets.ts` (create)
- `src/Web/sensormine-web/src/lib/types/assets.ts` (create)
- `src/Web/sensormine-web/src/components/dashboard-v2/config/AssetTreeSelector.tsx` (create)

---

### Phase 5: Device List Widget - Configuration (High Priority)
**Duration:** 4 hours  
**Story:** 4.5 (Complete)

#### Step 1: Create DeviceListConfig Component
```tsx
// src/Web/sensormine-web/src/components/dashboard-v2/config/DeviceListConfig.tsx
```

**Data Tab:**
- Device Type Selector
- Asset Tree Selector (optional filter)
- Field Mapping Selector (multi-select)
- Include Status checkbox
- Include Custom Fields multi-select

**Appearance Tab:**
- Show Header checkbox
- Show Pagination checkbox
- Rows Per Page slider (10-100)
- Compact Mode checkbox

**Behavior Tab:**
- Enable Selection checkbox
- On Row Click: 'select' | 'navigate' | 'none'
- Drill-Down Dashboard selector (if navigate)

#### Step 2: Update DeviceListWidget
- Read config from widget.config
- Render based on configuration
- If no config, show "Configure this widget" message

#### Step 3: Connect Configuration Panel
- In ConfigurationPanel, switch based on widget type:
  ```tsx
  {selectedWidget.type === 'deviceList' && <DeviceListConfig ... />}
  {selectedWidget.type === 'timeSeriesChart' && <TimeSeriesChartConfig ... />}
  ```

**Files:**
- `src/Web/sensormine-web/src/components/dashboard-v2/config/DeviceListConfig.tsx` (create)
- `src/Web/sensormine-web/src/components/dashboard-v2/widgets/DeviceListWidget.tsx`
- `src/Web/sensormine-web/src/components/dashboard-v2/ConfigurationPanel.tsx`

---

### Phase 6: Device List Widget - Live Data (High Priority)
**Duration:** 5 hours  
**Story:** 4.5 (Complete)

#### Step 1: Create Device API Client
```tsx
// src/Web/sensormine-web/src/lib/api/devices.ts
export async function getDevices(params: DeviceQueryParams): Promise<DeviceListResponse>
export async function getDevice(id: string): Promise<Device>
export async function getDevicesByType(deviceTypeId: string): Promise<Device[]>
export async function getDevicesByAsset(assetId: string): Promise<Device[]>
```

#### Step 2: Create Query API Client for Widget Data
```tsx
// src/Web/sensormine-web/src/lib/api/widgetData.ts
export async function getDeviceListData(config: DeviceListConfig): Promise<DeviceWithTelemetry[]>
```

**Query Logic:**
1. Call Device API with filters (deviceTypeId, assetId)
2. Get list of matching devices
3. For each device, get latest telemetry for selected fields
4. Combine device metadata + field values
5. Return as table rows

#### Step 3: Update DeviceListWidget with Data Fetching
- useEffect hook: Fetch data when config changes
- Loading state with skeleton
- Error handling with retry
- Empty state if no devices
- Pagination controls

**Backend Endpoints:**
```
GET /api/device?deviceTypeId={id}&assetId={id} → Filtered devices
GET /api/widgetdata/devices-with-telemetry?deviceIds={ids}&fields={fields}
```

**Files:**
- `src/Web/sensormine-web/src/lib/api/devices.ts` (create)
- `src/Web/sensormine-web/src/lib/api/widgetData.ts` (create)
- `src/Web/sensormine-web/src/components/dashboard-v2/widgets/DeviceListWidget.tsx`

---

### Phase 7: Time-Series Chart Configuration (Medium Priority)
**Duration:** 5 hours  
**Story:** 4.2 + 4.3 (Complete)

#### Components:
- TimeSeriesChartConfig.tsx
- SeriesBuilder.tsx (add/remove series, configure each)
- TimeRangeSelector.tsx (relative or absolute)
- AggregationSelector.tsx (avg, sum, min, max, etc.)

#### Integration:
- Update TimeSeriesChartWidget to use config
- Fetch data from Query.API widgetdata/historical endpoint
- Support multi-series with different fields
- Color coding per series

---

### Phase 8: Dashboard-Level Filtering (Medium Priority)
**Duration:** 4 hours  
**Story:** 4.2 (Complete)

#### Dashboard Filter Bar Component:
```tsx
// src/Web/sensormine-web/src/components/dashboard-v2/DashboardFilterBar.tsx
```

**Features:**
- Asset Tree selector (dashboard-wide filter)
- Time Range selector (dashboard-wide default)
- Active filters displayed as chips
- "Clear All Filters" button
- Filters stored in dashboard state
- All widgets receive filter context

**Filter Propagation:**
- Store filters in dashboard-v2-store
- Each widget receives filters as props
- Widget queries include filter parameters
- Visual indicator on widgets when filtered

---

## 📋 API Integration Reference

### Device.API (Port 5293)
```
GET /api/device → List devices (with filters)
GET /api/device/{id} → Get device details
GET /api/devicetype → List device types
GET /api/devicetype/{id} → Get device type details
GET /api/devicetype/{id}/fields → Get field mappings
PUT /api/devicetype/{id}/fields → Update field mappings
POST /api/devicetype/{id}/fields/sync → Sync from schema
```

### DigitalTwin.API (Port 5297)
```
GET /api/assets/roots → Get root assets
GET /api/assets/{id} → Get asset details
GET /api/assets/{id}/children → Get child assets
GET /api/assets/{id}/tree → Get full subtree
GET /api/assets/{id}/devices → Get devices at asset
```

### Query.API (Port 5079)
```
GET /api/widgetdata/realtime → Latest values
GET /api/widgetdata/historical → Time-series data
GET /api/kpidata/summary → KPI aggregations
GET /api/widgetdata/devices-with-telemetry → Devices + data
POST /api/query/telemetry → Advanced query
```

### Dashboard.API (Port 5298)
```
GET /api/dashboards → List dashboards
GET /api/dashboards/{id} → Get dashboard
POST /api/dashboards → Create dashboard
PUT /api/dashboards/{id} → Update dashboard
DELETE /api/dashboards/{id} → Delete dashboard
```

---

## 🧪 Testing Plan

### Phase 1: Manual Testing (Browser Automation)
1. ✅ Create dashboard → List page shows new dashboard
2. ✅ Edit dashboard → Design page loads
3. ✅ Add widget → Widget appears on canvas
4. 🔴 Configure widget → Side panel opens with device type selector
5. 🔴 Select device type → Field mappings load
6. 🔴 Select fields → Preview shows sample data
7. 🔴 Apply configuration → Widget displays real data
8. 🔴 Save dashboard → Changes persist to backend

### Phase 2: Integration Tests
- Test Device Type API endpoints
- Test Asset hierarchy loading
- Test Query API with different configurations
- Test dashboard CRUD operations

### Phase 3: End-to-End Tests
- Complete dashboard creation workflow
- Widget configuration workflow
- Filter application and propagation
- Dashboard publish and share

---

## 📦 Dependencies & Libraries

### Already Installed:
- ✅ react-grid-layout (drag-and-drop layout)
- ✅ recharts (charting)
- ✅ @dnd-kit/core (future drag-and-drop)
- ✅ lucide-react (icons)
- ✅ shadcn/ui components

### Need to Install:
- 🔴 @tanstack/react-query (data fetching, caching, auto-refresh)
- 🔴 react-leaflet (maps)
- 🔴 @react-three/fiber (3D viewer - optional)

---

## 🎯 Next Actions (Priority Order)

1. **Immediate (Today):**
   - ✅ Fix settings error → DONE
   - 🔴 Fix dashboard list loading
   - 🔴 Add WidgetHeader with configure/delete icons

2. **High Priority (This Week):**
   - 🔴 Create DeviceType API client
   - 🔴 Build Device Type selector component
   - 🔴 Build Field Mapping selector component
   - 🔴 Implement Device List widget configuration
   - 🔴 Connect Device List to live data

3. **Medium Priority (Next Week):**
   - 🔴 Asset tree selector component
   - 🔴 Dashboard-level filtering
   - 🔴 Time-Series Chart configuration
   - 🔴 KPI Card configuration

4. **Lower Priority (Future Sprints):**
   - 🔴 Widget interactions and linking
   - 🔴 Templates and reusability
   - 🔴 Publishing and permissions
   - 🔴 Runtime optimization

---

**Status Legend:**
- ✅ Complete
- 🟡 In Progress / Partial
- 🔴 Not Started
- ⚠️ Blocked / Issue

