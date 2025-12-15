# Dashboard Designer V2 - Implementation Plan

**Date:** December 11, 2025  
**Status:** Planning Phase  
**Architecture:** Complete Redesign from Scratch

---

## 🎯 Overview

Complete redesign of the dashboard system with a focus on:
- **Mode-based editing** (View/Design/Configure)
- **Digital twin integration** for hierarchical filtering
- **Device type-centric** data binding via field mappings
- **Schema-aware** data configuration
- **Widget interaction system** for linked visualizations
- **Advanced widget catalog** (3D assets, maps, digital twin trees)
- **Template and publishing** capabilities

---

## 📋 Implementation Phases

### Phase 1: Foundation & Core Architecture (Sprint 1)
**Duration:** 2 weeks  
**Story Points:** 34

#### 1.1 Dashboard Core State Management
- **New Zustand Store:** `dashboard-designer-store.ts`
  - Dashboard metadata (id, name, description, tags)
  - Widget collection with position/size
  - Current mode (view/design/configure)
  - Selected widget state
  - Active digital twin filter
  - Active device type filter
  - Widget link configuration
- **Actions:**
  - CRUD operations for dashboards
  - Widget add/remove/update
  - Mode switching
  - Filter application
  - Link management

#### 1.2 Mode System Implementation
- **ViewMode Component:** Read-only dashboard display
- **DesignMode Component:** Layout editing (drag/resize/reorder)
- **ConfigureMode Component:** Right-hand tray for data binding
- **Mode Switcher:** Toolbar buttons with state persistence
- **Permission System:** View/Edit/Publish role checks

#### 1.3 Dashboard Layout Engine
- **Grid System:** Custom implementation or react-grid-layout v2
- **Responsive Breakpoints:** Desktop/tablet/mobile layouts
- **Widget Container:** Wrapper with mode-specific controls
- **Layout Persistence:** Save/load widget positions and sizes

#### 1.4 API Integration
- **Dashboard CRUD:** Create, read, update, delete dashboards
- **Template Management:** Save/load/apply templates
- **Publishing System:** Publish draft to production
- **Version Control:** Dashboard revision history

**Deliverables:**
- Empty dashboard can be created
- Mode switching works
- Widgets can be added/positioned (empty placeholders)
- Save/load from Dashboard.API

---

### Phase 2: Data Binding Architecture (Sprint 2)
**Duration:** 2 weeks  
**Story Points:** 21

#### 2.1 Digital Twin Filter Widget
- **Tree Component:** react-arborist or custom implementation
- **Asset Hierarchy:** Display full digital twin tree
- **Selection:** Single-select node filtering
- **Breadcrumb:** Show selected path
- **Event Propagation:** Notify all widgets of filter change

#### 2.2 Device Type Selector
- **Dropdown Component:** Select from available device types
- **Field Mapping Display:** Show all mapped fields for selected type
- **Schema Integration:** Load schema definition
- **Validation:** Check field compatibility with widget

#### 2.3 Field Mapping System
- **Field Picker:** Drag-drop or multi-select interface
- **Field Metadata:** Display friendly name, data type, unit
- **Aggregation Options:** avg, sum, min, max, count, last
- **Time Range Selection:** Relative (1h, 24h, 7d) or absolute
- **Preview Data:** Live data sample before applying

#### 2.4 Configure Tray (Right-Hand Sidebar)
- **Widget Configuration Panel:**
  - **Data Tab:** Digital twin, device type, field selection
  - **Appearance Tab:** Colors, labels, styling
  - **Behavior Tab:** Refresh interval, interactions
- **Validation:** Real-time validation of configuration
- **Apply/Cancel:** Save or discard changes

**Deliverables:**
- Digital twin filter widget functional
- Device type selection working
- Field mappings can be configured
- Configure tray displays for any widget

---

### Phase 3: Widget Catalog - Data Visualization (Sprint 3)
**Duration:** 2 weeks  
**Story Points:** 21

