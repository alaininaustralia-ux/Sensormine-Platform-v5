# Application Architecture

**Last Updated:** December 10, 2025  
**Status:** Production-Ready  
**Architecture Pattern:** Microservices with Event-Driven Communication

---

## 🎯 Overview

The Sensormine Platform follows a microservices architecture with clear separation of concerns, event-driven communication, and API-first design principles.

---

## 🏗️ Architectural Principles

### 1. Microservices Architecture
- **Independence:** Each service can be developed, deployed, and scaled independently
- **Bounded Context:** Services own their domain logic and data models
- **Loose Coupling:** Services communicate via well-defined APIs and events
- **Technology Diversity:** Services can use different tech stacks (currently standardized on .NET 8)

### 2. Event-Driven Design
- **Asynchronous Communication:** Services publish/subscribe to events via Kafka
- **Event Sourcing:** State changes captured as immutable events
- **CQRS:** Separate read and write models for optimal performance
- **Eventual Consistency:** Services sync state through event propagation

### 3. API-First Approach
- **OpenAPI Specification:** All APIs documented with Swagger/OpenAPI
- **Versioning:** API versions in URL path (`/api/v1/devices`)
- **RESTful Design:** Standard HTTP methods and status codes
- **Consistent Response Format:** Standardized success/error responses

### 4. Schema-Driven System
- **Centralized Registry:** SchemaRegistry.API manages all data schemas
- **Validation:** Data validated against schemas at ingestion
- **Evolution:** Schema versioning supports backward compatibility
- **Discovery:** Services query registry for latest schemas

### 5. Cloud-Agnostic
- **No Vendor Lock-in:** Uses standard protocols and open-source tools
- **Portable:** Deploy on AWS, Azure, GCP, or on-premises
- **Configuration:** Environment-based config (appsettings.json + env vars)

---

## 🏢 Service Catalog

### API Gateway
**Port:** 5000  
**Purpose:** Single entry point for all client requests  
**Technology:** ASP.NET Core + Yarp (Reverse Proxy)

**Responsibilities:**
- Request routing to backend services
- Authentication & authorization (JWT validation)
- Rate limiting
- Request/response transformation
- API aggregation

**Endpoints:**
- `/api/devices/*` → Device.API
- `/api/schemas/*` → SchemaRegistry.API
- `/api/query/*` → Query.API
- `/api/assets/*` → DigitalTwin.API
- `/api/dashboards/*` → Dashboard.API

---

### Device.API
**Port:** 5293  
**Database:** sensormine_metadata  
**Purpose:** Device lifecycle management

**Responsibilities:**
- Device CRUD operations
- Device type definitions
- Custom field management
- Field mapping configuration
- Device registration/deregistration

**Key Endpoints:**
```
GET    /api/devices                    # List devices
POST   /api/devices                    # Create device
GET    /api/devices/{id}               # Get device details
PUT    /api/devices/{id}               # Update device
DELETE /api/devices/{id}               # Delete device

GET    /api/devicetype                 # List device types
POST   /api/devicetype                 # Create device type
GET    /api/devicetype/{id}/fields     # Get field mappings
PUT    /api/devicetype/{id}/fields     # Update field mappings
POST   /api/devicetype/{id}/fields/sync # Sync fields from schema
```

**Domain Models:**
```csharp
public class Device
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid DeviceTypeId { get; set; }
    public string Name { get; set; }
    public string SerialNumber { get; set; }
    public Dictionary<string, object>? Location { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DeviceType
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
    public List<FieldMapping>? Fields { get; set; }
}

public class FieldMapping
{
    public Guid Id { get; set; }
    public string FieldName { get; set; }
    public FieldSource FieldSource { get; set; } // Schema | CustomField | System
    public string FriendlyName { get; set; }
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public FieldDataType DataType { get; set; }
    public bool IsQueryable { get; set; }
    public bool IsVisible { get; set; }
}
```

---

