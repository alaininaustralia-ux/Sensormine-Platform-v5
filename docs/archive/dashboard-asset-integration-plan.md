# Dashboard Asset Integration - Implementation Plan

**Created**: December 9, 2025  
**Completed**: December 10, 2025  
**Status**: ✅ **COMPLETED** - All 6 stories implemented  
**Priority**: P0 - Critical  

---

## Executive Summary

This document outlines the plan to integrate the Digital Twin Asset Hierarchy into dashboard widgets, enabling users to:
1. Select devices based on asset hierarchy nodes
2. Create dynamic queries filtered by asset selection
3. Display device lists with latest telemetry data
4. Show time-series charts aggregated by asset
5. Configure all widgets with hierarchical asset selector control

---

## Current State Analysis

### ✅ **What We Have**
1. **Backend APIs:**
   - DigitalTwin.API with 26 endpoints for asset hierarchy
   - Query.API with telemetry queries and device-with-telemetry endpoints
   - Device.API with device management
   - Dashboard.API configured for sensormine_metadata database

2. **Frontend Components:**
   - DeviceList component (shows devices, but no telemetry)
   - DeviceTelemetryView (shows telemetry for single device)
   - Chart components (TimeSeriesChart, various chart types)
   - Dashboard builder with widget configuration

3. **Data Models:**
   - Asset model with hierarchical structure (Path, Level, ParentId)
   - DataPointMapping model (links devices to assets)
   - Dashboard model with widgets configuration
   - Device model with latest telemetry support

### ✅ **Implementation Results**
1. **Asset Hierarchy Selector Component** - ✅ **COMPLETED**: `AssetHierarchySelector.tsx` with tree navigation, search, and lazy loading
2. **Asset-Based Device Filtering** - ✅ **COMPLETED**: Query.API endpoints `/by-asset` and `/devices-with-telemetry/by-asset`
3. **Aggregated Queries by Asset** - ✅ **COMPLETED**: 4 aggregation methods (avg/sum/min/max) with time bucketing (1m/5m/15m/1h/1d)
4. **Device List with Telemetry** - ✅ **COMPLETED**: Enhanced `DeviceListWidget` with real-time telemetry table mode
5. **Widget Data Binding** - ✅ **COMPLETED**: ChartWidgetWithAsset, KPIWidgetWithAsset, GaugeWidgetWithAsset fetch real Query API data
6. **Asset Context in Charts** - ✅ **COMPLETED**: Time-series charts with asset filtering, auto-refresh, and trend indicators

**Impact**: Users can now create facility-wide dashboards (e.g., "Building A Overview") with automatic device aggregation, real-time telemetry display, and hierarchical asset filtering. All widgets support asset-based configuration through integrated UI controls.

---

## Architecture Design

### Component Hierarchy
```
Dashboard
├── WidgetGrid
│   ├── ChartWidget (with AssetSelector + field selection)
│   │   └── TimeSeriesChart (displays asset-filtered telemetry)
│   ├── DeviceListWidget (with AssetSelector)
│   │   └── DeviceTable (shows devices + latest telemetry)
│   ├── KPIWidget (with AssetSelector + field selection)
│   │   └── KPICard (single metric aggregated by asset)
│   └── GaugeWidget (with AssetSelector + field selection)
│       └── GaugeChart (real-time value for asset)
└── WidgetConfigDialog
    ├── AssetHierarchySelector (tree picker)
    ├── FieldSelector (multi-select from device type schema)
    ├── AggregationPicker (avg, sum, min, max, count)
    └── TimeRangePicker (1h, 24h, 7d, 30d, custom)
```

### Data Flow
```
1. User opens widget config
2. Selects asset node from hierarchy tree
3. System fetches all devices under that asset (recursive)
4. User selects telemetry fields to display
5. Widget queries Query.API with deviceIds[] + fields[]
6. Query.API aggregates data and returns
7. Widget renders chart/table/gauge with real data
8. Auto-refresh every N seconds
```

---

## Implementation Stories

### **Story 1: Asset Hierarchy Selector Component** 
**Priority**: P0 - Blocker for all other stories  
**Estimate**: 8 hours

