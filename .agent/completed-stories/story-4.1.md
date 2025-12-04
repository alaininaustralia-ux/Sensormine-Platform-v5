# Story Plan: 4.1 - Dashboard Builder

**Story**: 4.1  
**Epic**: Epic 4 - Visualization & Dashboards  
**Priority**: High  
**Story Points**: 21  
**Started**: 2025-12-04  
**Developer**: AI Agent

---

## Story Description

**As a** operations manager  
**I want** to create custom dashboards with drag-and-drop widgets  
**So that** I can visualize data relevant to my operations

---

## Acceptance Criteria

From user story:
- [ ] Drag-and-drop dashboard editor
- [ ] Widget library: charts, tables, maps, video feeds, gauges
- [ ] Widget configuration (data source, filters, styling)
- [ ] Dashboard layouts: grid, free-form
- [ ] Save and share dashboards
- [ ] Dashboard templates for common use cases

---

## Technical Analysis

### Dependencies
- **Required Stories**: Story 0.0 - Frontend Project Setup ✅ Complete
- **External Dependencies**: None (backend APIs will be mocked initially)
- **Blocked By**: None

### Architecture Alignment
- **Service**: Frontend (Next.js 14 + React)
- **State Management**: Zustand for dashboard/widget state
- **Component Library**: shadcn/ui + custom dashboard components
- **Layout Engine**: react-grid-layout for drag-and-drop grid system
- **Data Flow**: LocalStorage → API (future migration)

### Technology Choices
- **Frameworks/Libraries**: 
  - `react-grid-layout` for grid-based layouts
  - `zustand` for state management (already in package.json from Story 0.0)
  - `lucide-react` for icons (already installed)
- **Storage**: LocalStorage for MVP (migrate to backend API in future stories)
- **Testing**: Vitest + React Testing Library

---

## Implementation Plan

### Phase 1: Data Models & Store
**Files to Create**:
- [ ] `src/lib/types/dashboard.ts` - TypeScript interfaces
- [ ] `src/lib/stores/dashboard-store.ts` - Zustand state management
- [ ] `src/lib/stores/widget-store.ts` - Widget library and configurations

**Tasks**:
- [ ] Define `Dashboard` interface (id, name, layout, widgets, createdAt, etc.)
- [ ] Define `Widget` interface (id, type, config, position, size)
- [ ] Define `WidgetType` enum (chart, table, map, video, gauge, kpi)
- [ ] Create Zustand store with CRUD operations
- [ ] Implement persistence layer (LocalStorage)

### Phase 2: Widget Components
**Files to Create**:
- [ ] `src/components/dashboard/widgets/base-widget.tsx` - Base widget wrapper
- [ ] `src/components/dashboard/widgets/chart-widget.tsx` - Placeholder chart
- [ ] `src/components/dashboard/widgets/table-widget.tsx` - Placeholder table
- [ ] `src/components/dashboard/widgets/map-widget.tsx` - Placeholder map
- [ ] `src/components/dashboard/widgets/video-widget.tsx` - Placeholder video
- [ ] `src/components/dashboard/widgets/gauge-widget.tsx` - Placeholder gauge
- [ ] `src/components/dashboard/widgets/kpi-widget.tsx` - KPI card
- [ ] `src/components/dashboard/widgets/widget-registry.tsx` - Widget catalog

**Tasks**:
- [ ] Create base widget with header, content, and actions
- [ ] Implement placeholder widgets with mock data
- [ ] Add widget icons and descriptions
- [ ] Create widget registry for dynamic rendering

### Phase 3: Dashboard Grid Layout
**Files to Create**:
- [ ] `src/components/dashboard/dashboard-grid.tsx` - Grid container
- [ ] `src/components/dashboard/dashboard-widget-container.tsx` - Widget wrapper with drag handles

**Tasks**:
- [ ] Integrate react-grid-layout
- [ ] Configure responsive breakpoints
- [ ] Add drag-and-drop handlers
- [ ] Add resize handlers
- [ ] Implement grid state persistence

