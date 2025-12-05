# Story 1.3: Schema Assignment to Device Type - Implementation Plan

**Status:** In Progress  
**Started:** 2025-12-06  
**Priority:** High  
**Story Points:** 5

---

## Story Details

**As a** system administrator  
**I want** to assign a data schema to a Device Type  
**So that** all devices of that type validate their data against the same structure

### Acceptance Criteria
- [ ] In Device Type editor, navigate to "Schema" section
- [ ] Browse available schemas from Schema Registry
- [ ] Search/filter schemas by name, device type tags
- [ ] Preview schema structure (fields, types, validation rules)
- [ ] Select schema version (or "Latest")
- [ ] Map schema fields to protocol-specific data points (optional)
- [ ] Set up field transformations if needed
- [ ] Test schema with sample device payload
- [ ] Save schema assignment
- [ ] All new devices of this type automatically use assigned schema
- [ ] Schema version upgrades require explicit admin action
- [ ] Backwards compatibility checking when changing schema

---

## Technical Approach

### Phase 1: Backend - Schema Service Integration

#### 1.1 Schema Registry Client
Create HTTP client to communicate with SchemaRegistry.API:
```csharp
public interface ISchemaRegistryClient
{
    Task<Schema?> GetSchemaByIdAsync(Guid schemaId, string? version = null);
    Task<List<Schema>> SearchSchemasAsync(string? searchTerm, List<string>? tags);
    Task<SchemaVersion> GetSchemaVersionAsync(Guid schemaId, string version);
    Task<bool> ValidatePayloadAsync(Guid schemaId, string payload);
}
```

#### 1.2 Schema Field Mapping Model
```csharp
public class SchemaFieldMapping
{
    public string SchemaFieldName { get; set; } // Field from schema
    public string ProtocolDataPoint { get; set; } // Protocol-specific data point
    public string? Transformation { get; set; } // Optional: C#/JS expression for transformation
    public bool IsRequired { get; set; }
}

// Add to DeviceType model
public List<SchemaFieldMapping> SchemaFieldMappings { get; set; } = new();
```

#### 1.3 Schema Validation Service
```csharp
public class SchemaValidationService
{
    public async Task<SchemaCompatibilityResult> CheckCompatibilityAsync(
        Guid? currentSchemaId, 
        Guid newSchemaId, 
        Guid tenantId)
    {
        // Compare schema structures
        // Return breaking changes
        // Return affected device count
    }
    
    public async Task<SchemaTestResult> TestSchemaWithPayloadAsync(
        Guid schemaId, 
        string samplePayload)
    {
        // Validate payload against schema
        // Return field-by-field validation results
        // Suggest corrections if validation fails
    }
}
```

### Phase 2: Backend - Schema Assignment Endpoints

#### 2.1 New Controller Endpoints
```csharp
GET  /api/DeviceType/{id}/schema - Get assigned schema details
POST /api/DeviceType/{id}/schema/assign - Assign schema to device type
POST /api/DeviceType/{id}/schema/test - Test schema with sample payload
GET  /api/DeviceType/{id}/schema/compatibility - Check schema compatibility
POST /api/DeviceType/{id}/schema/mappings - Save field mappings
GET  /api/Schema/search - Proxy to SchemaRegistry.API (with tenant filtering)
```

#### 2.2 Schema Assignment Request/Response DTOs
```csharp
public class SchemaAssignmentRequest
{
    public Guid SchemaId { get; set; }
    public string? Version { get; set; } // null = "Latest"
    public List<SchemaFieldMapping> FieldMappings { get; set; } = new();
}

public class SchemaCompatibilityResult
{
    public bool IsCompatible { get; set; }
    public List<string> BreakingChanges { get; set; }
    public int AffectedDeviceCount { get; set; }
    public List<string> Warnings { get; set; }
}

public class SchemaTestResult
{
    public bool IsValid { get; set; }
    public Dictionary<string, string> FieldErrors { get; set; } // fieldName -> error message
    public List<string> Suggestions { get; set; }
}
```

### Phase 3: Frontend - Schema Assignment UI

#### 3.1 Schema Browser Component
Location: `src/Web/sensormine-web/src/components/device-types/SchemaBrowser.tsx`

Features:
- Search bar for schema name
- Filter by tags
- Grid/List view of available schemas
- Schema preview card (name, description, fields count)
- Version selector dropdown
- "Select Schema" button

#### 3.2 Schema Field Mapping Component
Location: `src/Web/sensormine-web/src/components/device-types/SchemaFieldMapper.tsx`

Features:
- Left column: Schema fields (from schema definition)
- Right column: Protocol data points (dynamic based on protocol)
- Drag-and-drop or select to map fields
- Transformation expression editor (optional)
- Visual indicator for required fields
- Save/Cancel buttons

#### 3.3 Schema Test Panel Component
Location: `src/Web/sensormine-web/src/components/device-types/SchemaTestPanel.tsx`

Features:
- JSON payload editor (with syntax highlighting)
- "Load Sample" button (loads protocol-specific example)
- "Test Schema" button
- Validation results display:
  - Green checkmark for valid
  - Red X with field-level errors
  - Suggestions for corrections

