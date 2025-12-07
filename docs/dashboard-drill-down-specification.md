# Dashboard Drill-Down & Device Detail Navigation - Technical Specification

## Overview
Enable users to navigate from dashboard overview widgets (device lists, maps) to detailed device pages, with support for hierarchical dashboard structures (parent dashboards with detail subpages).

## User Stories

### US-1: Device List Click-Through
**As a** dashboard user  
**I want to** click on a device in a device list widget  
**So that** I can view detailed information about that specific device

**Acceptance Criteria:**
- Device list widget displays clickable device rows
- Clicking a device navigates to device detail subpage
- Detail page shows device-specific widgets filtered to that device
- Back navigation returns to parent dashboard

### US-2: Map-Based Device Selection
**As a** dashboard user  
**I want to** click device markers on a map widget  
**So that** I can preview device info and navigate to device details

**Acceptance Criteria:**
- Map widget displays device markers for selected device types
- Clicking marker shows popup with device summary
- Popup includes "View Details" link to device detail subpage
- Multiple device types can be displayed simultaneously

### US-3: Subpage Auto-Creation
**As a** dashboard creator  
**I want** the system to offer creating a detail subpage when I add a device list or map widget  
**So that** I can quickly set up drill-down navigation

**Acceptance Criteria:**
- Adding device list/map widget shows "Create Detail Page" option
- Auto-creates subpage with common device detail widgets
- Links parent widget to subpage for navigation
- Subpage is pre-configured with device context filter

### US-4: Dashboard Hierarchy Display
**As a** dashboard user  
**I want to** see which dashboards have subpages in the dashboard list  
**So that** I know which dashboards support drill-down navigation

**Acceptance Criteria:**
- Dashboard cards show subpage count badge
- Dashboard cards show list of subpage names
- Clicking subpage name navigates directly to that subpage

### US-5: Context-Aware Widget Configuration
**As a** dashboard creator configuring a subpage  
**I want to** use the "selected device" as a data filter  
**So that** widgets automatically show data for the clicked device

**Acceptance Criteria:**
- Widget configuration shows "Use Selected Device" option on subpages
- Selected device acts as automatic device filter
- Applies to charts, gauges, KPIs, tables, and maps
- Context is passed via URL parameter

## Architecture

### Data Model Changes

#### Dashboard Entity (C# Model)
```csharp
public class Dashboard : BaseEntity
{
    // Existing properties...
    
    /// <summary>
    /// Parent dashboard ID for subpage hierarchy (null for root dashboards)
    /// </summary>
    public Guid? ParentDashboardId { get; set; }
    
    /// <summary>
    /// Navigation property to parent dashboard
    /// </summary>
    public Dashboard? ParentDashboard { get; set; }
    
    /// <summary>
    /// Navigation property to child dashboards (subpages)
    /// </summary>
    public ICollection<Dashboard> SubPages { get; set; } = new List<Dashboard>();
    
    /// <summary>
    /// Display order within parent dashboard (for subpage sorting)
    /// </summary>
    public int DisplayOrder { get; set; }
    
    /// <summary>
    /// Type of dashboard: Root, DeviceDetail, DeviceTypeList, Custom
    /// </summary>
    public DashboardType DashboardType { get; set; } = DashboardType.Root;
}

public enum DashboardType
{
    Root,           // Top-level dashboard
    DeviceDetail,   // Detail page for a single device
    DeviceTypeList, // List page for a device type
    Custom          // Custom subpage
}
```

#### Dashboard DTOs
```csharp
public class DashboardDto
{
    // Existing properties...
    
    public Guid? ParentDashboardId { get; set; }
    public string? ParentDashboardName { get; set; }
    public List<SubPageSummaryDto> SubPages { get; set; } = new();
    public int DisplayOrder { get; set; }
    public string DashboardType { get; set; } = "Root";
}

public class SubPageSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DashboardType { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class CreateDashboardRequest
{
    // Existing properties...
    
    public Guid? ParentDashboardId { get; set; }
    public int DisplayOrder { get; set; }
    public string DashboardType { get; set; } = "Root";
}
```

#### Widget Data Configuration
```typescript
// Existing dataConfig in DashboardWidget
interface WidgetDataConfig {
  dataSource: {
    type: 'device' | 'deviceType' | 'custom';
    deviceTypeId?: string;
    deviceId?: string;
    useContextDevice?: boolean; // NEW: Use device from navigation context
    fields: string[];
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
    timeRange?: string;
    refreshInterval?: number;
  };
}
```

### Database Migration

```sql
-- Add columns to Dashboards table
ALTER TABLE Dashboards ADD ParentDashboardId uniqueidentifier NULL;
ALTER TABLE Dashboards ADD DisplayOrder int NOT NULL DEFAULT 0;
ALTER TABLE Dashboards ADD DashboardType nvarchar(50) NOT NULL DEFAULT 'Root';

-- Add foreign key constraint
ALTER TABLE Dashboards 
ADD CONSTRAINT FK_Dashboards_ParentDashboard 
FOREIGN KEY (ParentDashboardId) REFERENCES Dashboards(Id);

-- Add index for parent lookup
CREATE INDEX IX_Dashboards_ParentDashboardId 
ON Dashboards(ParentDashboardId) 
WHERE ParentDashboardId IS NOT NULL;
```

### API Endpoints

#### New/Modified Endpoints
```csharp
// Get dashboard with subpages
GET /api/dashboards/{id}?includeSubPages=true
Response: DashboardDto with SubPages populated

// Get subpages for a dashboard
GET /api/dashboards/{id}/subpages
Response: List<SubPageSummaryDto>

// Create subpage
POST /api/dashboards/{parentId}/subpages
Request: CreateDashboardRequest
Response: DashboardDto

// Reorder subpages
PUT /api/dashboards/{id}/subpages/reorder
Request: { subPageIds: Guid[] }
```

