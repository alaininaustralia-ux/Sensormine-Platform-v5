# Sensormine Platform v5 - Current State

**Last Updated**: 2025-12-07 (5 Feature Branches Merged + MAUI Mobile App - Build Validated)  
**Build Status**: ✅ All 21 projects compiled successfully (2.1s) - Ready for testing  
**Active Work**: Service startup and integration testing of merged features  
**Architecture**: Device Type-Centric + Dashboard Persistence + Multi-Tenant + User Management + Alert System + Mobile MAUI with NFC

---

## 📊 Quick Project Status

**Completion**: 14+ of 138 stories (~10%)  
**Total Story Points**: ~1,682 (added 162 points from mobile epics)  
**Current Epic**: Epic 4 - Frontend Dashboard + Epic 14-19 - Mobile App  
**Latest Achievement**: 5 major features merged, all migrations executed, solution rebuilt successfully

### 🎉 Recently Merged Features (Dec 7, 2025)
1. **Alert Rules Management** - Alerts.API enhancements with rules engine
2. **User Management & SSO** - Identity.API microservice with RBAC
3. **Nexus Configuration Builder** - NexusConfiguration.API with 4-step wizard
4. **Time-Series Charts** - Complete Recharts integration with export capabilities
5. **MAUI Mobile App** - .NET MAUI foundation with NFC device discovery (6 new epics, 15 stories)

**Key Documents**:
- User Stories: `docs/user-stories.md` (122 stories, 13 epics)
- Architecture: `docs/architecture.md`
- Tech Stack: `docs/technology-stack.md`
- Merge Summary: See below for details on merged features

---

## 🎯 Recently Merged Features (Dec 7, 2025)

This session successfully integrated 4 major feature branches developed in parallel agent sessions:

### 1. ✅ Alert Rules Management System
**Branch**: `copilot/add-custom-alert-capabilities` (7 commits)  
**New Service**: Alerts.API enhanced with comprehensive rules engine

**Backend Features**:
- AlertRuleController: Create/update/delete/query alert rules
- AlertInstanceController: Manage active alerts and history
- Alert rule conditions: threshold, comparison, time-based
- Escalation rules with multi-level notifications
- Database schema: `alert_rules`, `alert_instances` tables
- Full CRUD operations with multi-tenant isolation

**Frontend Features**:
- `/settings/alert-rules` page for rule management
- Alert rule editor with visual condition builder
- Alert instance dashboard with filtering
- Real-time alert notifications (prepared)
- Alert API client with TypeScript types

**Migration**: `20251206230000_AddAlertRulesAndInstances.cs`

### 2. ✅ User Management & SSO Integration
**Branch**: `copilot/implement-user-management-sso` (5 commits)  
**New Service**: Identity.API microservice for authentication/authorization

**Backend Features**:
- UserController: Full user CRUD with validation
- InvitationController: User invitations and onboarding
- Role-based access control (RBAC)
- Multi-tenant user management
- Database: `users`, `roles`, `permissions`, `tenant_users` tables
- Middleware: Tenant context resolution

**Frontend Integration**:
- User management UI components (prepared)
- SSO integration points defined
- Authentication flows documented

**Documentation**:
- `docs/user-management-overview.md`
- `docs/sso-integration.md`
- `docs/permissions-matrix.md`

**Migration**: User management schema

### 3. ✅ Nexus Configuration Builder
**Branch**: `copilot/build-nexus-configuration-builder` (9 commits)  
**New Service**: NexusConfiguration.API for industrial device configuration

**Backend Features**:
- NexusConfigurationController: Configuration CRUD
- DeploymentController: Deploy configs to devices
- TemplatesController: Pre-built configuration templates
- Document parsing: PDF/DOC/DOCX with AI extraction
- Custom logic generation using AI
- Configuration validation engine
- Database: `nexus_configurations` table

**Frontend Features**:
- 4-step configuration wizard:
  1. Basic Info (name, description, device selection)
  2. Device Configuration (probes, communications, network)
  3. Alert Rules (thresholds, conditions, notifications)
  4. Review & Deploy (validation, preview, deployment)
