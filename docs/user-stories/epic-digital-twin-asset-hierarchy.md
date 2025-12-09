# Epic: Digital Twin Asset Hierarchy & Data Point Mapping

## Executive Summary

Enable end users to create hierarchical asset structures (digital twins) and map telemetry data points from device schemas to specific assets in the hierarchy. This allows for:
- Asset-centric data organization (e.g., Building A → Crusher 2 → Motor Temperature)
- Hierarchical data aggregation and rollup
- Asset-based dashboards and analytics
- Multi-level asset performance monitoring

**Status**: 🟡 Phase 1 Complete - Core Digital Twin API and database foundation implemented (Dec 8, 2025)  
**Next Phase**: Phase 2 - Data Point Mapping UI and SchemaRegistry integration

---

## 🎉 Implementation Status (Phase 1 Complete - Dec 8, 2025)

### ✅ Completed Components

**Database Schema** (6 tables with PostgreSQL LTREE):
- ✅ `assets` - Hierarchical asset storage with LTREE paths
- ✅ `asset_states` - Real-time state tracking
- ✅ `data_point_mappings` - Schema JSON path to asset mappings
- ✅ `asset_rollup_configs` - Rollup configuration
- ✅ `asset_rollup_data` - TimescaleDB hypertable for rollups
- ✅ `asset_audit_log` - Audit trail

**Domain Models** (5 entities in Sensormine.Core):
- ✅ Asset.cs - Asset entity with Parent/Children navigation
- ✅ AssetState.cs - State tracking with alarm status
- ✅ DataPointMapping.cs - JSON path to asset mapping
- ✅ AssetRollupConfig.cs - Rollup configuration
- ✅ AssetRollupData.cs - Rollup storage

**Repository Layer** (2 implementations in Sensormine.Storage):
- ✅ AssetRepository - 15 methods (CRUD, hierarchical queries, state management)
- ✅ DataPointMappingRepository - 8 methods (CRUD, validation)

**API Controllers** (26 REST endpoints in DigitalTwin.API):
- ✅ AssetsController - 17 endpoints for asset management
- ✅ MappingsController - 9 endpoints for data point mapping

**DTOs & Extensions**:
- ✅ AssetDTOs.cs - Request/Response models for assets
- ✅ MappingDTOs.cs - Request/Response models for mappings
- ✅ StateDTOs.cs - State management models
- ✅ MappingExtensions.cs - Entity ↔ DTO conversions

**Build Status**: ✅ Solution compiles successfully (97 XML doc warnings only)

### 📋 Remaining Work (Phases 2-8)

**Phase 2 - Data Point Mapping** (Next, 2 weeks):
- [ ] SchemaRegistry integration for schema validation
- [ ] Frontend mapping editor (drag-drop JSON paths to assets)
- [ ] Bulk mapping import/export
- [ ] Mapping templates for common device types

**Phase 3 - Asset State Management** (2 weeks):
- [ ] Real-time asset state processor (Kafka consumer)
- [ ] Telemetry-to-asset mapping resolution
- [ ] Alarm threshold evaluation
- [ ] State change event publishing

**Phase 4 - Hierarchical Aggregation** (2 weeks):
- [ ] Rollup calculation engine
- [ ] TimescaleDB continuous aggregates
- [ ] Weighted averages for heterogeneous assets

**Phase 5-8** (Asset Management UI, Mapping UI, Dashboard Integration, Polish)
- See "Migration Strategy" section below for detailed breakdown

**Documentation**:
- 📄 Implementation summary: `docs/digital-twin-phase1-complete.md`
- 📄 Database schema: `infrastructure/timescaledb/init-digital-twin-schema.sql`

---

## User Story 1: Asset Hierarchy Management

**As a** plant operations manager  
**I want to** define and manage a hierarchical asset structure (digital twin)  
**So that** I can organize my physical assets logically and map sensor data to specific equipment

### Acceptance Criteria

1. **Asset Tree Structure** ✅ API Complete, ⏳ UI Pending (Phase 5)
   - [x] Create root-level assets (Sites, Buildings, Areas) - API endpoint implemented
   - [x] Create child assets under any parent (unlimited depth) - LTREE support implemented
   - [x] Each asset has: Name, Type, Description, Metadata, Status - Domain model complete
   - [x] Asset types: Site, Building, Area, Line, Equipment, Component, Sensor - Enum defined
   - [ ] Visual tree view with expand/collapse - Phase 5
   - [ ] Drag-and-drop to reorganize hierarchy - Phase 5
   - [ ] Bulk import from CSV/JSON - Phase 5

