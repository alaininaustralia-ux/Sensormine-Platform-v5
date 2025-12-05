# Story 1.2: Edit Device Type Configuration - Implementation Plan

**Status:** In Progress  
**Started:** 2025-12-06  
**Priority:** High  
**Story Points:** 5

---

## Story Details

**As a** system administrator  
**I want** to modify an existing Device Type's settings  
**So that** I can adapt to changing requirements without creating new types

### Acceptance Criteria
- [x] Select Device Type from Settings → Device Types list
- [ ] View usage statistics (number of devices using this type)
- [ ] Edit general settings (name, description, tags)
- [ ] Update protocol configuration
- [ ] Change assigned schema (with version compatibility check)
- [ ] Add/remove/modify custom fields
- [ ] Warning if changes affect existing devices
- [ ] View version history of Device Type changes
- [ ] Rollback to previous configuration version
- [ ] Changes propagate to all devices of this type
- [ ] Audit log captures all modifications

---

## Technical Approach

### Phase 1: Backend - Version History System

#### 1.1 Create DeviceTypeVersion Model
```csharp
public class DeviceTypeVersion
{
    public Guid Id { get; set; }
    public Guid DeviceTypeId { get; set; }
    public int Version { get; set; } // Auto-incremented version number
    public string VersionData { get; set; } // JSON snapshot of DeviceType at this version
    public string ChangeSummary { get; set; } // Description of changes
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}
```

#### 1.2 Create DeviceTypeAuditLog Model
```csharp
public class DeviceTypeAuditLog
{
    public Guid Id { get; set; }
    public Guid DeviceTypeId { get; set; }
    public Guid TenantId { get; set; }
    public string Action { get; set; } // Created, Updated, SchemaChanged, Deleted
    public string? OldValue { get; set; } // JSON of previous state (for updates)
    public string? NewValue { get; set; } // JSON of new state
    public string? ChangeSummary { get; set; }
    public DateTime Timestamp { get; set; }
    public string UserId { get; set; }
}
```

#### 1.3 Update DeviceTypeRepository
- Add `GetVersionHistoryAsync(Guid deviceTypeId, Guid tenantId)` method
- Add `RollbackToVersionAsync(Guid deviceTypeId, int version, Guid tenantId)` method
- Add `GetUsageStatisticsAsync(Guid deviceTypeId, Guid tenantId)` method
- Modify `UpdateAsync` to:
  - Create version snapshot before update
  - Create audit log entry
  - Detect breaking changes
  - Return validation warnings

#### 1.4 Add New Controller Endpoints
```csharp
GET  /api/DeviceType/{id}/versions - Get version history
POST /api/DeviceType/{id}/rollback/{version} - Rollback to version
GET  /api/DeviceType/{id}/usage - Get usage statistics
POST /api/DeviceType/{id}/validate-update - Validate update (returns warnings)
```

### Phase 2: Backend - Change Detection & Validation

#### 2.1 Breaking Change Detection
Changes that affect existing devices:
- Protocol change (requires device reconfiguration)
- Schema change (data validation changes)
- Required custom field addition (existing devices need values)
- Alert template modification (may trigger false alerts)

#### 2.2 Validation Service
```csharp
public class DeviceTypeUpdateValidator
{
    public ValidationResult ValidateUpdate(DeviceType current, DeviceType proposed)
    {
        // Returns warnings for breaking changes
        // Returns affected device count
        // Returns recommended actions
    }
}
```

### Phase 3: Frontend - Edit UI

#### 3.1 Edit Device Type Page (`/settings/device-types/[id]/edit`)
Components:
- Device Type Editor Form (reuse from create wizard)
- Usage Statistics Panel
  - Number of devices using this type
  - Last used date
  - Active vs inactive device count
- Version History Panel
  - Timeline view of all versions
  - Version number, date, user, change summary
  - Rollback button (with confirmation)
- Change Warning Banner
  - Shows when breaking changes detected
  - Lists affected devices
  - Suggests migration steps