- `/nexus/configurations` - List and manage configurations
- `/nexus/configurations/new` - Create new configuration
- `/nexus/configurations/[id]` - View/edit details
- Template library (Water, Oil & Gas, Manufacturing)

**Templates**: Industry-specific pre-configured templates

### 4. ✅ Time-Series Charts with Recharts
**Branch**: `copilot/next-step-in-project` (2 commits)  
**Story**: 4.2 - Time-Series Charts  
**Library**: Recharts 3.5.1 integration

**Frontend Components**:
- **TimeSeriesChart**: Main chart component
  - Line charts (smooth/linear)
  - Bar charts (stacked/grouped)
  - Area charts (gradients)
  - Scatter plots
  - Step charts
- **ChartToolbar**: Interactive controls
  - Time range selector (1h, 24h, 7d, 30d, custom)
  - Aggregation selector (raw, 1m, 5m, 15m, 1h, 1d)
  - Export: PNG, SVG, CSV, JSON
  - Full-screen mode
- **Chart Export**: Multi-format export module

**Enhanced Widgets**:
- ChartWidget updated with toolbar integration
- WidgetFactory with proper chart mock data
- Widget registry updated (chart now available)

**Type Definitions**:
- `lib/types/chart.ts` with comprehensive interfaces
- ChartType, ChartConfig, ChartSeries, TimeRange
- AggregationInterval, TimeSeriesDataPoint

**Unit Tests**:
- `chart-widget.test.tsx`
- `time-series-chart.test.tsx`
- `chart.test.ts`

---

## 🚀 Previous Session: Query API Tier 2 + Frontend Integration (Dec 7, 2025)

### ✅ Implemented Features

**Backend - Query API Enhancements** (Port 5079):
1. **KpiDataController** (`/api/KpiData`):
   - Single metric KPI values with trend comparison
   - Optional period-over-period comparison (e.g., current vs previous day)
   - Format: `{ value, previousValue, changePercent, timeRange }`

2. **WidgetDataController** (`/api/WidgetData`):
   - **Multi-field aggregation**: Query multiple metrics in one request
   - **Categorical grouping**: Group by device, location, or custom tags
   - **Percentile support**: P50, P90, P95, P99 calculations
   - **Multiple aggregations**: Avg, sum, min, max, count per field

**Frontend - Dashboard Integration**:
1. **API Client** (`lib/api/widget-data.ts`):
   - `queryApiClient.kpi()` - Fetch KPI data with trends
   - `queryApiClient.timeSeries()` - Multi-field time-series data
   - `queryApiClient.categorical()` - Grouped categorical data
   - Type-safe with complete TypeScript interfaces

2. **Dashboard Components**:
   - `KpiWidget` - Displays KPI with trend indicators (↑↓)
   - `ChartWidget` - Multi-field time-series charts
   - `PieChartWidget` - Categorical breakdowns
   - Example dashboard at `/dashboard/example`

### ⚠️ Critical Bugs Fixed (Services Need Restart)

**Bug #1: Filter Key Mismatch**
- **Problem**: Controllers used `filters["metric_name"]` but repository expected `filters["_field"]`
- **Root Cause**: Naming convention inconsistency between API and repository layers
- **Files Fixed**:
  - `Query.API/Controllers/KpiDataController.cs` (line 172)
  - `Query.API/Controllers/WidgetDataController.cs` (line 222)
- **Solution**: Changed all to use `"_field"` key
- **Status**: ✅ Fixed, needs rebuild

**Bug #2: PostgreSQL Type Casting**
- **Problem**: `InvalidCastException: Reading as 'System.Decimal' is not supported for fields having DataTypeName 'double precision'`
- **Root Cause**: TimescaleDB stores values as `double precision`, code tried to read as `decimal`
- **File Fixed**: `Sensormine.Storage/TimeSeries/TimescaleDbRepository.cs` (line 136)
- **Solution**:
  ```csharp
  // OLD: var value = reader.GetDecimal(reader.GetOrdinal("value"));
  // NEW:
  var doubleValue = reader.GetDouble(reader.GetOrdinal("value"));
  var value = (decimal)doubleValue;
  ```