#### 3.1 Time-Series Chart Widget
- **Chart Library:** Recharts or Apache ECharts
- **Chart Types:** Line, bar, area, scatter, step
- **Multi-Series:** Support multiple fields on same chart
- **Time Aggregation:** Bucket data by interval
- **Zoom/Pan:** Interactive time range selection
- **Export:** PNG, SVG, CSV

#### 3.2 KPI Card Widget
- **Single Value Display:** Large number with label
- **Trend Indicator:** Up/down arrow with percentage change
- **Comparison:** Current vs previous period
- **Threshold Colors:** Green/yellow/red based on value
- **Sparkline:** Mini chart showing recent trend

#### 3.3 Data Table Widget
- **Tabular Display:** Rows of device data
- **Columns:** Configurable from field mappings
- **Sorting:** Multi-column sort
- **Filtering:** Per-column filters
- **Pagination:** Server-side pagination
- **Export:** CSV, Excel

#### 3.4 Pie/Donut Chart Widget
- **Categorical Data:** Group by field value
- **Aggregation:** Count, sum, avg per category
- **Interactive:** Click slice to filter other widgets
- **Legend:** Toggle series on/off
- **Drill-Down:** Navigate to detail view

**Deliverables:**
- 4 data visualization widgets functional
- All widgets respect digital twin filter
- All widgets use device type field mappings
- Widgets update when configuration changes

---

### Phase 4: Widget Catalog - Monitoring (Sprint 4)
**Duration:** 2 weeks  
**Story Points:** 18

#### 4.1 Gauge Widget
- **Gauge Types:** Circular, semi-circular, linear, bullet
- **Value Display:** Current value with unit
- **Threshold Zones:** Color bands for ranges
- **Needle Animation:** Smooth transitions
- **Customization:** Colors, labels, tick marks

#### 4.2 Device List Widget
- **Tabular List:** Devices with metadata
- **Filtering:** By digital twin node and device type
- **Search:** Free-text search across fields
- **Selection:** Click device to filter other widgets
- **Status Indicators:** Online/offline/alarm state
- **Drill-Down:** Navigate to device detail page

#### 4.3 Digital Twin Tree Widget
- **Hierarchy Display:** Asset tree visualization
- **Device Assignment:** Show devices under assets
- **Selection:** Click node to filter all widgets
- **Breadcrumb:** Show selected asset path
- **Expand/Collapse:** Control tree depth

**Deliverables:**
- 3 monitoring widgets functional
- Device list integrates with digital twin filter
- Digital twin widget can filter entire dashboard

---

### Phase 5: Widget Catalog - Maps & Spatial (Sprint 5)
**Duration:** 2 weeks  
**Story Points:** 21

#### 5.1 Map Widget (ArcGIS)
- **ArcGIS Integration:** @arcgis/core SDK
- **Device Markers:** Plot devices by GPS coordinates
- **Clustering:** Group nearby devices
- **Popup:** Device details on click
- **Layers:** Toggle device type layers
- **Heat Map:** Visualize data values spatially
- **Geofencing:** Display zones/boundaries

#### 5.2 Map Widget (Leaflet - Alternative)
- **Leaflet Integration:** react-leaflet
- **Same Features:** As ArcGIS variant
- **Tile Providers:** OpenStreetMap, Mapbox, etc.
- **Plugin Support:** Leaflet plugins for advanced features

#### 5.3 Map Selection & Linking
- **Click Marker:** Select device, filter dashboard
- **Draw Tools:** Define geographic areas to filter
- **Route Display:** Show device paths over time

**Deliverables:**
- Two map widget variants (ArcGIS and Leaflet)
- Maps respect digital twin filter
- Map selection filters other widgets
- Geofencing configuration in design mode

---

### Phase 6: Widget Catalog - 3D & Advanced (Sprint 6)
**Duration:** 3 weeks  
**Story Points:** 34