### SchemaRegistry.API
**Port:** 5021  
**Database:** sensormine_metadata  
**Purpose:** Centralized schema management and validation

**Responsibilities:**
- Schema CRUD operations
- Schema versioning
- Schema validation (Avro/JSON Schema)
- Schema compatibility checking
- Schema discovery

**Key Endpoints:**
```
GET    /api/schemas                    # List schemas
POST   /api/schemas                    # Create schema
GET    /api/schemas/{id}               # Get schema
PUT    /api/schemas/{id}               # Update schema
GET    /api/schemas/{id}/versions      # Get version history
POST   /api/schemas/{id}/validate      # Validate data against schema
```

**Schema Format (Avro):**
```json
{
  "type": "record",
  "name": "TemperatureSensor",
  "fields": [
    {"name": "temperature", "type": "float"},
    {"name": "humidity", "type": "float"},
    {"name": "pressure", "type": "float"},
    {"name": "timestamp", "type": "long", "logicalType": "timestamp-millis"}
  ]
}
```

---

### DigitalTwin.API
**Port:** 5297  
**Database:** sensormine_metadata  
**Purpose:** Asset hierarchy and digital twin management

**Responsibilities:**
- Asset CRUD operations
- Asset hierarchy (parent-child relationships)
- Asset state management
- Data point mappings (device → asset)
- Asset rollup/aggregation configuration

**Key Endpoints:**
```
GET    /api/assets                     # List assets
POST   /api/assets                     # Create asset
GET    /api/assets/{id}                # Get asset details
PUT    /api/assets/{id}                # Update asset
DELETE /api/assets/{id}                # Delete asset
GET    /api/assets/{id}/children       # Get child assets
GET    /api/assets/{id}/devices        # Get associated devices
POST   /api/assets/{id}/mappings       # Create device mapping
```

**Domain Models:**
```csharp
public class Asset
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; }
    public string Type { get; set; } // Site, Building, Floor, Zone, Equipment
    public int Level { get; set; }
    public string Path { get; set; } // Materialized path for hierarchy
    public string? Icon { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public Dictionary<string, object>? Location { get; set; }
}

public class DataPointMapping
{
    public Guid Id { get; set; }
    public Guid AssetId { get; set; }
    public Guid DeviceId { get; set; }
    public string DataPointName { get; set; }
    public string AggregationMethod { get; set; } // avg, sum, min, max, last
}
```

---

### Dashboard.API
**Port:** 5299  
**Database:** sensormine_metadata  
**Purpose:** Dashboard configuration and management

**Responsibilities:**
- Dashboard CRUD operations
- Widget configuration
- Dashboard sharing/permissions
- Layout management
- User preferences

**Key Endpoints:**
```
GET    /api/dashboards                 # List dashboards
POST   /api/dashboards                 # Create dashboard
GET    /api/dashboards/{id}            # Get dashboard
PUT    /api/dashboards/{id}            # Update dashboard
DELETE /api/dashboards/{id}            # Delete dashboard
POST   /api/dashboards/{id}/share      # Share dashboard
```

**Domain Models:**
```csharp
public class Dashboard
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public DashboardLayout Layout { get; set; }
    public List<Widget> Widgets { get; set; }
    public string CreatedBy { get; set; }
}

public class Widget
{
    public string Id { get; set; }
    public string Type { get; set; } // chart, gauge, kpi, deviceList
    public WidgetConfig Config { get; set; }
    public WidgetPosition Position { get; set; }
}
```

---

### Query.API
**Port:** 5079  
**Database:** sensormine_timeseries  
**Purpose:** Time-series data queries and aggregations

**Responsibilities:**
- Telemetry data queries
- Time-range queries
- Aggregations (avg, sum, min, max, count)
- Time bucketing (1m, 5m, 15m, 1h, 1d)
- Field resolution (friendly names → columns)
- Asset-based queries