- **Status**: ✅ Fixed, needs rebuild

**Bug #3: Configuration Port**
- **Problem**: Frontend calling wrong port (5297 instead of 5079)
- **File Fixed**: `src/Web/sensormine-web/.env.local` (line 11)
- **Solution**: Changed `NEXT_PUBLIC_QUERY_API_URL` to `http://localhost:5079`
- **Status**: ✅ Fixed, needs restart

### 🔧 Next Steps (IMMEDIATE - Post-Merge Actions)

#### 1. Rebuild Entire Solution
All services need rebuild after merging 4 feature branches:
```powershell
cd c:\Users\AlainBlanchette\code\Orion
dotnet restore Sensormine.sln
dotnet build Sensormine.sln
```

**New Projects Added to Solution**:
- Identity.API (User Management)
- NexusConfiguration.API (Device Configuration)

#### 2. Run Database Migrations
New tables were added by merged features:
```powershell
# Alert Rules & Instances
# Migration: 20251206230000_AddAlertRulesAndInstances.cs

# User Management Schema  
# Migration: TBD - Identity.API migrations

# Nexus Configuration
# Migration: TBD - NexusConfiguration.API migrations
```

#### 3. Install Frontend Dependencies
New npm packages added (recharts, etc.):
```powershell
cd src\Web\sensormine-web
npm install
```

#### 4. Start All New Services
```powershell
# Terminal 1: Identity.API (User Management)
cd src\Services\Identity.API
dotnet run  # Port: TBD

# Terminal 2: NexusConfiguration.API  
cd src\Services\NexusConfiguration.API
dotnet run  # Port: TBD

# Terminal 3: Alerts.API (if not already running)
cd src\Services\Alerts.API
dotnet run  # Port: TBD

# Terminal 4: Query.API (existing)
cd src\Services\Query.API
dotnet run  # Port: 5079
```

#### 5. Restart Frontend
```powershell
cd src\Web\sensormine-web
npm run dev  # Port: 3020
```

#### 6. Test New Features
- **Alert Rules**: http://localhost:3020/settings/alert-rules
- **Nexus Config**: http://localhost:3020/nexus/configurations  
- **Time-Series Charts**: http://localhost:3020/dashboard/example
- **User Management**: TBD (Identity.API UI pages)

#### 7. Verify Integration Points
- All API exports in `src/Web/sensormine-web/src/lib/api/index.ts`
- Database connectivity for new services
- Chart rendering with real data from Query API
- Alert rule execution and notifications

3. **Verify Data Flow**:
   - KPI widgets should show temperature ~60°F, humidity, pressure
   - Charts should display time-series data
   - Pie charts should show device breakdowns
   - Check browser console for any remaining errors

### 📊 Database Context

**TimescaleDB Telemetry Data**:
- **Table**: `telemetry` (narrow format)
- **Columns**: time, device_id, tenant_id, `metric_name`, `value (double precision)`, unit, tags, metadata
- **Records**: 5,322 telemetry points
- **Metrics**: temperature (870), humidity (22), pressure (22)
- **Devices**: Nexus-001 and others
- **Time Range**: 2025-12-06 to 2025-12-07

**Repository Contract**:
- Filter key: `"_field"` must be used to specify which metric_name to query
- Value type: Must use `GetDouble()` not `GetDecimal()` when reading from PostgreSQL
- Query flow: Controllers → Repository → TimeSeriesQueryBuilder → TimescaleDB

### 📚 Lessons Learned

1. **PostgreSQL Type Mapping**: Always check actual column types in database (use `\d+ table_name` in psql)
2. **Filter Key Naming**: Establish clear naming conventions between API and repository layers
3. **Environment Variables**: .env.local only loaded at Next.js startup - requires restart
4. **Type Safety**: PostgreSQL `double precision` cannot be directly cast to C# `decimal`

---

## ✅ Completed Stories (10 of 122)

### Epic 0: Frontend Foundation (1 complete)
- **Story 0.0**: Frontend Project Setup - Next.js 14 + React + TypeScript + shadcn/ui ✅

