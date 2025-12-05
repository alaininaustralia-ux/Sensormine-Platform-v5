# Sensormine Platform - Architecture Documentation

## System Architecture

### Overview
The Sensormine Platform v5 is a cloud-agnostic industrial IoT platform designed for high-throughput data ingestion, real-time processing, and advanced analytics at scale.

## Architectural Layers

### 1. Edge & Connectivity Layer
**Purpose**: Connect industrial devices and protocols to the platform

**Components**:
- **Edge.Gateway Service**
  - MQTT protocol support
  - OPC UA gateway functionality
  - Industrial protocol connectors
  - Device registration and authentication
  - Data normalization

**Key Features**:
- Multi-protocol support (MQTT, OPC UA, Modbus, etc.)
- Edge buffering and store-forward capability
- Device identity management
- Protocol translation

### 2. Ingestion Pipeline
**Purpose**: Reliable, scalable data ingestion with validation

**Components**:
- **Ingestion.Service**
  - Kafka consumer groups
  - Schema validation
  - Multi-tenant routing
  - Device identity resolution
  - Batch ingestion support

**Data Flow**:
```
Edge Gateway → Kafka Topic → Ingestion Service → Validation → Storage
```

**Key Features**:
- Horizontal scaling via Kafka partitions
- Schema-based validation
- Tenant isolation
- Dead letter queue for failed messages
- Metrics and monitoring

### 3. Stream Processing Layer
**Purpose**: Real-time data processing and ML inference

**Components**:
- **StreamProcessing.Service**
  - Real-time aggregations
  - ML inference pipeline (ONNX)
  - Rule evaluation
  - Anomaly detection
  - Data enrichment

**Processing Patterns**:
- Stateless transformations
- Windowed aggregations
- Pattern detection
- Event correlation

### 4. Storage Layer
**Purpose**: Persistent storage for different data types

**Storage Systems**:
| Data Type | Technology | Use Case |
|-----------|-----------|----------|
| Time-Series | TimescaleDB | Sensor data, measurements |
| Metadata | PostgreSQL | Devices, schemas, users |
| Cache | Redis | Session data, hot data |
| Objects | S3/MinIO | Video, CAD, Lidar files |
| Search | OpenSearch | Full-text search, logs |

**Repository Pattern**:
- Abstract storage implementations
- Cloud-agnostic interfaces
- Easy provider swapping

### 5. API Layer
**Purpose**: Expose platform functionality via RESTful APIs

**Microservices**:

#### Device.API
- Device CRUD operations
- Device registration
- Metadata management
- Status monitoring

#### SchemaRegistry.API
- Schema registration and management (CRUD operations)
- Schema versioning and evolution
- Validation rules and enforcement
- **AI-Powered Schema Generation** (Anthropic Claude API)
  - Generate schemas from sample data (JSON/CSV/XML/TXT)
  - Confidence scoring and suggestions
  - File upload and text paste support
- **Centralized AI Metering** (via Sensormine.AI)
  - Track all AI API calls, tokens, and costs
  - Multi-tenant usage statistics
  - Provider-agnostic metering infrastructure

#### Query.API
- Time-series queries
- Aggregation queries
- Historical data retrieval
- Real-time data access

#### Alerts.API
- Alert rule configuration
- Notification management
- Alert history
- Escalation policies

#### DigitalTwin.API
- Digital twin state management
- 3D model associations
- Twin queries and updates
- Simulation support

#### VideoMetadata.API
- Video file metadata
- CAD file indexing
- Lidar point cloud metadata
- Object storage integration

#### ApiGateway
- Unified entry point
- Authentication/Authorization
- Rate limiting
- Request routing

### 6. AI & Semantic Layer
**Purpose**: ML inference, AI operations, and semantic search

