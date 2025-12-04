# Story 2.2: Schema Definition - Implementation Plan

**Story ID**: 2.2  
**Priority**: High  
**Story Points**: 8  
**Started**: 2025-12-05  

---

## Story Description

**As a** data engineer  
**I want** to define payload schemas with field names, types, and units  
**So that** incoming data is validated and structured correctly

---

## Acceptance Criteria

- [x] Schema Registry UI for creating/editing schemas
- [x] Support for JSON Schema format
- [x] Field definitions include: name, type, unit, description, validation rules
- [x] Schema versioning (major.minor.patch)
- [x] Schema can be associated with device types
- [x] Schema validation errors provide clear feedback

---

## Technical Approach

### Architecture
- **Service**: SchemaRegistry.API (already scaffolded)
- **Storage**: PostgreSQL via Sensormine.Storage
- **Validation**: NJsonSchema library for JSON Schema validation
- **Domain Models**: Sensormine.Core

### Domain Model Design

#### Schema Entity
```csharp
public class Schema
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public Guid TenantId { get; set; }
    public List<SchemaVersion> Versions { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
```

#### SchemaVersion Entity
```csharp
public class SchemaVersion
{
    public Guid Id { get; set; }
    public Guid SchemaId { get; set; }
    public Schema Schema { get; set; }
    public string Version { get; set; } // Semantic versioning: major.minor.patch
    public string JsonSchema { get; set; } // JSON Schema definition
    public SchemaStatus Status { get; set; } // Draft, Active, Deprecated
    public bool IsDefault { get; set; }
    public List<DeviceType> DeviceTypes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}
```

#### SchemaField (Helper model for UI)
```csharp
public class SchemaField
{
    public string Name { get; set; }
    public string Type { get; set; } // string, number, integer, boolean, object, array
    public string Unit { get; set; }
    public string Description { get; set; }
    public bool Required { get; set; }
    public ValidationRules ValidationRules { get; set; }
}
```

---

## Implementation Steps (TDD Workflow)

### Phase 1: Domain Models & Storage (Tests First)

**Step 1**: Create domain models
- Schema.cs
- SchemaVersion.cs
- SchemaField.cs (DTO)
- Enums: SchemaStatus

**Step 2**: Write repository tests (RED)
- Test: Create schema with initial version
- Test: Get schema by ID
- Test: List schemas for tenant
- Test: Add new version to schema
- Test: Get specific schema version
- Test: Set default version
- Test: Update schema status (Draft → Active → Deprecated)
- Test: Delete schema (soft delete)

**Step 3**: Implement SchemaRepository (GREEN)
- ISchemaRepository interface
- SchemaRepository with EF Core
- Database migrations
- All tests pass

### Phase 2: Schema Validation (Tests First)

**Step 4**: Write validation service tests (RED)
- Test: Validate JSON against schema
- Test: Return clear error messages for invalid data
- Test: Support JSON Schema draft 7
- Test: Validate field types (string, number, boolean, etc.)
- Test: Validate required fields
- Test: Validate field constraints (min, max, pattern, etc.)

**Step 5**: Implement SchemaValidationService (GREEN)
- ISchemaValidationService interface
- Use NJsonSchema library
- Validation error mapping
- All tests pass

### Phase 3: API Endpoints (Tests First)

**Step 6**: Write API integration tests (RED)
- Test: POST /api/schemas - Create schema
- Test: GET /api/schemas - List schemas (with pagination)
- Test: GET /api/schemas/{id} - Get schema by ID
- Test: PUT /api/schemas/{id} - Update schema metadata
- Test: DELETE /api/schemas/{id} - Delete schema
- Test: POST /api/schemas/{id}/versions - Add new version
- Test: GET /api/schemas/{id}/versions - List versions
- Test: GET /api/schemas/{id}/versions/{version} - Get specific version
- Test: PUT /api/schemas/{id}/versions/{version}/status - Update status
- Test: POST /api/schemas/{id}/validate - Validate data against schema
- Test: Multi-tenancy isolation

