# Sensormine MCP Server Architecture

**Last Updated:** December 12, 2025  
**Status:** Design Document  
**Purpose:** Enable AI agents to query and interact with platform data via Model Context Protocol

---

## 🎯 Executive Summary

The Sensormine MCP Server provides a standardized interface for AI agents to access IoT data, enabling:
- Natural language queries over telemetry data
- Device and asset discovery
- Real-time data analysis and insights
- Automated anomaly detection and alerting
- Integration with AI/ML pipelines

This design supports future AI offerings including:
- AI-powered dashboards
- Predictive maintenance
- Automated optimization
- Conversational analytics
- Custom AI agent deployment

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent / LLM Client                        │
│  (Claude, GPT-4, Custom Agents, Jupyter Notebooks)             │
└────────────────────────────┬────────────────────────────────────┘
                             │ MCP Protocol (JSON-RPC 2.0)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Sensormine.MCP.Server (Port 5400)                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MCP Resource Providers                                 │   │
│  │  ├─ Device Catalog                                      │   │
│  │  ├─ Asset Hierarchy                                     │   │
│  │  ├─ Schema Registry                                     │   │
│  │  ├─ Telemetry Streams                                   │   │
│  │  └─ Dashboard Definitions                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MCP Tool Handlers                                       │   │
│  │  ├─ Query Tools (search, filter, aggregate)            │   │
│  │  ├─ Analysis Tools (anomaly, trend, prediction)        │   │
│  │  ├─ Configuration Tools (create, update, delete)       │   │
│  │  └─ Export Tools (CSV, JSON, visualization)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MCP Prompts (Pre-configured AI Workflows)              │   │
│  │  ├─ "Analyze device performance"                        │   │
│  │  ├─ "Detect anomalies in telemetry"                     │   │
│  │  ├─ "Generate maintenance report"                       │   │
│  │  └─ "Optimize asset utilization"                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Internal HTTP/gRPC
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Existing Microservices                        │
│  ├─ Device.API (5293)         - Device management              │
│  ├─ Query.API (5079)          - Telemetry queries              │
│  ├─ DigitalTwin.API (5297)    - Asset hierarchy                │
│  ├─ Dashboard.API (5299)      - Dashboard config               │
│  ├─ SchemaRegistry.API (5021) - Schema management              │
│  ├─ Alerts.API (5295)         - Alert rules                    │
│  └─ Identity.API (5XXX)       - User/tenant management         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 MCP Resources

Resources are read-only data sources that AI agents can access.

### 1. Device Catalog
**URI Pattern:** `device:///<tenant-id>/<device-id>`

**Resources:**
- `device:///list` - All devices (paginated)
- `device:///<tenant-id>/search?type=<type>&location=<location>` - Filtered devices
- `device:///<tenant-id>/<device-id>` - Single device with metadata
- `device:///<tenant-id>/<device-id>/schema` - Device schema definition
- `device:///<tenant-id>/<device-id>/telemetry/latest` - Latest telemetry snapshot

**Example Response:**
```json
{
  "uri": "device:///00000000-0000-0000-0000-000000000001/abc-123",
  "mimeType": "application/json",
  "text": {
    "id": "abc-123",
    "name": "Temperature Sensor #42",
    "deviceType": "TemperatureSensor",
    "location": {"lat": 45.5017, "lng": -73.5673},
    "lastSeen": "2025-12-12T10:30:00Z",
    "status": "online",
    "telemetry": {
      "temperature": 22.5,
      "humidity": 65.0,
      "pressure": 1013.25
    }
  }
}
```

### 2. Asset Hierarchy
**URI Pattern:** `asset:///<tenant-id>/<asset-id>`

**Resources:**
- `asset:///roots` - Root-level assets
- `asset:///<tenant-id>/tree` - Full hierarchy tree
- `asset:///<tenant-id>/<asset-id>` - Single asset
- `asset:///<tenant-id>/<asset-id>/devices` - Devices in asset
- `asset:///<tenant-id>/<asset-id>/metrics` - Aggregated metrics

**Example Response:**
```json
{
  "uri": "asset:///00000000-0000-0000-0000-000000000001/factory-1",
  "mimeType": "application/json",
  "text": {
    "id": "factory-1",
    "name": "Factory Building 1",
    "type": "Facility",
    "children": [
      {"id": "floor-1", "name": "Floor 1", "deviceCount": 25},
      {"id": "floor-2", "name": "Floor 2", "deviceCount": 30}
    ],
    "totalDevices": 55,
    "metrics": {
      "avgTemperature": 23.1,
      "powerConsumption": 1250.5
    }
  }
}
```