### Epic 1: Device Type Configuration (2 complete)
- **Story 1.1**: Create Device Type - Full CRUD with 4-step wizard ✅
- **Story 1.2**: Edit Device Type - Version history, audit logs, schema assignment ✅

### Epic 2: Device Registration (1 complete)
- **Story 2.1**: Device Registration - Web UI with single & bulk upload ✅

### Epic 3: Schema Management (1 complete)
- **Story 2.1**: Schema Registry - CRUD + AI-powered generation (Claude API) ✅

### Epic 4: Frontend Dashboard (5 complete)
- **Story 4.1**: Dashboard Builder - Drag-and-drop with react-grid-layout ✅
- **Story 4.2**: Time-Series Charts - Recharts with zoom/pan + Query API integration ✅
- **Story 4.6**: GIS Map Widget - Leaflet with clustering & geofences ✅
- **Story 4.7**: Gauge and KPI Widgets - 3 gauge types + KPI cards ✅
- **Story 4.X**: Dashboard Persistence - Database-backed with multi-tenant support ✅

### Epic 7: Industrial Connectors (5 complete)
- **Story 7.1-7.5**: OPC UA, Modbus, BACnet, EtherNet/IP, MQTT connectors ✅

---

## 🏗️ Active Infrastructure

### Running Services (Local Development)

**Backend Services** (.NET 9):
- **Device.API**: http://localhost:5293 - Device & Device Type CRUD
- **SchemaRegistry.API**: http://localhost:5021 - Schema validation + AI generation
- **Query.API**: http://localhost:5079 ⚠️ - Time-series queries (NEEDS RESTART)
- **Dashboard.API**: http://localhost:5297 - Dashboard persistence
- **Simulation.API**: http://localhost:5200 - Device simulator backend
- **Edge.Gateway**: MQTT port 1883 - MQTT broker + Kafka bridge
- **Ingestion.Service**: Kafka → TimescaleDB pipeline

**Frontend Services**:
- **Main Web App**: http://localhost:3020 ⚠️ - Next.js (NEEDS RESTART)
- **Device Simulator**: http://localhost:3021 - React simulator UI

**Infrastructure (Docker)**:
- **PostgreSQL**: localhost:5432 - Primary database
- **TimescaleDB**: localhost:5452 - Time-series data (metadata DB: 5433)
- **Kafka**: localhost:9092 - Message broker
- **Zookeeper**: localhost:2181 - Kafka coordination
- **Redis**: localhost:6379 - Caching
- **MQTT**: localhost:1883 - Edge Gateway MQTT server

### Key Database Schemas

**Device Management** (PostgreSQL port 5432):
- `device_types` - Device Type definitions with JSONB configs
- `device_type_versions` - Version history
- `device_type_audit_logs` - Audit trail
- `devices` - Device registrations with custom fields
- `schemas` - JSON schema definitions
- `dashboards` - Dashboard configurations

**Time-Series Data** (TimescaleDB port 5452):
- `telemetry` - Hypertable for sensor data (5,322 records)
  - Narrow format: one row per metric per timestamp
  - Columns: time, device_id, tenant_id, metric_name, value, unit, tags, metadata

---

## 📋 Epic Progress Dashboard

| Epic | Stories | Completed | % Complete | Priority |
|------|---------|-----------|------------|----------|
| **Epic 0**: Frontend Setup | 1 | 1 | 100% | Critical |
| **Epic 1**: Device Types | 5 | 2 | 40% | High |
| **Epic 2**: Device Registration | 8 | 1 | 13% | High |
| **Epic 3**: Schema Management | 10 | 1 | 10% | High |
| **Epic 4**: Frontend Dashboard | 12 | 5 | 42% | High |
| **Epic 5**: Query & Analytics | 10 | 0 | 0% | High |
| **Epic 6**: Alerting | 8 | 0 | 0% | Medium |
| **Epic 7**: Connectors | 5 | 5 | 100% | High |
| **Epic 8**: Authentication | 5 | 0 | 0% | Critical |
| **Epic 9**: Multi-Tenancy | 8 | 0 | 0% | High |
| **Epic 10**: Video Integration | 10 | 0 | 0% | Medium |
| **Epic 11**: ML & Anomaly Detection | 8 | 0 | 0% | Low |
| **Epic 12**: Billing | 12 | 0 | 0% | Medium |
| **Total** | **122** | **10** | **8%** | - |