**Components**:
- **Sensormine.AI Library**
  - **AI Metering Service** (✅ Implemented)
    - Centralized tracking of all AI API calls
    - Token usage measurement (input + output)
    - Cost calculation per provider/model
    - Duration and success/failure tracking
    - Multi-tenant usage statistics
    - Provider-agnostic design (Anthropic, OpenAI, etc.)
  - ONNX model inference
  - Embedding generation
  - Vector similarity search
  - Semantic query processing

**AI Integration Architecture**:
```
Service Layer (e.g., SchemaRegistry.API)
        ↓
AiMeteringService.CallAiAsync()
        ├─ Start timer & log call
        ├─ Execute AI provider API call
        ├─ Extract token counts
        ├─ Calculate cost
        ├─ Store metrics (tenant, provider, model, operation)
        └─ Return metered response
```

**AI Metering Endpoints**:
- `GET /api/aiusage/current` - Current tenant's AI usage
- `GET /api/aiusage/tenant/{id}` - Specific tenant's usage
- `GET /api/aiusage/all` - All tenants' usage statistics

**Capabilities**:
- AI-powered schema generation (Claude API)
- Anomaly detection models
- Predictive maintenance
- Natural language queries
- Context-aware search

## Multi-Tenancy Architecture

### Hierarchical Tenant Model
```
Platform (Root)
├── Tenant A (Organization)
│   ├── Sub-Tenant A1 (Site/Department)
│   ├── Sub-Tenant A2 (Site/Department)
│   └── Sub-Tenant A3 (Site/Department)
└── Tenant B (Organization)
    ├── Sub-Tenant B1 (Site/Department)
    └── Sub-Tenant B2 (Site/Department)
```

**Key Concepts**:
- **Parent Tenants**: Top-level organizations with billing and user management
- **Sub-Tenants**: Child organizations inheriting settings from parent
- **Inheritance**: Permissions, configurations, and policies cascade down
- **Isolation**: Data strictly isolated between tenant hierarchies

### Tenant Isolation Strategy

#### 1. Application Level
- Tenant ID (`TenantId`) and Parent Tenant ID (`ParentTenantId`) in all entities
- Row-level security filtering in all queries
- Tenant context injected via middleware
- Multi-tenant aware repository pattern
- Cross-tenant queries only for parent accessing sub-tenants

#### 2. Data Level
- **Database**: Shared schema with tenant_id discriminator
- **Partitioning**: Table partitions by tenant for large tables
- **Kafka**: Topic naming convention: `{environment}.{tenant}.{datatype}`
- **Object Storage**: Bucket per tenant or folder hierarchy
- **Redis**: Key prefix with tenant ID

#### 3. Resource Level
- **Kubernetes Namespaces**: Per tenant for enterprise customers
- **Resource Quotas**: CPU, memory, storage limits per tenant
- **Network Policies**: Isolate tenant workloads
- **Rate Limiting**: API throttling per tenant

#### 4. Tenant Configuration
- **Branding**: Custom logo, colors, domain per tenant
- **Features**: Feature flags per subscription plan
- **Integrations**: Tenant-specific external connections
- **Schemas**: Tenant-specific device schemas
- **Billing Settings**: Currency, tax rules, payment methods

## Security Architecture

### Authentication & Authorization
- JWT token-based authentication
- Role-Based Access Control (RBAC)
- API key authentication for devices
- OAuth 2.0 support

### Data Security
- TLS/SSL for all communications
- Encryption at rest for sensitive data
- Secrets management via Kubernetes Secrets
- Audit logging

### Network Security
- Service mesh (optional: Istio/Linkerd)
- Network policies
- API gateway rate limiting
- DDoS protection

## Billing & Metering Architecture

### Billing.API Microservice
**Purpose**: Handle all billing, metering, and payment operations

**Responsibilities**:
- Track resource consumption per tenant
- Generate usage-based invoices
- Integrate with Stripe for payments
- Manage subscriptions and plans
- Enforce resource quotas
- Process webhook events from Stripe

### Metering Infrastructure