### Frontend Architecture

#### Routing Structure
```
/dashboards                          - Dashboard list
/dashboards/:id                      - Dashboard view (root)
/dashboards/:id/subpages/:subId      - Subpage view
/dashboards/:id/subpages/:subId?deviceId={guid}  - Subpage with device context
```

#### State Management (Zustand)
```typescript
interface DashboardStore {
  // Existing state...
  
  // New state
  currentDashboard: Dashboard | null;
  parentDashboard: Dashboard | null;
  subPages: SubPageSummary[];
  deviceContext: {
    deviceId?: string;
    deviceName?: string;
    deviceTypeId?: string;
  } | null;
  
  // New actions
  loadSubPages: (dashboardId: string) => Promise<void>;
  setDeviceContext: (context: DeviceContext) => void;
  clearDeviceContext: () => void;
  createSubPage: (parentId: string, config: CreateSubPageConfig) => Promise<Dashboard>;
}
```

#### Components

**1. SubPageManager Component**
- Location: `src/components/dashboard/SubPageManager.tsx`
- Purpose: Manage subpages for a dashboard
- Features:
  - List existing subpages
  - Create new subpage
  - Reorder subpages
  - Delete subpage

**2. DeviceListWidget (Enhanced)**
- Location: `src/components/dashboard/widgets/device-list-widget.tsx`
- Changes:
  - Add `onDeviceClick` handler
  - Add `linkedSubPageId` configuration
  - Navigate to subpage with deviceId context

**3. MapWidget (Enhanced)**
- Location: `src/components/dashboard/widgets/map-widget.tsx`
- Changes:
  - Add device marker click handler
  - Show device info popup
  - Add "View Details" link to popup
  - Support multiple device type overlays

**4. DeviceContextBanner Component**
- Location: `src/components/dashboard/DeviceContextBanner.tsx`
- Purpose: Show current device context on subpages
- Features:
  - Display device name and type
  - Show "Back to Overview" link
  - Clear device context option

**5. WidgetDataConfig (Enhanced)**
- Location: `src/components/dashboard/builder/WidgetDataConfig.tsx`
- Changes:
  - Add "Use Selected Device" checkbox (visible on subpages)
  - Show device context info when enabled
  - Disable device selection when context enabled

**6. DashboardCard (Enhanced)**
- Location: `src/components/dashboard/DashboardCard.tsx`
- Changes:
  - Show subpage count badge
  - Add expandable subpage list
  - Quick navigation to subpages

**7. SubPageWizard Component**
- Location: `src/components/dashboard/builder/SubPageWizard.tsx`
- Purpose: Guide user through creating device detail subpage
- Steps:
  1. Choose subpage type (Device Detail, Device Type List, Custom)
  2. Select widgets to include
  3. Configure default filters
  4. Review and create

## Implementation Phases

### Phase 1: Foundation (Backend)
**Duration:** 2-3 hours
- [ ] Update Dashboard model with hierarchy fields
- [ ] Create database migration
- [ ] Update Dashboard repository
- [ ] Update Dashboard DTOs
- [ ] Modify Dashboard API endpoints
- [ ] Add subpage-specific endpoints
- [ ] Update API documentation

### Phase 2: Frontend Data Layer
**Duration:** 1-2 hours
- [ ] Update TypeScript types
- [ ] Enhance dashboard store with subpage support
- [ ] Add device context to store
- [ ] Update API client methods
- [ ] Add subpage API calls

### Phase 3: Core UI Components
**Duration:** 3-4 hours
- [ ] Create SubPageManager component
- [ ] Create DeviceContextBanner component
- [ ] Enhance DashboardCard with subpage display
- [ ] Update dashboard routing
- [ ] Add URL parameter handling for device context

### Phase 4: Widget Enhancements
**Duration:** 3-4 hours
- [ ] Enhance DeviceListWidget with click-through
- [ ] Enhance MapWidget with popups and navigation
- [ ] Update WidgetDataConfig for context awareness
- [ ] Add device context filtering to widget data fetching
- [ ] Test all widget types with device context

### Phase 5: Creation Wizards
**Duration:** 2-3 hours
- [ ] Create SubPageWizard component
- [ ] Add "Create Detail Page" prompt in widget config
- [ ] Implement auto-subpage creation logic
- [ ] Add pre-configured widget templates for subpages

### Phase 6: Testing & Polish
**Duration:** 2-3 hours
- [ ] Integration testing
- [ ] Navigation flow testing
- [ ] Device context propagation testing
- [ ] UI/UX polish
- [ ] Documentation updates

**Total Estimated Duration:** 13-19 hours

## Technical Considerations

### Performance
- Lazy load subpages (don't fetch until expanded)
- Cache device context in session storage
- Debounce widget data refetching on context change
- Use React.memo for device list rows

### Security
- Verify user permissions for parent dashboard before accessing subpage
- Validate device context matches user's accessible devices
- Tenant isolation on all dashboard queries

### Error Handling
- Handle missing subpages gracefully
- Show message if device no longer exists
- Fallback to parent dashboard if subpage deleted
- Clear invalid device context

### Browser Support
- URL state management (deviceId parameter)
- Browser back/forward navigation
- Bookmark support for subpages with context

## Future Enhancements (Out of Scope)
- Multiple device selection (compare view)
- Device group navigation
- Breadcrumb trail for deep hierarchies
- Template subpages for device types
- Cross-dashboard device linking
