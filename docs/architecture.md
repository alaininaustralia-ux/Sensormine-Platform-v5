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
- Schema registration
- Schema versioning
- Validation rules
- Schema evolution

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
**Purpose**: ML inference and semantic search

**Components**:
- **Sensormine.AI Library**
  - ONNX model inference
  - Embedding generation
  - Vector similarity search
  - Semantic query processing

**Capabilities**:
- Anomaly detection models
- Predictive maintenance
- Natural language queries
- Context-aware search

## Multi-Tenancy

### Tenant Isolation Strategy
1. **Application Level**
   - Tenant ID in all requests
   - Row-level filtering
   - Tenant-aware queries

2. **Data Level**
   - Partitioned tables by tenant
   - Separate Kafka topics per tenant
   - Isolated object storage buckets

3. **Resource Level**
   - Kubernetes namespaces per tenant (enterprise)
   - Resource quotas
   - Network policies

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
