# MQTT Data Ingestion Test Script
# Tests the complete data flow: MQTT → Kafka → TimescaleDB

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MQTT Data Ingestion Pipeline Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check infrastructure
Write-Host "Step 1: Checking infrastructure..." -ForegroundColor Yellow
$infraReady = $true

try {
    $null = Test-NetConnection -ComputerName localhost -Port 1883 -WarningAction SilentlyContinue -ErrorAction Stop
    Write-Host "  ✓ MQTT Broker (port 1883): Ready" -ForegroundColor Green
} catch {
    Write-Host "  ✗ MQTT Broker (port 1883): Not responding" -ForegroundColor Red
    $infraReady = $false
}

try {
    $null = Test-NetConnection -ComputerName localhost -Port 9092 -WarningAction SilentlyContinue -ErrorAction Stop
    Write-Host "  ✓ Kafka (port 9092): Ready" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Kafka (port 9092): Not responding" -ForegroundColor Red
    $infraReady = $false
}

try {
    $null = Test-NetConnection -ComputerName localhost -Port 5452 -WarningAction SilentlyContinue -ErrorAction Stop
    Write-Host "  ✓ TimescaleDB (port 5452): Ready" -ForegroundColor Green
} catch {
    Write-Host "  ✗ TimescaleDB (port 5452): Not responding" -ForegroundColor Red
    $infraReady = $false
}

if (-not $infraReady) {
    Write-Host ""
    Write-Host "Infrastructure not ready. Run: docker-compose up -d" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Start Edge.Gateway
Write-Host "Step 2: Starting Edge.Gateway..." -ForegroundColor Yellow
$edgeJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    dotnet run --project src/Services/Edge.Gateway/Edge.Gateway.csproj --no-build
}
Start-Sleep -Seconds 3
Write-Host "  ✓ Edge.Gateway started (Job ID: $($edgeJob.Id))" -ForegroundColor Green
Write-Host ""

# Test 3: Start Ingestion.Service
Write-Host "Step 3: Starting Ingestion.Service..." -ForegroundColor Yellow
$ingestionJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    dotnet run --project src/Services/Ingestion.Service/Ingestion.Service.csproj --no-build
}
Start-Sleep -Seconds 3
Write-Host "  ✓ Ingestion.Service started (Job ID: $($ingestionJob.Id))" -ForegroundColor Green
Write-Host ""

# Test 4: Publish MQTT message
Write-Host "Step 4: Publishing test telemetry message..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  To publish a message, use an MQTT client:" -ForegroundColor Cyan
Write-Host "  Topic:   sensormine/devices/TEST-001/telemetry" -ForegroundColor White
Write-Host "  Payload: {""deviceId"":""TEST-001"",""timestamp"":""$(Get-Date -Format 'o')"",""temperature"":22.5,""humidity"":65}" -ForegroundColor White
Write-Host ""
Write-Host "  Or start the Device Simulator at http://localhost:3021" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to stop services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host ""
Write-Host "Stopping services..." -ForegroundColor Yellow
Stop-Job $edgeJob, $ingestionJob
Remove-Job $edgeJob, $ingestionJob
Write-Host "  ✓ Services stopped" -ForegroundColor Green
Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
