# Sensormine MCP Server

Model Context Protocol (MCP) server enabling AI agents to query and interact with Sensormine Platform data.

## Features

- **MCP Protocol Implementation**: Full JSON-RPC 2.0 support
- **Resource Providers**: Devices, Assets, Schemas, Telemetry
- **Query Tools**: Search devices, query telemetry, navigate asset hierarchy
- **Analysis Tools**: Anomaly detection, trend analysis, KPI calculations (coming soon)
- **Caching**: Redis-based caching for performance
- **Multi-tenancy**: Full tenant isolation and security
- **Resilience**: Polly-based retry policies and circuit breakers

## Quick Start

### 1. Start Infrastructure

```powershell
# Start Redis, TimescaleDB, and other dependencies
docker-compose up -d

# Start dependent APIs
cd src/Services/Device.API
dotnet run

cd src/Services/Query.API
dotnet run

cd src/Services/DigitalTwin.API
dotnet run
```

### 2. Run MCP Server

```powershell
cd src/Services/Sensormine.MCP.Server
dotnet run
```

Server starts at: http://localhost:5400

### 3. Test with Swagger

Navigate to: http://localhost:5400/swagger

## Architecture

```
┌─────────────────────────────────────────┐
│         AI Agent / LLM Client           │
└─────────────────┬───────────────────────┘
                  │ MCP Protocol
                  ▼
┌─────────────────────────────────────────┐
│      Sensormine.MCP.Server (5400)       │
│  ┌────────────────────────────────────┐ │
│  │  Resource Providers                │ │
│  │  - Device Catalog                  │ │
│  │  - Asset Hierarchy                 │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Tool Handlers                     │ │
│  │  - query_devices                   │ │
│  │  - query_telemetry                 │ │
│  │  - query_asset_hierarchy           │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
                  ▼
┌─────────────────────────────────────────┐
│         Existing Microservices          │
│  - Device.API (5293)                    │
│  - Query.API (5079)                     │
│  - DigitalTwin.API (5297)               │
└─────────────────────────────────────────┘
```

## MCP Protocol

### Resources

```http
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "resources/list",
  "params": {
    "uri": "device:///"
  }
}
```

### Tools

```http
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "query_devices",
    "arguments": {
      "tenantId": "00000000-0000-0000-0000-000000000001",
      "filters": {
        "deviceType": "TemperatureSensor",
        "status": "online"
      },
      "limit": 50
    }
  }
}
```

## Available Tools

### query_devices

Search and filter devices.

**Input:**
```json
{
  "tenantId": "uuid",
  "filters": {
    "deviceType": "string",
    "status": "online|offline|error",
    "customFields": {}
  },
  "limit": 100,
  "sortBy": "name"
}
```

### query_telemetry

Query time-series telemetry data.

**Input:**
```json
{
  "deviceIds": ["device-1", "device-2"],
  "fields": ["temperature", "humidity"],
  "startTime": "2025-12-12T00:00:00Z",
  "endTime": "2025-12-12T23:59:59Z",
  "aggregation": "avg",
  "interval": "1h"
}
```

### query_asset_hierarchy

Navigate asset relationships.

**Input:**
```json
{
  "tenantId": "uuid",
  "rootAssetId": "uuid",
  "includeDevices": true,
  "includeMetrics": false,
  "maxDepth": 10
}
```

## Configuration

### appsettings.json

```json
{
  "ServiceUrls": {
    "DeviceApi": "http://localhost:5293",
    "QueryApi": "http://localhost:5079",
    "DigitalTwinApi": "http://localhost:5297"
  },
  "Redis": {
    "ConnectionString": "localhost:6379",
    "InstanceName": "mcp:"
  },
  "Jwt": {
    "Authority": "https://localhost:5001",
    "Audience": "sensormine-api"
  }
}
```

## Authentication

### JWT Token

```http
Authorization: Bearer <jwt-token>
X-Tenant-Id: 00000000-0000-0000-0000-000000000001
```

Token must include `tenant_id` claim.

## Client Examples

### TypeScript

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  url: 'http://localhost:5400/mcp',
  auth: {
    type: 'bearer',
    token: '<jwt-token>'
  }
});

// Query devices
const result = await client.tools.call('query_devices', {
  tenantId: '00000000-0000-0000-0000-000000000001',
  filters: { status: 'online' }
});

console.log(result);
```

### Python

```python
from mcp import Client

client = Client(
    url='http://localhost:5400/mcp',
    token='<jwt-token>'
)

# Query telemetry
result = client.call_tool('query_telemetry', {
    'deviceIds': ['sensor-1'],
    'startTime': '2025-12-12T00:00:00Z',
    'endTime': '2025-12-12T23:59:59Z'
})

print(result)
```

### cURL

```bash
curl -X POST http://localhost:5400/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "query_devices",
      "arguments": {
        "tenantId": "00000000-0000-0000-0000-000000000001",
        "limit": 10
      }
    }
  }'
```

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sensormine": {
      "command": "node",
      "args": ["path/to/mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:5400/mcp",
        "JWT_TOKEN": "<your-token>",
        "TENANT_ID": "00000000-0000-0000-0000-000000000001"
      }
    }
  }
}
```

## Development

### Build

```powershell
dotnet build
```

### Run Tests

```powershell
dotnet test
```

### Run with Watch

```powershell
dotnet watch run
```

## Performance

- **Caching**: 5-minute cache for resources
- **Retry Policy**: 3 retries with exponential backoff
- **Timeout**: 30 seconds per request
- **Rate Limiting**: Configurable by tier

## Monitoring

### Metrics Endpoint

```
GET /metrics
```

### Health Check

```
GET /health
GET /health/ready
```

## Roadmap

- [x] Phase 1: Foundation (Resources, Query Tools)
- [ ] Phase 2: Analysis Tools (Anomaly Detection, Trends)
- [ ] Phase 3: Advanced Features (Predictions, Reports)
- [ ] Phase 4: Production Readiness

## Documentation

- [Design Document](../../docs/mcp-server-design.md) - Complete architecture and design
- [Service Ports](../../docs/service-ports.md) - Port assignments
- [MCP Protocol](https://modelcontextprotocol.io) - Official MCP specification

## Support

For issues or questions:
- GitHub Issues: [Sensormine Platform Issues](#)
- Documentation: `docs/mcp-server-design.md`
- Slack: #sensormine-dev

## License

Copyright © 2025 Sensormine Platform
