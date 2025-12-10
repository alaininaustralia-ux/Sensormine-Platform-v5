# Local Development Environment

**Last Updated:** December 10, 2025  
**Prerequisites:** Docker Desktop, .NET 8 SDK, Node.js 18+, PowerShell 7+

---

## ⚡ Quick Start (5 Minutes)

```powershell
# 1. Clone repository
git clone https://github.com/alaininaustralia-ux/Sensormine-Platform-v5.git
cd Sensormine-Platform-v5

# 2. Start infrastructure
docker-compose up -d

# 3. Verify infrastructure
docker ps  # Should show 6 containers running

# 4. Build backend
dotnet restore Sensormine.sln
dotnet build Sensormine.sln

# 5. Run Device.API
cd src/Services/Device.API
dotnet run

# 6. Run frontend (new terminal)
cd src/Web/sensormine-web
npm install
npm run dev

# 7. Access application
# Frontend: http://localhost:3020
# Device.API: http://localhost:5293/swagger
```

---

## 🔧 Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Docker Desktop** | 4.25+ | https://www.docker.com/products/docker-desktop |
| **.NET SDK** | 8.0+ | https://dotnet.microsoft.com/download |
| **Node.js** | 18.x LTS | https://nodejs.org/ |
| **PowerShell** | 7.0+ | https://github.com/PowerShell/PowerShell |
| **Git** | 2.40+ | https://git-scm.com/ |
| **Visual Studio Code** | Latest | https://code.visualstudio.com/ |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "humao.rest-client",
    "github.copilot"
  ]
}
```

### System Requirements

**Minimum:**
- CPU: 4 cores
- RAM: 16 GB
- Disk: 50 GB free space

**Recommended:**
- CPU: 8 cores
- RAM: 32 GB
- Disk: 100 GB SSD

---

## 🐳 Infrastructure Setup

### 1. Start Docker Containers

```powershell
# Navigate to project root
cd C:\Users\<YourUsername>\code\Orion

# Start all infrastructure services
docker-compose up -d

# Verify all containers are running
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                         STATUS        PORTS
abc123...      sensormine-timescaledb        Up 2 minutes  0.0.0.0:5452->5432/tcp
def456...      eclipse-mosquitto:2.0         Up 2 minutes  0.0.0.0:1883->1883/tcp
ghi789...      confluentinc/cp-kafka:7.5.0   Up 2 minutes  0.0.0.0:9092->9092/tcp
jkl012...      redis:7-alpine                Up 2 minutes  0.0.0.0:6379->6379/tcp
mno345...      minio/minio:latest            Up 2 minutes  0.0.0.0:9000->9000/tcp
```

### 2. Verify Database

```powershell
# Check TimescaleDB is accepting connections
docker exec sensormine-timescaledb psql -U sensormine -d postgres -c "\l"

# Expected output: Should list sensormine_metadata and sensormine_timeseries
```

### 3. Check Container Logs

```powershell
# View logs for specific container
docker logs sensormine-timescaledb --tail 50

# Follow logs in real-time
docker logs -f sensormine-kafka
```

### 4. Stop Infrastructure

```powershell
# Stop all containers (data persists)
docker-compose down

# Stop and remove all data (WARNING: Deletes volumes)
docker-compose down -v
```

---

## 🔨 Backend Development

### Build Entire Solution

```powershell
# Restore NuGet packages
dotnet restore Sensormine.sln

# Build all projects
dotnet build Sensormine.sln

# Run all tests
dotnet test Sensormine.sln

# Clean build artifacts
dotnet clean Sensormine.sln
```

### Run Individual Service

```powershell
# Navigate to service directory
cd src/Services/Device.API

# Run service
dotnet run

# Run with watch (hot reload)
dotnet watch run

