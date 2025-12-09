# Digital Twin UI Requirements

**Epic 13 - Phase 2: Frontend Integration**  
**Created**: December 9, 2025  
**Status**: Planning  
**Priority**: High

---

## Executive Summary

This document defines the requirements for integrating the Digital Twin Asset Hierarchy system into the Sensormine Web UI. Phase 1 (Backend API) is complete with 26 endpoints and 6 database tables. Phase 2 focuses on creating an intuitive, multi-tenant frontend for managing asset hierarchies, assigning devices to assets, and mapping telemetry data points.

**Key Deliverables:**
1. Asset Hierarchy Tree Visualization
2. Asset CRUD Management Interface
3. Device-to-Asset Assignment UI
4. Data Point Mapping Editor
5. Asset State Dashboard

---

## Functional Requirements

### FR-1: Asset Hierarchy Management

#### FR-1.1: Tree Visualization
**Description:** Display asset hierarchy as an interactive tree

**Requirements:**
- Display assets in expandable/collapsible tree structure
- Show asset name, type icon, and status indicator
- Support multiple root assets (different sites/facilities)
- Navigate up to 10 levels deep (site → building → floor → area → zone → equipment → subsystem → component → subcomponent → sensor)
- Color-code by asset type (site=blue, equipment=green, sensor=gray, etc.)
- Display asset count badges (e.g., "Equipment (5)")
- Search/filter assets by name, type, status
- Keyboard navigation (arrow keys, Enter, Escape)
- Responsive layout (sidebar on desktop, full-screen on mobile)

**Acceptance Criteria:**
- ✅ Tree loads all root assets on mount
- ✅ Clicking expands/collapses children
- ✅ Search filters tree in real-time
- ✅ Selected asset highlights in tree
- ✅ Tree state persists in session storage

#### FR-1.2: Asset Creation
**Description:** Create new assets in the hierarchy

**Requirements:**
- Modal dialog with form fields:
  - Name (required, 1-100 chars)
  - Type (dropdown: Site, Building, Floor, Area, Zone, Equipment, Subsystem, Component, Subcomponent, Sensor)
  - Parent asset (tree picker, null for root)
  - Description (optional, 500 chars)
  - Status (Active, Inactive, Maintenance, Decommissioned)
  - Location (optional):
    - Address (text input with autocomplete)
    - GPS coordinates (lat/lon, manual or map picker)
    - Altitude (meters)
  - Metadata (key-value pairs, JSON editor)
  - Tags (comma-separated)