#### 6.1 3D Asset Viewer Widget
- **3D Library:** Three.js or react-three-fiber
- **Model Formats:** GLTF, GLB, OBJ
- **Asset Hierarchy:** Bind digital twin to 3D model parts
- **Selection:** Click 3D element to select asset
- **Device Binding:** Link devices to 3D model components
- **Interactive:** Rotate, zoom, pan
- **Highlighting:** Highlight selected assets
- **Data Overlay:** Show live values on 3D model

#### 6.2 LiDAR Point Cloud Viewer (Optional)
- **Point Cloud Library:** Potree or custom WebGL
- **File Formats:** LAS, LAZ, E57
- **Navigation:** Orbit, pan, zoom
- **Coloring:** Elevation, intensity, classification
- **Measurement:** Distance, area, volume
- **Device Integration:** Plot devices in point cloud

**Deliverables:**
- 3D asset viewer functional
- 3D selection filters dashboard
- Digital twin bound to 3D model
- (Optional) LiDAR viewer

---

### Phase 7: Widget Interactions & Linking (Sprint 7)
**Duration:** 2 weeks  
**Story Points:** 21

#### 7.1 Widget Event System
- **Event Types:**
  - `device:selected` - Device picked from list/map/3D
  - `asset:selected` - Digital twin node selected
  - `timeRange:changed` - Time range modified
  - `filter:applied` - Custom filter applied
- **Event Bus:** Centralized pub/sub system
- **Widget Subscriptions:** Widgets subscribe to relevant events

#### 7.2 Widget Linking Configuration
- **Link Definition:** Configure which widgets respond to events
- **Link Types:**
  - **Master-Detail:** List filters detail widgets
  - **Cross-Filter:** Multiple widgets filter each other
  - **Drill-Down:** Navigate to subpage with context
- **Link UI:** Visual indication of linked widgets

#### 7.3 Subpage Navigation
- **Subpage Creation:** Create dashboard subpages
- **Navigation Triggers:** Click list item to navigate
- **Context Passing:** Selected device/asset filters subpage
- **Breadcrumb:** Show navigation path
- **Back Navigation:** Return to parent dashboard

**Deliverables:**
- Widget event system operational
- Links can be configured in design mode
- Master-detail pattern works (e.g., device list → charts)
- Subpage navigation functional

---

### Phase 8: Templates & Publishing (Sprint 8)
**Duration:** 2 weeks  
**Story Points:** 13

#### 8.1 Dashboard Templates
- **Template Creation:** Save dashboard as reusable template
- **Template Library:** Browse available templates
- **Template Metadata:** Name, description, category, preview
- **Template Application:** Apply to new dashboard
- **Variable Substitution:** Replace digital twin root, device types
- **Industry Templates:**
  - Water Management
  - Oil & Gas
  - Manufacturing
  - Facility Management
  - Environmental Monitoring

#### 8.2 Publishing System
- **Draft Mode:** Work-in-progress dashboards
- **Publish Action:** Promote draft to production
- **Version Control:** Track dashboard revisions
- **Rollback:** Revert to previous version
- **Permission Gates:** Only editors can publish

#### 8.3 Permissions & Sharing
- **Role-Based Access:**
  - **Viewer:** View published dashboards only
  - **Designer:** Create and edit dashboards
  - **Publisher:** Publish dashboards to production
  - **Admin:** Manage permissions
- **Sharing:** Share dashboard with users/groups
- **Public Dashboards:** Optionally make dashboard public

**Deliverables:**
- Template system functional
- Dashboards can be published
- Permissions enforced
- Template library with 5+ industry templates

---

### Phase 9: Runtime Optimization & UX (Sprint 9)
**Duration:** 2 weeks  
**Story Points:** 13

#### 9.1 Performance Optimization
- **Data Caching:** Cache metadata and static data
- **Lazy Loading:** Load widgets on demand
- **Virtual Scrolling:** Large device lists
- **Debounced Queries:** Rate-limit API calls
- **Optimistic UI:** Instant feedback on actions