2. **Asset Properties**
   - [ ] Custom metadata fields per asset
   - [ ] Location/GPS coordinates
   - [ ] Manufacturer, model, serial number
   - [ ] Installation date, warranty info
   - [ ] Maintenance schedule
   - [ ] Asset photos/documents

3. **Asset Relationships**
   - [ ] Parent-child relationships
   - [ ] Asset groups/collections
   - [ ] Cross-references (e.g., spare parts)

### Technical Requirements

- Multi-tenant asset hierarchy storage
- PostgreSQL with recursive CTE support for tree queries
- Real-time updates via SignalR/WebSocket
- RBAC for asset management
- Audit trail for hierarchy changes

---

## User Story 2: Schema Data Point to Asset Mapping

**As a** data engineer  
**I want to** map specific data points from device schemas to assets in the hierarchy  
**So that** telemetry data is automatically associated with the correct physical equipment

### Acceptance Criteria

1. **Schema Mapping Interface** ✅ API Complete, ⏳ UI Pending (Phase 2)
   - [x] API for data point mappings - MappingsController implemented
   - [x] JsonPath to asset association - DataPointMapping model complete
   - [x] Define field label (human-readable name) - Label property implemented
   - [x] Add field description/documentation - Description property implemented
   - [x] Set aggregation method (last, avg, sum, min, max, count) - AggregationMethod enum
   - [ ] View schema fields in schema editor - Phase 2 UI
   - [ ] For each field, select target asset from hierarchy tree - Phase 2 UI
   - [ ] Preview mapped data structure - Phase 2 UI

2. **Mapping Configuration**
   - [ ] One-to-one: One data point → One asset
   - [ ] One-to-many: One data point → Multiple assets (broadcast)
   - [ ] Many-to-one: Multiple data points → One asset (consolidation)
   - [ ] Conditional mapping based on device metadata

3. **Mapping Validation**
   - [ ] Warn if data point unmapped
   - [ ] Detect circular references
   - [ ] Validate asset exists
   - [ ] Check data type compatibility

### Example Mapping

```json
{
  "schemaId": "abc-123",
  "mappings": [
    {
      "jsonPath": "$.temperature",
      "label": "Motor Temperature",
      "description": "Primary motor bearing temperature in °C",
      "targetAsset": {
        "assetId": "building-a/crusher-2/motor-1",
        "aggregation": "avg",
        "rollupEnabled": true
      }
    },
    {
      "jsonPath": "$.vibration.x",
      "label": "X-Axis Vibration",
      "description": "Vibration amplitude on horizontal axis",
      "targetAsset": {
        "assetId": "building-a/crusher-2",
        "aggregation": "max",
        "rollupEnabled": true
      }
    }
  ]
}
```

---

## User Story 3: Hierarchical Data Aggregation

**As a** facility manager  
**I want to** view aggregated metrics for assets at any level of the hierarchy  
**So that** I can monitor overall building/area performance without drilling into individual sensors

### Acceptance Criteria

1. **Rollup Calculations**
   - [ ] Aggregate child asset data to parent automatically
   - [ ] Support aggregation methods: avg, sum, min, max, count, latest
   - [ ] Real-time rollup as new data arrives
   - [ ] Historical rollup for time-range queries

2. **Rollup Configuration**
   - [ ] Enable/disable rollup per data point
   - [ ] Configure rollup interval (1min, 5min, 15min, 1hr)
   - [ ] Select which children to include
   - [ ] Weight/factor for weighted averages

3. **Rollup Performance**
   - [ ] Pre-computed rollups stored in TimescaleDB continuous aggregates
   - [ ] On-demand rollup for ad-hoc queries (< 2s for 1000 assets)
   - [ ] Cache rollup results (Redis)

### Example Rollup Hierarchy

```
Building A (Total Power: 450 kW)
├── Crusher 2 (Total Power: 200 kW)
│   ├── Motor 1 (Power: 120 kW, Temp: 65°C)
│   └── Motor 2 (Power: 80 kW, Temp: 62°C)
└── Conveyor 5 (Total Power: 250 kW)
    ├── Drive 1 (Power: 150 kW, Temp: 58°C)
    └── Drive 2 (Power: 100 kW, Temp: 60°C)
```

---

## User Story 4: Asset-Based Dashboard Designer

**As a** dashboard creator  
**I want to** build dashboards that show data for specific assets or asset groups  
**So that** users can monitor equipment performance in context

