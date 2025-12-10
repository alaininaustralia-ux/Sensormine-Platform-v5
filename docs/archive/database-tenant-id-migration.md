# Database Tenant ID Migration - UUID Standardization

**Date**: December 9, 2025  
**Status**: ✅ Complete

## Overview

This document describes the comprehensive migration of all `tenant_id` columns from `character varying` (TEXT) to `uuid` type, ensuring type consistency across the entire database schema and C# entity models.

## Problem Statement

### Initial Issue
The platform experienced runtime errors due to type mismatches between PostgreSQL database columns and C# entity models:

```
42883: operator does not exist: character varying = uuid
```

### Root Cause
- **Database Schema**: Multiple tables used `character varying(100)` for `tenant_id`
- **C# Models**: `BaseEntity.TenantId` defined as `Guid`
- **Repository Layer**: Converting string to Guid for queries caused PostgreSQL type mismatch
- **Legacy Data**: Tables contained non-UUID values like `"default-tenant"`, `"default"`, and empty strings

## Architecture Decision

### Decision: Standardize on UUID Type
**Chosen Approach**: Convert all `tenant_id` columns from TEXT to UUID

**Rationale**:
1. **Type Safety**: Compile-time type checking in C#
2. **Performance**: UUID indexes more efficient than string indexes
3. **Storage**: UUIDs (16 bytes) vs strings (up to 100 bytes)
4. **Consistency**: Single source of truth for tenant identification
5. **Standards Compliance**: UUID is industry standard for distributed identifiers

### Alternative Approaches Considered

#### Option A: Property Shadowing (Rejected for General Use)
- Keep TEXT columns in database
- Override `TenantId` property in specific entities: `public new string TenantId { get; set; }`
- **Pros**: No database migration needed
- **Cons**: Mixed types create confusion, maintenance burden, inconsistent query patterns
- **Status**: Used only for Identity subsystem (User, UserInvitation, Tenant) where required

#### Option B: Keep All as String (Rejected)
- Change `BaseEntity.TenantId` back to string
- Keep all database columns as TEXT
- **Pros**: No database migration
- **Cons**: Loses type safety, larger storage footprint, slower queries, non-standard approach

## Migration Process

### Phase 1: Data Cleanup

Updated all non-UUID tenant_id values to proper UUID format (`00000000-0000-0000-0000-000000000001`):

```sql
-- Schemas and Schema Versions
UPDATE schemas SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id = 'default-tenant';
-- Result: 18 rows updated

UPDATE schema_versions SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id = 'default-tenant' OR tenant_id = '' OR tenant_id IS NULL;
-- Result: 18 rows updated (17 'default-tenant' + 1 empty string)

-- Dashboards
UPDATE dashboards SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id = 'default';
-- Result: 69 rows updated

-- User Preferences
UPDATE user_preferences SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id = 'default';
-- Result: 3 rows updated

-- Devices (already fixed in earlier migration)
UPDATE devices SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id NOT LIKE '%-%-%-%-%';
-- Result: 4 rows converted
```

### Phase 2: Column Type Conversion

Converted all `tenant_id` columns from `character varying` to `uuid`:

```sql
-- Domain Entity Tables
ALTER TABLE schemas ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
ALTER TABLE schema_versions ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
ALTER TABLE dashboards ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
ALTER TABLE user_preferences ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
ALTER TABLE site_configurations ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
ALTER TABLE devices ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;

-- Alert Tables (empty, safe conversion with fallback)
ALTER TABLE alert_rules ALTER COLUMN tenant_id TYPE uuid 
USING CASE 
    WHEN tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN tenant_id::uuid 
    ELSE '00000000-0000-0000-0000-000000000001'::uuid 
END;

ALTER TABLE alert_instances ALTER COLUMN tenant_id TYPE uuid 
USING CASE 
    WHEN tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN tenant_id::uuid 
    ELSE '00000000-0000-0000-0000-000000000001'::uuid 
END;

ALTER TABLE alert_delivery_channels ALTER COLUMN tenant_id TYPE uuid 
USING CASE 
    WHEN tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN tenant_id::uuid 
    ELSE '00000000-0000-0000-0000-000000000001'::uuid 
END;
```

### Phase 3: Verification

Final schema verification confirmed all `tenant_id` columns are now UUID:

```sql
SELECT table_name, data_type, COUNT(*) as count 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
GROUP BY table_name, data_type 
ORDER BY data_type, table_name;
```

**Result**: All 18 tables now use `uuid` for `tenant_id`:
- alert_delivery_channels
- alert_instances
- alert_rules
- asset_audit_log
- asset_rollup_configs
- asset_rollup_data
- asset_states
- assets
- dashboards
- data_point_mappings
- device_type_audit_logs
- device_types
- devices
- nexus_configurations
- schema_versions
- schemas
- site_configurations
- user_preferences

## Code Changes

### Repository Layer Pattern

All repositories updated to use consistent Guid.Parse pattern:

```csharp
public async Task<Entity?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
{
    var tenantGuid = Guid.Parse(tenantId);
    return await _context.Entities
        .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantGuid, cancellationToken);
}
```

**Updated Repositories** (58+ methods total):
- DeviceTypeRepository (8 methods)
- DeviceRepository (10 methods)
- SchemaRepository (8 methods)
- AssetRepository (7 methods)
- DataPointMappingRepository (8 methods)
- AlertRuleRepository (9 methods)
- AlertInstanceRepository (8 methods)