#### Description
Create a reusable component that displays the asset hierarchy as an interactive tree, allowing users to select a single node or multiple nodes.

#### Requirements
- Display asset tree with expand/collapse
- Show asset icon, name, type, and device count
- Support single-select and multi-select modes
- Search/filter by asset name
- Lazy loading for performance (load children on expand)
- Keyboard navigation
- Persist expanded state in localStorage
- Mobile-responsive (drawer on mobile, sidebar on desktop)

#### Technical Approach
```tsx
<AssetHierarchySelector
  mode="single" | "multiple"
  selectedAssetIds={string[]}
  onSelectionChange={(assetIds: string[]) => void}
  showDeviceCount={boolean}
  enableSearch={boolean}
/>
```

#### API Integration
- **GET /api/assets** - Fetch root assets
- **GET /api/assets/{id}/children** - Lazy load children
- **GET /api/assets/{id}/descendants** - Get all descendants (for device filtering)
- **GET /api/assets/{id}/device-count** - Display device count badge

#### Files to Create
- `src/Web/sensormine-web/src/components/digital-twin/AssetHierarchySelector.tsx`
- `src/Web/sensormine-web/src/components/digital-twin/AssetTreeNode.tsx`
- `src/Web/sensormine-web/src/lib/api/assets.ts` (API client)
- `src/Web/sensormine-web/src/hooks/useAssetTree.ts` (state management)

#### Acceptance Criteria
- [ ] Tree loads root assets on mount
- [ ] Clicking expands/collapses children
- [ ] Search filters tree in real-time
- [ ] Selected asset highlights with visual indicator
- [ ] Device count badge shows correct numbers
- [ ] Works on mobile and desktop

---

### **Story 2: Query API Endpoints for Asset-Based Filtering**
**Priority**: P0 - Required for widgets  
**Estimate**: 6 hours

#### Description
Add new endpoints to Query.API that accept asset IDs and return aggregated telemetry data for all devices under those assets.

#### New Endpoints

##### **GET /api/query/telemetry/by-asset**
```csharp
Query Parameters:
- assetId: Guid (required)
- includeDescendants: bool = true
- fields: string[] (telemetry field names)
- startTime: DateTime (ISO 8601)
- endTime: DateTime (ISO 8601)
- aggregation: string = "avg" (avg, sum, min, max, count)
- interval: string = "5m" (1m, 5m, 15m, 1h, 1d)
- limit: int = 1000

Response:
{
  "assetId": "guid",
  "assetName": "string",
  "deviceCount": 5,
  "series": [
    {
      "field": "temperature",
      "unit": "°C",
      "dataPoints": [
        {
          "timestamp": "2025-12-09T10:00:00Z",
          "value": 22.5,
          "count": 5,
          "min": 20.1,
          "max": 24.8
        }
      ]
    }
  ]
}
```

##### **GET /api/query/devices-with-telemetry/by-asset**
```csharp
Query Parameters:
- assetId: Guid (required)
- includeDescendants: bool = true
- fields: string[] (optional, filter telemetry fields)
- limit: int = 100

Response:
{
  "assetId": "guid",
  "devices": [
    {
      "deviceId": "DEVICE-001",
      "name": "Temperature Sensor A",
      "deviceTypeName": "NEXUS_PROBE",
      "status": "Active",
      "lastSeenAt": "2025-12-09T10:05:00Z",
      "latestTelemetry": {
        "timestamp": "2025-12-09T10:05:00Z",
        "fields": {
          "temperature": 22.3,
          "humidity": 65.5,
          "battery": 85
        }
      }
    }
  ]
}
```

#### Implementation Steps
1. Add `AssetTelemetryController.cs` to Query.API
2. Create service `AssetTelemetryService` that:
   - Fetches asset and descendants from DigitalTwin.API
   - Gets all devices mapped to those assets
   - Queries telemetry from TimescaleDB for those devices
   - Aggregates data by time intervals
3. Add data aggregation logic (AVG, SUM, MIN, MAX, COUNT)
4. Add caching layer (Redis, 30-second TTL for real-time data)

