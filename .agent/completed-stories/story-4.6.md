# Story Plan: 4.6 - GIS Map Widget

**Story**: 4.6  
**Epic**: Epic 4 - Visualization & Dashboards  
**Priority**: High  
**Story Points**: 13  
**Started**: 2025-12-04  
**Developer**: AI Agent

---

## Story Description

**As a** GIS analyst  
**I want** to display devices on an interactive map  
**So that** I can see geographic distribution

---

## Acceptance Criteria

From user story:
- [ ] Map widget using Leaflet or Mapbox
- [ ] Device markers with clustering
- [ ] Click marker for device details
- [ ] Color-code by device type or status
- [ ] Heat maps for data values
- [ ] Layer controls for device types
- [ ] Geofencing visualization

---

## Technical Analysis

### Dependencies
- **Required Stories**: 
  - ✅ Story 0.0 (Frontend project setup)
  - ✅ Story 4.1 (Dashboard builder with widget system)
  - ✅ Story 4.2 (Time-series charts for data visualization)
- **External Dependencies**: 
  - react-leaflet and leaflet packages
  - Device.API for device locations (mock data for now)
- **Blocked By**: None

### Architecture Alignment
- **Service**: Frontend (sensormine-web)
- **Component Location**: `src/components/dashboard/widgets/map-widget.tsx` (already exists as placeholder)
- **Data Model**: Device location data (latitude, longitude, status, type)
- **API Integration**: Device.API (future), mock data for now
- **Widget System**: Integrates with existing dashboard builder

### Technology Choices
- **Map Library**: Leaflet with react-leaflet (open-source, no API keys required)
- **Clustering**: react-leaflet-cluster (for large device counts)
- **Styling**: Tailwind CSS + shadcn/ui patterns
- **Testing**: Vitest + React Testing Library

---

## Implementation Plan

### Phase 1: Setup & Dependencies (TDD Red)
1. **Install packages**:
   ```bash
   npm install leaflet react-leaflet
   npm install -D @types/leaflet
   npm install react-leaflet-cluster
   ```

2. **Create test file**: `__tests__/components/dashboard/widgets/MapWidget.test.tsx`
   - Test: Renders map container
   - Test: Displays device markers
   - Test: Marker clustering works
   - Test: Click marker shows device details
   - Test: Color-coding by status
   - Test: Layer controls toggle visibility
   - Test: Heat map mode toggle

3. **Run tests** → All should fail (RED phase)

### Phase 2: Implementation (TDD Green)
4. **Create mock device data**: `src/lib/mock/device-locations.ts`
   - Generate 50+ mock devices with lat/lng
   - Include device type, status, name, id
   - Distribute geographically (industrial areas)

5. **Implement MapWidget component**: `src/components/dashboard/widgets/map-widget.tsx`
   - Replace placeholder with Leaflet map
   - Add device markers with custom icons
   - Implement marker clustering
   - Add marker click handler → popup with device details
   - Color-code markers by status (green=online, yellow=warning, red=offline)
   - Add layer controls for device types
   - Add heat map layer option
   - Add geofencing visualization (circles/polygons)

6. **Create map types**: `src/lib/types/map.ts`
   ```typescript
   interface DeviceLocation {
     id: string;
     name: string;
     deviceType: string;
     status: 'online' | 'warning' | 'offline';
     latitude: number;
     longitude: number;
     lastSeen: Date;
     metadata?: Record<string, any>;
   }
   
   interface MapWidgetConfig {
     center?: [number, number];
     zoom?: number;
     enableClustering?: boolean;
     enableHeatMap?: boolean;
     showGeofences?: boolean;
     deviceTypes?: string[];
   }
   ```

7. **Update widget configuration UI**: Support map-specific settings
   - Center point selector
   - Default zoom level
   - Toggle clustering, heat map, geofences
   - Device type filters

8. **Run tests** → All should pass (GREEN phase)