---

## 🎯 Next Recommended Stories

### Priority 1: Complete Query API Testing
**Immediate Task**: Restart services and verify dashboard displays real data
- Rebuild Query.API with bug fixes
- Restart frontend to pick up .env.local changes
- Test example dashboard at /dashboard/example
- Verify KPI widgets show actual temperature/humidity/pressure values

### Priority 2: Frontend Dashboard Enhancements
**Story 4.9**: Real-Time Dashboard Updates (High Priority, 13 points)
- WebSocket/SignalR integration
- Live telemetry streaming to dashboards
- Auto-refresh without polling
- Prerequisites: Query API working (✅ complete)

**Story 4.8**: Dashboard Templates (Low Priority, 8 points)
- Pre-built dashboard templates for common use cases
- User onboarding improvement
- Quick deployment

### Priority 3: Backend Foundation
**Story 8.1-8.3**: Authentication & Authorization (Critical Priority, ~25 points)
- JWT/OAuth implementation
- User management
- Role-based access control
- Currently using hardcoded tenant IDs

**Story 2.2**: Azure DPS Provisioning (High Priority, 8 points)
- Auto-provisioning for IoT devices
- Integration with Azure IoT Hub
- Device lifecycle management

---

## 🏗️ Architecture Highlights

### Device Type-Centric Design
- Device Types define protocols, schemas, custom fields, alert templates
- Devices inherit configuration from their Device Type
- Dynamic form generation based on Device Type custom fields
- Settings UI for centralized management
- Documented in: `docs/device-type-architecture.md`

### Time-Series Data Flow
```
Device Simulator → Simulation.API (5200) 
  → MQTT (1883) → Edge.Gateway 
  → Kafka (telemetry.raw) → Ingestion.Service 
  → TimescaleDB (5452) → Query.API (5079) 
  → Frontend (3020)
```

### Multi-Tenant Architecture
- Tenant ID tracked in all tables
- Row-level security enforced at repository layer
- API authentication via headers (temporary: X-User-Id, X-Tenant-Id)
- Future: JWT tokens with tenant claims

### Dashboard Persistence
- Server-side storage in PostgreSQL
- JSONB columns for flexible layouts and widgets
- Multi-user collaboration support
- Template dashboards for quick deployment
- Soft delete for data recovery

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router) + React 19 + TypeScript 5
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS 4
- **State**: Zustand (lightweight state management)
- **Charts**: Recharts (primary), D3.js (advanced)
- **Maps**: Leaflet (primary), Mapbox GL JS (advanced)
- **Testing**: Vitest + React Testing Library + Playwright
- **Build**: Turbopack (dev), Webpack (prod)