**Key Endpoints:**
```
POST   /api/query/telemetry            # Query telemetry data
POST   /api/query/aggregate            # Aggregate queries
GET    /api/query/devices/{id}/latest  # Latest telemetry
GET    /api/query/devices/{id}/history # Historical data
POST   /api/query/by-asset             # Asset-based query
GET    /api/query/devices-with-telemetry # Devices + latest telemetry
```

**Query Request Format:**
```json
{
  "deviceIds": ["uuid1", "uuid2"],
  "fields": ["temperature", "humidity"],
  "startTime": "2025-01-01T00:00:00Z",
  "endTime": "2025-01-02T00:00:00Z",
  "aggregation": "avg",
  "interval": "15m"
}
```

---

### Ingestion.Service
**Port:** 5022  
**Database:** sensormine_timeseries (write), sensormine_metadata (read)  
**Purpose:** High-throughput telemetry data ingestion

**Responsibilities:**
- Receive telemetry from Edge Gateway or HTTP
- Schema validation
- Data transformation
- Write to TimescaleDB
- Publish events to Kafka

**Data Flow:**
```
MQTT/HTTP → Edge.Gateway → Kafka (device.telemetry) → Ingestion.Service → TimescaleDB
                                     └─→ Validation against SchemaRegistry.API
```

**Performance:**
- Batch inserts (1000 records/batch)
- Async processing
- Back-pressure handling
- Dead-letter queue for failures

---

### Edge.Gateway
**Port:** 5023  
**Protocols:** MQTT, Modbus TCP, OPC UA  
**Purpose:** Protocol translation and edge connectivity

**Responsibilities:**
- MQTT broker/bridge
- Modbus TCP polling
- OPC UA subscription
- Protocol normalization
- Buffering during disconnection
- TLS/SSL termination

**Supported Protocols:**
- MQTT (Port 1883, 8883)
- HTTP/REST (Port 5023)
- WebSocket (Port 5023/ws)
- Modbus TCP (configurable)
- OPC UA (configurable)

---

### Alerts.API
**Port:** 5295  
**Database:** sensormine_metadata  
**Purpose:** Alert rule management and notification

**Responsibilities:**
- Alert rule CRUD
- Condition evaluation (threshold, anomaly, pattern)
- Alert triggering
- Notification delivery (email, SMS, webhook)
- Alert history

**Alert Rule Example:**
```json
{
  "name": "High Temperature Alert",
  "condition": "temperature > 75",
  "deviceTypeId": "uuid",
  "severity": "Critical",
  "actions": [
    {"type": "email", "recipients": ["ops@example.com"]},
    {"type": "webhook", "url": "https://example.com/alert"}
  ]
}
```

---

### StreamProcessing.Service
**Port:** 5138  
**Database:** sensormine_timeseries (write)  
**Purpose:** Real-time stream processing and analytics

**Responsibilities:**
- Real-time aggregations
- Anomaly detection
- Pattern matching
- Window functions
- Derived metrics calculation

**Processing Pipeline:**
```
Kafka (device.telemetry) → StreamProcessing → Kafka (metrics) → TimescaleDB
                                ↓
                          Alert evaluation
```

---

## 🔄 Communication Patterns

### Synchronous (HTTP/REST)
**Use When:**
- Client needs immediate response
- Request-response pattern
- CRUD operations

**Example:**
```
Frontend → API Gateway → Device.API (GET /api/devices/{id})
```

### Asynchronous (Kafka Events)
**Use When:**
- Decoupling services
- Event notification
- High-throughput data flows

**Event Topics:**
```
device.telemetry    - Raw sensor data
device.events       - Device state changes
asset.updates       - Asset hierarchy changes
alerts.triggered    - Alert notifications
metrics.calculated  - Derived metrics
```

**Event Format:**
```json
{
  "eventId": "uuid",
  "eventType": "device.telemetry",
  "timestamp": "2025-01-01T00:00:00Z",
  "tenantId": "uuid",
  "deviceId": "uuid",
  "payload": {
    "temperature": 22.5,
    "humidity": 65.0
  }
}
```

---

## 🔐 Security