#### 3.2 Update API Client
```typescript
deviceTypeApi.update(id: string, data: DeviceTypeRequest): Promise<DeviceTypeResponse>
deviceTypeApi.getVersionHistory(id: string): Promise<DeviceTypeVersion[]>
deviceTypeApi.rollback(id: string, version: number): Promise<DeviceTypeResponse>
deviceTypeApi.getUsageStats(id: string): Promise<UsageStatistics>
deviceTypeApi.validateUpdate(id: string, data: DeviceTypeRequest): Promise<ValidationResult>
```

---

## Database Changes

### Migration: AddDeviceTypeVersioning

```sql
-- DeviceTypeVersions table
CREATE TABLE device_type_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type_id UUID NOT NULL REFERENCES device_types(id),
    version INTEGER NOT NULL,
    version_data JSONB NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    UNIQUE(device_type_id, version)
);

CREATE INDEX idx_device_type_versions_device_type_id 
    ON device_type_versions(device_type_id);

-- DeviceTypeAuditLogs table
CREATE TABLE device_type_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type_id UUID NOT NULL REFERENCES device_types(id),
    tenant_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_summary TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

CREATE INDEX idx_device_type_audit_logs_device_type_id 
    ON device_type_audit_logs(device_type_id);
CREATE INDEX idx_device_type_audit_logs_timestamp 
    ON device_type_audit_logs(timestamp DESC);
```

---

## Test Plan

### Unit Tests (Backend)

#### DeviceTypeRepositoryTests
- [x] `UpdateAsync_CreatesVersionSnapshot` - Verify version created on update
- [x] `UpdateAsync_CreatesAuditLog` - Verify audit log entry
- [ ] `GetVersionHistoryAsync_ReturnsAllVersions` - Get version history
- [ ] `RollbackToVersionAsync_RestoresPreviousState` - Rollback functionality
- [ ] `GetUsageStatisticsAsync_ReturnsDeviceCount` - Usage stats

#### DeviceTypeControllerTests
- [x] `UpdateDeviceType_Success` - Basic update works
- [ ] `UpdateDeviceType_WithBreakingChanges_ReturnsWarnings` - Breaking change detection
- [ ] `GetVersionHistory_ReturnsVersions` - Get version history endpoint
- [ ] `RollbackToVersion_Success` - Rollback endpoint
- [ ] `GetUsageStatistics_Success` - Usage stats endpoint
- [ ] `ValidateUpdate_DetectsBreakingChanges` - Validation endpoint

#### DeviceTypeUpdateValidatorTests
- [ ] `ValidateUpdate_ProtocolChange_ReturnsWarning` - Protocol change detection
- [ ] `ValidateUpdate_SchemaChange_ReturnsWarning` - Schema change detection
- [ ] `ValidateUpdate_RequiredFieldAdded_ReturnsWarning` - Required field detection
- [ ] `ValidateUpdate_NonBreakingChanges_NoWarnings` - Non-breaking changes

### Integration Tests (Frontend)

#### DeviceTypeEditPage Tests
- [ ] Loads device type data correctly
- [ ] Displays usage statistics
- [ ] Shows version history
- [ ] Displays warnings for breaking changes
- [ ] Submits update successfully
- [ ] Handles validation errors
- [ ] Rollback functionality works

---

## Implementation Order

1. **Database Migration** - Create version and audit tables
2. **Backend Models** - DeviceTypeVersion, DeviceTypeAuditLog
3. **Repository Updates** - Add versioning, audit logging, usage stats
4. **Validation Service** - Breaking change detection
5. **Controller Endpoints** - Version history, rollback, usage stats, validate
6. **Unit Tests** - Backend testing
7. **Frontend API Client** - Add new API functions
8. **Frontend Edit Page** - UI implementation
9. **Integration Testing** - End-to-end testing

---

## Dependencies
- Story 1.1 (Create Device Type) - ✅ Complete
- Device.API running - ✅ Available
- Frontend project setup - ✅ Complete

---

## Notes
- Versioning only applies to updates, not creation
- Soft delete should also create version snapshot
- Usage statistics require Device table (Story 2.1 dependency) - **Mock for now**
- Audit logs stored separately from versions for queryability
- Consider version retention policy (keep all versions for now)
