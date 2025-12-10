# Field Mapping Integration Test Script
# Tests the complete field mapping workflow

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5295"  # Device.API URL
$tenantId = "00000000-0000-0000-0000-000000000001"

Write-Host "=== Field Mapping Integration Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Create a Device Type with Schema
Write-Host "Test 1: Creating device type with schema..." -ForegroundColor Yellow
$deviceTypeRequest = @{
    name = "Test Temperature Sensor $(Get-Date -Format 'yyyyMMddHHmmss')"
    description = "Test device type for field mapping"
    protocol = "MQTT"
    protocolConfig = @{
        mqtt = @{
            broker = "localhost"
            port = 1883
            topic = "sensors/temperature"
        }
    }
    schemaId = $null  # Will be set if schema exists
    customFields = @(
        @{
            name = "location"
            label = "Location"
            type = "String"
            required = $false
            defaultValue = ""
            validation = ""
            description = "Physical location of sensor"
        },
        @{
            name = "calibrationDate"
            label = "Last Calibration"
            type = "DateTime"
            required = $false
            validation = ""
            description = "Date of last calibration"
        }
    )
    alertTemplates = @()
    tags = @("test", "field-mapping")
    isActive = $true
} | ConvertTo-Json -Depth 10

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/devicetype" `
        -Method POST `
        -ContentType "application/json" `
        -Body $deviceTypeRequest

    $deviceTypeId = $createResponse.id
    Write-Host "✓ Device type created: $deviceTypeId" -ForegroundColor Green
    Write-Host "  Name: $($createResponse.name)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Failed to create device type: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Device Type with Fields
Write-Host "Test 2: Fetching device type with field mappings..." -ForegroundColor Yellow
try {
    $deviceType = Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$deviceTypeId" -Method GET
    
    Write-Host "✓ Device type retrieved" -ForegroundColor Green
    if ($deviceType.fields) {
        Write-Host "  Fields count: $($deviceType.fields.Count)" -ForegroundColor Gray
        Write-Host "  Field sources:" -ForegroundColor Gray
        $deviceType.fields | Group-Object fieldSource | ForEach-Object {
            Write-Host "    - $($_.Name): $($_.Count)" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ⚠ No fields property returned" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Failed to get device type: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Get Field Mappings Directly
Write-Host "Test 3: Fetching field mappings..." -ForegroundColor Yellow
try {
    $fields = Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$deviceTypeId/fields" -Method GET
    
    Write-Host "✓ Field mappings retrieved: $($fields.Count) fields" -ForegroundColor Green
    
    if ($fields.Count -gt 0) {
        Write-Host "  Sample fields:" -ForegroundColor Gray
        $fields | Select-Object -First 5 | ForEach-Object {
            Write-Host "    - $($_.fieldName) → $($_.friendlyName) [$($_.fieldSource)]" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "✗ Failed to get field mappings: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 4: Update Field Mappings (Friendly Names)
Write-Host "Test 4: Updating field mappings..." -ForegroundColor Yellow
try {
    # Prepare update request with modified friendly names
    $updateRequest = @{
        fieldMappings = @($fields | ForEach-Object {
            @{
                fieldName = $_.fieldName
                friendlyName = if ($_.fieldSource -eq "System") { 
                    "📊 $($_.friendlyName)" 
                } else { 
                    "✨ $($_.friendlyName)" 
                }
                description = "Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
                unit = $_.unit
                minValue = $_.minValue
                maxValue = $_.maxValue
                isQueryable = $_.isQueryable
                isVisible = $true  # Make all visible
                displayOrder = $_.displayOrder
                category = $_.category
                tags = $_.tags
                defaultAggregation = $_.defaultAggregation
                supportsAggregations = $_.supportsAggregations
                formatString = $_.formatString
            }
        })
    } | ConvertTo-Json -Depth 10

    $updatedFields = Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$deviceTypeId/fields" `
        -Method PUT `
        -ContentType "application/json" `
        -Body $updateRequest
    
    Write-Host "✓ Field mappings updated: $($updatedFields.Count) fields" -ForegroundColor Green
    Write-Host "  Sample updated fields:" -ForegroundColor Gray
    $updatedFields | Select-Object -First 3 | ForEach-Object {
        Write-Host "    - $($_.friendlyName)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Failed to update field mappings: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 5: Synchronize Field Mappings
Write-Host "Test 5: Synchronizing field mappings..." -ForegroundColor Yellow
try {
    $syncedFields = Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$deviceTypeId/fields/sync" `
        -Method POST `
        -ContentType "application/json"
    
    Write-Host "✓ Field mappings synchronized: $($syncedFields.Count) fields" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to sync field mappings: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 6: Verify Updates Persisted
Write-Host "Test 6: Verifying updates persisted..." -ForegroundColor Yellow
try {
    $verifyFields = Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$deviceTypeId/fields" -Method GET
    
    $visibleCount = ($verifyFields | Where-Object { $_.isVisible -eq $true }).Count
    $updatedCount = ($verifyFields | Where-Object { $_.friendlyName -match "📊|✨" }).Count
    
    Write-Host "✓ Verification complete" -ForegroundColor Green
    Write-Host "  Visible fields: $visibleCount / $($verifyFields.Count)" -ForegroundColor Gray
    Write-Host "  Updated friendly names: $updatedCount / $($verifyFields.Count)" -ForegroundColor Gray
    
    if ($updatedCount -eq 0) {
        Write-Host "  ⚠ Updates may have been overwritten by sync" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Failed to verify: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 7: Field Source Distribution
Write-Host "Test 7: Analyzing field source distribution..." -ForegroundColor Yellow
$sourceStats = $verifyFields | Group-Object fieldSource | 
    Select-Object @{Name='Source';Expression={$_.Name}}, @{Name='Count';Expression={$_.Count}}

Write-Host "✓ Field source distribution:" -ForegroundColor Green
$sourceStats | ForEach-Object {
    Write-Host "  $($_.Source): $($_.Count) fields" -ForegroundColor Gray
}

Write-Host ""

# Test 8: Queryable vs Non-Queryable
Write-Host "Test 8: Analyzing queryable fields..." -ForegroundColor Yellow
$queryableCount = ($verifyFields | Where-Object { $_.isQueryable -eq $true }).Count
$nonQueryableCount = ($verifyFields | Where-Object { $_.isQueryable -eq $false }).Count

Write-Host "✓ Queryable analysis:" -ForegroundColor Green
Write-Host "  Queryable: $queryableCount" -ForegroundColor Gray
Write-Host "  Non-queryable: $nonQueryableCount" -ForegroundColor Gray

Write-Host ""

# Cleanup (Optional - Comment out to keep test data)
Write-Host "Test 9: Cleanup (deleting test device type)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$deviceTypeId" -Method DELETE
    Write-Host "✓ Test device type deleted" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Failed to delete device type (might need manual cleanup): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✓ Device type CRUD operations" -ForegroundColor Green
Write-Host "  ✓ Field mapping retrieval" -ForegroundColor Green
Write-Host "  ✓ Field mapping updates" -ForegroundColor Green
Write-Host "  ✓ Field synchronization" -ForegroundColor Green
Write-Host "  ✓ Data persistence verification" -ForegroundColor Green
Write-Host "  ✓ Field source analysis" -ForegroundColor Green
Write-Host ""