### 3. Schema Registry
**URI Pattern:** `schema:///<schema-id>`

**Resources:**
- `schema:///list` - All schemas
- `schema:///<schema-id>` - Schema definition
- `schema:///<schema-id>/versions` - Schema version history
- `schema:///<schema-id>/devices` - Devices using this schema

### 4. Telemetry Streams
**URI Pattern:** `telemetry:///<device-id>/<time-range>`

**Resources:**
- `telemetry:///<device-id>/latest` - Latest reading
- `telemetry:///<device-id>/history?start=<start>&end=<end>` - Time range
- `telemetry:///<device-id>/aggregated?interval=1h` - Aggregated data
- `telemetry:///<device-id>/anomalies` - Detected anomalies

### 5. Dashboard Definitions
**URI Pattern:** `dashboard:///<dashboard-id>`

**Resources:**
- `dashboard:///list` - All dashboards
- `dashboard:///<dashboard-id>` - Dashboard configuration
- `dashboard:///<dashboard-id>/data` - Live dashboard data

---

## 🔧 MCP Tools

Tools allow AI agents to perform actions and computations.

### Query Tools

#### `query_devices`
Search and filter devices based on criteria.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "tenantId": {"type": "string", "format": "uuid"},
    "filters": {
      "type": "object",
      "properties": {
        "deviceType": {"type": "string"},
        "location": {"type": "object"},
        "status": {"type": "string", "enum": ["online", "offline", "error"]},
        "customFields": {"type": "object"}
      }
    },
    "limit": {"type": "integer", "default": 100},
    "sortBy": {"type": "string", "default": "name"}
  },
  "required": ["tenantId"]
}
```

**Example:**
```json
{
  "tenantId": "00000000-0000-0000-0000-000000000001",
  "filters": {
    "deviceType": "TemperatureSensor",
    "status": "online"
  },
  "limit": 50
}
```

#### `query_telemetry`
Query time-series telemetry data with aggregations.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "deviceIds": {"type": "array", "items": {"type": "string"}},
    "fields": {"type": "array", "items": {"type": "string"}},
    "startTime": {"type": "string", "format": "date-time"},
    "endTime": {"type": "string", "format": "date-time"},
    "aggregation": {
      "type": "string",
      "enum": ["raw", "avg", "min", "max", "sum", "count"]
    },
    "interval": {"type": "string", "pattern": "^\\d+[smhd]$"}
  },
  "required": ["deviceIds", "startTime", "endTime"]
}
```

**Example:**
```json
{
  "deviceIds": ["sensor-1", "sensor-2"],
  "fields": ["temperature", "humidity"],
  "startTime": "2025-12-12T00:00:00Z",
  "endTime": "2025-12-12T23:59:59Z",
  "aggregation": "avg",
  "interval": "1h"
}
```

#### `query_asset_hierarchy`
Navigate and query asset relationships.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "tenantId": {"type": "string", "format": "uuid"},
    "rootAssetId": {"type": "string", "format": "uuid"},
    "includeDevices": {"type": "boolean", "default": true},
    "includeMetrics": {"type": "boolean", "default": false},
    "maxDepth": {"type": "integer", "default": 10}
  },
  "required": ["tenantId"]
}
```

### Analysis Tools

#### `detect_anomalies`
Identify anomalies in telemetry data using statistical methods or ML models.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "deviceId": {"type": "string"},
    "field": {"type": "string"},
    "startTime": {"type": "string", "format": "date-time"},
    "endTime": {"type": "string", "format": "date-time"},
    "method": {
      "type": "string",
      "enum": ["z-score", "iqr", "isolation-forest", "lstm"],
      "default": "z-score"
    },
    "threshold": {"type": "number", "default": 3.0}
  },
  "required": ["deviceId", "field", "startTime", "endTime"]
}
```

**Output:**
```json
{
  "anomalies": [
    {
      "timestamp": "2025-12-12T15:30:00Z",
      "value": 95.2,
      "expectedRange": [20.0, 30.0],
      "score": 4.5,
      "severity": "high"
    }
  ],
  "summary": {
    "totalPoints": 1440,
    "anomalyCount": 3,
    "anomalyPercentage": 0.21
  }
}
```

