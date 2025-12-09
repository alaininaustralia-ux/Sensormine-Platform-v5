# UUID vs String TenantId Type Fix - Status Report

## Summary
Changed `TenantId` property from `string` to `Guid` in all entity models to align with PostgreSQL database schema (UUID column type). This requires updating all repository methods that filter by tenant ID.

## Completed Fixes

### Models ✅
- `BaseEntity.TenantId`: string → Guid
- `DeviceType.TenantId`: string → Guid
- `DeviceTypeAuditLog.TenantId`: string → Guid
- `TimeSeriesData.TenantId`: string → Guid

### Repositories ✅
- **DeviceTypeRepository**: All 12 methods fixed
- **DeviceRepository**: All 7 methods fixed

### DTOs and Mapping ✅
- `AlertRuleDto.FromEntity()`: Convert Guid to string
- `AlertDeliveryChannelDto.FromEntity()`: Convert Guid to string
- `AlertInstanceDto.FromEntity()`: Convert Guid to string
- `Query.cs` (GraphQL): Convert Guid to string in TelemetryData mapping

### Infrastructure ✅
- **ApplicationDbContext**: Removed unnecessary value converter for TenantId
- **TimescaleDbRepository**: Updated to handle Guid TenantId (4 locations)

## Remaining Work 🔴

### Pattern to Apply
For each repository method with `string tenantId` parameter:

1. Add at start of method:
   ```csharp
   var tenantGuid = Guid.Parse(tenantId);
   ```

2. Replace in LINQ queries:
   ```csharp
   // OLD
   .Where(x => x.TenantId == tenantId)
   
   // NEW
   .Where(x => x.TenantId == tenantGuid)
   ```

### Repositories Needing Fixes

#### SchemaRepository (8 errors)
- Lines: 35, 42, 53, 63, 109, 119, 138, 151, 164
- Methods: GetByIdAsync, GetByNameAsync, GetByTypeAsync, GetActiveSchemas, GetVersionsBySchemaIdAsync, RollbackToVersionAsync, GetSchemaVersionAsync

#### AssetRepository (13 errors)
- Lines: 24, 31, 72, 85, 93, 115, 138, 147, 175, 193, 202, 239, 267
- Methods: GetByIdAsync, GetAllAsync, UpdateAsync, GetChildrenAsync, GetDescendantsAsync, GetAncestorsAsync, GetRootAssetsAsync, SearchAsync, GetCountAsync, MoveAssetAsync, GetStateAsync, GetBulkStatesAsync

#### DataPointMappingRepository (5 errors)
- Lines: 25, 33, 43, 52, 96
- Methods: GetByIdAsync, GetBySchemaIdAsync, GetByAssetIdAsync, GetByDeviceIdAsync, DeleteAsync

#### AlertInstanceRepository (6 errors)
- Lines: 74, 107, 118, 127, 146, 166
- Methods: SearchAsync, GetByAlertRuleIdAsync, GetActiveAlertsAsync, GetAlertsRequiringEscalationAsync, GetByIdAsync, UpdateAsync

#### AlertRuleRepository (2 errors)
- Lines: 62, 88
- Methods: GetAllAsync, SearchAsync

#### UserPreferenceRepository (1 error)
- Line: 23
- Method: GetByUserIdAsync

## Automated Fix Script

```powershell
# Run this script from repository root
$files = @(
    "src\Shared\Sensormine.Storage\Repositories\SchemaRepository.cs",
    "src\Shared\Sensormine.Storage\Repositories\AssetRepository.cs",
    "src\Shared\Sensormine.Storage\Repositories\DataPointMappingRepository.cs",
    "src\Shared\Sensormine.Storage\Repositories\AlertInstanceRepository.cs",
    "src\Shared\Sensormine.Storage\Repositories\AlertRuleRepository.cs",
    "src\Shared\Sensormine.Storage\Repositories\UserPreferenceRepository.cs"
)

foreach ($file in $files) {
    Write-Host "Fixing $file..." -ForegroundColor Cyan
    
    $content = Get-Content $file -Raw
    
    # Replace TenantId comparisons
    $content = $content -replace '\.TenantId == tenantId\)', '.TenantId == tenantGuid)'
    $content = $content -replace '\.TenantId == tenantId,', '.TenantId == tenantGuid,'
    $content = $content -replace '\.TenantId == tenantId;', '.TenantId == tenantGuid;'
    
    Set-Content $file $content -NoNewline
    Write-Host "✓ Updated comparisons in $file" -ForegroundColor Green
}

Write-Host "`nNext: Manually add 'var tenantGuid = Guid.Parse(tenantId);' to each method" -ForegroundColor Yellow
```

## Manual Steps After Script

For each method listed above:
1. Find method definition (search for error line number)
2. Add `var tenantGuid = Guid.Parse(tenantId);` as first line after opening brace
3. Verify the query uses `tenantGuid` not `tenantId`

## Verification
After all fixes:
```powershell
dotnet build Sensormine.sln
```

Expected: 0 errors related to "Operator '==' cannot be applied to operands of type 'Guid' and 'string'"

## Context
- **Why**: PostgreSQL database uses UUID for tenant_id columns
- **Impact**: All tenant-filtered queries were failing at runtime
- **Solution**: Align C# model types with database schema
- **API Boundary**: DTOs keep string TenantId for HTTP; convert at mapping layer
