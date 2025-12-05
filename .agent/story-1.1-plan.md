# Story 1.1: Create Device Type - Implementation Plan

**Story**: Epic 1 - Device Type Configuration  
**Priority**: High  
**Story Points**: 8  
**Start Date**: 2025-12-05  
**Status**: 🟡 In Progress

---

## Story Summary

**As a** system administrator  
**I want** to create a Device Type that defines protocols, schemas, and custom fields  
**So that** I can standardize device configuration across multiple devices

---

## Acceptance Criteria

- [x] Navigate to Settings → Device Types
- [ ] Create new Device Type with name and description
- [ ] Select primary protocol (MQTT, HTTP, WebSocket, OPC UA, Modbus, etc.)
- [ ] Configure protocol-specific settings (endpoints, auth, sampling rate)
- [ ] Assign data schema from Schema Registry
- [ ] Define custom metadata fields (name, type, validation rules, help text)
- [ ] Set field as required/optional
- [ ] Configure default alert rule templates
- [ ] Add tags for categorization
- [ ] Save Device Type
- [ ] Preview example device configuration
- [ ] Clone existing Device Type to create similar configuration

---

## Technical Approach

### Architecture Pattern
- **Backend**: Clean Architecture with Repository Pattern
- **Frontend**: React with Next.js App Router, shadcn/ui components
- **Database**: PostgreSQL (sensormine_metadata database)
- **API**: RESTful endpoints in Device.API service
- **Testing**: TDD with xUnit (backend), Vitest (frontend)

### Database Schema

**Table: `device_types`**
```sql
CREATE TABLE device_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    protocol VARCHAR(50) NOT NULL, -- MQTT, HTTP, WebSocket, OPC_UA, Modbus, etc.
    protocol_config JSONB NOT NULL, -- Protocol-specific settings
    schema_id UUID, -- FK to schemas table
    custom_fields JSONB, -- Array of field definitions
    alert_templates JSONB, -- Array of alert rule templates
    tags TEXT[], -- Array of tags for categorization
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT fk_schema FOREIGN KEY (schema_id) REFERENCES schemas(id)
);

CREATE INDEX idx_device_types_tenant ON device_types(tenant_id);
CREATE INDEX idx_device_types_protocol ON device_types(protocol);
CREATE INDEX idx_device_types_tags ON device_types USING GIN(tags);
```

**Custom Fields JSONB Structure:**
```json
[
  {
    "name": "location",
    "label": "Installation Location",
    "type": "text",
    "required": true,
    "defaultValue": "",
    "validationRules": {
      "minLength": 3,
      "maxLength": 100
    },
    "helpText": "Physical location of the device"
  },
  {
    "name": "maintenanceInterval",
    "label": "Maintenance Interval (days)",
    "type": "number",
    "required": false,
    "defaultValue": 30,
    "validationRules": {
      "min": 1,
      "max": 365
    },
    "helpText": "Days between scheduled maintenance"
  }
]
```

**Protocol Config JSONB Structure:**
```json
{
  "mqtt": {
    "broker": "mqtt://localhost:1883",
    "topic": "devices/{deviceId}/telemetry",
    "qos": 1,
    "keepAlive": 60,
    "cleanSession": true,
    "auth": {
      "username": "",
      "password": ""
    }
  },
  "http": {
    "endpoint": "https://api.example.com/telemetry",
    "method": "POST",
    "headers": {},
    "auth": {
      "type": "bearer",
      "token": ""
    }
  }
}
```

### Domain Model