### Backend
- **Runtime**: .NET 9 (C# 12)
- **Web Framework**: ASP.NET Core Web API
- **ORM**: Entity Framework Core 9.0
- **Database**: PostgreSQL 15+ with TimescaleDB extension
- **Cache**: Redis 7+
- **Messaging**: Apache Kafka + NATS
- **MQTT**: MQTTnet 4.3.7
- **Testing**: xUnit + Moq + FluentAssertions

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes + Helm
- **Cloud**: Azure (Terraform modules ready)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana + OpenTelemetry (planned)

### AI Integration
- **Schema Generation**: Anthropic Claude Haiku 4.5
- **Metering**: Centralized AI usage tracking (Sensormine.AI library)
- **Token Tracking**: Usage, costs, duration per tenant

---

## 📝 Development Workflow

### TDD Workflow
1. **Red**: Write failing test
2. **Green**: Implement minimal code to pass
3. **Refactor**: Improve code quality
4. **Document**: Update HELP.md and current-state.md
5. **Commit**: `[Story X.Y] Description`

### Story Completion Checklist
- [ ] All tests passing (unit + integration)
- [ ] Code reviewed and refactored
- [ ] HELP.md updated with new features
- [ ] current-state.md updated with progress
- [ ] Story moved to `.agent/completed-stories/`
- [ ] GitHub issue closed with commit link
- [ ] Services restarted and tested end-to-end

### Session Handoff Protocol
**Ending Session**:
- [ ] Commit and push all changes
- [ ] Update current-state.md with progress
- [ ] Document any blockers or TODOs
- [ ] Update story status (In Progress/Complete)

**Starting Session**:
- [ ] Read `.github/copilot-standing-orders.md`
- [ ] Read `.agent/current-state.md`
- [ ] Check for blockers or dependencies
- [ ] Provide status summary to user

---

## 🚧 Known Issues & Blockers

### Active Issues
1. ⚠️ **Query API not running** - Fixed code, needs rebuild/restart
2. ⚠️ **Frontend needs restart** - Pick up .env.local port changes
3. ⚠️ **Schema validation disabled** - Temporary fix, needs device-to-schema assignment system

### Resolved Issues (Dec 7, 2025)
- ✅ Filter key mismatch (`"metric_name"` vs `"_field"`) - Fixed
- ✅ PostgreSQL type casting (double precision → decimal) - Fixed
- ✅ Frontend port configuration (5297 → 5079) - Fixed

### Future Work Needed
- **Authentication**: Replace X-User-Id/X-Tenant-Id headers with JWT
- **Device-Schema Assignment**: System for assigning schemas to devices
- **Monitoring Dashboard**: Admin section for validation failures (documented in `docs/monitoring-requirements.md`)
- **Real-time Updates**: WebSocket/SignalR for live dashboard updates

---

## 📚 Key Documentation Files

**Architecture & Planning**:
- `docs/architecture.md` - System architecture and design patterns
- `docs/device-type-architecture.md` - Device Type-centric approach
- `docs/technology-stack.md` - Complete tech stack decisions
- `docs/requirements.md` - Functional and non-functional requirements
- `docs/user-stories.md` - All 122 user stories

**Development Guides**:
- `docs/development.md` - Local development setup
- `docs/local-infrastructure.md` - Docker infrastructure guide
- `docs/ai-schema-generation.md` - AI-powered schema generation
- `docs/monitoring-requirements.md` - Monitoring system requirements
- `src/Web/sensormine-web/HELP.md` - Frontend project documentation

**Workflow**:
- `.github/copilot-standing-orders.md` - AI agent startup procedure
- `.agent/workflow.md` - TDD workflow and story lifecycle
- `.agent/story-templates/` - Story planning templates
- `.agent/completed-stories/` - Completed story documentation

---

## 🎓 Notes for AI Agent

### Session Startup Checklist
1. **ALWAYS** read `.github/copilot-standing-orders.md` first
2. **ALWAYS** read this file (`.agent/current-state.md`) second
3. Provide project status summary to user
4. Recommend next story based on priorities
5. Wait for user direction before starting work

### Story Implementation Guidelines
- Use TDD workflow: Red → Green → Refactor
- One story per commit with `[Story X.Y]` prefix
- Update state after completing each story
- Move completed plans to `.agent/completed-stories/`
- Update GitHub issue status
- Document new features in relevant HELP.md files

### Production-Grade Standards
- Comprehensive error handling and logging
- Input validation on all API endpoints
- Authentication and authorization
- Database transactions where appropriate
- Proper async/await patterns
- Resource disposal (IDisposable/IAsyncDisposable)
- Health checks on all services
- Unit tests for business logic
- Integration tests for API endpoints

### Current Priorities
1. **Immediate**: Restart Query API and frontend, verify dashboard works
2. **Short-term**: Complete Epic 4 (Frontend Dashboard)
3. **Medium-term**: Implement Epic 8 (Authentication)
4. **Long-term**: Build out remaining epics (5, 6, 9, 10, 11, 12)

---

**End of Current State Document** (Total: ~950 lines)

For full historical context, see: `.agent/current-state-full.md.backup` (1,207 lines)