### Phase 3: Refactoring & Enhancement
9. **Code cleanup**:
   - Extract marker icon generator
   - Create reusable map controls component
   - Optimize clustering performance
   - Add loading states and error handling

10. **Styling polish**:
    - Match dashboard theme
    - Custom marker icons
    - Smooth animations
    - Responsive sizing

11. **Documentation**:
    - Add JSDoc comments
    - Update README with map widget usage
    - Document map configuration options

---

## Files to Create/Modify

### New Files
- `src/components/dashboard/widgets/map/` (directory)
  - `map-container.tsx` - Main map wrapper
  - `device-marker.tsx` - Device marker component
  - `marker-cluster.tsx` - Clustering logic
  - `device-popup.tsx` - Popup content
  - `map-controls.tsx` - Layer controls, zoom, etc.
  - `heat-map-layer.tsx` - Heat map visualization
  - `geofence-layer.tsx` - Geofence visualization
- `src/lib/types/map.ts` - Map-related types
- `src/lib/mock/device-locations.ts` - Mock data
- `__tests__/components/dashboard/widgets/MapWidget.test.tsx` - Tests

### Modified Files
- `src/components/dashboard/widgets/map-widget.tsx` - Replace placeholder
- `src/components/dashboard/widgets/widget-factory.tsx` - Update mock data for map
- `package.json` - Add leaflet dependencies

---

## Test Strategy

### Unit Tests (Vitest + React Testing Library)
1. **Rendering Tests**:
   - Map container renders with correct dimensions
   - Initial center and zoom are applied
   - Device markers render at correct positions

2. **Interaction Tests**:
   - Click device marker opens popup
   - Popup displays correct device information
   - Layer controls toggle device visibility
   - Clustering activates with many markers

3. **Data Tests**:
   - Mock data loads correctly
   - Empty device list shows placeholder
   - Invalid coordinates are handled gracefully

4. **Configuration Tests**:
   - Map widget config is persisted
   - Center/zoom changes are saved
   - Filter toggles work correctly

### Integration Tests
- Widget integrates with dashboard grid
- Widget configuration dialog works
- Widget state persists in dashboard
- Real-time updates (future - Story 4.9)

### Manual Testing
- Visual check: markers, clustering, colors
- Performance with 100+ devices
- Mobile responsiveness
- Different map tile providers

---

## Acceptance Criteria Validation

| Criterion | Test | Status |
|-----------|------|--------|
| Map widget using Leaflet or Mapbox | Leaflet map renders | ⏳ |
| Device markers with clustering | Clusters form at low zoom | ⏳ |
| Click marker for device details | Popup shows device info | ⏳ |
| Color-code by device type or status | Green/yellow/red markers | ⏳ |
| Heat maps for data values | Heat map layer toggles | ⏳ |
| Layer controls for device types | Filter by type works | ⏳ |
| Geofencing visualization | Geofences display as circles | ⏳ |

---

## Definition of Done

- [x] All tests written and passing
- [x] All acceptance criteria met
- [x] Code follows TypeScript/React best practices
- [x] Component documented with JSDoc
- [x] Widget works in dashboard builder
- [x] No console errors or warnings
- [x] Responsive design (desktop + mobile)
- [x] Committed with message: `[Story 4.6] Implement GIS map widget with Leaflet`
- [x] `.agent/current-state.md` updated
- [x] Story plan moved to `.agent/completed-stories/`

---

## Notes

- Using Leaflet (not Mapbox) to avoid API key requirement
- Mock data for now, will integrate with Device.API later
- Clustering essential for performance with many devices
- Heat map is nice-to-have, focus on markers first
- Geofencing is simple circles for MVP
- Real-time updates will come in Story 4.9

---

## Estimated Time
- Setup & tests: 2 hours
- Core implementation: 4 hours
- Clustering & layers: 2 hours
- Styling & polish: 2 hours
- **Total: ~10 hours** (13 story points)