#### `analyze_trends`
Analyze trends and patterns in time-series data.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "deviceIds": {"type": "array", "items": {"type": "string"}},
    "field": {"type": "string"},
    "startTime": {"type": "string", "format": "date-time"},
    "endTime": {"type": "string", "format": "date-time"},
    "analysis": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["trend", "seasonality", "correlation", "forecast"]
      }
    }
  },
  "required": ["deviceIds", "field", "startTime", "endTime"]
}
```

#### `predict_values`
Forecast future values using ML models.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "deviceId": {"type": "string"},
    "field": {"type": "string"},
    "historicalData": {
      "startTime": {"type": "string", "format": "date-time"},
      "endTime": {"type": "string", "format": "date-time"}
    },
    "forecastHorizon": {"type": "string", "pattern": "^\\d+[hd]$"},
    "model": {
      "type": "string",
      "enum": ["arima", "prophet", "lstm"],
      "default": "arima"
    }
  },
  "required": ["deviceId", "field", "historicalData", "forecastHorizon"]
}
```

#### `calculate_kpis`
Calculate key performance indicators across devices or assets.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "object",
      "properties": {
        "type": {"type": "string", "enum": ["device", "asset", "tenant"]},
        "id": {"type": "string"}
      }
    },
    "kpis": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "uptime",
          "availability",
          "mtbf",
          "mttr",
          "efficiency",
          "utilization",
          "energy-consumption"
        ]
      }
    },
    "timeRange": {
      "startTime": {"type": "string", "format": "date-time"},
      "endTime": {"type": "string", "format": "date-time"}
    }
  },
  "required": ["scope", "kpis", "timeRange"]
}
```

### Configuration Tools

#### `create_alert_rule`
Create automated alert rules based on AI-detected patterns.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "description": {"type": "string"},
    "condition": {"type": "string"},
    "deviceTypeId": {"type": "string", "format": "uuid"},
    "severity": {
      "type": "string",
      "enum": ["info", "warning", "error", "critical"]
    },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string", "enum": ["email", "sms", "webhook"]},
          "config": {"type": "object"}
        }
      }
    }
  },
  "required": ["name", "condition", "severity"]
}
```

#### `update_device_metadata`
Update device metadata based on AI insights.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "deviceId": {"type": "string"},
    "updates": {
      "type": "object",
      "properties": {
        "customFields": {"type": "object"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "location": {"type": "object"}
      }
    }
  },
  "required": ["deviceId", "updates"]
}
```

### Export Tools

#### `export_data`
Export data in various formats for external analysis.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {"type": "object"},
    "format": {
      "type": "string",
      "enum": ["csv", "json", "parquet", "excel"]
    },
    "destination": {
      "type": "string",
      "enum": ["download", "s3", "email"]
    }
  },
  "required": ["query", "format"]
}
```

#### `generate_report`
Generate formatted reports from queries and analysis.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "title": {"type": "string"},
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["summary", "chart", "table", "text", "recommendation"]
          },
          "data": {"type": "object"}
        }
      }
    },
    "format": {"type": "string", "enum": ["pdf", "html", "markdown"]}
  },
  "required": ["title", "sections"]
}
```

---

## 💬 MCP Prompts

Pre-configured workflows that guide AI agents through common tasks.

### Prompt: `analyze_device_performance`
**Description:** Comprehensive analysis of device health and performance

**Template:**
```
Analyze the performance of device {deviceId} over the past {duration}.

Steps:
1. Retrieve device metadata and schema
2. Query telemetry data for the specified period
3. Calculate uptime, availability, and error rate
4. Detect anomalies in key metrics
5. Compare performance to historical baseline
6. Identify potential issues and root causes
7. Generate actionable recommendations

Output:
- Performance score (0-100)
- Key findings
- Anomalies detected
- Recommendations for optimization
```

### Prompt: `detect_fleet_anomalies`
**Description:** Identify unusual patterns across multiple devices

**Template:**
```
Detect anomalies across all devices of type {deviceType} in asset {assetId}.

Steps:
1. List all devices matching criteria
2. Query telemetry for last {duration}
3. Apply statistical anomaly detection
4. Cluster similar anomalies
5. Rank by severity and impact
6. Generate alert recommendations

Output:
- Total devices analyzed
- Anomalies detected (grouped by pattern)
- Suggested alert rules
- Devices requiring immediate attention
```

### Prompt: `optimize_asset_operations`
**Description:** Recommend operational improvements for assets

**Template:**
```
Analyze asset {assetId} and recommend operational optimizations.

Steps:
1. Retrieve asset hierarchy and all devices
2. Calculate utilization and efficiency metrics
3. Identify underutilized or overloaded resources
4. Analyze energy consumption patterns
5. Compare to industry benchmarks
6. Generate optimization recommendations

Output:
- Current performance metrics
- Optimization opportunities
- Expected improvements
- Implementation priority
```

### Prompt: `generate_maintenance_report`
**Description:** Create predictive maintenance report

**Template:**
```
Generate a predictive maintenance report for devices in {scope}.