### Acceptance Criteria

1. **Asset Selector Widget**
   - [ ] New widget type: "Asset Selector"
   - [ ] Browse asset hierarchy tree
   - [ ] Search assets by name/type
   - [ ] Multi-select assets
   - [ ] Save asset selection in dashboard config

2. **Asset-Aware Widgets**
   - [ ] Time-series chart: Plot asset data points
   - [ ] KPI card: Show single asset metric
   - [ ] Asset status grid: Multi-asset overview
   - [ ] Asset comparison: Side-by-side metrics
   - [ ] Asset hierarchy: Tree view with live status

3. **Dynamic Data Binding**
   - [ ] Bind widget to asset ID
   - [ ] Auto-resolve mapped data points
   - [ ] Filter by asset type
   - [ ] Cascade filters (Building → Line → Equipment)

4. **Dashboard Templates**
   - [ ] "Asset Overview" template
   - [ ] "Asset Health" template
   - [ ] "Asset Comparison" template
   - [ ] Clone template for new assets

---

## User Story 5: Digital Twin State Management

**As a** system  
**I want to** maintain current state of each asset in the digital twin  
**So that** queries for asset status are fast and consistent

### Acceptance Criteria

1. **Asset State Storage**
   - [ ] Current state per asset (latest values)
   - [ ] Calculated metrics (uptime, availability, OEE)
   - [ ] Alarm/alert status
   - [ ] Last update timestamp

2. **State Updates**
   - [ ] Real-time state update on telemetry ingestion
   - [ ] Rollup state to parent assets
   - [ ] State change events published to event bus
   - [ ] State history (last 100 changes per asset)

3. **State Query API**
   - [ ] GET /api/digital-twin/assets/{assetId}/state
   - [ ] GET /api/digital-twin/assets/{assetId}/children/state
   - [ ] POST /api/digital-twin/assets/bulk-state (batch query)
   - [ ] WebSocket subscription for real-time updates

---

## Technical Architecture

### New Services

#### 1. **DigitalTwin.API** (Already scaffolded - needs implementation)

**Responsibilities:**
- Asset hierarchy CRUD operations
- Asset state management (current values)
- Data point mapping configuration
- Hierarchical queries with recursive CTEs

**Endpoints:**
```
POST   /api/assets                          # Create asset
GET    /api/assets/{id}                     # Get asset details
PUT    /api/assets/{id}                     # Update asset
DELETE /api/assets/{id}                     # Delete asset
GET    /api/assets/{id}/children            # Get direct children
GET    /api/assets/{id}/descendants         # Get entire subtree
POST   /api/assets/{id}/move                # Move in hierarchy

GET    /api/assets/{id}/state               # Current state
GET    /api/assets/{id}/rollup              # Aggregated state
POST   /api/assets/bulk-state               # Batch state query

POST   /api/assets/{id}/mappings            # Create data point mapping
GET    /api/assets/{id}/mappings            # List mappings
PUT    /api/mappings/{id}                   # Update mapping
DELETE /api/mappings/{id}                   # Delete mapping

GET    /api/asset-types                     # List asset types
POST   /api/asset-types                     # Define custom type
```

**Database Schema:**