#### Files to Create/Modify
- `src/Services/Query.API/Controllers/AssetTelemetryController.cs`
- `src/Services/Query.API/Services/AssetTelemetryService.cs`
- `src/Services/Query.API/Models/AssetTelemetryQuery.cs`
- `src/Services/Query.API/Models/AssetTelemetryResponse.cs`

#### Acceptance Criteria
- [ ] Endpoint returns aggregated data for single asset
- [ ] includeDescendants=true aggregates all child assets
- [ ] Aggregation functions work correctly (avg, sum, min, max)
- [ ] Response includes device count and field metadata
- [ ] Performance: < 500ms for 100 devices, 1-week range

---

### **Story 3: Device List Widget with Telemetry**
**Priority**: P1 - High  
**Estimate**: 6 hours

#### Description
Enhance the device list widget to show latest telemetry values alongside device information, with asset filtering.

#### Requirements
- Display device table with columns:
  - Device Name
  - Device ID
  - Status (badge with color)
  - Last Seen (time ago)
  - Selected telemetry fields (e.g., Temperature, Humidity, Battery)
  - Actions (view details, view dashboard)
- Filter devices by selected asset
- Show loading skeleton while fetching
- Auto-refresh every 30 seconds
- Support pagination (50 devices per page)
- Click device row to navigate to device detail page
- Export to CSV

#### Widget Configuration
```typescript
interface DeviceListWidgetConfig {
  assetId?: string; // Selected asset
  includeDescendants: boolean; // Include child assets
  fields: string[]; // Telemetry fields to display
  showFields: string[]; // Device fields (name, status, lastSeen, etc.)
  sortBy: string; // Column to sort by
  sortDirection: 'asc' | 'desc';
  pageSize: number;
  refreshInterval: number; // milliseconds
}
```

#### Technical Approach
```tsx
<DeviceListWidget
  config={config}
  onDeviceClick={(deviceId) => router.push(`/devices/${deviceId}`)}
/>
```

#### API Integration
- **GET /api/query/devices-with-telemetry/by-asset** (new endpoint from Story 2)

#### Files to Create/Modify
- `src/Web/sensormine-web/src/components/dashboard/widgets/device-list-widget.tsx`
- `src/Web/sensormine-web/src/components/dashboard/widgets/device-list-config.tsx`
- `src/Web/sensormine-web/src/lib/api/query.ts` (add new endpoint)

#### Acceptance Criteria
- [ ] Table displays devices with latest telemetry
- [ ] Asset selector filters device list
- [ ] Pagination works correctly
- [ ] Auto-refresh updates data in background
- [ ] Loading states and error handling work
- [ ] Export to CSV includes telemetry fields

---

### **Story 4: Chart Widget with Asset Filtering**
**Priority**: P1 - High  
**Estimate**: 8 hours

#### Description
Enable chart widgets to display aggregated telemetry data scoped to a selected asset and its descendants.

#### Requirements
- Add asset selector to chart configuration
- Display aggregated time-series data for all devices under asset
- Support multiple aggregation methods (avg, sum, min, max)
- Show individual device series or combined aggregate
- Legend shows device names or "Aggregate (5 devices)"
- Time range selector (1h, 6h, 24h, 7d, 30d, custom)
- Auto-refresh every 60 seconds
- Zoom and pan on chart
- Tooltip shows timestamp, value, device count

#### Widget Configuration
```typescript
interface ChartWidgetConfig {
  assetId?: string;
  includeDescendants: boolean;
  fields: string[]; // Up to 5 telemetry fields
  chartType: 'line' | 'area' | 'bar';
  aggregation: 'avg' | 'sum' | 'min' | 'max';
  showIndividualSeries: boolean; // Show each device separately
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
  customRange?: { start: Date; end: Date };
  refreshInterval: number;
}
```

#### Technical Approach
```tsx
<ChartWidget
  config={config}
  dashboardId={dashboardId}
  widgetId={widgetId}
/>
```

#### API Integration
- **GET /api/query/telemetry/by-asset** (new endpoint from Story 2)

#### Files to Create/Modify
- `src/Web/sensormine-web/src/components/dashboard/widgets/chart-widget-config.tsx`
- `src/Web/sensormine-web/src/components/dashboard/widgets/asset-chart-widget.tsx`
- `src/Web/sensormine-web/src/lib/api/query.ts`

