# Update Connection Strings for Option C Architecture
# PostgreSQL (port 5433): OLTP - sensormine database
# TimescaleDB (port 5452): OLAP - sensormine_timeseries database

Write-Host "🔄 Updating service connection strings for Option C" -ForegroundColor Cyan
Write-Host "=" * 80

$services = @(
    @{
        Name = "Device.API"
        Path = "src/Services/Device.API/appsettings.Development.json"
        OldConnection = "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123"
        NewConnection = "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
        Database = "sensormine (PostgreSQL)"
    },
    @{
        Name = "DigitalTwin.API"
        Path = "src/Services/DigitalTwin.API/appsettings.json"
        OldConnection = "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123"
        NewConnection = "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
        Database = "sensormine (PostgreSQL)"
    },
    @{
        Name = "Query.API"
        Path = "src/Services/Query.API/appsettings.Development.json"
        ConnectionName = "TelemetryConnection"
        OldConnection = "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
        NewConnection = "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123"
        Database = "sensormine_timeseries (TimescaleDB)"
    }
)

$updated = 0
$skipped = 0
$errors = 0

foreach ($service in $services) {
    Write-Host "`n📝 Processing $($service.Name)..." -ForegroundColor Yellow
    
    $filePath = Join-Path $PSScriptRoot ".." $service.Path
    
    if (-not (Test-Path $filePath)) {
        Write-Host "  ✗ File not found: $filePath" -ForegroundColor Red
        $errors++
        continue
    }
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Update connection string
    if ($service.ConnectionName) {
        # Specific connection name (like TelemetryConnection)
        $content = $content -replace [regex]::Escape($service.OldConnection), $service.NewConnection
    } else {
        # Default connection
        $content = $content -replace [regex]::Escape($service.OldConnection), $service.NewConnection
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  ✓ Updated to: $($service.Database)" -ForegroundColor Green
        $updated++
    } else {
        Write-Host "  ○ No changes needed (already correct or pattern not found)" -ForegroundColor Gray
        $skipped++
    }
}

Write-Host "`n" + ("=" * 80)
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Updated: $updated services" -ForegroundColor Green
Write-Host "  Skipped: $skipped services" -ForegroundColor Gray
Write-Host "  Errors:  $errors services" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Gray" })

if ($updated -gt 0) {
    Write-Host "`n⚠️  Services with updated connections must be restarted!" -ForegroundColor Yellow
    Write-Host "`nServices to restart:" -ForegroundColor Cyan
    foreach ($service in $services) {
        Write-Host "  - $($service.Name)" -ForegroundColor White
    }
}

Write-Host "`n✓ Connection string update complete!" -ForegroundColor Green