Steps:
1. Query device telemetry and maintenance history
2. Calculate MTBF and MTTR
3. Predict next failure using ML models
4. Identify devices needing preventive maintenance
5. Estimate maintenance costs and downtime
6. Prioritize maintenance schedule

Output:
- Devices requiring maintenance (prioritized)
- Predicted failure dates
- Maintenance cost estimates
- Recommended maintenance windows
```

---

## 🔐 Security & Authorization

### Multi-Tenancy
- All MCP requests include tenant context
- Resources filtered by tenant ID
- Row-level security enforced at database level

### Authentication
**JWT Token-Based:**
```http
Authorization: Bearer <jwt-token>
X-Tenant-Id: <tenant-uuid>
```

**API Key (for service accounts):**
```http
X-API-Key: <api-key>
X-Tenant-Id: <tenant-uuid>
```

### Authorization
**Role-Based Access Control:**
- `ai:read` - Query data and resources
- `ai:analyze` - Run analysis tools
- `ai:configure` - Create/update configurations
- `ai:admin` - Full access including exports

**Rate Limiting:**
- Free tier: 100 requests/hour
- Pro tier: 1,000 requests/hour
- Enterprise: Unlimited

---

## 📈 Scalability & Performance

### Caching Strategy
- **Redis:** Cache frequent queries (device lists, schemas)
- **TTL:** 5 minutes for dynamic data, 1 hour for static data
- **Invalidation:** Event-driven cache invalidation on updates

### Query Optimization
- **Continuous Aggregates:** Pre-computed hourly/daily rollups
- **Pagination:** All list endpoints support cursor-based pagination
- **Streaming:** Large datasets streamed via Server-Sent Events
- **Parallel Queries:** Concurrent requests to multiple services

### Resource Limits
- Max query time range: 90 days
- Max devices per query: 1,000
- Max data points returned: 100,000
- Timeout: 30 seconds per request

---

## 🧪 Testing Strategy

### Unit Tests
- Tool handler logic
- Resource provider logic
- Schema validation
- Error handling

### Integration Tests
- End-to-end MCP protocol flows
- Multi-service queries
- Authentication/authorization
- Rate limiting

### AI Agent Tests
- Claude Sonnet integration
- GPT-4 integration
- Custom agent frameworks
- Prompt effectiveness

---

## 📊 Monitoring & Observability

### Metrics
```
sensormine_mcp_requests_total{tool, status}
sensormine_mcp_request_duration_seconds{tool, percentile}
sensormine_mcp_resources_accessed{resource_type}
sensormine_mcp_cache_hit_rate{cache_type}
sensormine_mcp_errors_total{error_type}
```

### Logging
```json
{
  "timestamp": "2025-12-12T10:30:00Z",
  "level": "info",
  "component": "mcp-server",
  "tool": "query_devices",
  "tenantId": "00000000-0000-0000-0000-000000000001",
  "userId": "user-123",
  "duration": 250,
  "status": "success"
}
```

### Tracing
- OpenTelemetry integration
- Trace MCP request → Service calls
- Distributed trace IDs

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (2 weeks)
- [ ] MCP server project setup (.NET 8)
- [ ] Basic resource providers (devices, assets)
- [ ] Core query tools
- [ ] Authentication & authorization
- [ ] Docker containerization

### Phase 2: Analysis Tools (3 weeks)
- [ ] Anomaly detection tool
- [ ] Trend analysis tool
- [ ] KPI calculation tool
- [ ] ML model integration
- [ ] Caching layer

### Phase 3: Advanced Features (3 weeks)
- [ ] Predictive tools
- [ ] Configuration tools
- [ ] Export tools
- [ ] Pre-configured prompts
- [ ] Report generation

### Phase 4: Production Readiness (2 weeks)
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Rate limiting & quotas
- [ ] Monitoring & alerting

---

## 🔮 Future AI Offerings

### 1. Conversational Analytics
**AI Assistant:** Natural language interface for data exploration
```
User: "Show me temperature trends in Building 1 last week"
AI: [Queries data, generates visualization, explains findings]
```

### 2. Autonomous Optimization
**AI Agent:** Continuously monitors and optimizes operations
- Auto-tune device configurations
- Balance workloads
- Optimize energy consumption
- Predict and prevent failures

### 3. Predictive Maintenance
**ML Models:** Failure prediction and maintenance scheduling
- RUL (Remaining Useful Life) prediction
- Anomaly-based early warning
- Cost-optimized maintenance planning

### 4. Custom AI Agents
**Agent Marketplace:** Deploy specialized AI agents
- Quality control inspector
- Energy efficiency optimizer
- Security threat detector
- Compliance auditor

### 5. AI-Powered Dashboards
**Dynamic Dashboards:** Auto-generated insights
- AI-recommended widgets
- Anomaly highlights
- Predictive KPIs
- Natural language explanations

### 6. Federated Learning
**Distributed ML:** Learn from tenant data without centralization
- Privacy-preserving model training
- Cross-tenant insights (anonymized)
- Industry benchmarks

---

## 📚 Technology Stack

### MCP Server
- **Framework:** ASP.NET Core 8.0
- **Protocol:** JSON-RPC 2.0 over HTTP/WebSocket
- **Serialization:** System.Text.Json
- **Validation:** FluentValidation

### AI/ML Integration
- **Python Runtime:** Python.NET or gRPC
- **ML Framework:** scikit-learn, TensorFlow, PyTorch
- **Model Serving:** MLflow, TensorFlow Serving
- **Vector DB:** Qdrant (for semantic search)

### Infrastructure
- **Container:** Docker
- **Orchestration:** Kubernetes
- **Service Mesh:** Istio (optional)
- **Caching:** Redis
- **Message Queue:** Kafka (for async AI jobs)

---

## 📖 API Documentation

### MCP Protocol Endpoint
```
HTTP/WebSocket: http://localhost:5400/mcp
```

### OpenAPI Specification
```
http://localhost:5400/swagger
```

### Example Client (TypeScript)
```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  url: 'http://localhost:5400/mcp',
  auth: {
    type: 'bearer',
    token: '<jwt-token>'
  }
});