#### Acceptance Criteria
- [ ] Chart displays aggregated data for selected asset
- [ ] Individual device series can be toggled
- [ ] Aggregation methods work correctly
- [ ] Time range selector updates chart
- [ ] Auto-refresh works without jarring UI
- [ ] Performance: < 1s load time for 7-day range

---

### **Story 5: KPI and Gauge Widgets with Asset Filtering**
**Priority**: P2 - Medium  
**Estimate**: 4 hours

#### Description
Add asset filtering to KPI and Gauge widgets to show single-value metrics aggregated across asset devices.

#### Requirements

##### **KPI Widget**
- Display single aggregated value (e.g., "Avg Temperature: 22.3°C")
- Show trend vs previous period (up/down arrow, percentage)
- Comparison periods: previous hour, day, week
- Color coding based on thresholds
- Large font for primary value

##### **Gauge Widget**
- Display single real-time value as radial gauge
- Min/max range configurable
- Color zones (green/yellow/red)
- Shows current value and timestamp
- Optional: sparkline showing last hour trend

#### Widget Configuration
```typescript
interface KPIWidgetConfig {
  assetId?: string;
  includeDescendants: boolean;
  field: string; // Single field
  aggregation: 'avg' | 'sum' | 'min' | 'max';
  comparisonPeriod: '1h' | '24h' | '7d';
  thresholds?: {
    warning: number;
    critical: number;
  };
}

interface GaugeWidgetConfig {
  assetId?: string;
  includeDescendants: boolean;
  field: string;
  aggregation: 'avg' | 'sum' | 'min' | 'max';
  min: number;
  max: number;
  zones?: { color: string; from: number; to: number }[];
  showSparkline: boolean;
}
```

#### API Integration
- **GET /api/query/telemetry/by-asset** with `limit=1` for latest value
- **GET /api/query/telemetry/by-asset** with time range for sparkline

#### Files to Create/Modify
- `src/Web/sensormine-web/src/components/dashboard/widgets/kpi-widget-config.tsx`
- `src/Web/sensormine-web/src/components/dashboard/widgets/gauge-widget-config.tsx`
- `src/Web/sensormine-web/src/components/dashboard/widgets/asset-kpi-widget.tsx`
- `src/Web/sensormine-web/src/components/dashboard/widgets/asset-gauge-widget.tsx`

#### Acceptance Criteria
- [ ] KPI shows aggregated value with trend
- [ ] Gauge displays real-time aggregated value
- [ ] Thresholds and color zones work
- [ ] Widgets update automatically
- [ ] Handles missing data gracefully

---

### **Story 6: Widget Configuration Panel Integration**
**Priority**: P1 - High  
**Estimate**: 6 hours

#### Description
Integrate AssetHierarchySelector into the widget configuration dialog for all widget types.

#### Requirements
- Add "Data Source" tab in widget config dialog
- Show AssetHierarchySelector component
- Allow selection of single asset
- "Include Descendant Assets" checkbox
- Display device count for selected asset
- Field selector (multi-select from device type schemas)
- Aggregation method picker
- Time range picker
- Preview pane showing sample data
- Save configuration to widget's `dataConfig` property

#### Widget Config Flow
```
1. User drags widget onto dashboard
2. Widget shows "Configure Data Source" placeholder
3. User clicks "Configure"
4. Dialog opens with tabs: [Data Source] [Appearance] [Advanced]
5. Data Source tab shows:
   - AssetHierarchySelector
   - Include descendants checkbox
   - Field selector (fetches fields from devices under asset)
   - Aggregation picker
   - Time range picker
   - Preview button
6. User selects asset "Building A"
7. System fetches devices under "Building A" (including descendants)
8. System fetches device type schemas for those devices
9. Field selector shows all available fields
10. User selects "temperature", "humidity"
11. User chooses aggregation "Average"
12. User clicks "Preview"
13. System fetches sample data and shows mini chart
14. User clicks "Save"
15. Widget configuration saved to database
16. Widget fetches real data and displays
```