#### 9.2 UX Enhancements
- **Tooltips:** Contextual help throughout
- **Hover Effects:** Data details on hover
- **Keyboard Shortcuts:** Power-user navigation
- **Undo/Redo:** Action history for design mode
- **Auto-Save:** Periodic draft saves

#### 9.3 Data Refresh System
- **Manual Refresh:** Refresh button per widget or entire dashboard
- **Auto-Refresh:** Configurable intervals (10s, 30s, 1m, 5m)
- **Refresh Indicator:** Show last updated timestamp
- **Smart Refresh:** Only refresh visible widgets
- **Pause/Resume:** Control auto-refresh

**Deliverables:**
- Dashboard loads <2 seconds
- Widget rendering optimized
- Auto-refresh working
- UX polished and intuitive

---

## 🗂️ File Structure (New Implementation)

```
src/Web/sensormine-web/
├── src/
│   ├── app/
│   │   └── dashboards/
│   │       ├── page.tsx                    # Dashboard list
│   │       ├── new/
│   │       │   └── page.tsx                # Create new dashboard
│   │       └── [id]/
│   │           ├── page.tsx                # Dashboard view
│   │           ├── design/
│   │           │   └── page.tsx            # Design mode
│   │           └── configure/
│   │               └── page.tsx            # Configure mode
│   ├── components/
│   │   └── dashboards/
│   │       ├── core/
│   │       │   ├── DashboardCanvas.tsx     # Main canvas
│   │       │   ├── WidgetContainer.tsx     # Widget wrapper
│   │       │   ├── ModeToolbar.tsx         # Mode switcher
│   │       │   └── ConfigureTray.tsx       # Right sidebar
│   │       ├── widgets/
│   │       │   ├── TimeSeriesChartWidget.tsx
│   │       │   ├── KPICardWidget.tsx
│   │       │   ├── DataTableWidget.tsx
│   │       │   ├── PieChartWidget.tsx
│   │       │   ├── GaugeWidget.tsx
│   │       │   ├── DeviceListWidget.tsx
│   │       │   ├── DigitalTwinTreeWidget.tsx
│   │       │   ├── MapWidgetArcGIS.tsx
│   │       │   ├── MapWidgetLeaflet.tsx
│   │       │   └── Asset3DViewerWidget.tsx
│   │       ├── config/
│   │       │   ├── DataSourceConfig.tsx    # Data tab
│   │       │   ├── AppearanceConfig.tsx    # Appearance tab
│   │       │   ├── BehaviorConfig.tsx      # Behavior tab
│   │       │   ├── DigitalTwinFilter.tsx   # DT filter component
│   │       │   ├── DeviceTypeSelector.tsx  # Type selector
│   │       │   └── FieldMappingPicker.tsx  # Field selection
│   │       └── templates/
│   │           ├── TemplateLibrary.tsx
│   │           ├── TemplateCard.tsx
│   │           └── TemplateApplyDialog.tsx
│   ├── lib/
│   │   ├── stores/
│   │   │   └── dashboard-designer-store.ts # Zustand store
│   │   ├── api/
│   │   │   ├── dashboards.ts               # Dashboard API client
│   │   │   └── widget-data.ts              # Widget data queries
│   │   ├── types/
│   │   │   └── dashboard-designer.ts       # TypeScript types
│   │   └── hooks/
│   │       ├── useDashboardMode.ts
│   │       ├── useWidgetData.ts
│   │       └── useWidgetLinks.ts
│   └── __tests__/
│       └── components/
│           └── dashboards/
│               ├── widgets/                # Widget tests
│               ├── config/                 # Config tests
│               └── core/                   # Core tests
```

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js 16** with App Router
- **React 19** with Server Components
- **TypeScript 5**

### State Management
- **Zustand** for dashboard state
- **React Context** for widget-level state