### Phase 4: Dashboard Builder UI
**Files to Create**:
- [ ] `src/app/dashboard/builder/page.tsx` - Dashboard builder page
- [ ] `src/components/dashboard/builder/widget-library-sidebar.tsx` - Widget palette
- [ ] `src/components/dashboard/builder/dashboard-toolbar.tsx` - Actions (save, cancel, etc.)
- [ ] `src/components/dashboard/builder/widget-config-drawer.tsx` - Widget configuration panel

**Tasks**:
- [ ] Create builder layout (sidebar + canvas + toolbar)
- [ ] Implement widget library with drag-to-add
- [ ] Add widget configuration panel
- [ ] Implement save/cancel actions
- [ ] Add dashboard naming/metadata

### Phase 5: Dashboard Management
**Files to Create**:
- [ ] `src/app/dashboard/list/page.tsx` - List all dashboards
- [ ] `src/app/dashboard/[id]/page.tsx` - View dashboard (read-only)
- [ ] `src/app/dashboard/[id]/edit/page.tsx` - Edit dashboard
- [ ] `src/components/dashboard/dashboard-card.tsx` - Dashboard preview card
- [ ] `src/components/dashboard/dashboard-templates.tsx` - Template selector

**Tasks**:
- [ ] Create dashboard list page with grid/list views
- [ ] Implement dashboard CRUD operations
- [ ] Add dashboard sharing UI (future backend integration)
- [ ] Create dashboard templates (operations, maintenance, security)
- [ ] Add "Create from Template" flow

### Phase 6: Dashboard Templates
**Files to Create**:
- [ ] `src/lib/templates/operations-template.ts` - Operations dashboard
- [ ] `src/lib/templates/maintenance-template.ts` - Maintenance dashboard
- [ ] `src/lib/templates/security-template.ts` - Security monitoring

**Tasks**:
- [ ] Define 3-5 pre-built templates
- [ ] Include default widgets and layouts
- [ ] Add template descriptions and use cases

### Phase 7: Testing
**Files to Create**:
- [ ] `__tests__/stores/dashboard-store.test.ts` - Store tests
- [ ] `__tests__/components/dashboard-grid.test.tsx` - Grid tests
- [ ] `__tests__/components/widget-library.test.tsx` - Widget tests

**Tasks**:
- [ ] Test dashboard CRUD operations
- [ ] Test widget add/remove/configure
- [ ] Test layout persistence
- [ ] Test template instantiation

---

## File Structure

```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx                    # Dashboard home (list view)
│       ├── builder/
│       │   └── page.tsx                # Create new dashboard
│       ├── [id]/
│       │   ├── page.tsx                # View dashboard (read-only)
│       │   └── edit/
│       │       └── page.tsx            # Edit existing dashboard
│       └── templates/
│           └── page.tsx                # Browse templates
│
├── components/
│   └── dashboard/
│       ├── dashboard-grid.tsx          # Main grid layout
│       ├── dashboard-widget-container.tsx
│       ├── dashboard-card.tsx          # List view card
│       ├── builder/
│       │   ├── widget-library-sidebar.tsx
│       │   ├── dashboard-toolbar.tsx
│       │   └── widget-config-drawer.tsx
│       ├── widgets/
│       │   ├── base-widget.tsx
│       │   ├── chart-widget.tsx
│       │   ├── table-widget.tsx
│       │   ├── map-widget.tsx
│       │   ├── video-widget.tsx
│       │   ├── gauge-widget.tsx
│       │   ├── kpi-widget.tsx
│       │   └── widget-registry.tsx
│       └── templates/
│           └── dashboard-templates.tsx
│
├── lib/
│   ├── types/
│   │   └── dashboard.ts                # TypeScript interfaces
│   ├── stores/
│   │   ├── dashboard-store.ts          # Zustand store
│   │   └── widget-store.ts
│   ├── templates/
│   │   ├── operations-template.ts
│   │   ├── maintenance-template.ts
│   │   └── security-template.ts
│   └── utils/
│       └── dashboard-utils.ts          # Helper functions
│
└── __tests__/
    ├── stores/
    │   └── dashboard-store.test.ts
    └── components/
        └── dashboard/
            ├── dashboard-grid.test.tsx
            └── widget-library.test.tsx
```