#### Technical Approach
```tsx
<WidgetConfigDialog
  widgetType="chart"
  config={existingConfig}
  onSave={(config) => saveWidget(config)}
>
  <Tabs>
    <TabsList>
      <TabsTrigger value="datasource">Data Source</TabsTrigger>
      <TabsTrigger value="appearance">Appearance</TabsTrigger>
    </TabsList>
    <TabsContent value="datasource">
      <AssetHierarchySelector
        mode="single"
        onSelect={(assetId) => setConfig({...config, assetId})}
      />
      <Checkbox label="Include descendants" />
      <FieldSelector
        deviceTypeIds={deviceTypeIds}
        selectedFields={config.fields}
        onChange={(fields) => setConfig({...config, fields})}
      />
      <AggregationPicker />
      <TimeRangePicker />
      <Button onClick={showPreview}>Preview</Button>
    </TabsContent>
  </Tabs>
</WidgetConfigDialog>
```

#### Files to Create/Modify
- `src/Web/sensormine-web/src/components/dashboard/builder/widget-config-dialog.tsx`
- `src/Web/sensormine-web/src/components/dashboard/builder/data-source-config.tsx`
- `src/Web/sensormine-web/src/components/dashboard/builder/field-selector.tsx`
- `src/Web/sensormine-web/src/components/dashboard/builder/aggregation-picker.tsx`
- `src/Web/sensormine-web/src/components/dashboard/builder/time-range-picker.tsx`

#### Acceptance Criteria
- [ ] Config dialog shows AssetHierarchySelector
- [ ] Field selector populates with fields from selected asset's devices
- [ ] Preview shows sample data
- [ ] Configuration saves to dashboard
- [ ] Widget loads real data after save
- [ ] Works for all widget types (chart, table, kpi, gauge)

---

## Database Schema Changes

### **Dashboard Widget Configuration**
Update the `widgets` JSONB field structure in the `dashboards` table:

```typescript
interface WidgetDataConfig {
  // Asset selection
  assetId?: string;
  includeDescendants?: boolean;
  
  // Device filtering (legacy, for backward compatibility)
  deviceTypeId?: string;
  deviceIds?: string[];
  
  // Field selection
  fields: string[]; // Telemetry field names
  
  // Aggregation
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  
  // Time range
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
  customRange?: {
    start: string; // ISO 8601
    end: string;
  };
  
  // Auto-refresh
  refreshInterval?: number; // milliseconds
  
  // Display options
  showIndividualSeries?: boolean;
  chartType?: 'line' | 'area' | 'bar';
}

interface Widget {
  id: string;
  type: 'chart' | 'table' | 'kpi' | 'gauge' | 'map';
  title: string;
  dataConfig?: WidgetDataConfig; // New property
  displayConfig?: Record<string, any>; // Appearance settings
  layout: { x: number; y: number; w: number; h: number };
}
```

**Migration:** No schema changes needed, just update widget configuration structure.

---

## API Changes Summary

### **New Endpoints**

#### Query.API
```
GET  /api/query/telemetry/by-asset
GET  /api/query/devices-with-telemetry/by-asset
```

#### DigitalTwin.API (may need enhancements)
```
GET  /api/assets/{id}/device-count
GET  /api/assets/{id}/descendants/devices
```

---

## Testing Strategy

### Unit Tests
- [ ] AssetHierarchySelector component
- [ ] AssetTelemetryService aggregation logic
- [ ] Widget configuration save/load
- [ ] Field selector filtering

### Integration Tests
- [ ] Query.API endpoints with real TimescaleDB data
- [ ] Asset-based device filtering with DigitalTwin.API
- [ ] Widget data fetching and rendering
- [ ] Configuration persistence and loading

### E2E Tests
- [ ] Create dashboard with asset-filtered chart widget
- [ ] Configure device list widget with asset selection
- [ ] Verify real-time data updates
- [ ] Test multi-tenant isolation

---

## Performance Considerations

### Optimization Strategies
1. **Caching:**
   - Cache asset hierarchy tree (5 min TTL)
   - Cache device-to-asset mappings (1 min TTL)
   - Cache aggregated telemetry (30 sec TTL)