### Authentication
**JWT (JSON Web Tokens):**
- Issued by Identity Provider (Keycloak/Auth0)
- Validated at API Gateway
- Contains claims: userId, tenantId, roles, permissions

**Token Format:**
```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "roles": ["admin", "operator"],
  "permissions": ["devices:read", "devices:write"],
  "exp": 1704067200
}
```

### Authorization
**Role-Based Access Control (RBAC):**
```csharp
[Authorize(Roles = "admin,operator")]
[HttpGet("{id}")]
public async Task<IActionResult> GetDevice(Guid id) { ... }
```

**Permission-Based:**
```csharp
[Authorize(Policy = "devices:write")]
[HttpPost]
public async Task<IActionResult> CreateDevice(CreateDeviceRequest request) { ... }
```

### Multi-Tenancy
**Tenant Isolation:**
- All requests include `X-Tenant-Id` header (extracted from JWT)
- All database queries filtered by `tenant_id`
- Row-Level Security (RLS) in PostgreSQL

```csharp
// Middleware sets tenant context
public class TenantMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = context.User.FindFirst("tenant_id")?.Value;
        context.Items["TenantId"] = tenantId;
        await _next(context);
    }
}
```

---

## 📊 Observability

### Logging
**Structured JSON Logging:**
```csharp
_logger.LogInformation("Device created: {DeviceId}, Tenant: {TenantId}", 
    deviceId, tenantId);
```

**Log Levels:**
- Debug: Detailed diagnostic info
- Information: General flow
- Warning: Unexpected but handled
- Error: Errors and exceptions
- Critical: System failure

### Metrics
**Prometheus Format:**
```
# Device count by tenant
sensormine_devices_total{tenant_id="uuid"} 1234

# Ingestion rate
sensormine_telemetry_ingestion_rate{device_id="uuid"} 100.5

# API latency
sensormine_api_request_duration_seconds{endpoint="/api/devices",method="GET"} 0.045
```

### Tracing
**OpenTelemetry:**
- Distributed tracing across services
- Trace ID propagated in headers
- Span creation for each operation

```csharp
using var activity = Activity.StartActivity("GetDevice");
activity?.SetTag("device.id", deviceId);
activity?.SetTag("tenant.id", tenantId);
```

### Health Checks
**Endpoints:**
```
GET /health         # Liveness (is service running?)
GET /health/ready   # Readiness (is service ready to serve?)
```

**Response:**
```json
{
  "status": "Healthy",
  "checks": {
    "database": "Healthy",
    "kafka": "Healthy",
    "redis": "Healthy"
  },
  "duration": "00:00:00.1234567"
}
```

---

## 🧪 Testing Strategy

### Unit Tests
**Location:** `tests/<Service>.Tests/`  
**Framework:** xUnit  
**Mocking:** Moq

```csharp
[Fact]
public async Task CreateDevice_ShouldReturnCreatedDevice()
{
    // Arrange
    var repository = new Mock<IDeviceRepository>();
    var service = new DeviceService(repository.Object);
    
    // Act
    var result = await service.CreateDeviceAsync(request);
    
    // Assert
    Assert.NotNull(result);
    Assert.Equal(expectedName, result.Name);
}
```

### Integration Tests
**Database:** TestContainers (PostgreSQL)  
**Messaging:** In-memory Kafka

```csharp
[Collection("IntegrationTests")]
public class DeviceApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetDevice_ReturnsDevice()
    {
        var response = await _client.GetAsync($"/api/devices/{deviceId}");
        response.EnsureSuccessStatusCode();
    }
}
```

### End-to-End Tests
**Tool:** Playwright (frontend) + REST Assured (backend)

---

## 📚 Related Documentation

- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Container and deployment details
- **[DATABASE.md](./DATABASE.md)** - Database architecture
- **[LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md)** - Local setup guide
- **[service-ports.md](./service-ports.md)** - Complete port reference

---

**Last Review:** December 10, 2025  
**Next Review:** January 10, 2026  
**Owner:** Platform Team