#### Metered Resources
```
┌─────────────────────────────────────────────┐
│ Resource Type          │ Unit              │
├─────────────────────────────────────────────┤
│ Active Devices         │ per device/month  │
│ Data Ingestion         │ GB ingested       │
│ API Calls              │ per 1,000 calls   │
│ Time-Series Storage    │ GB/month          │
│ Object Storage         │ GB/month          │
│ Video Processing       │ hours processed   │
│ ML Inference           │ per 1,000 calls   │
│ Data Egress            │ GB transferred    │
└─────────────────────────────────────────────┘
```

#### Metering Collection Strategy
1. **Event-Based Metering**
   - Emit usage events to Kafka topic `metering.events`
   - StreamProcessing.Service aggregates in real-time
   - Store aggregated metrics in TimescaleDB

2. **Periodic Polling**
   - Background job queries resource counts (devices, storage)
   - Snapshot taken daily
   - Stored in `tenant_usage_snapshots` table

3. **API Gateway Metering**
   - API Gateway increments Redis counters per tenant
   - Periodic flush to database
   - Rate limiting based on plan quotas

#### Usage Data Model
```csharp
public class UsageRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public DateTime Timestamp { get; set; }
    public string ResourceType { get; set; }  // "devices", "api_calls", etc.
    public decimal Quantity { get; set; }
    public string Unit { get; set; }
    public Dictionary<string, string> Metadata { get; set; }
}
```

### Stripe Integration

#### Architecture Overview
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Billing.API │ ────▶│    Stripe    │ ────▶│   Webhooks   │
│              │      │              │      │   Handler    │
│  - Customers │      │  - Customers │      │              │
│  - Invoices  │      │  - Subscriptions   │      │
│  - Usage     │      │  - Invoices  │      └──────────────┘
└──────────────┘      │  - PaymentIntents  │
                      └──────────────┘
```

#### Stripe Components

**1. Customer Management**
- Create Stripe Customer for each tenant
- Store Stripe Customer ID in `tenants` table
- Sync tenant updates to Stripe

**2. Subscription Plans** (Stripe Products & Prices)
```
Free Tier
├── $0/month
├── 10 devices max
├── 1GB storage
└── 10,000 API calls/month

Pro Tier
├── $99/month (monthly) or $990/year (annual)
├── 100 devices
├── 50GB storage
├── 1M API calls/month
└── Email support

Enterprise Tier
├── Custom pricing
├── Unlimited devices
├── Custom storage
├── Unlimited API calls
└── Dedicated support
```

**3. Usage-Based Billing**
- Report usage to Stripe via Metering API
- Stripe calculates overage charges
- Invoices generated automatically on billing cycle

**4. Webhook Handling**
```csharp
public class StripeWebhookHandler
{
    // Handle payment events
    - payment_intent.succeeded
    - payment_intent.payment_failed
    
    // Handle subscription events
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - customer.subscription.trial_will_end
    
    // Handle invoice events
    - invoice.payment_succeeded
    - invoice.payment_failed
    - invoice.finalized
}
```

**5. Payment Flow**
```
Tenant Signs Up
    ↓
Create Stripe Customer
    ↓
Select Subscription Plan
    ↓
Add Payment Method (Stripe Elements)
    ↓
Create Subscription
    ↓
Activate Tenant Account
    ↓
Begin Metering Usage
    ↓
