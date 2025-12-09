# Standing Orders for GitHub Copilot

**These instructions must be followed at the start of EVERY chat session.**

---

## 🤖 Automatic Startup Procedure

When a new chat session begins, **IMMEDIATELY** execute these steps:

### Step 1: Read Project State (MANDATORY)
```
Read .agent/current-state.md
```

This document contains:
- Current sprint and active story
- Story completion tracking (X of 122 stories complete)
- Epic progress dashboard
- Blockers and dependencies
- Next recommended story

### Step 2: Greet User with Context
Provide a brief summary like:

```
📊 Project Status:
- Completed: X of 122 stories (Y%)
- Current Epic: Epic 12 - Billing, Metering & Payments (X of 12 complete)
- Active Story: [Story Number] - [Title] (In Progress)
  OR
- Active Story: None (Ready to start)

🎯 Next Recommended Story: 
Story X.Y - [Title] ([Priority], [Points] points)
Reason: [Why this story is recommended - critical path, unblocks others, etc.]

Ready to continue? Or would you like to work on a different story?
```

### Step 3: Wait for User Direction
Let the user choose:
- Continue with recommended story
- Work on a different story
- Check project status
- Review completed work

---

## 📋 Workflow Rules

### When Working on a Story
1. **Follow TDD workflow** defined in `.agent/workflow.md`
2. **Create story plan** from `.agent/story-templates/story-plan.md`
3. **Red → Green → Refactor** for all code
4. **Update `.agent/current-state.md`** after completion
5. **Commit with [Story X.Y] prefix**
6. **Close GitHub issue** with completion summary

### When Completing a Story
1. Move plan to `.agent/completed-stories/story-X.Y.md`
2. Update current-state.md:
   - Change story status from 🔴/🟡 to ✅
   - Update completion counts
   - Update epic percentages
   - Clear "Active Story" or set next one
3. **Update Web Project Help** (MANDATORY):
   - Navigate to `src/Web/sensormine-web/HELP.md`
   - Document any new features, components, or API endpoints added
   - Include usage examples and configuration details
   - Update troubleshooting section if relevant
4. Commit and push to GitHub
5. Close GitHub issue with link to commit

### Before Starting Any Story
1. ✅ Check `.agent/current-state.md` for blockers
2. ✅ Verify dependencies are complete
3. ✅ Read story in `docs/user-stories.md`
4. ✅ Review relevant sections in `docs/architecture.md`

---

## 🎯 Story Selection Priority

When recommending next story, prioritize:
1. **Critical Path** - Stories that unblock other work
2. **High Priority** - Stories marked as High priority
3. **No Dependencies** - Stories with all dependencies met
4. **Context Continuity** - Stories in same service/domain as previous work

### Epic 4 (Frontend Dashboard) Recommended Order
**Phase 1: Foundation**
1. **0.0** - Frontend Project Setup (Choose React/Next.js or Blazor, establish architecture)
2. **4.1** - Dashboard Builder (Core framework for all dashboards)

**Phase 2: Essential Visualizations**
3. **4.2** - Time-Series Charts (Foundation for data visualization)
4. **4.6** - GIS Map Widget (Geographic device visualization)
5. **4.7** - Gauge and KPI Widgets (Operational metrics)
6. **4.9** - Real-Time Dashboard Updates (WebSocket integration)

**Phase 3: Advanced Features**
7. **4.3** - Video Timeline Widget (Video event correlation)
8. **4.4** - 3D CAD Viewer (Facility visualization)
9. **4.8** - Dashboard Templates (User onboarding)
10. **4.10** - Dashboard Annotations (Collaboration)

**Phase 4: Optional Advanced**
11. **4.5** - LiDAR Point Cloud Viewer (Advanced 3D visualization)

### Backend Support Stories (As Needed)
- **Epic 1 subset**: Device API basics (1.1, 1.4, 1.5, 1.7)
- **Epic 8 subset**: Authentication & Authorization (8.1, 8.2, 8.3)
- **Epic 4 backend**: Query API for time-series data

---

## 🚫 Anti-Patterns to Avoid

❌ Starting work without reading current-state.md  
❌ Implementing code before writing tests  
❌ Completing multiple stories in one commit  
❌ Skipping state updates after story completion  
❌ Starting stories with incomplete dependencies  
❌ Forgetting to close GitHub issues  

---

## ⭐ Production-Grade Quality Standards

**CRITICAL: This is a production-grade product. Never take shortcuts.**

### Code Quality Requirements
✅ **Error Handling**: All services must have comprehensive error handling with proper logging  
✅ **Validation**: Input validation on all API endpoints with meaningful error messages  
✅ **Security**: Authentication, authorization, input sanitization on all endpoints  
✅ **Logging**: Structured logging with correlation IDs for distributed tracing  
✅ **Resilience**: Retry policies, circuit breakers, timeout configurations  
✅ **Testing**: Unit tests, integration tests, and end-to-end tests  
✅ **Documentation**: XML comments, API documentation, README files  
✅ **Performance**: Proper indexing, caching strategies, pagination  
✅ **Monitoring**: Health checks, metrics, application insights  
✅ **Configuration**: Environment-based configuration, secrets management  

### Never Skip These Steps
1. **Proper dependency injection** - Use interfaces, register services correctly
2. **Database migrations** - Version controlled, reversible, tested
3. **API versioning** - Plan for future changes
4. **Proper status codes** - HTTP semantics matter (200, 201, 400, 404, 500, etc.)
5. **Transaction management** - Proper use of database transactions
6. **Null checks** - Defensive programming everywhere
7. **Async/await properly** - No blocking calls, ConfigureAwait when appropriate
8. **Resource disposal** - Proper using statements, IDisposable/IAsyncDisposable
9. **Configuration validation** - Validate settings on startup
10. **API contracts** - DTOs for requests/responses, never expose entities directly

