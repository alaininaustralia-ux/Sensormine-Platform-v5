# Sensormine Platform v5 - Current State

**Last Updated**: 2025-12-04  
**Current Sprint**: Epic 12 - Billing, Metering & Payments  
**Active Story**: None (Ready to start)

---

## Project Navigation

### Requirements & Planning
- **User Stories**: `docs/user-stories.md` - 122 stories across 13 epics (~1,520 points)
- **Architecture**: `docs/architecture.md` - System design, patterns, technology decisions
- **User Requirements**: `docs/requirements.md` - Functional and non-functional requirements
- **Checklist**: `CHECKLIST.md` - High-level implementation tracking
- **GitHub Issues**: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues (201 issues)

### Project Structure
```
src/
├── Services/              # 11 Microservices
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
│   └── Billing.API/       # ⚠️ NEW - Billing, metering, Stripe integration
│
└── Shared/                # 6 Shared Libraries
    ├── Sensormine.Core/   # Domain models, interfaces, utilities
    ├── Sensormine.Messaging/ # Kafka/NATS abstractions
    ├── Sensormine.Storage/   # Repository patterns, DB abstractions
    ├── Sensormine.AI/        # ML pipelines, anomaly detection
    ├── Sensormine.Schemas/   # Avro/JSON schema definitions
    └── Sensormine.Billing/   # ⚠️ NEW - Billing models, Stripe SDK wrappers
```

### Infrastructure
- **Docker Compose**: `docker-compose.yml` - Local development environment
- **Helm Charts**: `infrastructure/helm/` - Kubernetes deployment
- **Terraform**: `infrastructure/terraform/` - Cloud infrastructure (AWS/Azure/GCP agnostic)
- **Scripts**: `scripts/` - Automation scripts (PowerShell)

---

## Current Epic: Billing, Metering & Payments

### Epic Status: 🟡 In Progress (0 of 12 stories completed)

| Story | Title | Priority | Points | Status | Notes |
|-------|-------|----------|--------|--------|-------|
| 12.1  | Usage Metering Infrastructure | High | 21 | 🔴 Not Started | Foundation for all billing |
| 12.2  | Stripe Integration for Payments | High | 13 | 🔴 Not Started | Critical path dependency |
| 12.3  | Subscription Plan Management | High | 13 | 🔴 Not Started | Depends on 12.2 |
| 12.4  | Automated Invoice Generation | High | 13 | 🔴 Not Started | Depends on 12.1, 12.2 |
| 12.5  | Tenant Billing Portal | High | 13 | 🔴 Not Started | Frontend component |
| 12.6  | Resource Quota Enforcement | High | 13 | 🔴 Not Started | Depends on 12.1 |
| 12.7  | Multi-Currency Support | Medium | 8 | 🔴 Not Started | Enhancement to 12.2 |
| 12.8  | Revenue Analytics Dashboard | Medium | 13 | 🔴 Not Started | Reporting feature |
| 12.9  | Billing Webhooks and Events | High | 8 | 🔴 Not Started | Stripe webhook handler |
| 12.10 | Sub-Tenant Billing Allocation | Medium | 13 | 🔴 Not Started | Depends on 12.1 |
| 12.11 | Promotional Codes and Discounts | Low | 8 | 🔴 Not Started | Nice-to-have |
| 12.12 | Payment Method Compliance | High | 8 | 🔴 Not Started | Security requirement |

### Completed Work (Foundation)
- ✅ Created Sensormine.Billing shared library (models + interfaces)
- ✅ Created Billing.API microservice (ASP.NET Core scaffold)
- ✅ Enhanced Tenant model with ParentTenantId, StripeCustomerId, billing address
- ✅ Documented billing architecture in `docs/architecture.md`
- ✅ All 12 stories created as GitHub issues (#190-201)

### Next Story Recommendation
**Start with Story 12.2: Stripe Integration for Payments** (Critical Path)
- Establishes foundation for subscription management and payment processing
- Required by stories 12.3, 12.4, 12.7, 12.9
- High business value, unblocks other work

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
- **Total Stories**: 122
- **Total Points**: ~1,520
- **Completed**: 0 (0%)
- **In Progress**: 0
- **Not Started**: 122

### Epic Completion
| Epic | Name | Stories | Completed | % |
|------|------|---------|-----------|---|
| 1 | Device Management | 11 | 0 | 0% |
| 2 | Data Ingestion & Schema Registry | 10 | 0 | 0% |
| 3 | Video Metadata & Annotation | 13 | 0 | 0% |
| 4 | Query & Historical Data Access | 10 | 0 | 0% |
| 5 | Anomaly Detection & ML | 6 | 0 | 0% |
| 6 | Alerts & Notification Engine | 12 | 0 | 0% |
| 7 | Digital Twin & Real-time State | 10 | 0 | 0% |
| 8 | Multi-Tenancy & RBAC | 9 | 0 | 0% |
| 9 | Observability & Monitoring | 8 | 0 | 0% |
| 10 | Mobile & Edge Support | 6 | 0 | 0% |
| 11 | Developer Experience | 8 | 0 | 0% |
| 12 | Billing, Metering & Payments | 12 | 0 | 0% |
| 13 | Performance & Scalability | 5 | 0 | 0% |

---

## Active Blockers

- None

---

## Notes for AI Agent

- Always update this document after completing a story
- Use TDD workflow defined in `.agent/workflow.md`
- Keep story plans in `.agent/story-templates/` during active work
- Move completed plans to `.agent/completed-stories/` with test results
- Update GitHub issue status when marking stories complete
- Commit changes with story number in commit message: `git commit -m "[Story 12.2] Implement Stripe payment integration"`
- This file serves as context for new chat sessions - read it first!