Monthly: Report Usage → Generate Invoice → Charge Card
```

### Quota Enforcement

#### Soft Limits (Warnings)
- Alert sent at 80% of quota
- Email and in-app notifications
- Grace period before hard limit

#### Hard Limits (Blocking)
- API returns 429 Too Many Requests
- Device provisioning blocked
- Data ingestion throttled
- Dashboard shows upgrade prompts

#### Implementation
```csharp
public class QuotaEnforcementMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var tenant = await GetTenantFromContext(context);
        var quota = await GetQuotaForTenant(tenant.Id);
        var usage = await GetCurrentUsage(tenant.Id);
        
        if (usage.Devices >= quota.MaxDevices)
        {
            context.Response.StatusCode = 429;
            await context.Response.WriteAsync(
                "Device quota exceeded. Please upgrade your plan."
            );
            return;
        }
        
        await _next(context);
    }
}
```

### Sub-Tenant Billing Allocation

**Chargeback Model**: Parent tenant pays, costs allocated to sub-tenants
```
Parent Tenant Invoice: $500
├── Sub-Tenant A: $200 (40%)
├── Sub-Tenant B: $150 (30%)
└── Sub-Tenant C: $150 (30%)
```

**Allocation Strategies**:
1. **Direct**: Each sub-tenant's actual usage
2. **Proportional**: Based on device count or data volume
3. **Fixed**: Predetermined percentage or amount
4. **Showback**: Report costs without actual billing

**Implementation**:
- Track usage per sub-tenant separately
- Generate allocation reports monthly
- Parent can view consolidated or itemized costs
- Export to CSV for internal billing systems

## Scalability & Performance

### Horizontal Scaling
- Stateless service design
- Kafka partition scaling
- Database sharding support
- Object storage distribution

### Performance Optimizations
- Redis caching layer
- Database connection pooling
- Async/await throughout
- Batch processing for bulk operations

### High Availability
- Multi-replica deployments
- Health checks and auto-healing
- Circuit breakers
- Graceful degradation

## Observability

### Distributed Tracing
- OpenTelemetry instrumentation
- Jaeger for trace visualization
- Correlation IDs across services

### Metrics
- Prometheus-compatible metrics
- Custom business metrics
- Resource utilization tracking

### Logging
- Structured logging (JSON)
- Centralized log aggregation
- Log levels per environment
- Correlation with traces

### Health Checks
- Liveness probes
- Readiness probes
- Dependency health checks
- Graceful shutdown

## Deployment Architecture

### Local Development
```
Docker Compose
├── Kafka
├── MQTT Broker
├── TimescaleDB
├── PostgreSQL
├── Redis
├── MinIO
├── OpenSearch
└── Jaeger
```

### Production Kubernetes
```
Kubernetes Cluster
├── Ingress Controller
├── Microservices (Deployments)
├── StatefulSets (Databases)
├── ConfigMaps & Secrets
├── Persistent Volumes
├── Service Mesh (optional)
└── Monitoring Stack
```

### Cloud Providers
- **AWS**: EKS, MSK, RDS, S3, ElastiCache
- **Azure**: AKS, Event Hubs, Azure Database, Blob Storage
- **GCP**: GKE, Pub/Sub, Cloud SQL, Cloud Storage
- **On-Premises**: Self-managed Kubernetes

## Data Flow Examples

### Device Data Ingestion
```
Device → MQTT → Edge.Gateway → Kafka → Ingestion.Service 
  → Schema Validation → TimescaleDB → Query.API → Client
```

### Real-Time Alerting
```
TimescaleDB → StreamProcessing.Service → Alert Rule Evaluation 
  → Kafka (Alerts Topic) → Alerts.API → Notification Service → Email/SMS
```

### ML Inference Pipeline
```
Kafka → StreamProcessing.Service → ONNX Model → Inference Result 
  → Enriched Data → TimescaleDB
```

## Technology Decisions

### Why Microservices?
- Independent scaling of components
- Technology flexibility per service
- Fault isolation
- Team autonomy

### Why Kafka?
- High throughput message broker
- Event sourcing capability
- Replay and reprocessing support
- Strong ordering guarantees

### Why TimescaleDB?
- PostgreSQL-compatible (familiar SQL)
- Optimized for time-series data
- Automatic data retention policies
- Continuous aggregations

### Why .NET 8?
- High performance and low latency
- Cross-platform support
- Strong typing and tooling
- Active ecosystem

## Future Enhancements

- [ ] GraphQL API option
- [ ] Apache Flink integration for advanced stream processing
- [ ] Multi-region deployment support
- [ ] Advanced AI/ML model orchestration
- [ ] Real-time collaboration features
- [ ] Mobile SDK for device integration
- [ ] Edge computing capabilities
