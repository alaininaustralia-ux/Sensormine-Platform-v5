# Widget Data Binding - Requirements & Implementation Plan

## Overview
Enable dashboard widgets to automatically fetch and display real-time and historical device data by binding to Device Type schema fields.

## Current State
- ✅ Dashboard builder UI with drag-and-drop widgets
- ✅ Widget configuration panel with field selector
- ✅ Device Type schema integration
- ✅ Field selector component for choosing device fields
- ❌ No actual data fetching from Query API
- ❌ Widgets show mock/demo data instead of real data

## Requirements

### R1: Widget Configuration with Data Binding
**Priority:** P0 - Critical

Widgets must be configurable to bind to specific device data sources:

1. **Data Source Selection**
   - Device Type: Select which device type's data to display
   - Device Filter: Optionally filter to specific device(s)
   - Field Selection: Choose 1+ fields from device type schema
   - Time Range: Select historical range (last 1h, 24h, 7d, custom)
   - Refresh Interval: Auto-refresh every N seconds (optional)

2. **Field Configuration per Widget Type**
   - **Chart:** Multiple fields (up to 5), aggregation method (avg/min/max/sum)
   - **Table:** Multiple fields, show device ID + timestamp + field values
   - **Gauge:** Single numeric field, min/max range, thresholds
   - **KPI:** Single numeric field, comparison period for trend
   - **Map:** Location fields (latitude/longitude) if available

3. **Configuration Persistence**
   - Save configuration as part of widget's `dataConfig` property
   - Include: deviceTypeId, deviceIds[], fields[], timeRange, aggregation, refreshInterval

### R2: Query API Integration
**Priority:** P0 - Critical

Backend API endpoints to serve widget-optimized data:

1. **Endpoint: GET /api/widgetdata/realtime**
   - Purpose: Latest values for real-time widgets (gauges, KPIs, tables)
   - Query params: deviceTypeId, deviceIds[], fields[], limit
   - Response: Array of {deviceId, timestamp, values: {field: value}}
   - Cacheable for 5-30 seconds

2. **Endpoint: GET /api/widgetdata/historical**
   - Purpose: Time-series data for charts
   - Query params: deviceTypeId, deviceIds[], fields[], startTime, endTime, limit
   - Response: Array of {deviceId, timestamp, values: {field: value}}
   - Support for pagination if needed

3. **Endpoint: GET /api/widgetdata/aggregated**
   - Purpose: Pre-aggregated data for performance
   - Query params: deviceTypeId, deviceIds[], fields[], startTime, endTime, interval, aggregation
   - Response: Array of {field, dataPoints: [{timestamp, value, count}]}
   - Aggregation: avg, min, max, sum, count
   - Interval: 1m, 5m, 15m, 1h, 1d

### R3: Widget Data Fetching & Rendering
**Priority:** P0 - Critical

Frontend components to fetch and display data:

1. **Data Fetching Logic**
   - Check if widget has `dataConfig` configured
   - If not configured: show "Configure data source" placeholder
   - If configured: fetch data from appropriate endpoint
   - Handle loading states with spinner
   - Handle errors with error message display
   - Implement auto-refresh if configured

2. **Data Transformation per Widget**
   - **Chart:** Transform to {series: [{name, data: [{x, y}]}]}
   - **Table:** Flatten to rows with columns: [deviceId, timestamp, ...fields]
   - **Gauge:** Extract single latest value
   - **KPI:** Calculate current value + trend vs previous period
   - **Map:** Extract lat/lng coordinates

3. **Widget-Specific Rendering**
   - Chart: Use existing ChartWidget with series data
   - Table: Use existing TableWidget with columns + data
   - Gauge: Use existing GaugeWidget with value
   - KPI: Use existing KPIWidget with value + previousValue
   - Map: Use existing MapWidget with device locations

### R4: Error Handling & Fallbacks
**Priority:** P1 - High

1. **Configuration Validation**
   - Warn if selected fields no longer exist in schema
   - Disable widget if device type deleted
   - Show validation errors in config panel

2. **Runtime Errors**
   - Display friendly error message in widget if API fails
   - Show "No data available" if query returns empty
   - Log errors to console for debugging
   - Don't break dashboard if one widget fails

3. **Loading States**
   - Show spinner while fetching initial data
   - Show subtle indicator during auto-refresh
   - Don't show loading for cached data

### R5: Performance Optimization
**Priority:** P1 - High

1. **Query Optimization**
   - Use aggregated endpoint for large time ranges
   - Implement client-side caching (5-30s TTL)
   - Batch multiple widget requests if possible
   - Limit data points per widget (max 1000 points)

2. **Refresh Strategy**
   - Stagger widget refreshes to avoid thundering herd
   - Pause refresh when dashboard not visible
   - Cancel in-flight requests when dashboard unmounted