#### 3.4 Integration with Device Type Editor
Update Device Type creation/edit wizard:
- **Step 2: Protocol Configuration** (existing)
- **Step 3: Schema Assignment** (NEW)
  - Schema browser
  - Field mapping (if applicable)
  - Schema test
- **Step 4: Custom Fields/Tags** (renumbered from 3)
- **Step 5: Alert Templates** (renumbered from 4)

### Phase 4: Database Changes

#### 4.1 Update DeviceType Table
```sql
-- Add schema field mappings column (JSONB array)
ALTER TABLE device_types 
ADD COLUMN schema_field_mappings JSONB DEFAULT '[]';

-- Add schema version tracking
ALTER TABLE device_types
ADD COLUMN schema_version TEXT;

-- Create GIN index for field mappings
CREATE INDEX idx_device_types_schema_field_mappings 
    ON device_types USING gin(schema_field_mappings);
```

---

## Test Plan

### Unit Tests (Backend)

#### SchemaRegistryClientTests
- [ ] `GetSchemaByIdAsync_Success` - Fetch schema from registry
- [ ] `SearchSchemasAsync_WithFilters` - Search with tags and name
- [ ] `GetSchemaVersionAsync_SpecificVersion` - Get specific version
- [ ] `ValidatePayloadAsync_ValidPayload_ReturnsTrue` - Valid payload

#### SchemaValidationServiceTests
- [ ] `CheckCompatibilityAsync_CompatibleSchemas_ReturnsTrue` - Compatible schemas
- [ ] `CheckCompatibilityAsync_IncompatibleSchemas_ReturnsBreakingChanges` - Breaking changes
- [ ] `TestSchemaWithPayloadAsync_ValidPayload_ReturnsSuccess` - Valid payload test
- [ ] `TestSchemaWithPayloadAsync_InvalidPayload_ReturnsErrors` - Invalid payload test

#### DeviceTypeControllerTests (Schema Endpoints)
- [ ] `AssignSchema_Success` - Schema assignment works
- [ ] `AssignSchema_InvalidSchemaId_ReturnsNotFound` - Invalid schema
- [ ] `TestSchemaWithPayload_ValidPayload` - Schema test endpoint
- [ ] `CheckSchemaCompatibility_BreakingChanges` - Compatibility check

### Integration Tests (Frontend)

#### SchemaBrowser Tests
- [ ] Displays list of available schemas
- [ ] Search filters schemas correctly
- [ ] Tag filtering works
- [ ] Schema preview shows details
- [ ] Version selector displays versions

#### SchemaFieldMapper Tests
- [ ] Displays schema fields and protocol points
- [ ] Mapping creation works
- [ ] Transformation expressions can be added
- [ ] Required field indicator visible
- [ ] Save updates field mappings

#### SchemaTestPanel Tests
- [ ] JSON editor loads correctly
- [ ] Sample payload loads
- [ ] Test schema validates payload
- [ ] Error messages display correctly
- [ ] Suggestions appear for invalid payload

---

## Implementation Order

1. **Database Migration** - Add schema_field_mappings column
2. **SchemaFieldMapping Model** - Create mapping data structure
3. **SchemaRegistryClient** - HTTP client for Schema Registry
4. **SchemaValidationService** - Compatibility and testing logic
5. **Controller Endpoints** - Schema assignment, testing, compatibility
6. **Unit Tests** - Backend testing
7. **Frontend Types** - TypeScript interfaces for schema operations
8. **Frontend API Client** - Schema-related API functions
9. **SchemaBrowser Component** - UI for browsing schemas
10. **SchemaFieldMapper Component** - UI for mapping fields
11. **SchemaTestPanel Component** - UI for testing payloads
12. **Integration with Device Type Editor** - Add schema step to wizard
13. **Integration Testing** - End-to-end testing

---

## Dependencies

- Story 1.1 (Create Device Type) - ✅ Complete
- Story 2.1 (Schema Registry API) - ✅ Complete (API available at localhost:5021)
- SchemaRegistry.API running - ✅ Available
- Device.API running - ✅ Available
- Frontend project setup - ✅ Complete

---

## API Integration Points

### SchemaRegistry.API Endpoints (localhost:5021)
```
GET  /api/Schema/{id} - Get schema by ID
GET  /api/Schema?page=1&pageSize=20 - List schemas
POST /api/Schema/search - Search schemas with filters
GET  /api/Schema/{id}/versions - Get schema versions
POST /api/Schema/{id}/validate - Validate payload against schema
```

### Device.API Endpoints (localhost:5293)
```
POST /api/DeviceType/{id}/schema/assign - Assign schema
POST /api/DeviceType/{id}/schema/test - Test schema with payload
GET  /api/DeviceType/{id}/schema/compatibility - Check compatibility
```

---

## Notes

- Schema version "Latest" means device always uses newest schema version (auto-upgrade)
- Specific version pin means device stays on that version (manual upgrade)
- Field mappings are optional - if not specified, direct field name matching is used
- Transformation expressions use C# for backend validation, JavaScript for frontend preview
- Sample payloads should be protocol-specific (MQTT JSON, HTTP POST body, etc.)
- Backwards compatibility checking prevents accidental breaking changes
- Consider caching schema definitions in Device.API to reduce Registry calls
