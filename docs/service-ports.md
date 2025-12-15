# Service Port Assignments

This document lists all service ports for the Sensormine Platform v5.

## Backend Services

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **ApiGateway** | 5000 | HTTP | Main API Gateway, entry point for all client requests |
| **Device.API** | 5293 | HTTP | Device management and registration |
| **SchemaRegistry.API** | 5021 | HTTP | Schema definition and validation |
| **DigitalTwin.API** | 5297 | HTTP | Digital twin and asset hierarchy management |
| **Query.API** | 5079 | HTTP | Time-series data queries |
| **Ingestion.Service** | 5022 | HTTP | Data ingestion pipeline |
| **Alerts.API** | 5295 | HTTP | Alert rules and notifications |
| **Edge.Gateway** | 5187 | HTTP/MQTT | Edge device connectivity and MQTT broker |
| **StreamProcessing.Service** | 5138 | HTTP | Real-time stream processing |
| **VideoMetadata.API** | 5298 | HTTP | Video analytics configuration and metadata |
| **Billing.API** | 5236 | HTTP | Billing, metering, and Stripe integration |
| **Identity.API** | 5298 | HTTP | Authentication and authorization |
| **Preferences.API** | 5296 | HTTP | User preferences management |
| **NexusConfiguration.API** | 5179 | HTTP | Nexus configuration builder (Direct access - not through API Gateway) |
| **Simulation.API** | 5200 | HTTP | Device simulation for testing |
| **Dashboard.API** | 5299 | HTTP | Dashboard configuration and management |
| **Template.API** | 5320 | HTTP | Template export/import for dashboards, alerts, device types, schemas, nexus configs |
| **AI.API** | 5401 | HTTP | AI Agent service with Claude integration (routes through API Gateway) |
| **Sensormine.MCP.Server** | 5400 | HTTP | Model Context Protocol server for AI agent integration |

## Frontend Applications

| Application | Port | Description |
|-------------|------|-------------|
| **sensormine-web** | 3020 | Main web application (Next.js) |
| **device-simulator** | 3021 | Device simulator web UI |

## Infrastructure Services

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **TimescaleDB/PostgreSQL** | 5432 | PostgreSQL | Time-series and metadata database |
| **MQTT Broker (Mosquitto)** | 1883 | MQTT | MQTT message broker for device connectivity |
| **Kafka** | 9092 | Kafka | Message streaming platform |
| **Redis** | 6379 | Redis | Caching and session storage |

## Tenant IDs

Different services use different tenant ID formats:

- **Device.API**: `00000000-0000-0000-0000-000000000001` (UUID format)
- **SchemaRegistry.API**: `default-tenant` (string format)
- **DigitalTwin.API**: `test-tenant-001` (string format)

## Quick Reference Commands

### Check if a service is running
```powershell
# Check specific port
Get-NetTCPConnection -LocalPort 5021 -ErrorAction SilentlyContinue

# Check all service ports
5000,5293,5021,5297,5079,5022,5295,5187,5138,5023,5236,5298,5296,5179,5200,5299,5401,5400 | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "Port $_`: $($process.ProcessName)" -ForegroundColor Green
    }
}
```

### Start a service
```powershell
# Example: Start Device API
cd src/Services/Device.API
dotnet run

# Example: Start Schema Registry API
cd src/Services/SchemaRegistry.API
dotnet run
```

### Kill a process on a specific port
```powershell
# Example: Kill process on port 5021
$conn = Get-NetTCPConnection -LocalPort 5021 -ErrorAction SilentlyContinue
if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force
}
```

## Docker Compose Services

When running `docker-compose up -d`, the following ports are exposed:

- PostgreSQL/TimescaleDB: **5432** → 5432
- MQTT (Mosquitto): **1883** → 1883
- Kafka: **9092** → 9092
- Redis: **6379** → 6379

## Notes

- All HTTP services support both HTTP and HTTPS (HTTPS ports are typically HTTP port + 2000)
- HTTPS ports are configured in `launchSettings.json` but typically not used in development
- Frontend applications use webpack dev server with hot reload
- Infrastructure services run in Docker containers via `docker-compose.yml`
