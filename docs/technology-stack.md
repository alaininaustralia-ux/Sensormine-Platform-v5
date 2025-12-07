# Sensormine Platform - Technology Stack

## Architecture Philosophy

A **cloud-agnostic architecture** designed for portability, performance, and long-term maintainability. All components can be deployed on any public cloud, private cloud, or on-premises environment.

---

## Frontend Layer

### Web Application Framework
**React 18+**
- Modern, component-based SPA framework
- Easily deployable behind SHDCDN or any edge delivery platform
- Supports integration with REST and GraphQL APIs
- Rich ecosystem for data visualization and real-time updates

**Next.js 14** (Recommended)
- Server-side rendering (SSR) and static site generation (SSG)
- API routes for backend-for-frontend (BFF) patterns
- Optimized performance and SEO
- Built-in routing and code splitting

### UI Component Libraries
**shadcn/ui + Tailwind CSS** (Recommended)
- Customizable, accessible components
- Utility-first CSS for rapid development
- No runtime dependencies
- Full design system control

**Alternative: Material-UI (MUI)**
- Comprehensive component library
- Enterprise-ready with theming support
- Accessibility built-in

### State Management
**Zustand** (Recommended for React)
- Lightweight, simple API
- No boilerplate
- TypeScript support

**Alternative: Redux Toolkit**
- Mature, battle-tested
- Larger ecosystem
- More structured for complex state

### Data Visualization
- **Recharts** - React-native charting library
- **Chart.js** - Simple yet flexible
- **D3.js** - Advanced custom visualizations
- **Plotly.js** - Scientific and financial charts

### Mapping & GIS
- **Leaflet** - Lightweight, mobile-friendly maps
- **Mapbox GL JS** - Advanced vector maps with 3D support

### 3D Visualization
- **Three.js** - WebGL 3D engine for CAD and point clouds
- **Babylon.js** - Alternative 3D engine with better tooling

### Real-Time Communication
- **Socket.IO** - WebSocket library with fallbacks
- **SignalR** - ASP.NET Core real-time framework
- **MQTT over WebSockets** - Direct IoT device communication

### Content Delivery
**SHDCDN (Secure, High-Distributed CDN)**
- Provides global asset caching and low-latency delivery
- Edge-side security controls independent of cloud vendor
- Automatic failover and multi-region redundancy
- Alternative: Cloudflare, Fastly, or self-hosted Varnish

---

## Backend Layer

