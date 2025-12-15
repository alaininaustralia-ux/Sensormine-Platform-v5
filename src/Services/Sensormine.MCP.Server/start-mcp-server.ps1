# Quick Start - MCP Server

Write-Host "🚀 Starting Sensormine MCP Server Setup..." -ForegroundColor Cyan

# 1. Check if infrastructure is running
Write-Host "`n1️⃣  Checking infrastructure..." -ForegroundColor Yellow
$redisRunning = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if (-not $redisRunning) {
    Write-Host "   ❌ Redis not running on port 6379" -ForegroundColor Red
    Write-Host "   Starting infrastructure with docker-compose..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 5
} else {
    Write-Host "   ✅ Redis is running" -ForegroundColor Green
}

# 2. Check required APIs
Write-Host "`n2️⃣  Checking required APIs..." -ForegroundColor Yellow
$requiredPorts = @{
    5293 = "Device.API"
    5079 = "Query.API"
    5297 = "DigitalTwin.API"
}

$missingApis = @()
foreach ($port in $requiredPorts.Keys) {
    $running = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "   ✅ $($requiredPorts[$port]) is running on port $port" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($requiredPorts[$port]) is NOT running on port $port" -ForegroundColor Red
        $missingApis += $requiredPorts[$port]
    }
}

if ($missingApis.Count -gt 0) {
    Write-Host "`n   ⚠️  Missing APIs detected. Please start them manually:" -ForegroundColor Yellow
    Write-Host "   cd src/Services/Device.API && dotnet run" -ForegroundColor Gray
    Write-Host "   cd src/Services/Query.API && dotnet run" -ForegroundColor Gray
    Write-Host "   cd src/Services/DigitalTwin.API && dotnet run" -ForegroundColor Gray
    Write-Host "`n   Or press Enter to continue anyway..." -ForegroundColor Yellow
    Read-Host
}

# 3. Build MCP Server
Write-Host "`n3️⃣  Building MCP Server..." -ForegroundColor Yellow
Push-Location src/Services/Sensormine.MCP.Server
dotnet build --nologo --verbosity quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# 4. Start MCP Server
Write-Host "`n4️⃣  Starting MCP Server..." -ForegroundColor Yellow
Write-Host "   Server will be available at: http://localhost:5400" -ForegroundColor Cyan
Write-Host "   Swagger UI: http://localhost:5400/swagger" -ForegroundColor Cyan
Write-Host "`n   Press Ctrl+C to stop the server`n" -ForegroundColor Gray

dotnet run --no-build

Pop-Location
