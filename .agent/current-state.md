# Sensormine Platform v5 - Current State

**Last Updated**: 2025-12-04  
**Current Sprint**: Epic 4 - Visualization & Dashboards (Frontend Foundation)  
**Active Story**: Story 0.0 - Frontend Project Setup (✅ Complete)

---

## Project Navigation

### Requirements & Planning
- **User Stories**: `docs/user-stories.md` - 122 stories across 13 epics (~1,520 points)
- **Architecture**: `docs/architecture.md` - System design, patterns, technology decisions
- **Technology Stack**: `docs/technology-stack.md` - Complete technology choices and rationale
- **User Requirements**: `docs/requirements.md` - Functional and non-functional requirements
- **Checklist**: `CHECKLIST.md` - High-level implementation tracking
- **GitHub Issues**: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues (201 issues)

### Project Structure
```
src/
├── Web/                   # ✅ Frontend Applications
│   ├── sensormine-web/    # Main web application (Next.js 14 + React)
│   │   ├── src/
│   │   │   ├── app/       # Next.js App Router pages
│   │   │   ├── components/ # UI components (shadcn/ui)
│   │   │   └── lib/       # API client, auth, utilities
│   │   ├── __tests__/     # Vitest unit tests
│   │   └── package.json
│   └── Sensormine.Mobile/ # Mobile app (React Native/Flutter) - TODO
│
├── Services/              # 11 Microservices (Backend - Foundation Ready)
│   ├── ApiGateway/        # Entry point, rate limiting, auth
│   ├── Edge.Gateway/      # MQTT broker, device connectivity
│   ├── Ingestion.Service/ # Data ingestion pipeline
│   ├── Device.API/        # Device management CRUD
│   ├── SchemaRegistry.API/# Schema versioning and validation
│   ├── Query.API/         # Time-series data queries
│   ├── Alerts.API/        # Alert rules and notifications
│   ├── DigitalTwin.API/   # Digital twin state management
│   ├── VideoMetadata.API/ # Video processing metadata
│   ├── StreamProcessing.Service/ # Real-time stream processing
│   └── Billing.API/       # Billing, metering, Stripe integration
│
└── Shared/                # 7 Shared Libraries
    ├── Sensormine.Core/   # Domain models, interfaces, utilities
    ├── Sensormine.Messaging/ # Kafka/NATS abstractions
    ├── Sensormine.Storage/   # Repository patterns, DB abstractions
    ├── Sensormine.AI/        # ML pipelines, anomaly detection
    ├── Sensormine.Schemas/   # Avro/JSON schema definitions
    ├── Sensormine.Billing/   # Billing models, Stripe SDK wrappers
    └── Sensormine.Connectors/ # Industrial protocol connectors (NEW)
```

### Infrastructure
- **Docker Compose**: `docker-compose.yml` - Local development environment
- **Helm Charts**: `infrastructure/helm/` - Kubernetes deployment
- **Terraform**: `infrastructure/terraform/` - Cloud infrastructure (AWS/Azure/GCP agnostic)
- **Scripts**: `scripts/` - Automation scripts (PowerShell)

---

## Current Epic: Visualization & Dashboards (Frontend Foundation)

### Epic Status: 🟢 Frontend Foundation Complete (1 of 11 stories completed)

| Story | Title | Priority | Points | Status | Notes |
|-------|-------|----------|--------|--------|-------|
| 0.0  | Frontend Project Setup | Critical | 13 | ✅ Complete | Foundation ready |
| 4.1  | Dashboard Builder | High | 21 | 🔴 Not Started | Core frontend capability |
| 4.2  | Time-Series Charts | High | 13 | 🔴 Not Started | Data visualization foundation |
| 4.3  | Video Timeline Widget | High | 13 | 🔴 Not Started | Video event correlation |
| 4.4  | 3D CAD Viewer | Medium | 21 | 🔴 Not Started | Facility visualization |
| 4.5  | LiDAR Point Cloud Viewer | Low | 21 | 🔴 Not Started | Advanced visualization |
| 4.6  | GIS Map Widget | High | 13 | 🔴 Not Started | Geographic device display |
| 4.7  | Gauge and KPI Widgets | Medium | 8 | 🔴 Not Started | Operational metrics |
| 4.8  | Dashboard Templates | Low | 8 | 🔴 Not Started | User onboarding |
| 4.9  | Real-Time Dashboard Updates | High | 13 | 🔴 Not Started | WebSocket/SignalR |
| 4.10 | Dashboard Annotations | Low | 8 | 🔴 Not Started | Collaboration feature |