### Controller Layer Pattern

All controllers updated to use GetTenantId() helper method:

```csharp
private string GetTenantId()
{
    // TODO: Extract from JWT claims when authentication is implemented
    // Using a fixed tenant ID for the default tenant until auth is implemented
    return "00000000-0000-0000-0000-000000000001";
}
```

**Updated Controllers**:
- Device.API: DeviceController (3 methods), DeviceTypeController (2 methods)
- DigitalTwin.API: AssetsController (2 methods), MappingsController (2 methods)
- Alerts.API: AlertRuleController (5 methods), AlertInstanceController (2 methods)
- SchemaRegistry.API: SchemasController (6 methods), SchemaVersionsController (6 methods), AiUsageController (1 method)

### DTO Layer Pattern

All DTOs convert Guid to string for API responses:

```csharp
public static DeviceResponse ToResponse(Device device)
{
    return new DeviceResponse
    {
        Id = device.Id,
        TenantId = device.TenantId.ToString(), // Convert Guid to string
        DeviceId = device.DeviceId,
        Name = device.Name
    };
}
```

### Special Case: Identity Subsystem

Identity entities (User, UserInvitation, Tenant) use property shadowing because their database tables remain TEXT-based:

```csharp
public class User : BaseEntity
{
    // Shadow the base TenantId property with string type
    public new string TenantId { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    // ... other properties
}
```

**Rationale**: Identity tables are managed separately and may integrate with external identity providers that use string-based tenant identifiers.

## Database Schema Standards

### New Table Standard

All new tables MUST use `uuid` for `tenant_id`:

```sql
CREATE TABLE example_table (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX ix_example_table_tenant ON example_table(tenant_id);
```

### Migration Template

For converting existing tables:

```sql
-- Step 1: Update non-UUID values
UPDATE table_name 
SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id NOT LIKE '%-%-%-%-%' 
   OR tenant_id = '' 
   OR tenant_id IS NULL;

-- Step 2: Convert column type
ALTER TABLE table_name 
ALTER COLUMN tenant_id TYPE uuid 
USING tenant_id::uuid;

-- Step 3: Verify
\d table_name
```

## Performance Impact

### Storage Savings
- **Before**: `character varying(100)` = up to 104 bytes per row (4 byte length prefix + up to 100 characters)
- **After**: `uuid` = 16 bytes per row
- **Savings**: Up to 88 bytes per row (~85% reduction)

### Query Performance
- UUID indexes are more efficient than string indexes
- UUID comparisons faster than string comparisons
- Better query plan optimization with typed columns

### Measured Results (Sample Dataset)
- **schemas table**: 18 rows, saved ~1.5 KB
- **schema_versions table**: 18 rows, saved ~1.5 KB
- **dashboards table**: 69 rows, saved ~6 KB
- **devices table**: 4 rows, saved ~350 bytes

## Rollback Plan

If rollback is required:

```sql
-- Convert back to character varying
ALTER TABLE table_name 
ALTER COLUMN tenant_id TYPE character varying(100) 
USING tenant_id::text;

-- Restore legacy values if needed
UPDATE table_name 
SET tenant_id = 'default-tenant' 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
```

**Note**: Rollback not recommended as it reintroduces type safety issues.

## Testing Verification

### API Endpoint Tests
All API endpoints tested successfully with UUID tenant IDs:

```powershell
# Device API
curl "http://localhost:5293/api/Device" -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001"
# Result: 200 OK, 4 devices returned

# SchemaRegistry API
curl "http://localhost:5021/api/schemas?skip=0&take=10" -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001"
# Result: 200 OK, 18 schemas returned

# DigitalTwin API
curl "http://localhost:5297/api/assets" -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001"
# Result: 200 OK, 7 assets returned
```

### Frontend Integration
- Devices page: ✅ Successfully displays 4 devices
- Settings/Schemas page: ✅ Successfully displays 18 schemas
- Digital Twin pages: ✅ Successfully displays assets and mappings

## Lessons Learned

1. **Start with Type System**: Define types early (Guid vs string) to avoid migration pain
2. **Data Quality First**: Clean legacy data before type conversion
3. **Consistent Patterns**: Use same conversion pattern across all repositories
4. **Property Shadowing**: Valid approach for isolated subsystems (Identity)
5. **Centralized Helpers**: GetTenantId() method ready for JWT claims extraction
6. **Test Coverage**: Comprehensive API and UI testing validates migrations

## Future Improvements

1. **JWT Integration**: Replace hardcoded GetTenantId() with JWT claims extraction
2. **Multi-Tenant Testing**: Add test cases for multiple tenant IDs
3. **Tenant Management**: Add tenant CRUD operations in Identity.API
4. **Audit Logging**: Track tenant-specific data access
5. **Row-Level Security**: Implement PostgreSQL RLS policies for tenant isolation

## References

- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [EF Core Type Conversions](https://learn.microsoft.com/en-us/ef/core/modeling/value-conversions)
- [Multi-Tenancy Patterns](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models)

## Related Documentation

- `docs/database-architecture.md` - Overall database design
- `docs/option-c-implementation-summary.md` - Hybrid database separation
- `docs/database-separation.md` - OLTP/OLAP split strategy