```sql
-- Asset hierarchy table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    asset_type VARCHAR(50) NOT NULL, -- Site, Building, Area, Line, Equipment, Component
    path LTREE NOT NULL, -- Materialized path for efficient queries
    level INTEGER NOT NULL, -- Depth in hierarchy
    metadata JSONB, -- Custom properties
    location GEOGRAPHY(POINT), -- GPS coordinates
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, offline, decommissioned
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES assets(id),
    CONSTRAINT unique_asset_name_per_parent UNIQUE(tenant_id, parent_id, name)
);

CREATE INDEX idx_assets_tenant ON assets(tenant_id);
CREATE INDEX idx_assets_parent ON assets(parent_id);
CREATE INDEX idx_assets_path ON assets USING GIST(path);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_location ON assets USING GIST(location);

-- Asset state (current values) - optimized for reads
CREATE TABLE asset_states (
    asset_id UUID PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    state JSONB NOT NULL, -- Current data point values
    calculated_metrics JSONB, -- Derived KPIs (uptime, OEE, etc.)
    alarm_status VARCHAR(50), -- ok, warning, critical
    alarm_count INTEGER DEFAULT 0,
    last_update_time TIMESTAMPTZ NOT NULL,
    last_update_device_id VARCHAR(200),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_asset_states_tenant ON asset_states(tenant_id);
CREATE INDEX idx_asset_states_alarm ON asset_states(alarm_status);
CREATE INDEX idx_asset_states_last_update ON asset_states(last_update_time);

-- Data point to asset mappings
CREATE TABLE data_point_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    schema_id UUID NOT NULL, -- FK to schemas table
    schema_version VARCHAR(50) NOT NULL,
    json_path VARCHAR(500) NOT NULL, -- JSONPath expression (e.g., $.temperature)
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL, -- Human-readable name
    description TEXT,
    unit VARCHAR(50), -- e.g., °C, kW, rpm
    aggregation_method VARCHAR(50) DEFAULT 'last', -- last, avg, sum, min, max, count
    rollup_enabled BOOLEAN DEFAULT true,
    transform_expression TEXT, -- Optional: JavaScript/SQL expression for transformation
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT unique_mapping UNIQUE(tenant_id, schema_id, json_path, asset_id)
);

CREATE INDEX idx_mappings_tenant ON data_point_mappings(tenant_id);
CREATE INDEX idx_mappings_schema ON data_point_mappings(schema_id);
CREATE INDEX idx_mappings_asset ON data_point_mappings(asset_id);

-- Asset rollup configuration
CREATE TABLE asset_rollup_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    metric_name VARCHAR(200) NOT NULL,
    aggregation_method VARCHAR(50) NOT NULL, -- avg, sum, min, max, count, last
    rollup_interval INTERVAL DEFAULT '5 minutes', -- How often to compute
    include_children BOOLEAN DEFAULT true,
    weight_factor NUMERIC(10, 4) DEFAULT 1.0, -- For weighted averages
    filter_expression TEXT, -- Optional: WHERE clause to filter children
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT unique_rollup UNIQUE(tenant_id, asset_id, metric_name)
);

-- Pre-computed rollups (TimescaleDB continuous aggregate)
CREATE TABLE asset_rollup_data (
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION,
    sample_count INTEGER,
    metadata JSONB,
    PRIMARY KEY (asset_id, metric_name, time)
);

SELECT create_hypertable('asset_rollup_data', 'time');

CREATE INDEX idx_rollup_asset ON asset_rollup_data(asset_id);
CREATE INDEX idx_rollup_tenant ON asset_rollup_data(tenant_id);
CREATE INDEX idx_rollup_metric ON asset_rollup_data(metric_name);

-- Asset audit log
CREATE TABLE asset_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete, move
    changes JSONB, -- Before/after diff
    user_id VARCHAR(100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_asset ON asset_audit_log(asset_id);
CREATE INDEX idx_audit_time ON asset_audit_log(timestamp);
```

#### 2. **Asset State Processor** (New background service)

**Responsibilities:**
- Consume telemetry from Kafka
- Resolve data point mappings
- Update asset states in real-time
- Compute rollup aggregations
- Publish state change events

**Processing Flow:**
```
Telemetry → Kafka → Asset State Processor
                            ↓
                    Lookup Mappings (by deviceId + schema)
                            ↓
                    Update Asset State (PostgreSQL)
                            ↓
                    Compute Rollups (parent assets)
                            ↓
                    Publish State Change Event (SignalR/WebSocket)
                            ↓
                    Update Dashboard Widgets (Real-time)
```

### Modified Services

#### 3. **SchemaRegistry.API** (Enhancement)

**New Features:**
- Asset mapping UI in schema editor
- Mapping validation
- Export/import mappings with schema

**New Endpoints:**
```
GET  /api/schemas/{id}/mappings              # Get all mappings for schema
POST /api/schemas/{id}/mappings/validate     # Validate mapping configuration
POST /api/schemas/{id}/mappings/export       # Export mappings as JSON
POST /api/schemas/{id}/mappings/import       # Import mappings
```

#### 4. **Query.API** (Enhancement)

**New Features:**
- Asset-based queries
- Hierarchical data retrieval
- Rollup data queries

**New Endpoints:**
```
GET  /api/query/assets/{assetId}/timeseries       # Get time-series for asset
GET  /api/query/assets/{assetId}/latest           # Latest values
GET  /api/query/assets/{assetId}/aggregate        # Aggregated data
POST /api/query/assets/bulk-timeseries            # Batch query multiple assets
GET  /api/query/assets/{assetId}/rollup           # Pre-computed rollup data
```

#### 5. **Dashboard.API** (Enhancement)

**New Features:**
- Asset-aware widget types
- Asset selector component
- Dashboard templates