### Architecture Principles
- **SOLID principles** - Follow single responsibility, dependency inversion, etc.
- **Clean Architecture** - Separate concerns, depend on abstractions
- **Microservices patterns** - Service discovery, API gateway, circuit breakers
- **Domain-Driven Design** - Rich domain models, ubiquitous language
- **Event-Driven Architecture** - Publish/subscribe for decoupling
- **CQRS where appropriate** - Separate read and write models when beneficial

### DevOps & Operations
- **Infrastructure as Code** - Terraform, Helm charts
- **CI/CD Pipelines** - Automated builds, tests, deployments
- **Monitoring & Alerting** - Prometheus, Grafana, Application Insights
- **Logging aggregation** - Centralized logging (ELK, Seq)
- **Secrets management** - Azure Key Vault, HashiCorp Vault
- **Disaster recovery** - Backup strategies, restore procedures
- **Security scanning** - Dependency scanning, SAST, DAST

**When implementing any feature, ask: "Is this production-ready?" If not, make it so.**

---

## 🌐 Service Ports Reference

### Frontend Applications
- **Sensormine Web** (Production): `http://localhost:3000`
- **Sensormine Web** (Debug/Development): `http://localhost:3020`
- **Device Simulator**: `http://localhost:3021`

### Backend Microservices
- **API Gateway**: `http://localhost:5000`
- **Device.API**: `http://localhost:5293` (HTTP), `https://localhost:7042` (HTTPS)
- **SchemaRegistry.API**: `http://localhost:5021`
- **Query.API**: `http://localhost:5079`
- **Alerts.API**: `http://localhost:5295`
- **Preferences.API**: `http://localhost:5296`
- **DigitalTwin.API**: `http://localhost:5297`
- **Dashboard.API**: `http://localhost:5298`
- **Identity.API**: `http://localhost:5299`
- **Edge.Gateway** (MQTT): `mqtt://localhost:1883`

### Infrastructure Services
- **PostgreSQL/TimescaleDB**: `localhost:5432`
- **Kafka**: `localhost:9092`
- **Redis**: `localhost:6379`
- **MQTT Broker (Mosquitto)**: `localhost:1883`

---

## 🗄️ Database Architecture Standards

### Multi-Tenancy Pattern (Mandatory)
**All domain entities MUST use UUID for tenant_id**:

1. **C# Entity Models**:
   ```csharp
   public class YourEntity : BaseEntity  // Inherits Guid TenantId
   {
       // Your properties
   }
   ```

2. **Database Schema**:
   ```sql
   CREATE TABLE your_table (
       id uuid PRIMARY KEY,
       tenant_id uuid NOT NULL,  -- Must be uuid, never TEXT
       -- other columns
   );
   CREATE INDEX ix_your_table_tenant ON your_table(tenant_id);
   ```

3. **Repository Pattern**:
   ```csharp
   public async Task<Entity?> GetByIdAsync(Guid id, string tenantId)
   {
       var tenantGuid = Guid.Parse(tenantId);  // Always parse string to Guid
       return await _context.Entities
           .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantGuid);
   }
   ```

4. **Controller Pattern**:
   ```csharp
   private string GetTenantId()
   {
       // TODO: Extract from JWT claims
       return "00000000-0000-0000-0000-000000000001";
   }
   ```

### Exception: Identity Subsystem
Only User, UserInvitation, and Tenant entities use property shadowing:
```csharp
public class User : BaseEntity
{
    public new string TenantId { get; set; } = string.Empty;  // Shadow Guid with string
}
```

### Database Separation (Option C - Hybrid)
- **PostgreSQL (Port 5433)**: OLTP - devices, schemas, users, assets, configurations
- **TimescaleDB (Port 5452)**: OLAP - telemetry, time-series data

**See Documentation**:
- `docs/database-tenant-id-migration.md` - UUID migration guide
- `docs/option-c-implementation-summary.md` - Database separation details
- `docs/database-architecture.md` - Overall database design

---

## 📁 Essential File Locations

- **Project State**: `.agent/current-state.md` (READ FIRST!)
- **User Stories**: `docs/user-stories.md` (122 stories, source of truth)
- **Architecture**: `docs/architecture.md` (System design)
- **Workflow**: `.agent/workflow.md` (TDD process)
- **Story Templates**: `.agent/story-templates/`
- **Completed Work**: `.agent/completed-stories/`
- **GitHub Issues**: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues

---

## 🔄 Session Handoff Protocol

### Ending a Session
Before ending, ensure:
- [ ] All work committed and pushed
- [ ] `.agent/current-state.md` updated with progress
- [ ] Active story status is accurate (In Progress/Complete)
- [ ] Blockers documented if any
- [ ] GitHub issues updated

### Starting a Session
Always begin with:
- [ ] Read `.agent/current-state.md`
- [ ] Greet user with status summary
- [ ] Recommend next story with reasoning
- [ ] Wait for user direction

---

## 💡 Quick Commands for User

Users can say:
- "What's our current status?" → Read and summarize current-state.md
- "Continue" → Pick up where last session left off
- "What's next?" → Recommend next priority story
- "Start Story X.Y" → Begin work on specific story
- "Show completed work" → List files in completed-stories/

---

**This standing order ensures every chat session starts with full context and maintains consistency across development work.**
