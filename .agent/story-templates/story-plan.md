# Story Plan: [Story Number] - [Story Title]

**Story**: [Story Number]  
**Epic**: [Epic Name]  
**Priority**: [High/Medium/Low]  
**Story Points**: [Number]  
**Started**: [Date]  
**Developer**: [Your Name or "AI Agent"]

---

## Story Description

[Copy the story description from docs/user-stories.md]

---

## Acceptance Criteria

From user story:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] [Add all criteria from story]

---

## Technical Analysis

### Dependencies
- **Required Stories**: [List stories that must be complete first]
- **External Dependencies**: [Stripe API keys, database migrations, etc.]
- **Blocked By**: [Any current blockers]

### Architecture Alignment
- **Service**: [Which microservice will own this feature]
- **Shared Libraries**: [Which shared libraries will be modified/created]
- **Data Model**: [New entities or modifications to existing ones]
- **API Endpoints**: [List new endpoints to create]
- **Message Topics**: [Kafka/NATS topics if event-driven]

### Technology Choices
- **Frameworks/Libraries**: [e.g., Stripe.net, Entity Framework]
- **Database**: [PostgreSQL, TimescaleDB, Redis]
- **Testing**: [xUnit, Moq, Testcontainers]

---

## Implementation Plan

### Phase 1: Data Models
**Files to Create/Modify**:
- [ ] `src/Shared/Sensormine.Core/Models/[Entity].cs`
- [ ] `src/Shared/Sensormine.Storage/Entities/[EntityConfiguration].cs`

**Tasks**:
- [ ] Define entity classes
- [ ] Add EF Core configuration
- [ ] Create database migration
- [ ] Apply migration to test database

### Phase 2: Service Interfaces
**Files to Create/Modify**:
- [ ] `src/Shared/Sensormine.[Domain]/Interfaces/I[Service].cs`
- [ ] `src/Shared/Sensormine.[Domain]/Models/[RequestModel].cs`
- [ ] `src/Shared/Sensormine.[Domain]/Models/[ResponseModel].cs`

**Tasks**:
- [ ] Define service interfaces
- [ ] Create request/response DTOs
- [ ] Add validation attributes

### Phase 3: Service Implementation
**Files to Create/Modify**:
- [ ] `src/Services/[Service].API/Services/[ServiceImplementation].cs`
- [ ] `src/Services/[Service].API/Repositories/[Repository].cs`

**Tasks**:
- [ ] Implement business logic
- [ ] Add error handling
- [ ] Add logging
- [ ] Implement repository pattern

### Phase 4: API Controllers
**Files to Create/Modify**:
- [ ] `src/Services/[Service].API/Controllers/[Controller].cs`
- [ ] `src/Services/[Service].API/Models/[ViewModel].cs`

**Tasks**:
- [ ] Create controller endpoints
- [ ] Add authorization attributes
- [ ] Add OpenAPI documentation
- [ ] Add request validation

### Phase 5: Dependency Injection
**Files to Modify**:
- [ ] `src/Services/[Service].API/Program.cs`
- [ ] `src/Services/[Service].API/appsettings.json`

**Tasks**:
- [ ] Register services in DI container
- [ ] Add configuration sections
- [ ] Configure middleware

---

## Test Strategy

### Unit Tests
**Test Project**: `tests/Services/[Service].API.Tests`

**Test Classes to Create**:
- [ ] `[Service]ServiceTests.cs` - Business logic tests
- [ ] `[Controller]ControllerTests.cs` - Controller tests
- [ ] `[Repository]RepositoryTests.cs` - Data access tests

**Test Scenarios**:
1. **Happy Path**:
   - [ ] Valid input returns expected output
   - [ ] Correct status codes returned
   - [ ] Data persisted correctly

2. **Error Cases**:
   - [ ] Null arguments throw ArgumentNullException
   - [ ] Invalid input returns BadRequest
   - [ ] Not found returns NotFound
   - [ ] Duplicate creates return Conflict

3. **Edge Cases**:
   - [ ] Empty collections handled
   - [ ] Large datasets perform acceptably
   - [ ] Concurrent operations handled safely

### Integration Tests
**Test Classes to Create**:
- [ ] `[Service]ApiIntegrationTests.cs` - Full API tests

**Test Scenarios**:
- [ ] End-to-end API calls work
- [ ] Database transactions commit properly
- [ ] External API calls succeed (mocked)
- [ ] Events published to message bus

### Test Coverage Target
- **Minimum**: 80%
- **Target**: 90%+

---

## Acceptance Criteria → Test Mapping

Map each acceptance criterion to specific tests:

| Criterion | Test Class | Test Method | Type |
|-----------|-----------|-------------|------|
| [Criterion 1] | [TestClass] | [TestMethod] | Unit/Integration |
| [Criterion 2] | [TestClass] | [TestMethod] | Unit/Integration |
| [Add all...] | ... | ... | ... |

---

## Configuration Required

### appsettings.json
```json
{
  "FeatureName": {
    "Setting1": "value",
    "Setting2": 123
  }
}
```

### Environment Variables
- `STRIPE_SECRET_KEY`: Stripe API secret key
- [Add other env vars]

### Database Migrations
```powershell
dotnet ef migrations add [MigrationName] --project src/Shared/Sensormine.Storage
dotnet ef database update --project src/Shared/Sensormine.Storage
```

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| External API downtime | High | Medium | Add circuit breaker, retry logic |
| Data migration fails | High | Low | Test on copy of production data |
| [Add more risks] | ... | ... | ... |

---

## Open Questions

- [ ] [Question 1 that needs answering before implementation]
- [ ] [Question 2]
- [ ] [Question 3]

---

## Notes

[Add any additional context, links to documentation, or implementation notes]

---

## Progress Tracking

### Daily Log

**Day 1** ([Date]):
- [ ] Created story plan
- [ ] Set up test project
- [ ] Wrote initial failing tests
- [ ] Status: [In Progress/Blocked/Complete]

**Day 2** ([Date]):
- [ ] Implemented service layer
- [ ] Tests passing
- [ ] Code review
- [ ] Status: [In Progress/Blocked/Complete]

---

## Definition of Done

Story is complete when:
- [ ] All acceptance criteria met
- [ ] All tests passing (green)
- [ ] Code coverage ≥ 80%
- [ ] Code refactored (clean, documented)
- [ ] API documented in OpenAPI/Swagger
- [ ] Health checks added
- [ ] Configuration documented
- [ ] `.agent/current-state.md` updated
- [ ] Committed with [Story X.Y] prefix
- [ ] Pushed to GitHub
- [ ] GitHub issue closed with summary
- [ ] Plan moved to `.agent/completed-stories/`