# Run with specific profile
dotnet run --launch-profile "Device.API"
```

### Using VS Code Tasks

Press `Ctrl+Shift+B` (Build) or `F5` (Debug)

**Available Tasks:**
- `build` - Build entire solution
- `build-device-api` - Build Device.API
- `build-query-api` - Build Query.API
- `test-all` - Run all tests
- `start-infrastructure` - docker-compose up -d
- `stop-infrastructure` - docker-compose down

### Debug Configuration

**launch.json** (already configured):
```json
{
  "configurations": [
    {
      "name": "Device.API",
      "type": "coreclr",
      "request": "launch",
      "program": "${workspaceFolder}/src/Services/Device.API/bin/Debug/net8.0/Device.API.dll",
      "cwd": "${workspaceFolder}/src/Services/Device.API",
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  ]
}
```

**Set Breakpoints:**
1. Open source file (e.g., `DeviceController.cs`)
2. Click left margin to set breakpoint (red dot)
3. Press `F5` to start debugging
4. Make API request to trigger breakpoint

---

## 🎨 Frontend Development

### Setup Frontend

```powershell
# Navigate to frontend directory
cd src/Web/sensormine-web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npx vitest
```

### Access Frontend

**Development Server:** http://localhost:3020  
**API Proxy:** Configured in `next.config.js`

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // API Gateway
      },
    ];
  },
};
```

### Hot Module Replacement

Code changes automatically reload in browser:
- React components: Preserves state
- CSS changes: Instant update
- Configuration changes: Requires restart

---

## 🧪 Testing

### Backend Tests

```powershell
# Run all tests
dotnet test Sensormine.sln

# Run specific test project
dotnet test tests/Device.API.Tests/Device.API.Tests.csproj

# Run with coverage
dotnet test /p:CollectCoverage=true /p:CoverageDirectory=./coverage

# Run specific test
dotnet test --filter "FullyQualifiedName=Device.API.Tests.DeviceControllerTests.GetDevice_ReturnsDevice"
```

### Frontend Tests

```powershell
cd src/Web/sensormine-web

# Run tests once
npx vitest run

# Run tests in watch mode
npx vitest

# Run with coverage
npx vitest --coverage
```

### Integration Tests

```powershell
# Start test infrastructure
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
dotnet test tests/Integration.Tests/Integration.Tests.csproj

# Stop test infrastructure
docker-compose -f docker-compose.test.yml down -v
```

---

## 🔍 API Testing

### Using Swagger UI

**Access Swagger:**
- Device.API: http://localhost:5293/swagger
- Query.API: http://localhost:5079/swagger
- Dashboard.API: http://localhost:5299/swagger

**Make Request:**
1. Click endpoint (e.g., `GET /api/devices`)
2. Click "Try it out"
3. Fill parameters
4. Click "Execute"
5. View response

### Using REST Client (VS Code Extension)

**Create `api-tests.http`:**
```http
### Get all devices
GET http://localhost:5293/api/devices
X-Tenant-Id: 00000000-0000-0000-0000-000000000001

### Create device
POST http://localhost:5293/api/devices
Content-Type: application/json
X-Tenant-Id: 00000000-0000-0000-0000-000000000001

{
  "name": "Test Device",
  "deviceTypeId": "{{deviceTypeId}}",
  "serialNumber": "SN12345"
}

### Get device by ID
GET http://localhost:5293/api/devices/{{deviceId}}
X-Tenant-Id: 00000000-0000-0000-0000-000000000001
```

**Run Request:**
1. Click "Send Request" above request
2. View response in split panel

### Using PowerShell

```powershell
# Set base URL
$baseUrl = "http://localhost:5293"
$tenantId = "00000000-0000-0000-0000-000000000001"

# Get devices
$devices = Invoke-RestMethod -Uri "$baseUrl/api/devices" `
    -Method GET `
    -Headers @{"X-Tenant-Id" = $tenantId}

# Create device
$body = @{
    name = "Test Device"
    deviceTypeId = "uuid"
    serialNumber = "SN12345"
} | ConvertTo-Json

$device = Invoke-RestMethod -Uri "$baseUrl/api/devices" `
    -Method POST `
    -Headers @{"X-Tenant-Id" = $tenantId; "Content-Type" = "application/json"} `
    -Body $body
```

---

## 📊 Database Management

### Access Database

```powershell
# Connect to metadata database
docker exec -it sensormine-timescaledb psql -U sensormine -d sensormine_metadata

# Connect to timeseries database
docker exec -it sensormine-timescaledb psql -U sensormine -d sensormine_timeseries
```

### Common SQL Queries

```sql
-- List all tables
\dt

-- Describe table
\d devices

-- Count devices
SELECT COUNT(*) FROM devices;

-- View recent telemetry
SELECT * FROM telemetry 
WHERE time > NOW() - INTERVAL '1 hour' 
ORDER BY time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname, 
    tablename, 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Run Migrations

```powershell
# EF Core migrations
cd src/Services/Device.API
dotnet ef database update

# Manual SQL migration
docker exec -i sensormine-timescaledb psql -U sensormine -d sensormine_metadata < infrastructure/migrations/20251210_add_field_mappings.sql
```

### Seed Data

```powershell
# Run seed script
cd demo-data
.\Generate-DemoDevices.ps1

# Import SQL data
docker exec -i sensormine-timescaledb psql -U sensormine -d sensormine_metadata < demo-data/seed.sql
```

---

## 🎮 Device Simulator

### Start Simulator

```powershell
cd src/Web/device-simulator

# Install dependencies
npm install

# Run on port 3021
npm run dev -- -p 3021
```

**Access:** http://localhost:3021

### Simulate Telemetry

1. **Create Device:**
   - Click "Quick Add Device"
   - Select sensor types (temperature, humidity, etc.)
   - Click "Add Device"

2. **Start Simulation:**
   - Click "Start" on device card
   - Telemetry sent every N seconds (configurable)

3. **View Logs:**
   - Click "Logs" tab
   - Filter by protocol, device
   - Export to CSV

### Supported Protocols

- **MQTT:** Publish to mqtt://localhost:1883
- **HTTP:** POST to http://localhost:5022/api/telemetry
- **WebSocket:** Connect to ws://localhost:5022/ws
- **Modbus TCP:** Simulate register reads
- **OPC UA:** Simulate node data changes

---

## 🔧 Troubleshooting

### Port Conflicts

**Problem:** Port already in use  
**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :5293

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Failed

**Problem:** Can't connect to database  
**Solution:**
```powershell
# Verify container is running
docker ps | findstr timescaledb

# Check logs
docker logs sensormine-timescaledb --tail 50

# Restart container
docker restart sensormine-timescaledb

# Test connection
Test-NetConnection -ComputerName localhost -Port 5452
```

### NuGet Restore Failed

**Problem:** Package restore errors  
**Solution:**
```powershell
# Clear NuGet cache
dotnet nuget locals all --clear

# Restore again
dotnet restore Sensormine.sln
```

### npm Install Failed

**Problem:** npm dependency issues  
**Solution:**
```powershell
# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules, package-lock.json

# Clear npm cache
npm cache clean --force

# Install again
npm install
```

### Docker Out of Disk Space

**Problem:** Docker volume full  
**Solution:**
```powershell
# Remove unused containers/images
docker system prune -a

# Remove volumes (WARNING: Deletes data)
docker volume prune
```

---

## 📚 Related Documentation

- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Infrastructure details
- **[DATABASE.md](./DATABASE.md)** - Database architecture
- **[APPLICATION.md](./APPLICATION.md)** - Application architecture
- **[DATABASE-QUICK-REFERENCE.md](./DATABASE-QUICK-REFERENCE.md)** - Database connection strings

---

## 🆘 Getting Help

**Documentation:** `docs/` folder  
**Issues:** GitHub Issues  
**Team Chat:** Slack #sensormine-dev  
**Code Review:** Pull Requests

---

**Last Review:** December 10, 2025  
**Next Review:** January 10, 2026  
**Owner:** Platform Team