### Frontend Technology Stack
**Selected Stack** (See `docs/technology-stack.md` for full details):
- **Web Framework**: React 18+ with Next.js 14
- **State Management**: Zustand
- **UI Components**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts (primary), D3.js (advanced)
- **Maps**: Leaflet (primary), Mapbox GL JS (advanced)
- **3D Viewer**: Three.js
- **Real-time**: Socket.IO or SignalR client
- **Testing**: Vitest + React Testing Library + Playwright
- **API Client**: Generated TypeScript client from OpenAPI specs

### Backend Technology Stack
**Core Stack** (See `docs/technology-stack.md` for full details):
- **Runtime**: .NET 8 (C# 12)
- **Database**: PostgreSQL 15+ with TimescaleDB extension
- **Cache**: Redis 7+
- **Messaging**: Apache Kafka (primary), NATS (edge)
- **Authentication**: Keycloak (OIDC/JWT)
- **Container Orchestration**: Kubernetes + Helm
- **Monitoring**: Prometheus + Grafana + OpenTelemetry

### Next Story Recommendation
**Story 4.1: Dashboard Builder** (High Priority, 21 points)

**Prerequisites Complete:**
- ✅ Frontend project initialized (Story 0.0)
- ✅ React + Next.js 14 with TypeScript
- ✅ Tailwind CSS + shadcn/ui components
- ✅ API client infrastructure ready
- ✅ Authentication structure in place
- ✅ Base layout and routing configured

**Story 4.1 - Dashboard Builder** creates the foundation for all Epic 4 visualization features:
- Drag-and-drop dashboard builder
- Widget layout system (grid-based)
- Dashboard CRUD operations
- Widget configuration panels
- Dashboard templates
- Real-time data binding preparation

This story unblocks all subsequent visualization stories (4.2-4.10).

---

## Development Standards

### Tech Stack
- **.NET**: 8.0 (C# 12)
- **Database**: PostgreSQL + TimescaleDB (time-series), Redis (cache)
- **Messaging**: Kafka (primary), NATS (edge)
- **API Style**: REST + GraphQL (planned)
- **Container**: Docker + Kubernetes
- **Testing**: xUnit, Moq, Testcontainers

### Coding Principles
- Clean Architecture (Domain → Application → Infrastructure → API)
- CQRS for read-heavy operations
- Event-driven communication between services
- Multi-tenancy at application + data layers
- API-first design with OpenAPI specs
- Test-driven development (TDD)

### Before Starting Any Story
1. Read the story in `docs/user-stories.md`
2. Check dependencies on other stories
3. Create story plan in `.agent/story-templates/story-plan.md`
4. Write failing tests first (Red)
5. Implement minimum code to pass (Green)
6. Refactor with best practices
7. Update `.agent/current-state.md` when complete
8. Move plan to `.agent/completed-stories/{story-number}.md`

---

## Quick Start Commands

### Build & Test
```powershell
# Restore dependencies
dotnet restore Sensormine.sln

# Build entire solution
dotnet build Sensormine.sln

# Run all tests
dotnet test Sensormine.sln

# Run specific service
cd src/Services/Billing.API
dotnet run
```

### Infrastructure
```powershell
# Start local development stack (PostgreSQL, Kafka, Redis, MQTT)
docker-compose up -d

# Stop infrastructure
docker-compose down

# View logs
docker-compose logs -f
```

### Database Migrations (Entity Framework Core)
```powershell
# Add migration
dotnet ef migrations add MigrationName --project src/Shared/Sensormine.Storage

# Apply migration
dotnet ef database update --project src/Shared/Sensormine.Storage
```

---

## Completion Tracking

### Overall Progress
- **Total Stories**: 123 (including Story 0.0)
- **Total Points**: ~1,533
- **Completed**: 1 (0.8%)
- **In Progress**: 0
- **Not Started**: 122

### Epic Completion
| Epic | Name | Stories | Completed | % | Priority |
|------|------|---------|-----------|---|----------|
| 1 | Device Management | 11 | 0 | 0% | Backend |
| 2 | Data Ingestion & Modeling | 10 | 0 | 0% | Backend |
| 3 | Video Processing & AI/ML | 13 | 0 | 0% | Backend |
| 0 | Frontend Foundation | 1 | 1 | 100% | **✅ Complete** |
| 4 | Visualization & Dashboards | 10 | 0 | 0% | **🎯 Frontend - Next** |
| 5 | LLM Interaction & Analytics | 6 | 0 | 0% | Frontend/Backend |
| 6 | Alerting & Notifications | 12 | 0 | 0% | Backend |
| 7 | Industrial Connectivity | 10 | 5 | 50% | **✅ Stories 7.1-7.5 Complete** |
| 8 | Administration & System Mgmt | 9 | 0 | 0% | Frontend/Backend |
| 9 | Reporting & Data Export | 8 | 0 | 0% | Frontend/Backend |
| 10 | Mobile Application | 6 | 0 | 0% | **Mobile - Later** |
| 11 | Integration & APIs | 8 | 0 | 0% | Backend |
| 12 | Billing, Metering & Payments | 12 | 0 | 0% | Frontend/Backend |
| 13 | Performance & Scalability | 5 | 0 | 0% | Backend

---

## Active Blockers

- ~~**Frontend project does not exist yet**~~ - ✅ RESOLVED: Next.js 14 project created
- **Backend APIs are scaffolds only** - APIs need implementation to support frontend
- **No authentication/authorization implemented** - Frontend ready, needs backend Keycloak integration

---

## Frontend Development Strategy

### Phase 1: Foundation (Current Focus)
1. **Setup Frontend Project** - Choose React/Next.js or Blazor WebAssembly
2. **Core Infrastructure** - Auth, API clients, routing, state management
3. **Design System** - UI component library, theming, layouts
4. **Story 4.1** - Dashboard Builder (foundation for all visualizations)

### Phase 2: Data Visualization
5. **Story 4.2** - Time-Series Charts
6. **Story 4.6** - GIS Map Widget
7. **Story 4.7** - Gauge and KPI Widgets
8. **Story 4.9** - Real-Time Dashboard Updates

### Phase 3: Advanced Visualization
9. **Story 4.3** - Video Timeline Widget
10. **Story 4.4** - 3D CAD Viewer
11. **Story 4.5** - LiDAR Point Cloud Viewer (optional)

### Phase 4: User Experience
12. **Story 4.8** - Dashboard Templates
13. **Story 4.10** - Dashboard Annotations

### Backend Support Needed
- **Device.API** - Basic CRUD for devices (Story 1.x dependencies)
- **Query.API** - Time-series data endpoints (Story 4.2 dependency)
- **Authentication** - JWT/OAuth implementation (Epic 8 subset)
- **ApiGateway** - CORS, routing, rate limiting

### Technology Decision Required
**Option A: React + Next.js** (Recommended)
- ✅ Large ecosystem, excellent tooling
- ✅ TypeScript support
- ✅ Rich component libraries (shadcn/ui, MUI)
- ✅ Strong data visualization options
- ❌ Separate codebase from backend

**Option B: Blazor WebAssembly**
- ✅ Share C# models with backend
- ✅ .NET ecosystem consistency
- ✅ Strong typing across stack
- ❌ Smaller ecosystem
- ❌ Less mature visualization libraries

## Notes for AI Agent

- Always update this document after completing a story
- Use TDD workflow defined in `.agent/workflow.md`
- Keep story plans in `.agent/story-templates/` during active work
- Move completed plans to `.agent/completed-stories/` with test results
- Update GitHub issue status when marking stories complete
- Commit changes with story number in commit message: `git commit -m "[Story 4.1] Implement dashboard builder"`
- This file serves as context for new chat sessions - read it first!
- **Frontend First**: Prioritize user-facing features to demonstrate value early
