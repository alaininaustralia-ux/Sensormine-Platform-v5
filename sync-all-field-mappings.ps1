# Sync all device types' field mappings from their schemas
# This ensures JsonPath is properly configured for all schema fields

$baseUrl = "http://localhost:5000"
$tenantId = "00000000-0000-0000-0000-000000000001"
$headers = @{"X-Tenant-Id" = $tenantId}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Field Mapping Sync - All Device Types" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Get all device types
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/devicetype" -Headers $headers
    $deviceTypes = $response.items
    Write-Host "Found $($deviceTypes.Count) device types`n" -ForegroundColor Green
} catch {
    Write-Host "Error fetching device types: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$syncResults = @()

foreach ($dt in $deviceTypes) {
    Write-Host "Processing: $($dt.name)..." -ForegroundColor Yellow -NoNewline
    
    try {
        # Sync fields from schema
        $result = Invoke-RestMethod -Uri "$baseUrl/api/devicetype/$($dt.id)/fields/sync" `
            -Method POST `
            -Headers $headers
        
        # Count field types
        $schemaFields = ($result | Where-Object { $_.fieldSource -eq 'Schema' }).Count
        $systemFields = ($result | Where-Object { $_.fieldSource -eq 'System' }).Count
        $customFields = ($result | Where-Object { $_.fieldSource -eq 'CustomField' }).Count
        $withJsonPath = ($result | Where-Object { $_.jsonPath -ne $null }).Count
        
        Write-Host " ✓" -ForegroundColor Green
        Write-Host "  Schema: $schemaFields | System: $systemFields | Custom: $customFields | JsonPath: $withJsonPath" -ForegroundColor Gray
        
        $syncResults += [PSCustomObject]@{
            DeviceType = $dt.name
            TotalFields = $result.Count
            SchemaFields = $schemaFields
            SystemFields = $systemFields
            CustomFields = $customFields
            WithJsonPath = $withJsonPath
            Status = "Success"
        }
    } catch {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $syncResults += [PSCustomObject]@{
            DeviceType = $dt.name
            TotalFields = 0
            SchemaFields = 0
            SystemFields = 0
            CustomFields = 0
            WithJsonPath = 0
            Status = "Failed"
        }
    }
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Sync Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$syncResults | Format-Table -AutoSize

$totalSchema = ($syncResults | Measure-Object -Property SchemaFields -Sum).Sum
$totalSystem = ($syncResults | Measure-Object -Property SystemFields -Sum).Sum
$totalCustom = ($syncResults | Measure-Object -Property CustomFields -Sum).Sum
$totalJsonPath = ($syncResults | Measure-Object -Property WithJsonPath -Sum).Sum

Write-Host "`nTotals:" -ForegroundColor Cyan
Write-Host "  Schema Fields: $totalSchema" -ForegroundColor White
Write-Host "  System Fields: $totalSystem" -ForegroundColor White
Write-Host "  Custom Fields: $totalCustom" -ForegroundColor White
Write-Host "  With JsonPath: $totalJsonPath" -ForegroundColor Green
Write-Host ""