**File: `src/Shared/Sensormine.Core/Models/DeviceType.cs`**
```csharp
public class DeviceType
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DeviceProtocol Protocol { get; set; }
    public ProtocolConfig ProtocolConfig { get; set; } = new();
    public Guid? SchemaId { get; set; }
    public List<CustomFieldDefinition> CustomFields { get; set; } = new();
    public List<AlertRuleTemplate> AlertTemplates { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public enum DeviceProtocol
{
    MQTT,
    HTTP,
    WebSocket,
    OPC_UA,
    Modbus_TCP,
    Modbus_RTU,
    BACnet,
    EtherNetIP
}

public class ProtocolConfig
{
    public MqttConfig? Mqtt { get; set; }
    public HttpConfig? Http { get; set; }
    public WebSocketConfig? WebSocket { get; set; }
    public OpcUaConfig? OpcUa { get; set; }
    public ModbusConfig? Modbus { get; set; }
}

public class CustomFieldDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public CustomFieldType Type { get; set; }
    public bool Required { get; set; }
    public object? DefaultValue { get; set; }
    public ValidationRules? ValidationRules { get; set; }
    public string? HelpText { get; set; }
    public List<string>? Options { get; set; } // For dropdown/list types
}

public enum CustomFieldType
{
    Text,
    Number,
    Boolean,
    Date,
    Dropdown,
    Email,
    URL
}
```

### API Endpoints (Device.API)

**Controller: `src/Services/Device.API/Controllers/DeviceTypesController.cs`**

```
POST   /api/device-types              - Create new device type
GET    /api/device-types              - List all device types (with pagination, filters)
GET    /api/device-types/{id}         - Get device type by ID
PUT    /api/device-types/{id}         - Update device type
DELETE /api/device-types/{id}         - Delete device type (soft delete)
POST   /api/device-types/{id}/clone   - Clone existing device type
GET    /api/device-types/{id}/preview - Preview device configuration example
```

**Request/Response DTOs:**
```csharp
public record CreateDeviceTypeRequest(
    string Name,
    string? Description,
    DeviceProtocol Protocol,
    ProtocolConfig ProtocolConfig,
    Guid? SchemaId,
    List<CustomFieldDefinition> CustomFields,
    List<AlertRuleTemplate> AlertTemplates,
    List<string> Tags
);

public record DeviceTypeResponse(
    Guid Id,
    string Name,
    string? Description,
    DeviceProtocol Protocol,
    ProtocolConfig ProtocolConfig,
    Guid? SchemaId,
    string? SchemaName,
    List<CustomFieldDefinition> CustomFields,
    List<AlertRuleTemplate> AlertTemplates,
    List<string> Tags,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
```

### Repository Layer

**Interface: `src/Shared/Sensormine.Core/Repositories/IDeviceTypeRepository.cs`**
```csharp
public interface IDeviceTypeRepository
{
    Task<DeviceType?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<DeviceType>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20);
    Task<DeviceType> CreateAsync(DeviceType deviceType);
    Task<DeviceType> UpdateAsync(DeviceType deviceType);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
    Task<bool> ExistsAsync(string name, Guid tenantId);
    Task<IEnumerable<DeviceType>> SearchAsync(Guid tenantId, string? searchTerm, List<string>? tags);
}
```

**Implementation: `src/Shared/Sensormine.Storage/Repositories/DeviceTypeRepository.cs`**
- Entity Framework Core implementation
- JSONB column handling for protocol_config, custom_fields, alert_templates
- Multi-tenancy filtering
- Pagination support

### Frontend Components

**Pages:**
1. `/app/settings/device-types/page.tsx` - List view with table
2. `/app/settings/device-types/create/page.tsx` - Create form
3. `/app/settings/device-types/[id]/page.tsx` - View/Edit details

**Components:**
1. `DeviceTypeList` - Table with search, filters, actions
2. `DeviceTypeForm` - Multi-step form with validation
3. `ProtocolSelector` - Protocol selection with config options
4. `SchemaSelector` - Browse and select schema from registry
5. `CustomFieldEditor` - Add/edit custom field definitions
6. `AlertTemplateEditor` - Configure alert rule templates
7. `DeviceTypePreview` - Preview configuration example

**API Client Extensions:**
```typescript
// src/Web/sensormine-web/src/lib/api-client.ts
export const deviceTypeApi = {
  create: (data: CreateDeviceTypeRequest) => 
    apiClient.post('/device-types', data),
  
  getAll: (params?: { page?: number; pageSize?: number; search?: string }) => 
    apiClient.get('/device-types', { params }),
  
  getById: (id: string) => 
    apiClient.get(`/device-types/${id}`),
  
  update: (id: string, data: UpdateDeviceTypeRequest) => 
    apiClient.put(`/device-types/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/device-types/${id}`),
  
  clone: (id: string) => 
    apiClient.post(`/device-types/${id}/clone`),
  
  preview: (id: string) => 
    apiClient.get(`/device-types/${id}/preview`)
};
```