// List resources
const devices = await client.resources.list('device:///list');

// Call tool
const result = await client.tools.call('query_telemetry', {
  deviceIds: ['sensor-1'],
  startTime: '2025-12-12T00:00:00Z',
  endTime: '2025-12-12T23:59:59Z'
});
```

### Example Client (Python)
```python
from mcp import Client

client = Client(
    url='http://localhost:5400/mcp',
    token='<jwt-token>'
)

# Query devices
devices = client.call_tool('query_devices', {
    'tenantId': '00000000-0000-0000-0000-000000000001',
    'filters': {'deviceType': 'TemperatureSensor'}
})

# Detect anomalies
anomalies = client.call_tool('detect_anomalies', {
    'deviceId': 'sensor-1',
    'field': 'temperature',
    'startTime': '2025-12-12T00:00:00Z',
    'endTime': '2025-12-12T23:59:59Z'
})
```

---

## 🤝 Integration Examples

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "sensormine": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "JWT_TOKEN=<token>",
        "sensormine-mcp-server:latest"
      ]
    }
  }
}
```

### Jupyter Notebook Integration
```python
%load_ext sensormine_mcp

%%sensormine_query
Query temperature data from all sensors in Building 1 
for the past 24 hours and show trends
```

### Custom Agent Framework
```python
from langchain.tools import Tool
from sensormine_mcp import SensormineMCP

mcp = SensormineMCP(url='http://localhost:5400/mcp', token='<token>')

tools = [
    Tool(
        name="Query Devices",
        func=mcp.query_devices,
        description="Search for devices by filters"
    ),
    Tool(
        name="Detect Anomalies",
        func=mcp.detect_anomalies,
        description="Find anomalies in telemetry data"
    )
]

agent = initialize_agent(tools, llm, agent="zero-shot-react-description")
```

---

## 📋 Success Metrics

### Technical Metrics
- **Response Time:** P95 < 500ms
- **Availability:** 99.9% uptime
- **Cache Hit Rate:** > 80%
- **Query Success Rate:** > 99%

### Business Metrics
- **AI Queries per Day:** Track adoption
- **Time to Insight:** Measure efficiency gains
- **AI-Detected Issues:** Validate accuracy
- **User Satisfaction:** NPS score

### Cost Metrics
- **Compute Cost per Query:** Optimize efficiency
- **Storage Cost:** Monitor data growth
- **API Call Costs:** Track external services

---

## 🔗 Related Documentation

- **[APPLICATION.md](./APPLICATION.md)** - Microservices architecture
- **[DATABASE.md](./DATABASE.md)** - Database schema
- **[service-ports.md](./service-ports.md)** - Service port mapping
- **Model Context Protocol:** https://modelcontextprotocol.io

---

**Next Steps:**
1. Review and approve design
2. Create project structure: `src/Services/Sensormine.MCP.Server`
3. Implement Phase 1 (Foundation)
4. Deploy to staging environment
5. Integrate with Claude Desktop for testing

---

**Last Review:** December 12, 2025  
**Reviewed By:** AI Architecture Team  
**Status:** Awaiting Approval