## Implementation Plan

### Phase 1: Query API Endpoints (Backend)
**Estimated:** 4 hours

1. Create `WidgetDataController` in Query.API
2. Implement three endpoints: realtime, historical, aggregated
3. Add service layer to query TimescaleDB
4. Implement proper error handling and validation
5. Add Swagger documentation
6. Write unit tests

**Acceptance Criteria:**
- ✅ All three endpoints respond with correct data format
- ✅ Endpoints validate input parameters
- ✅ Empty results return 200 with empty array
- ✅ Invalid requests return 400 with error details
- ✅ Tests cover happy path + error cases

### Phase 2: Widget Data Fetching (Frontend)
**Estimated:** 3 hours

1. Create `useWidgetData` custom hook
   - Accept: widget dataConfig
   - Return: {data, isLoading, error, refetch}
   - Handle auto-refresh with setInterval
   - Cleanup on unmount

2. Update widget components to use hook
   - Keep existing UI components unchanged
   - Add data fetching layer before rendering
   - Show loading/error states
   - Transform data for each widget type

**Acceptance Criteria:**
- ✅ Hook fetches data on mount
- ✅ Hook respects refresh interval
- ✅ Hook cleans up timers on unmount
- ✅ Loading state shown during fetch
- ✅ Error state shown on failure
- ✅ Data prop passed to widget correctly

### Phase 3: Widget-Specific Transformations
**Estimated:** 2 hours

1. Chart transformation: dataPoints → series array
2. Table transformation: dataPoints → table rows
3. Gauge transformation: dataPoints → single value
4. KPI transformation: dataPoints → value + trend
5. Map transformation: dataPoints → locations

**Acceptance Criteria:**
- ✅ Each widget type renders with real data
- ✅ Transformations handle empty data
- ✅ Transformations handle missing fields gracefully
- ✅ Multiple fields work for charts and tables

### Phase 4: Integration Testing
**Estimated:** 2 hours

1. Create test dashboard with all widget types
2. Configure each widget with device type fields
3. Verify data displays correctly
4. Test auto-refresh behavior
5. Test error scenarios (API down, invalid config)
6. Test with different time ranges

**Acceptance Criteria:**
- ✅ All widget types display real data
- ✅ Auto-refresh works without memory leaks
- ✅ Errors display gracefully
- ✅ Configuration persists across page reloads

## Total Estimated Time: 11 hours

## Success Metrics
- Widgets display real device data instead of mock data
- Data refreshes automatically per configured interval
- No console errors during normal operation
- Dashboard loads within 2 seconds with 10 widgets
- Each widget query completes within 500ms

## Technical Architecture

```
Frontend (React)
├── WidgetConfigPanel
│   └── Saves dataConfig to widget
├── useWidgetData hook
│   ├── Reads dataConfig
│   ├── Constructs API URL
│   ├── Fetches from Query API
│   ├── Handles auto-refresh
│   └── Returns {data, loading, error}
├── Widget Components
│   ├── ChartWidget (receives series data)
│   ├── TableWidget (receives rows data)
│   ├── GaugeWidget (receives value)
│   ├── KPIWidget (receives value + trend)
│   └── MapWidget (receives locations)

Backend (ASP.NET Core)
├── WidgetDataController
│   ├── GET /realtime → Latest values
│   ├── GET /historical → Time-series
│   └── GET /aggregated → Aggregated series
├── WidgetDataService
│   ├── Query TimescaleDB
│   ├── Apply filters/aggregations
│   └── Transform to widget format
└── TimeSeriesRepository
    └── Execute SQL queries
```

## Data Flow

1. User configures widget data source via FieldSelector
2. Configuration saved to `widget.dataConfig`
3. Widget component mounts
4. `useWidgetData` hook reads dataConfig
5. Hook constructs query parameters
6. Hook calls appropriate API endpoint
7. API queries TimescaleDB
8. API returns data in widget format
9. Hook transforms data for widget type
10. Widget renders with data
11. Hook sets up refresh timer (if configured)
12. Repeat steps 5-10 on refresh

## Migration from Current Code

**Keep:**
- ✅ All UI components (ChartWidget, TableWidget, etc.)
- ✅ Widget configuration panel
- ✅ Field selector component
- ✅ Dashboard builder/grid layout
- ✅ Widget library and templates

**Remove:**
- ❌ WidgetFactory with mock data generators
- ❌ Old WidgetRenderer (replace with new hook-based approach)
- ❌ Old dashboard-grid.tsx (already replaced with DashboardGrid.tsx)

**Create New:**
- ✨ WidgetDataController (backend)
- ✨ useWidgetData hook (frontend)
- ✨ Widget data transformation utilities
- ✨ API client for widget data endpoints