---

## Test Strategy

### Backend Unit Tests (xUnit)

**Test File: `tests/Sensormine.Storage.Tests/DeviceTypeRepositoryTests.cs`**
- ✅ Create device type with valid data
- ✅ Get device type by ID
- ✅ Get all device types with pagination
- ✅ Update device type
- ✅ Delete device type (soft delete)
- ✅ Search by name and tags
- ✅ Verify multi-tenancy isolation
- ✅ Handle JSONB serialization/deserialization

**Test File: `tests/Device.API.Tests/DeviceTypeControllerTests.cs`**
- ✅ POST /device-types returns 201 with valid data
- ✅ GET /device-types returns paginated list
- ✅ GET /device-types/{id} returns 200 with valid ID
- ✅ GET /device-types/{id} returns 404 with invalid ID
- ✅ PUT /device-types/{id} updates successfully
- ✅ DELETE /device-types/{id} soft deletes
- ✅ Validate request DTOs
- ✅ Handle tenant context

### Frontend Tests (Vitest)

**Test File: `__tests__/settings/device-types.test.tsx`**
- ✅ Renders device types list
- ✅ Search filters results
- ✅ Click create navigates to form
- ✅ Form validation works
- ✅ Submit creates device type
- ✅ Protocol selector updates config fields
- ✅ Schema selector integrates with registry
- ✅ Custom field editor adds/removes fields
- ✅ Preview shows example configuration

---

## Implementation Steps (TDD)

### Phase 1: Backend Foundation (RED → GREEN → REFACTOR)

**Step 1.1: Database Migration**
- [ ] Create migration for `device_types` table
- [ ] Add indexes for tenant_id, protocol, tags
- [ ] Add FK constraint to schemas table

**Step 1.2: Domain Models**
- [ ] Create `DeviceType` entity in Sensormine.Core
- [ ] Create supporting models (ProtocolConfig, CustomFieldDefinition, etc.)
- [ ] Create request/response DTOs

**Step 1.3: Repository Layer (TDD)**
- [ ] Write failing tests for IDeviceTypeRepository
- [ ] Implement DeviceTypeRepository
- [ ] Configure JSONB serialization
- [ ] Run tests → GREEN

**Step 1.4: API Layer (TDD)**
- [ ] Write failing tests for DeviceTypeController
- [ ] Implement controller endpoints
- [ ] Add validation and error handling
- [ ] Configure dependency injection
- [ ] Run tests → GREEN

### Phase 2: Frontend Implementation

**Step 2.1: Settings Navigation**
- [ ] Add Settings section to sidebar
- [ ] Create Device Types menu item
- [ ] Test navigation

**Step 2.2: List Page**
- [ ] Create `/settings/device-types` page
- [ ] Implement DeviceTypeList component
- [ ] Add search and filter functionality
- [ ] Integrate with API client
- [ ] Write component tests

**Step 2.3: Create Form**
- [ ] Create `/settings/device-types/create` page
- [ ] Implement multi-step form
- [ ] Add protocol selector
- [ ] Add schema selector (integrate with Schema Registry)
- [ ] Add custom field editor
- [ ] Add alert template editor
- [ ] Add form validation
- [ ] Integrate with API
- [ ] Write component tests

**Step 2.4: Preview & Clone**
- [ ] Implement preview modal
- [ ] Add clone functionality
- [ ] Test end-to-end flow

### Phase 3: Integration & E2E Testing
- [ ] Test full create flow (frontend → API → database)
- [ ] Test multi-tenancy isolation
- [ ] Test schema assignment integration
- [ ] Verify acceptance criteria

---

## Files to Create/Modify