**New Widget Types:**
```typescript
{
  widgetType: "asset-selector",
  config: {
    allowMultiple: true,
    assetTypes: ["Equipment", "Component"],
    defaultSelection: ["building-a/crusher-2"]
  }
}

{
  widgetType: "asset-kpi",
  config: {
    assetId: "{{selectedAsset}}",
    metricName: "temperature",
    aggregation: "avg",
    timeRange: "1h"
  }
}

{
  widgetType: "asset-hierarchy",
  config: {
    rootAsset: "building-a",
    showStatus: true,
    expandLevel: 2
  }
}
```

### Frontend Components

#### New React Components

**Location:** `src/Web/sensormine-web/src/components/digital-twin/`

1. **AssetTreeView.tsx**
   - Hierarchical tree with expand/collapse
   - Drag-and-drop reordering
   - Context menu (add, edit, delete)
   - Real-time status indicators

2. **AssetEditor.tsx**
   - Form for asset properties
   - Parent asset selector
   - Location picker (map)
   - Metadata editor (key-value pairs)

3. **DataPointMappingEditor.tsx**
   - Split view: Schema fields (left) + Asset tree (right)
   - Drag field to asset to create mapping
   - Mapping configuration (label, aggregation, rollup)
   - Preview mapped structure

4. **AssetDashboard.tsx**
   - Asset selector dropdown
   - Current state display
   - Mini charts for key metrics
   - Child asset grid

5. **AssetRollupConfig.tsx**
   - Configure rollup rules
   - Preview rollup results
   - Enable/disable per metric

#### Enhanced Components

**Location:** `src/Web/sensormine-web/src/components/schemas/`

- **SchemaEditor.tsx** - Add "Mappings" tab
- **SchemaWizard.tsx** - Add mapping step to wizard

**Location:** `src/Web/sensormine-web/src/components/dashboard/`

- **WidgetEditor.tsx** - Add asset binding options
- **DashboardCanvas.tsx** - Support asset context

### API Client Updates

**Location:** `src/Web/sensormine-web/src/lib/api/`

**New Files:**
- `digitalTwin.ts` - Asset CRUD, state queries
- `assetMappings.ts` - Mapping CRUD

**Updated Files:**
- `schemas.ts` - Add mapping endpoints
- `query.ts` - Add asset-based queries
- `dashboards.ts` - Add asset widget types

### Performance Considerations

#### 1. **Materialized Path (LTREE)**
Use PostgreSQL LTREE for efficient hierarchical queries:
```sql
-- Find all descendants
SELECT * FROM assets 
WHERE path <@ 'building_a.crusher_2';

-- Find all ancestors
SELECT * FROM assets 
WHERE 'building_a.crusher_2.motor_1' ~ path::lquery;
```

#### 2. **TimescaleDB Continuous Aggregates**
Pre-compute rollups automatically:
```sql
CREATE MATERIALIZED VIEW asset_hourly_rollup
WITH (timescaledb.continuous) AS
SELECT 
    asset_id,
    time_bucket('1 hour', time) AS bucket,
    metric_name,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    COUNT(*) as sample_count
FROM asset_rollup_data
GROUP BY asset_id, bucket, metric_name;
```

#### 3. **Redis Caching**
Cache frequently accessed data:
- Asset hierarchy (5 min TTL)
- Asset state (30 sec TTL)
- Data point mappings (10 min TTL)

#### 4. **Denormalization**
Store materialized path and level for O(1) depth queries

#### 5. **Batch Processing**
- Bulk state updates (batch write every 1s)
- Batch rollup computation (configurable interval)

### Migration Strategy

#### Phase 1: Core Digital Twin (2 weeks) ✅ COMPLETE (Dec 8, 2025)
- [x] Create database schema - `init-digital-twin-schema.sql` complete
- [x] Implement DigitalTwin.API endpoints - 26 endpoints implemented
- [x] Asset CRUD operations - AssetsController complete
- [x] Basic hierarchy queries - LTREE-based queries implemented
- [ ] Unit tests - TODO: Phase 1.5

**Implemented Files**:
- Database: `infrastructure/timescaledb/init-digital-twin-schema.sql`
- Models: `src/Shared/Sensormine.Core/Models/Asset.cs` (and 4 others)
- Repositories: `src/Shared/Sensormine.Storage/Repositories/AssetRepository.cs` (and 1 other)
- Controllers: `src/Services/DigitalTwin.API/Controllers/AssetsController.cs` (and 1 other)
- DTOs: `src/Services/DigitalTwin.API/DTOs/` (3 files)
- Documentation: `docs/digital-twin-phase1-complete.md`