---

## Test Strategy

### Unit Tests (Vitest + React Testing Library)
1. **Store Tests**:
   - Create, read, update, delete dashboards
   - Add, remove, configure widgets
   - Template instantiation
   - LocalStorage persistence

2. **Component Tests**:
   - Dashboard grid rendering
   - Widget drag-and-drop
   - Widget configuration panel
   - Dashboard toolbar actions
   - Widget library sidebar

3. **Integration Tests**:
   - Full dashboard creation flow
   - Template to dashboard conversion
   - Dashboard save and load

### Manual Testing
- [ ] Create dashboard from scratch
- [ ] Add widgets via drag-and-drop
- [ ] Configure widget settings
- [ ] Save and reload dashboard
- [ ] Create dashboard from template
- [ ] Edit existing dashboard
- [ ] Delete dashboard
- [ ] Responsive behavior on mobile/tablet

---

## API Contract (Future Backend Integration)

**Note**: For this story, we'll use LocalStorage. Future stories will integrate with backend APIs.

### Endpoints to Create (Backend - Future)
```
GET    /api/dashboards              # List all dashboards
POST   /api/dashboards              # Create dashboard
GET    /api/dashboards/{id}         # Get dashboard by ID
PUT    /api/dashboards/{id}         # Update dashboard
DELETE /api/dashboards/{id}         # Delete dashboard
GET    /api/dashboards/templates    # List templates
POST   /api/dashboards/share        # Share dashboard with user/team
```

### Data Models
```typescript
interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: Layout[];
  widgets: Widget[];
  isTemplate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sharedWith?: string[];
}

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
}

interface Layout {
  i: string;       // Widget ID
  x: number;       // Grid column position
  y: number;       // Grid row position
  w: number;       // Width in grid units
  h: number;       // Height in grid units
  minW?: number;
  minH?: number;
}

type WidgetType = 'chart' | 'table' | 'map' | 'video' | 'gauge' | 'kpi';

interface WidgetConfig {
  dataSource?: string;
  filters?: Record<string, any>;
  styling?: Record<string, any>;
  refreshInterval?: number;
  [key: string]: any;
}
```

---

## Implementation Order

1. ✅ Create story plan (this file)
2. Install dependencies (react-grid-layout)
3. Create data models and types
4. Build Zustand store with LocalStorage persistence
5. Create base widget components (placeholders)
6. Implement dashboard grid with react-grid-layout
7. Build dashboard builder UI
8. Add widget configuration panel
9. Implement dashboard templates
10. Write unit tests
11. Manual testing and refinement
12. Update documentation

---

## Success Metrics

- [ ] Can create dashboard from scratch in < 2 minutes
- [ ] Can add and configure 5+ widgets
- [ ] Dashboard persists across browser sessions
- [ ] Templates provide instant value
- [ ] All unit tests passing
- [ ] Responsive on desktop, tablet, mobile
- [ ] Zero console errors/warnings

---

## Future Enhancements (Not in Scope)

- Real-time data updates (Story 4.9)
- Backend API integration (Epic 8 - Administration)
- Time-series charts (Story 4.2)
- GIS maps (Story 4.6)
- Video feeds (Story 4.3)
- 3D CAD viewer (Story 4.4)
- Dashboard sharing permissions
- Dashboard versioning
- Collaborative editing

---

## Notes

- This story establishes the foundation for all visualization features
- Widget components are placeholders; they'll be enhanced in Stories 4.2-4.10
- LocalStorage is temporary; backend integration planned for later
- Focus on UX and layout management, not data visualization yet
- Ensure responsive design for mobile field technicians