**Step 7**: Implement SchemaRegistry.API endpoints (GREEN)
- SchemasController
- SchemaVersionsController
- DTOs for requests/responses
- AutoMapper profiles
- OpenAPI documentation
- All tests pass

### Phase 4: Integration & Polish

**Step 8**: Refactor & optimize
- Code quality review
- Performance optimization
- Error handling
- Logging with OpenTelemetry

**Step 9**: Documentation
- API documentation (OpenAPI/Swagger)
- README with examples
- Architecture decision records

---

## Database Schema

```sql
CREATE TABLE schemas (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE schema_versions (
    id UUID PRIMARY KEY,
    schema_id UUID NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    json_schema TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    UNIQUE(schema_id, version)
);

CREATE TABLE schema_device_types (
    schema_version_id UUID NOT NULL REFERENCES schema_versions(id) ON DELETE CASCADE,
    device_type VARCHAR(255) NOT NULL,
    PRIMARY KEY(schema_version_id, device_type)
);

CREATE INDEX idx_schemas_tenant ON schemas(tenant_id);
CREATE INDEX idx_schema_versions_schema ON schema_versions(schema_id);
CREATE INDEX idx_schema_versions_status ON schema_versions(status);
```

---

## API Endpoints

### Schema Management
- `POST /api/schemas` - Create new schema
- `GET /api/schemas` - List all schemas (paginated, filtered)
- `GET /api/schemas/{id}` - Get schema by ID
- `PUT /api/schemas/{id}` - Update schema metadata
- `DELETE /api/schemas/{id}` - Delete schema

### Version Management
- `POST /api/schemas/{id}/versions` - Create new version
- `GET /api/schemas/{id}/versions` - List versions
- `GET /api/schemas/{id}/versions/{version}` - Get specific version
- `PUT /api/schemas/{id}/versions/{version}/status` - Update status
- `PUT /api/schemas/{id}/versions/{version}/default` - Set as default

### Validation
- `POST /api/schemas/{id}/validate` - Validate JSON data against schema
- `POST /api/schemas/{id}/versions/{version}/validate` - Validate against specific version

---

## JSON Schema Example

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Temperature Sensor Reading",
  "type": "object",
  "required": ["deviceId", "timestamp", "temperature"],
  "properties": {
    "deviceId": {
      "type": "string",
      "description": "Unique device identifier"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Reading timestamp in ISO 8601 format"
    },
    "temperature": {
      "type": "number",
      "description": "Temperature reading",
      "unit": "°C",
      "minimum": -50,
      "maximum": 150
    },
    "humidity": {
      "type": "number",
      "description": "Relative humidity",
      "unit": "%",
      "minimum": 0,
      "maximum": 100
    },
    "location": {
      "type": "object",
      "properties": {
        "latitude": { "type": "number" },
        "longitude": { "type": "number" }
      }
    }
  }
}
```

---

## Dependencies

### NuGet Packages Needed
- `NJsonSchema` - JSON Schema validation
- `Newtonsoft.Json` - JSON parsing (if not using System.Text.Json)
- `Serilog` - Logging
- `AutoMapper` - DTO mapping

### Service Dependencies
- PostgreSQL database
- Multi-tenancy context

---

## Test Coverage Goals

- Unit tests: >80% coverage
- Integration tests: All API endpoints
- Edge cases: Invalid JSON, version conflicts, tenant isolation

---

## Success Metrics

- All acceptance criteria met
- API documented with OpenAPI/Swagger
- >80% test coverage
- Performance: Schema validation < 100ms
- Can validate 1000+ messages/second

---

## Blockers & Risks

### Risk 1: JSON Schema complexity
**Mitigation**: Use well-tested NJsonSchema library, start with simple schemas

### Risk 2: Version management conflicts
**Mitigation**: Enforce unique version numbers, clear status workflow

### Risk 3: Performance at scale
**Mitigation**: Cache compiled schemas, use async operations

---

## Next Stories Unblocked

After completing Story 2.2:
- ✅ Story 2.1: MQTT Data Ingestion (depends on schema validation)
- ✅ Story 2.3: Schema Evolution (depends on version management)
- ✅ Story 2.4: Multi-Protocol Ingestion (depends on schema validation)