### Backend
**New Files:**
- `src/Shared/Sensormine.Core/Models/DeviceType.cs`
- `src/Shared/Sensormine.Core/Models/ProtocolConfig.cs`
- `src/Shared/Sensormine.Core/Models/CustomFieldDefinition.cs`
- `src/Shared/Sensormine.Core/Repositories/IDeviceTypeRepository.cs`
- `src/Shared/Sensormine.Storage/Repositories/DeviceTypeRepository.cs`
- `src/Shared/Sensormine.Storage/Migrations/YYYYMMDD_AddDeviceTypes.cs`
- `src/Services/Device.API/Controllers/DeviceTypesController.cs`
- `src/Services/Device.API/DTOs/DeviceTypeRequests.cs`
- `src/Services/Device.API/DTOs/DeviceTypeResponses.cs`
- `tests/Sensormine.Storage.Tests/DeviceTypeRepositoryTests.cs`
- `tests/Device.API.Tests/DeviceTypeControllerTests.cs`

**Modified Files:**
- `src/Shared/Sensormine.Storage/Data/SensormineDbContext.cs` (add DbSet)
- `src/Services/Device.API/Program.cs` (register repository)

### Frontend
**New Files:**
- `src/Web/sensormine-web/src/app/settings/device-types/page.tsx`
- `src/Web/sensormine-web/src/app/settings/device-types/create/page.tsx`
- `src/Web/sensormine-web/src/app/settings/device-types/[id]/page.tsx`
- `src/Web/sensormine-web/src/components/settings/DeviceTypeList.tsx`
- `src/Web/sensormine-web/src/components/settings/DeviceTypeForm.tsx`
- `src/Web/sensormine-web/src/components/settings/ProtocolSelector.tsx`
- `src/Web/sensormine-web/src/components/settings/CustomFieldEditor.tsx`
- `src/Web/sensormine-web/src/components/settings/AlertTemplateEditor.tsx`
- `src/Web/sensormine-web/src/components/settings/DeviceTypePreview.tsx`
- `src/Web/sensormine-web/__tests__/settings/device-types.test.tsx`

**Modified Files:**
- `src/Web/sensormine-web/src/lib/api-client.ts` (add device type functions)
- `src/Web/sensormine-web/src/components/layout/Sidebar.tsx` (add Settings section)

---

## Dependencies

**Backend:**
- ✅ PostgreSQL database (sensormine_metadata)
- ✅ Entity Framework Core
- ✅ Schema Registry API (for schema assignment)

**Frontend:**
- ✅ Next.js 14 project setup
- ✅ shadcn/ui components
- ✅ API client infrastructure
- ✅ Schema Registry integration

---

## Acceptance Criteria Checklist

- [ ] Navigate to Settings → Device Types
- [ ] Create new Device Type with name and description
- [ ] Select primary protocol (MQTT, HTTP, WebSocket, OPC UA, Modbus, etc.)
- [ ] Configure protocol-specific settings (endpoints, auth, sampling rate)
- [ ] Assign data schema from Schema Registry
- [ ] Define custom metadata fields (name, type, validation rules, help text)
- [ ] Set field as required/optional
- [ ] Configure default alert rule templates
- [ ] Add tags for categorization
- [ ] Save Device Type successfully
- [ ] Preview example device configuration
- [ ] Clone existing Device Type to create similar configuration
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Frontend tests passing
- [ ] Documentation updated

---

## Notes

- **Multi-tenancy**: All queries MUST filter by tenant_id
- **JSONB**: Use Npgsql.EnableDynamicJson() for complex types
- **Validation**: Both client-side and server-side validation required
- **Security**: Ensure proper authorization checks
- **Performance**: Add indexes on frequently queried columns
- **Schema Integration**: Validate schema_id exists in Schema Registry
- **Clone Feature**: Creates deep copy with new ID and "(Copy)" suffix

---

## Estimated Completion

**Story Points**: 8  
**Estimated Hours**: 12-16 hours  
**Complexity**: Medium-High (database design + full-stack implementation)

---

## Rollback Plan

If issues arise:
1. Revert database migration
2. Remove API endpoints
3. Remove frontend pages
4. Keep domain models for future use

---

## Definition of Done

- [x] Story plan created and reviewed
- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] Frontend tests written and passing
- [ ] Code reviewed and refactored
- [ ] Documentation updated (HELP.md)
- [ ] Acceptance criteria verified
- [ ] Story moved to completed-stories/
- [ ] current-state.md updated
- [ ] Committed with [Story 1.1] prefix
- [ ] GitHub issue closed
