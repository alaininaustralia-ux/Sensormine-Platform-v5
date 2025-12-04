# Sensormine Platform - Quick Start Script
# This script starts the infrastructure and builds the solution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sensormine Platform v5 - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check .NET SDK
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK installed: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ .NET SDK not found. Please install .NET 8+ SDK" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✓ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Infrastructure services started" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start infrastructure services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Restoring NuGet packages..." -ForegroundColor Yellow
dotnet restore

Write-Host ""
Write-Host "Building solution..." -ForegroundColor Yellow
dotnet build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Setup complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Infrastructure Services:" -ForegroundColor Cyan
    Write-Host "  - Kafka: http://localhost:9092" -ForegroundColor White
    Write-Host "  - Kafka UI: http://localhost:8080" -ForegroundColor White
    Write-Host "  - MQTT: mqtt://localhost:1883" -ForegroundColor White
    Write-Host "  - TimescaleDB: localhost:5432" -ForegroundColor White
    Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
    Write-Host "  - Redis: localhost:6379" -ForegroundColor White
    Write-Host "  - MinIO: http://localhost:9000 (Console: http://localhost:9090)" -ForegroundColor White
    Write-Host "  - OpenSearch: http://localhost:9200" -ForegroundColor White
    Write-Host "  - Jaeger: http://localhost:16686" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run a service: dotnet run --project src/Services/Device.API" -ForegroundColor White
    Write-Host "  2. Access Swagger UI: http://localhost:5000/swagger" -ForegroundColor White
    Write-Host "  3. View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop infrastructure: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
