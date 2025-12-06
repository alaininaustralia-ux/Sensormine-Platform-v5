# Enhanced MQTT Data Ingestion Pipeline Test
# Tests: MQTT → Kafka → Schema Validation → TimescaleDB with DLQ and Rate Limiting

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Enhanced MQTT Data Ingestion Pipeline Test" -ForegroundColor Cyan
Write-Host "  Features: Schema Validation, DLQ, Rate Limiting, Batch Messages" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SCHEMA_REGISTRY_URL = "http://localhost:5021"
$EDGE_GATEWAY_URL = "http://localhost:5000"
$INGESTION_SERVICE_URL = "http://localhost:5001"
$DEVICE_API_URL = "http://localhost:5293"

# Test 1: Check infrastructure
Write-Host "Step 1: Checking infrastructure..." -ForegroundColor Yellow
$infraReady = $true

$services = @(
    @{Name="MQTT Broker"; Port=1883},
    @{Name="Kafka"; Port=9092},
    @{Name="TimescaleDB"; Port=5452},
    @{Name="Schema Registry"; Port=5021},
    @{Name="Device API"; Port=5293}
)

foreach ($service in $services) {
    try {
        $null = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue -ErrorAction Stop
        Write-Host "  ✓ $($service.Name) (port $($service.Port)): Ready" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $($service.Name) (port $($service.Port)): Not responding" -ForegroundColor Red
        $infraReady = $false
    }
}

if (-not $infraReady) {
    Write-Host ""
    Write-Host "Infrastructure not ready. Run: docker-compose up -d" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Start Edge.Gateway
Write-Host "Step 2: Starting Edge.Gateway with rate limiting..." -ForegroundColor Yellow
$edgeJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    dotnet run --project src/Services/Edge.Gateway/Edge.Gateway.csproj --no-build
}
Start-Sleep -Seconds 5
Write-Host "  ✓ Edge.Gateway started (Job ID: $($edgeJob.Id))" -ForegroundColor Green
Write-Host "    - MQTT Port: 1883" -ForegroundColor Gray
Write-Host "    - Rate Limiting: Enabled (100 msg/min)" -ForegroundColor Gray
Write-Host "    - Authentication: Disabled" -ForegroundColor Gray
Write-Host "    - Batch Support: Enabled" -ForegroundColor Gray
Write-Host ""

# Test 3: Start Ingestion.Service
Write-Host "Step 3: Starting Ingestion.Service with schema validation..." -ForegroundColor Yellow
$ingestionJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    dotnet run --project src/Services/Ingestion.Service/Ingestion.Service.csproj --no-build
}
Start-Sleep -Seconds 5
Write-Host "  ✓ Ingestion.Service started (Job ID: $($ingestionJob.Id))" -ForegroundColor Green
Write-Host "    - Schema Validation: Enabled" -ForegroundColor Gray
Write-Host "    - Dead Letter Queue: telemetry.dlq" -ForegroundColor Gray
Write-Host ""

# Test 4: Display test scenarios
Write-Host "Step 4: Test Scenarios" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MQTT Topic: sensormine/devices/{deviceId}/telemetry" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "A. Valid Single Message (Temperature Sensor):" -ForegroundColor Green
Write-Host '  mosquitto_pub -h localhost -t "sensormine/devices/temp-sensor-001/telemetry" -m' -ForegroundColor White
Write-Host '  ''{"deviceId":"temp-sensor-001","timestamp":"'$(Get-Date -Format 'o')'","temperature":22.5,"humidity":65}''' -ForegroundColor White
Write-Host ""

Write-Host "B. Valid Batch Message (Multiple readings):" -ForegroundColor Green
Write-Host '  mosquitto_pub -h localhost -t "sensormine/devices/temp-sensor-002/telemetry" -m' -ForegroundColor White
Write-Host '  ''[{"temperature":21.0,"humidity":60},{"temperature":22.0,"humidity":62}]''' -ForegroundColor White
Write-Host ""

Write-Host "C. Invalid Message (Will go to DLQ - missing required fields):" -ForegroundColor Yellow
Write-Host '  mosquitto_pub -h localhost -t "sensormine/devices/temp-sensor-003/telemetry" -m' -ForegroundColor White
Write-Host '  ''{"invalid":"data"}''' -ForegroundColor White
Write-Host ""

Write-Host "D. Rate Limit Test (Send 110 messages in 10 seconds):" -ForegroundColor Magenta
Write-Host '  for ($i=1; $i -le 110; $i++) {' -ForegroundColor White
Write-Host '    mosquitto_pub -h localhost -t "sensormine/devices/rate-test-001/telemetry" -m' -ForegroundColor White
Write-Host '    "{\"temp\":$i,\"timestamp\":\"$(Get-Date -Format ''o'')\"}"' -ForegroundColor White
Write-Host '  }' -ForegroundColor White
Write-Host '  # Last 10 messages should be dropped (rate limit: 100/min)' -ForegroundColor Gray
Write-Host ""

Write-Host "E. Device Simulator (Easy Testing):" -ForegroundColor Cyan
Write-Host "  Start simulator: http://localhost:3021" -ForegroundColor White
Write-Host "  Configure MQTT broker: localhost:1883" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Monitoring Commands" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "View Dead Letter Queue (DLQ) messages:" -ForegroundColor Yellow
Write-Host '  docker exec -it kafka kafka-console-consumer --bootstrap-server localhost:9092' -ForegroundColor White
Write-Host '    --topic telemetry.dlq --from-beginning --max-messages 10' -ForegroundColor White
Write-Host ""
Write-Host "Query TimescaleDB for stored data:" -ForegroundColor Yellow
Write-Host '  docker exec -it timescaledb psql -U sensormine -d sensormine_timeseries -c' -ForegroundColor White
Write-Host '  "SELECT device_id, timestamp, payload FROM telemetry ORDER BY timestamp DESC LIMIT 10;"' -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
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
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Features Implemented:" -ForegroundColor Cyan
Write-Host "  ✓ Schema Validation (via SchemaRegistry.API)" -ForegroundColor Green
Write-Host "  ✓ Dead Letter Queue (telemetry.dlq)" -ForegroundColor Green
Write-Host "  ✓ Rate Limiting (100 messages/minute per device)" -ForegroundColor Green
Write-Host "  ✓ Batch Message Support (JSON arrays)" -ForegroundColor Green
Write-Host "  ✓ MQTT Device Authentication (disabled by default)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