### Layout & Interaction
- **react-grid-layout** v2 or custom grid system
- **@dnd-kit** for drag-and-drop
- **Radix UI** primitives for UI components

### Data Visualization
- **Recharts** or **Apache ECharts** for charts
- **react-leaflet** for Leaflet maps
- **@arcgis/core** for ArcGIS maps
- **react-three-fiber** for 3D visualization

### Digital Twin
- **react-arborist** for tree visualization
- **Zustand** for filter state propagation

### Forms & Validation
- **react-hook-form** for configuration forms
- **zod** for schema validation

### Testing
- **Vitest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests

---

## 📊 Story Breakdown & Estimation

| Phase | Focus Area | Stories | Story Points | Duration |
|-------|------------|---------|--------------|----------|
| 1 | Foundation | 4 | 34 | 2 weeks |
| 2 | Data Binding | 4 | 21 | 2 weeks |
| 3 | Widget Catalog (Data Viz) | 4 | 21 | 2 weeks |
| 4 | Widget Catalog (Monitoring) | 3 | 18 | 2 weeks |
| 5 | Widget Catalog (Maps) | 3 | 21 | 2 weeks |
| 6 | Widget Catalog (3D) | 2 | 34 | 3 weeks |
| 7 | Interactions & Linking | 3 | 21 | 2 weeks |
| 8 | Templates & Publishing | 3 | 13 | 2 weeks |
| 9 | Optimization & UX | 3 | 13 | 2 weeks |
| **Total** | | **29** | **196** | **19 weeks** |

---

## ✅ Success Criteria

### Functional
- [ ] All 9 user story groups implemented
- [ ] All 11 widget types functional
- [ ] Digital twin filtering works across all widgets
- [ ] Device type field mappings bind correctly
- [ ] Widget interactions and linking operational
- [ ] Templates can be created and applied
- [ ] Dashboards can be published with permissions
- [ ] View/Design/Configure modes working

### Technical
- [ ] Dashboard loads <2 seconds
- [ ] Widget rendering <500ms
- [ ] Real-time updates <1 second latency
- [ ] Mobile responsive layout
- [ ] WCAG 2.1 AA accessibility
- [ ] 80%+ test coverage

### User Experience
- [ ] Intuitive mode switching
- [ ] Clear visual feedback for all actions
- [ ] Error handling with helpful messages
- [ ] Keyboard shortcuts for power users
- [ ] Undo/redo for design actions
- [ ] Auto-save prevents data loss

---

## 🚨 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Complex data binding logic | High | Medium | Prototype early, iterate on API design |
| Performance with many widgets | High | Medium | Implement virtualization, lazy loading |
| 3D rendering browser compatibility | Medium | Medium | Provide fallback, test on target browsers |
| ArcGIS licensing/complexity | Medium | Low | Offer Leaflet alternative |
| Widget interaction state management | High | High | Use event bus pattern, comprehensive testing |
| Schema evolution breaking dashboards | High | Medium | Version checking, migration tools |

---

## 📝 Next Steps

1. **Review & Approval** (1 day)
   - Stakeholder review of this plan
   - Approval to proceed

2. **Design System** (3 days)
   - Create Figma mockups for all modes
   - Define component library standards
   - Document interaction patterns

3. **Sprint 1 Kickoff** (Day 1 of Phase 1)
   - Set up project structure
   - Initialize stores and types
   - Implement mode system skeleton

4. **Weekly Demos**
   - End of each sprint: demo to stakeholders
   - Gather feedback, adjust plan

5. **Beta Release** (End of Phase 6)
   - Internal testing with real dashboards
   - Performance benchmarking
   - UX feedback collection

6. **Production Release** (End of Phase 9)
   - Full feature set deployed
   - Documentation complete
   - Training materials ready

---

**Document Owner:** Platform Team  
**Last Updated:** December 11, 2025  
**Next Review:** Start of each sprint