#### Phase 2: Data Point Mapping (2 weeks)
- [ ] Mapping data model
- [ ] Mapping CRUD endpoints
- [ ] SchemaRegistry integration
- [ ] Mapping validation logic
- [ ] Unit tests

#### Phase 3: Asset State Management (2 weeks)
- [ ] Asset State Processor service
- [ ] Kafka consumer for telemetry
- [ ] State update logic
- [ ] Real-time state queries
- [ ] Integration tests

#### Phase 4: Hierarchical Aggregation (2 weeks)
- [ ] Rollup configuration
- [ ] Rollup computation engine
- [ ] TimescaleDB continuous aggregates
- [ ] Rollup query API
- [ ] Performance testing

#### Phase 5: Frontend - Asset Management (2 weeks)
- [ ] AssetTreeView component
- [ ] AssetEditor component
- [ ] Asset management page
- [ ] Asset search/filter
- [ ] E2E tests

#### Phase 6: Frontend - Mapping UI (2 weeks)
- [ ] DataPointMappingEditor component
- [ ] Schema editor integration
- [ ] Mapping wizard
- [ ] Validation feedback
- [ ] E2E tests

#### Phase 7: Dashboard Integration (2 weeks)
- [ ] Asset selector widget
- [ ] Asset-aware widget types
- [ ] Dashboard templates
- [ ] Real-time updates
- [ ] E2E tests

#### Phase 8: Optimization & Polish (1 week)
- [ ] Performance tuning
- [ ] Caching strategy
- [ ] Load testing (10k assets)
- [ ] Documentation
- [ ] User training materials

**Total Duration: ~15 weeks (3.75 months)**

---

## Dependencies & Prerequisites

### Required
- ✅ TimescaleDB with continuous aggregates
- ✅ PostgreSQL with LTREE extension
- ✅ Redis for caching
- ✅ Kafka for event streaming
- ✅ SchemaRegistry.API operational
- ⚠️ DigitalTwin.API needs implementation
- ⚠️ SignalR/WebSocket for real-time updates

### Optional
- Asset import from existing systems (API/CSV)
- AI-powered asset discovery from data patterns
- 3D asset visualization
- Asset photos/documents storage

---

## Success Metrics

1. **Hierarchy Scale**
   - Support 100,000+ assets per tenant
   - Query depth 20+ levels in < 100ms
   - Tree view renders 1000 nodes in < 1s

2. **Mapping Coverage**
   - 95%+ data points mapped within 30 days
   - < 5% orphaned data points
   - < 10% unmapped devices

3. **Performance**
   - Asset state update latency < 500ms (p95)
   - Rollup computation < 2s for 1000 assets
   - Dashboard load time < 1s with asset widgets

4. **User Adoption**
   - 80%+ of dashboards use asset widgets
   - 50%+ of alerts use asset-based rules
   - 90%+ user satisfaction score

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation with deep hierarchies | High | Use LTREE, materialized paths, caching |
| Complex mapping UI confusing | Medium | Wizard-based approach, templates, tooltips |
| Data consistency across services | High | Event-driven architecture, eventual consistency |
| Schema changes breaking mappings | Medium | Mapping versioning, migration tools |
| Rollup computation load | High | Continuous aggregates, batch processing |

---

## Open Questions

1. **Asset Lifecycle:** How to handle decommissioned assets with historical data?
2. **Multi-Device Assets:** Can one asset receive data from multiple devices?
3. **Cross-Tenant Assets:** Are there shared assets (corporate level)?
4. **Asset Permissions:** Granular RBAC per asset or inherit from hierarchy?
5. **Asset Versioning:** Track asset configuration changes over time?
6. **Data Retention:** Different retention for assets vs raw telemetry?

---

## References

- [PostgreSQL LTREE Documentation](https://www.postgresql.org/docs/current/ltree.html)
- [TimescaleDB Continuous Aggregates](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/)
- [JSONPath Specification](https://goessner.net/articles/JsonPath/)
- ISA-95 Asset Hierarchy Standard
- OPC UA Information Model

---

**Story Priority:** HIGH  
**Business Value:** HIGH  
**Technical Complexity:** HIGH  
**Estimated Effort:** 15 weeks (3.75 months)  
**Dependencies:** SchemaRegistry.API, TimescaleDB, DigitalTwin.API