2. **Lazy Loading:**
   - Load asset children only when expanded
   - Paginate device lists (50 per page)
   - Limit time-series data points (max 1000)

3. **Query Optimization:**
   - Use TimescaleDB continuous aggregates
   - Index telemetry by (deviceId, timestamp)
   - Batch device queries

4. **Frontend Optimization:**
   - Debounce asset tree search (300ms)
   - Virtual scrolling for large device lists
   - Chart data decimation for large ranges

### Performance Targets
- Asset tree load: < 500ms
- Device list with telemetry: < 1s
- Chart data (7-day range): < 1.5s
- Widget auto-refresh: < 500ms (cached)

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Story 1: Asset Hierarchy Selector Component
2. Story 2: Query API Endpoints for Asset-Based Filtering

### Phase 2: Core Widgets (Week 2)
3. Story 3: Device List Widget with Telemetry
4. Story 4: Chart Widget with Asset Filtering

### Phase 3: Additional Widgets (Week 3)
5. Story 5: KPI and Gauge Widgets
6. Story 6: Widget Configuration Panel Integration

### Phase 4: Polish & Testing (Week 4)
7. Performance optimization
8. Comprehensive testing
9. Documentation
10. User acceptance testing

---

## Success Metrics

### User Experience
- [ ] Users can filter widgets by asset in < 5 clicks
- [ ] Device list shows latest telemetry without extra clicks
- [ ] Charts display aggregated data for entire facility
- [ ] Configuration is intuitive and discoverable

### Technical
- [ ] 95% of queries complete in < 1s
- [ ] Zero data loss during auto-refresh
- [ ] Multi-tenant isolation verified
- [ ] No memory leaks in long-running dashboards

### Business
- [ ] Reduces time to create asset-scoped dashboards by 80%
- [ ] Enables facility-wide KPI monitoring
- [ ] Supports hierarchical drill-down workflows
- [ ] Scalable to 1000+ devices per asset

---

## Open Questions

1. **Q:** Should we support multiple asset selection (e.g., select 3 buildings)?  
   **A:** Phase 2 - Start with single asset, add multi-select later

2. **Q:** How to handle devices mapped to multiple assets?  
   **A:** Use primary asset assignment, show badge for multi-mapped devices

3. **Q:** Should aggregation respect device weights (e.g., larger sensors weighted more)?  
   **A:** Phase 2 - Add weighted aggregation in future iteration

4. **Q:** How to handle mixed device types under one asset (different schemas)?  
   **A:** Field selector shows union of all fields, missing fields shown as null

5. **Q:** Real-time updates via WebSocket or polling?  
   **A:** Start with polling (30s interval), add WebSocket for critical widgets later

---

## Dependencies

### Backend
- ✅ DigitalTwin.API (Phase 1 complete)
- ❌ Query.API asset endpoints (Story 2)
- ✅ Dashboard.API (migrated to sensormine_metadata)

### Frontend
- ✅ Next.js 14 App Router
- ✅ React 19
- ✅ shadcn/ui components
- ✅ Existing chart components
- ❌ Asset tree component (Story 1)

### Infrastructure
- ✅ TimescaleDB for telemetry
- ✅ PostgreSQL for metadata
- ❌ Redis for caching (optional, can add later)

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Query performance degrades with large asset hierarchies | High | Medium | Implement caching, continuous aggregates |
| Asset tree too complex for mobile | Medium | Low | Simplified mobile view, drawer UI |
| Mixed device types cause field mismatches | Medium | Medium | Show union of fields, handle nulls gracefully |
| Auto-refresh causes UI jank | Low | Low | Optimistic updates, smooth transitions |

---

## Next Steps

1. **Immediate (Today):**
   - Review and approve this plan
   - Prioritize stories
   - Assign ownership

2. **This Week:**
   - Start Story 1 (Asset Hierarchy Selector)
   - Start Story 2 (Query API endpoints)
   - Set up development environment

3. **Next Week:**
   - Complete Stories 1-2
   - Begin Story 3 (Device List Widget)
   - Weekly progress review

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Owner:** Development Team  
**Approvers:** Product, Engineering