### API Services Framework
**.NET 8 (C#)** (Primary Stack)
- ASP.NET Core Web API for RESTful services
- High performance, cross-platform
- Strong typing and excellent tooling
- Native support for OpenTelemetry and health checks

**Alternative: Node.js / Python / Go**
- Node.js: Event-driven, excellent for real-time
- Python: ML/AI workloads, data processing
- Go: High-performance edge services

### API Patterns
- **REST APIs** - Primary interface (OpenAPI/Swagger documented)
- **GraphQL** - Planned for complex queries
- **WebSockets** - Real-time data streaming
- **gRPC** - Inter-service communication (optional)

### Microservices Architecture
**Services:**
- ApiGateway - Entry point, routing, rate limiting
- Edge.Gateway - MQTT broker, device connectivity
- Ingestion.Service - Data ingestion pipeline
- Device.API - Device management CRUD
- SchemaRegistry.API - Schema versioning
- Query.API - Time-series data queries
- Alerts.API - Alert rules and notifications
- DigitalTwin.API - Digital twin state
- VideoMetadata.API - Video processing
- StreamProcessing.Service - Real-time processing
- Billing.API - Billing, metering, payments

**Characteristics:**
- Stateless, containerized, portable
- Kubernetes, Docker Swarm, or VM-based deployments
- Independent scaling and deployment
- Health checks and graceful shutdown

---

## Authentication & Authorization

### Identity Provider
**OIDC-based (OpenID Connect)**
- **Keycloak** (Recommended) - Self-hosted, cloud-agnostic
- **Auth0** - Self-managed deployment option
- **Azure AD B2C / Entra ID** - Cloud option
- **Okta** - Enterprise option

### Token Management
- **JWT (JSON Web Tokens)** for session handling
- Distributed token validation across services
- Token refresh and revocation strategies
- Role-Based Access Control (RBAC)
- Multi-tenant isolation at token level

### API Security
- OAuth 2.0 / OpenID Connect flows
- API key management for M2M communication
- Certificate-based authentication for devices (X.509)

---

## Data Layer

### Relational Database
**PostgreSQL 15+**
- Standard relational storage for transactional workloads
- JSONB support for flexible schemas
- Full-text search capabilities
- Replication and backup strategies independent of cloud vendor
- PostGIS extension for geospatial queries

### Time-Series Database
**TimescaleDB**
- Time-series extension for PostgreSQL
- Ideal for IoT, sensor, and event data
- Automatic partitioning (hypertables)
- Retention policies and continuous aggregates
- Compression for efficient long-term storage
- Native PostgreSQL compatibility

### Caching Layer
**Redis 7+**
- In-memory cache for session data and hot data
- Pub/Sub for real-time notifications
- Distributed locking
- Cluster mode for high availability

### Object Storage
**S3-Compatible Storage**
- AWS S3, Azure Blob, GCS, or MinIO (self-hosted)
- Video files, CAD models, LiDAR data
- Lifecycle policies for data tiering

### Search & Analytics
**OpenSearch / Elasticsearch**
- Full-text search across logs and metadata
- Log aggregation and analysis
- Alternative: Loki + Grafana for logs

---

## Message Streaming & Event Processing

### Message Broker
**Apache Kafka** (Primary)
- High-throughput, distributed event streaming
- Persistent message storage
- Partitioned for horizontal scaling
- Consumer groups for load balancing

**NATS** (Edge & Lightweight Use Cases)
- Lightweight, fast pub/sub
- Ideal for edge deployments
- Lower resource footprint

### IoT Protocols
**MQTT**
- Lightweight publish/subscribe protocol
- Ideal for constrained devices
- QoS levels for reliability
- Integration with Eclipse Mosquitto

**AMQP**
- Advanced Message Queuing Protocol
- Enterprise messaging patterns
- RabbitMQ implementation

### Stream Processing
**Kafka Streams / KSQL**
- Real-time stream processing
- Stateful transformations
- Exactly-once semantics

**Alternative: Apache Flink**
- Complex event processing
- Windowing and aggregations

---

## Infrastructure & DevOps

### Container Orchestration
**Kubernetes** (Primary)
- AKS (Azure), EKS (AWS), GKE (Google), OpenShift, or self-hosted
- Helm charts for repeatable deployment
- Horizontal Pod Autoscaling (HPA)
- Service mesh optional (Istio/Linkerd) for advanced traffic management

**Docker Compose** (Local Development)
- Rapid local environment setup
- Service definition and networking

### CI/CD Pipeline
- **GitHub Actions** - Primary CI/CD
- **Jenkins** - Alternative for on-premises
- **ArgoCD / Flux** - GitOps for Kubernetes

### Infrastructure as Code
**Terraform**
- Cloud-agnostic infrastructure provisioning
- Multi-cloud support (AWS, Azure, GCP)
- State management and version control

**Helm**
- Kubernetes package manager
- Templated deployments
- Release management

---

## Monitoring & Observability

### Metrics & Dashboards
**Prometheus**
- Time-series metrics collection
- Service discovery and scraping
- PromQL for querying

**Grafana**
- Visualization dashboards
- Alerting and notifications
- Multi-datasource support

### Distributed Tracing
**OpenTelemetry**
- Vendor-neutral instrumentation
- Traces, metrics, and logs
- Integration with Jaeger, Zipkin, or cloud providers

### Logging
**Structured Logging**
- JSON-formatted logs
- Correlation IDs for request tracking
- Log aggregation with OpenSearch or Loki

### Application Performance Monitoring (APM)
- **Jaeger** - Distributed tracing
- **Zipkin** - Trace visualization
- **Elastic APM** - Application performance monitoring

---

## ML / AI Layer

### Model Serving
**ONNX Runtime**
- Cross-platform inference engine
- Optimized for production workloads
- Supports models from TensorFlow, PyTorch, scikit-learn

### ML Pipeline
- **MLflow** - Experiment tracking and model registry
- **Kubeflow** - ML workflows on Kubernetes
- **Azure ML** - Cloud option for training

### Video Analytics
- **OpenCV** - Computer vision library
- **YOLO / TensorFlow** - Object detection models
- **FFmpeg** - Video processing and transcoding

---

## Development Tools

### API Documentation
- **OpenAPI / Swagger** - REST API specs
- **Redoc** - Beautiful API documentation
- **GraphQL Playground** - GraphQL exploration

### Testing
- **xUnit** - .NET unit testing
- **Moq** - Mocking framework
- **Testcontainers** - Integration testing with containers
- **k6** - Load testing
- **Playwright** - End-to-end browser testing

### Code Quality
- **SonarQube** - Static code analysis
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting

---

## Mobile Application (.NET MAUI)

### Cross-Platform Framework
**.NET MAUI (.NET 8+)** (Selected)
- Native iOS and Android from single C# codebase
- Leverage existing .NET backend expertise
- Share business logic with backend services
- Hot reload for rapid development
- Strong typing and IDE support (Visual Studio, VS Code)
- NFC support via platform-specific implementations
- Mature ecosystem with NuGet packages

**Why MAUI over React Native/Flutter:**
- **Team expertise**: Leverages existing C# skills
- **Code sharing**: Share models, DTOs, validation logic with backend
- **Performance**: Native compilation, no JavaScript bridge
- **Enterprise support**: Long-term support from Microsoft
- **NFC support**: Better NFC integration on both iOS and Android

### Mobile Architecture

**UI Framework:**
- MAUI native controls
- Community Toolkit MAUI
- Syncfusion MAUI controls (advanced charts/gauges)
- .NET MAUI Maps

**MVVM Pattern:**
- ViewModels with CommunityToolkit.Mvvm
- Data binding and commands
- Dependency injection

**Data & Storage:**
- SQLite (SQLite-net-pcl) for offline storage
- Entity Framework Core for SQLite
- MAUI SecureStorage for credentials
- Akavache for caching

**Networking:**
- HttpClient for REST API calls
- Refit for typed HTTP clients
- Polly for resilience (retry, circuit breaker, timeout)

**NFC Integration:**
- iOS: CoreNFC via platform-specific code
- Android: Android.Nfc API via platform-specific code
- NDEF message parsing
- Custom NFC command/response protocol

**Authentication:**
- MSAL (Microsoft Authentication Library)
- Azure AD / Entra ID integration
- Biometric authentication (MAUI Essentials)
- Secure token storage

**Other Libraries:**
- ZXing.Net.Maui (QR/barcode scanning)
- Serilog (logging)
- Polly (resilience patterns)

### Mobile Backend
- Same REST APIs as web application
- Push notifications via Azure Notification Hubs or Firebase Cloud Messaging
- Offline-first architecture with local SQLite database
- Background sync service with conflict resolution
- JWT token-based authentication

### Platform Requirements

**iOS:**
- Minimum version: iOS 14.0+
- NFC capability requires iPhone 7+ with iOS 13+
- CoreNFC entitlements in Info.plist
- Distribution via App Store or Enterprise

**Android:**
- Minimum version: Android 8.0 (API 26)+
- NFC hardware required
- NFC permissions in AndroidManifest.xml
- Distribution via Google Play Store or APK sideloading

### Key Features

**NFC Operations:**
- Device discovery via NFC tap
- Read device diagnostics (battery, sensors, errors)
- Write configuration to device
- Offline device interaction

**Offline-First:**
- All operations work offline first
- Background sync when connectivity returns
- Queue pending operations
- Conflict resolution

**Field Technician Workflows:**
- Device provisioning with custom fields
- Configuration management
- Location capture (GPS + manual)
- Photo and document attachments
- Audit trail of all actions

---

## Security & Compliance

### Encryption
- **TLS 1.3** for data in transit
- **AES-256** for data at rest
- Certificate management with Let's Encrypt or internal PKI

### Secrets Management
- **HashiCorp Vault** - Secret storage and rotation
- **Kubernetes Secrets** - For containerized deployments
- **Azure Key Vault / AWS Secrets Manager** - Cloud options

### Compliance
- GDPR compliance for EU users
- Data residency controls
- Audit logging for all mutations

---

## Summary

This technology stack prioritizes:
- ✅ **Cloud Agnostic** - Deploy anywhere (AWS, Azure, GCP, on-premises)
- ✅ **Open Standards** - No vendor lock-in
- ✅ **Scalability** - Horizontal scaling via Kubernetes and message brokers
- ✅ **Observability** - Full instrumentation with OpenTelemetry
- ✅ **Developer Experience** - Modern tooling, strong typing, automated testing
- ✅ **Performance** - Time-series optimization, caching, edge delivery
- ✅ **Security** - Defense in depth, encryption, identity-based access

The stack can be incrementally adopted and components can be swapped as requirements evolve.
