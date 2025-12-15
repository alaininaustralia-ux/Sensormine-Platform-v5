# Test Template.API endpoints
# Run this after starting Template.API: dotnet run --project src/Services/Template.API/Template.API.csproj

$baseUrl = "http://localhost:5320"
$tenantId = "00000000-0000-0000-0000-000000000001"

Write-Host "Testing Template.API Endpoints" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Tenant ID: $tenantId" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($healthResponse.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: List Templates (should be empty initially)
Write-Host "Test 2: List Templates" -ForegroundColor Green
try {
    $templates = Invoke-RestMethod -Uri "$baseUrl/api/templates" `
        -Method GET `
        -Headers @{"X-Tenant-Id" = $tenantId}
    Write-Host "✓ List templates successful" -ForegroundColor Green
    Write-Host "  Count: $($templates.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ List templates failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Export Template (requires existing resources)
Write-Host "Test 3: Export Template" -ForegroundColor Green
$exportRequest = @{
    name = "Test Export Template"
    description = "Test export from PowerShell"
    author = "Test User"
    authorEmail = "test@example.com"
    tags = @("test", "powershell")
    category = "Testing"
    includeResources = @{
        schemas = $true
        deviceTypeIds = @()
        dashboardIds = @()
        alertRuleIds = @()
        assetIds = @()
        nexusConfigurationIds = @()
        includeDevices = $false
    }
    exportOptions = @{
        includeData = $false
        anonymize = $false
    }
} | ConvertTo-Json -Depth 10

try {
    $exportResponse = Invoke-RestMethod -Uri "$baseUrl/api/templates/export" `
        -Method POST `
        -Headers @{
            "X-Tenant-Id" = $tenantId
            "Content-Type" = "application/json"
        } `
        -Body $exportRequest
    Write-Host "✓ Export template successful" -ForegroundColor Green
    Write-Host "  Template Name: $($exportResponse.metadata.name)" -ForegroundColor Gray
    Write-Host "  Schema Count: $($exportResponse.resources.schemas.Count)" -ForegroundColor Gray
    Write-Host "  Device Type Count: $($exportResponse.resources.deviceTypes.Count)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Export template failed (expected if no resources exist yet): $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Validate Example Template
Write-Host "Test 4: Validate Example Template" -ForegroundColor Green
$exampleTemplatePath = "src/Services/Template.API/Examples/starter-template.json"
if (Test-Path $exampleTemplatePath) {
    try {
        $exampleTemplate = Get-Content $exampleTemplatePath -Raw | ConvertFrom-Json
        $validateRequest = @{
            template = $exampleTemplate
        } | ConvertTo-Json -Depth 20
        
        $validateResponse = Invoke-RestMethod -Uri "$baseUrl/api/templates/validate" `
            -Method POST `
            -Headers @{
                "X-Tenant-Id" = $tenantId
                "Content-Type" = "application/json"
            } `
            -Body $validateRequest
        Write-Host "✓ Validation successful" -ForegroundColor Green
        Write-Host "  Is Valid: $($validateResponse.isValid)" -ForegroundColor Gray
        Write-Host "  Errors: $($validateResponse.errors.Count)" -ForegroundColor Gray
        Write-Host "  Warnings: $($validateResponse.warnings.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Validation failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠ Example template not found at: $exampleTemplatePath" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Import Example Template (Dry Run)
Write-Host "Test 5: Import Preview (Dry Run)" -ForegroundColor Green
if (Test-Path $exampleTemplatePath) {
    try {
        $exampleTemplate = Get-Content $exampleTemplatePath -Raw | ConvertFrom-Json
        $previewRequest = @{
            template = $exampleTemplate
        } | ConvertTo-Json -Depth 20
        
        $previewResponse = Invoke-RestMethod -Uri "$baseUrl/api/templates/preview" `
            -Method POST `
            -Headers @{
                "X-Tenant-Id" = $tenantId
                "Content-Type" = "application/json"
            } `
            -Body $previewRequest
        Write-Host "✓ Import preview successful" -ForegroundColor Green
        Write-Host "  Will Import:" -ForegroundColor Gray
        Write-Host "    Schemas: $($previewResponse.willImport.schemas)" -ForegroundColor Gray
        Write-Host "    Device Types: $($previewResponse.willImport.deviceTypes)" -ForegroundColor Gray
        Write-Host "    Assets: $($previewResponse.willImport.assets)" -ForegroundColor Gray
        Write-Host "    Dashboards: $($previewResponse.willImport.dashboards)" -ForegroundColor Gray
        Write-Host "    Alert Rules: $($previewResponse.willImport.alertRules)" -ForegroundColor Gray
        Write-Host "  Conflicts: $($previewResponse.conflicts.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Import preview failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠ Example template not found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start required services: Device.API, SchemaRegistry.API, Dashboard.API, Alerts.API, DigitalTwin.API" -ForegroundColor Gray
Write-Host "2. Create some demo data (devices, schemas, dashboards)" -ForegroundColor Gray
Write-Host "3. Test export with real data" -ForegroundColor Gray
Write-Host "4. Test import to create resources" -ForegroundColor Gray