- Validation:
  - Name required and unique within parent
  - Type must be logical (e.g., can't put Site under Sensor)
  - GPS coordinates format validation
- Automatically sets Path, Level, TenantId
- Shows preview of where asset will be placed in tree

**Acceptance Criteria:**
- ✅ Form validates input before submission
- ✅ Asset appears in tree immediately after creation
- ✅ Success toast notification shown
- ✅ Error handling with user-friendly messages
- ✅ Respects tenant isolation (can't see other tenants' assets)

#### FR-1.3: Asset Editing
**Description:** Update existing asset properties

**Requirements:**
- Same form as creation, pre-populated with current values
- Allow changing all fields except ID, Path (auto-maintained)
- Warn if changing type affects children (e.g., Equipment → Sensor)
- Support moving asset to different parent (see FR-1.4)
- Show last updated timestamp and user
- Audit log of changes

**Acceptance Criteria:**
- ✅ Changes reflect immediately in tree
- ✅ Path recalculates if parent changed
- ✅ Validation prevents invalid hierarchy
- ✅ Optimistic UI update with rollback on error

#### FR-1.4: Asset Moving
**Description:** Move assets to different parents in hierarchy

**Requirements:**
- Drag-and-drop support:
  - Drag asset node
  - Drop on valid parent (with visual feedback)
  - Confirm move with dialog showing old → new path
- Alternative: "Move Asset" button opens parent picker
- Validates:
  - Not moving to own descendant (circular reference)
  - Target parent accepts source type
  - User has permission
- Updates all descendant paths automatically (backend triggers)
- Shows progress indicator for large moves

**Acceptance Criteria:**
- ✅ Drag-drop works smoothly with visual indicators
- ✅ Invalid drop targets show disabled cursor
- ✅ Confirmation dialog shows impact (# of descendants)
- ✅ Tree refreshes after move completes
- ✅ Error handling if move fails

#### FR-1.5: Asset Deletion
**Description:** Remove assets from hierarchy

**Requirements:**
- Delete button on asset detail page or context menu
- Confirmation dialog:
  - Shows asset name and type
  - Lists children count (if any)
  - Option: "Delete children" or "Cancel"
  - Warning if asset has active devices assigned
  - Warning if asset has data point mappings
- Cascade delete children if confirmed
- Soft delete (marks as Decommissioned) vs hard delete option
- Audit log entry

**Acceptance Criteria:**
- ✅ Cannot delete asset with active devices without confirmation
- ✅ Cascade delete works correctly
- ✅ Tree updates immediately after deletion
- ✅ Toast notification confirms deletion
- ✅ Can recover soft-deleted assets within 30 days

---

### FR-2: Device Assignment

#### FR-2.1: Assign Device to Asset
**Description:** Link physical devices/sensors to digital twin assets

**Requirements:**
- Two assignment methods:
  1. **Drag-and-drop**: Drag device from device list → drop on asset node
  2. **Selection dialog**: Click "Assign Device" on asset → select from list
- Device list shows:
  - Device name, serial number
  - Device type and schema
  - Current assignment status (unassigned, assigned to other asset)
  - Connection status (online, offline)
- Assignment validates:
  - Device exists and user has access
  - Asset-device type compatibility (e.g., Temperature Sensor → HVAC Equipment)
  - Device not already assigned to another asset (can reassign with confirmation)
- Multiple devices can be assigned to one asset
- Updates device record with AssetId field
- Shows devices on asset detail page

**Acceptance Criteria:**
- ✅ Drag-drop assigns device to asset
- ✅ Dialog shows only compatible devices
- ✅ Assignment persists in database (device.asset_id)
- ✅ Asset detail shows list of assigned devices
- ✅ Can unassign device (sets asset_id to null)

#### FR-2.2: View Assigned Devices
**Description:** See which devices are mapped to an asset

**Requirements:**
- Asset detail page "Devices" tab shows:
  - Table of assigned devices
  - Columns: Name, Serial, Type, Schema, Status, Last Seen, Actions
  - Click device → opens device detail page
  - "Unassign" button removes device from asset
- Quick stats: "5 devices assigned, 4 online, 1 offline"
- Filter by device type, status
- Export device list to CSV

**Acceptance Criteria:**
- ✅ Table loads assigned devices from API
- ✅ Real-time status updates via WebSocket
- ✅ Unassign button works with confirmation
- ✅ Click row navigates to device detail
- ✅ Export includes all device metadata

---

### FR-3: Data Point Mapping

#### FR-3.1: Create Mapping
**Description:** Map schema data points (JSON paths) to assets

**Requirements:**
- Mapping editor UI:
  - Left panel: Schema tree view (collapsible JSON structure)
    - Shows $.temperature, $.humidity, $.pressure, etc.
    - Expandable nested objects ($.location.lat)
  - Right panel: Asset tree view
- Mapping creation:
  1. Select JSON path from schema (e.g., $.temperature)
  2. Select target asset
  3. Configure:
     - Label (user-friendly name, e.g., "Boiler Temperature")
     - Description (optional)
     - Unit (e.g., "°C", "PSI", "RPM")
     - Aggregation method (Last, Average, Sum, Min, Max, Count)
     - Enable rollup (checkbox)
     - Transform expression (optional formula, e.g., "value * 1.8 + 32" for F to C)
  4. Validate and save
- Validation:
  - JSON path format (must start with $.)
  - Asset exists
  - Schema exists
  - No duplicate JSON path → asset mapping
- Shows mapping preview: "$.temperature → Site A / Building 1 / HVAC / Boiler #3"

**Acceptance Criteria:**
- ✅ Schema tree populates from SchemaRegistry.API
- ✅ Asset tree shows only relevant assets (filtered by device type)
- ✅ Drag-drop JSON path onto asset node creates mapping
- ✅ Form validates before submission
- ✅ Mapping appears in mappings list immediately

#### FR-3.2: Edit Mapping
**Description:** Update existing mapping configuration

**Requirements:**
- Mappings list table shows:
  - Schema name, JSON path
  - Asset name and path
  - Label, unit, aggregation method
  - Rollup enabled status
  - Actions: Edit, Delete
- Edit opens same form as create, pre-populated
- Can change label, unit, aggregation, transform, rollup
- Cannot change schema, JSON path, or asset (must delete and recreate)

**Acceptance Criteria:**
- ✅ Edit form loads current values
- ✅ Changes save successfully
- ✅ Table updates immediately

#### FR-3.3: Delete Mapping
**Description:** Remove mapping between data point and asset

**Requirements:**
- Delete button on mappings list
- Confirmation dialog: "Delete mapping $.temperature → Boiler #3?"
- Removes mapping from database
- Does not affect device or asset
- Audit log entry

**Acceptance Criteria:**
- ✅ Confirmation dialog shows before deletion
- ✅ Mapping removed from list immediately
- ✅ Toast notification confirms deletion

#### FR-3.4: Bulk Mapping
**Description:** Create multiple mappings at once

**Requirements:**
- "Import Mappings" button uploads CSV/JSON
- CSV format:
  ```
  schema_id,json_path,asset_id,label,unit,aggregation_method
  uuid,$.temperature,uuid,Boiler Temp,°C,Average
  ```
- Validates all rows before import
- Shows preview with validation results
- "Apply All" or "Apply Selected" buttons
- Shows progress bar during import
- Error report for failed rows

**Acceptance Criteria:**
- ✅ CSV parsing works correctly
- ✅ Validation prevents invalid mappings
- ✅ Bulk import creates all valid mappings
- ✅ Error report downloadable

---

### FR-4: Asset State Dashboard

#### FR-4.1: Real-Time State View
**Description:** Display current state of asset from telemetry

**Requirements:**
- Asset detail page "State" tab shows:
  - Current state dictionary (key-value pairs)
  - Calculated metrics (averages, totals, etc.)
  - Alarm status (Normal, Warning, Critical)
  - Alarm count (# of active alarms)
  - Last updated timestamp
  - "Refresh" button for manual update
- Data refreshes automatically every 5 seconds (configurable)
- Color-coded by alarm status:
  - Green = Normal
  - Yellow = Warning
  - Red = Critical
- Click metric → drill down to raw telemetry

**Acceptance Criteria:**
- ✅ State loads from /api/assets/{id}/state
- ✅ Auto-refresh via polling or WebSocket
- ✅ Color coding matches alarm status
- ✅ Timestamp shows relative time (e.g., "2 minutes ago")

#### FR-4.2: State History
**Description:** View historical state changes

**Requirements:**
- "History" button opens timeline view
- Timeline shows:
  - State changes over time
  - Alarm transitions (Normal → Warning → Critical)
  - User actions (state manually updated)
  - System events (device offline)
- Filter by date range, event type
- Export to CSV

**Acceptance Criteria:**
- ✅ Timeline loads from asset_audit_log table
- ✅ Filters work correctly
- ✅ Export includes all filtered events

---

### FR-5: Hierarchical Aggregation

#### FR-5.1: Parent Rollup View
**Description:** Show aggregated metrics from child assets

**Requirements:**
- Asset detail page shows "Aggregated Data" section
- Displays rollup metrics:
  - Average temperature across all child sensors
  - Total power consumption across all equipment
  - Min/max values
  - Sample counts
- Configurable rollup intervals:
  - 1 minute
  - 5 minutes
  - 15 minutes
  - 1 hour
  - 1 day
- Chart showing rollup values over time
- Drill down to child assets

**Acceptance Criteria:**
- ✅ Rollup data loads from asset_rollup_data hypertable
- ✅ Chart updates with selected interval
- ✅ Click child asset navigates to its detail page

---

## Non-Functional Requirements

### NFR-1: Multi-Tenancy
- All API calls include `X-Tenant-Id` header
- UI only shows assets for current user's tenant
- Tenant isolation enforced at database level (RLS policies)
- Cannot see or modify other tenants' assets
- Admin users can switch tenant context (dropdown in header)

### NFR-2: Performance
- Tree view loads <500ms for 1,000 assets
- Search filters tree in <100ms
- Pagination for large asset lists (50 per page)
- Lazy loading for deep hierarchies (load children on expand)
- Caching with Zustand for frequently accessed assets

### NFR-3: Security
- All endpoints require authentication (JWT token)
- Role-based access control:
  - **Admin**: Full CRUD on all assets
  - **Manager**: Read + Update on assigned assets
  - **Operator**: Read-only on assigned assets
  - **Viewer**: Read-only on all assets
- Audit log for all create/update/delete operations
- HTTPS only in production

### NFR-4: Usability
- Mobile-responsive (works on tablet for field use)
- Keyboard shortcuts:
  - Ctrl+N: New asset
  - Ctrl+S: Save
  - Escape: Close dialog
  - Arrow keys: Navigate tree
- Accessible (WCAG 2.1 AA compliant)
- Dark mode support
- Help tooltips on all forms

### NFR-5: Error Handling
- User-friendly error messages (no stack traces)
- Retry logic for transient failures (3 retries with exponential backoff)
- Offline detection with "Working Offline" banner
- Optimistic UI updates with rollback on error
- Toast notifications for success/error

---

## Technical Architecture

### Component Structure

```
src/Web/sensormine-web/src/
├── app/
│   └── digital-twin/
│       ├── page.tsx                   # Main tree view page
│       ├── [id]/
│       │   └── page.tsx               # Asset detail page
│       └── mappings/
│           └── page.tsx               # Mapping editor page
│
├── components/
│   └── digital-twin/
│       ├── AssetTree.tsx              # Hierarchical tree component
│       ├── AssetTreeNode.tsx          # Individual tree node
│       ├── AssetCreateDialog.tsx      # Create asset modal
│       ├── AssetEditDialog.tsx        # Edit asset modal
│       ├── AssetDeleteDialog.tsx      # Delete confirmation
│       ├── AssetDetailPanel.tsx       # Right panel with tabs
│       ├── AssetStateView.tsx         # Real-time state display
│       ├── AssetDeviceList.tsx        # Assigned devices table
│       ├── DeviceAssignDialog.tsx     # Device assignment picker
│       ├── MappingEditor.tsx          # Schema → Asset mapper
│       ├── MappingList.tsx            # Mappings table
│       ├── MappingForm.tsx            # Create/edit mapping form
│       └── AssetSearchBar.tsx         # Tree search/filter
│
├── lib/
│   └── api/
│       └── digital-twin.ts            # DigitalTwin.API client
│           ├── getAssets()
│           ├── getAssetById()
│           ├── getAssetTree()
│           ├── getAssetChildren()
│           ├── getAssetDescendants()
│           ├── createAsset()
│           ├── updateAsset()
│           ├── moveAsset()
│           ├── deleteAsset()
│           ├── getAssetState()
│           ├── updateAssetState()
│           ├── getMappings()
│           ├── getMappingsByAsset()
│           ├── getMappingsBySchema()
│           ├── createMapping()
│           ├── updateMapping()
│           └── deleteMapping()
│
└── stores/
    └── digital-twin-store.ts          # Zustand state management
        ├── assets: Asset[]            # Cached assets
        ├── selectedAssetId: string    # Current selection
        ├── expandedNodes: Set<string> # Tree expansion state
        ├── mappings: Mapping[]        # Cached mappings
        ├── isLoading: boolean
        ├── error: string | null
        ├── fetchAssets()
        ├── fetchAssetTree()
        ├── selectAsset()
        ├── expandNode()
        ├── createAsset()
        ├── updateAsset()
        └── deleteAsset()
```

### API Integration

**Base URL:** `http://localhost:5297` (DigitalTwin.API)

**Request Headers:**
```typescript
{
  'Content-Type': 'application/json',
  'X-Tenant-Id': currentUser.tenantId,
  'Authorization': `Bearer ${accessToken}`
}
```

**Response Handling:**
- 200: Success
- 201: Created
- 400: Validation error (show field-level errors)
- 401: Unauthorized (redirect to login)
- 403: Forbidden (show "No permission" message)
- 404: Not found (show "Asset not found")
- 500: Server error (show generic error, log to Sentry)

### State Management (Zustand)

```typescript
interface DigitalTwinStore {
  // Asset state
  assets: Asset[];
  selectedAsset: Asset | null;
  expandedNodes: Set<string>;
  
  // Mapping state
  mappings: DataPointMapping[];
  selectedMapping: DataPointMapping | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Actions
  fetchAssets: () => Promise<void>;
  fetchAssetTree: (rootId: string) => Promise<void>;
  selectAsset: (id: string) => void;
  expandNode: (id: string) => void;
  collapseNode: (id: string) => void;
  createAsset: (data: CreateAssetRequest) => Promise<Asset>;
  updateAsset: (id: string, data: UpdateAssetRequest) => Promise<Asset>;
  moveAsset: (id: string, newParentId: string) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  
  fetchMappings: () => Promise<void>;
  fetchMappingsByAsset: (assetId: string) => Promise<void>;
  createMapping: (data: CreateMappingRequest) => Promise<Mapping>;
  updateMapping: (id: string, data: UpdateMappingRequest) => Promise<Mapping>;
  deleteMapping: (id: string) => Promise<void>;
  
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}
```

### UI Libraries

**Tree Visualization:**
- **react-arborist** (Recommended)
  - High performance (virtualized rendering)
  - Drag-and-drop built-in
  - Keyboard navigation
  - Customizable node rendering
  - Example: `<Tree data={assets} openByDefault={false} />`

**Alternative: react-complex-tree**
- More features (multi-select, inline editing)
- Heavier bundle size
- Better accessibility

**Form Handling:**
- **react-hook-form** (already in project)
- **zod** for validation schemas

**Drag-and-Drop:**
- **@dnd-kit/core** for device assignment
- Built-in to react-arborist for tree moves

**Location Picker:**
- **react-leaflet** for map view (already in project dependencies)
- Geocoding API integration (Google Maps or OpenStreetMap)

---

## Implementation Phases

### Phase 2A: Asset Tree Foundation (8 points)
**User Stories:**
- Story 13.2: Asset Tree Visualization
- Story 13.3: Asset CRUD Management

**Deliverables:**
- API client (`digital-twin.ts`)
- Zustand store (`digital-twin-store.ts`)
- Tree component (`AssetTree.tsx`)
- Create/edit/delete dialogs
- `/digital-twin` page route

**Acceptance:**
- ✅ Tree loads and displays assets
- ✅ Can create/edit/delete assets
- ✅ Tree updates in real-time

### Phase 2B: Device Assignment (5 points)
**User Story:**
- Story 13.4: Device-to-Asset Assignment

**Deliverables:**
- Device assignment dialog (`DeviceAssignDialog.tsx`)
- Drag-drop device assignment
- Assigned devices list on asset detail
- Update device.asset_id via Device.API

**Acceptance:**
- ✅ Can assign/unassign devices
- ✅ Asset shows assigned devices
- ✅ Device detail shows parent asset

### Phase 2C: Data Point Mapping (8 points)
**User Story:**
- Story 13.5: Data Point Mapping UI

**Deliverables:**
- Mapping editor (`MappingEditor.tsx`)
- Mapping list/form (`MappingList.tsx`, `MappingForm.tsx`)
- Schema tree integration with SchemaRegistry.API
- `/digital-twin/mappings` page route

**Acceptance:**
- ✅ Can create/edit/delete mappings
- ✅ Schema tree shows JSON paths
- ✅ Drag-drop JSON path onto asset

### Phase 2D: State Dashboard (5 points)
**User Story:**
- Story 13.6: Asset State Visualization

**Deliverables:**
- Asset state view (`AssetStateView.tsx`)
- Real-time updates (polling or WebSocket)
- State history timeline
- Aggregated data charts

**Acceptance:**
- ✅ Asset state displays correctly
- ✅ Updates in real-time
- ✅ Can view history

---

## Success Metrics

### User Adoption
- 80% of users create at least one asset within first week
- Average 50 assets per tenant after 1 month
- 70% of devices assigned to assets within 2 months

### Performance
- Tree view load time <500ms for 1,000 assets
- Search response <100ms
- API response time p95 <200ms

### Quality
- Zero data loss incidents
- <1% error rate on API calls
- 95% user satisfaction score

---

## Open Questions

1. **Asset Import:** Support CSV/Excel import of asset hierarchies?
2. **Asset Templates:** Pre-defined asset structures (e.g., "Manufacturing Plant" template)?
3. **Asset Relationships:** Support non-hierarchical relationships (e.g., "Cooling Tower serves HVAC 1, 2, 3")?
4. **Permissions Granularity:** Asset-level permissions or just tenant-level?
5. **3D Models:** Integrate 3D building/equipment models (Three.js)?
6. **Asset Images:** Upload photos of assets (store in S3/MinIO)?

---

## References

- **Backend API Documentation:** `docs/digital-twin-phase1-complete.md`
- **Database Schema:** `infrastructure/timescaledb/init-digital-twin-schema.sql`
- **Epic Overview:** `docs/user-stories.md` (Epic 13)
- **Architecture:** `docs/architecture.md`
- **Tech Stack:** `docs/technology-stack.md`
- **Session Notes:** `docs/digital-twin-session-2025-12-09.md`
