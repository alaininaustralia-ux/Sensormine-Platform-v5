# Sensormine Platform v5

A cloud-agnostic industrial IoT platform built with C# .NET 8 microservices architecture for real-time data ingestion, processing, and analytics.

---

## 📚 Core Documentation (Start Here)

**For AI Agents & Developers:**

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[📌 LOCAL-DEVELOPMENT.md](docs/LOCAL-DEVELOPMENT.md)** | **Quick start, setup, troubleshooting** | Setting up local environment |
| **[🏗️ APPLICATION.md](docs/APPLICATION.md)** | **Microservices, APIs, domain models** | Understanding application architecture |
| **[🗄️ DATABASE.md](docs/DATABASE.md)** | **Database schema, queries, optimization** | Working with data layer |
| **[🐳 INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)** | **Containers, deployment, monitoring** | Infrastructure and DevOps |
| **[⚡ DATABASE-QUICK-REFERENCE.md](docs/DATABASE-QUICK-REFERENCE.md)** | **Connection strings, common commands** | Quick database reference |

---

## 🏗️ Architecture Overview

### Architectural Principles
- **Microservices Architecture**: Independently deployable services
- **Event-Driven**: Asynchronous communication via message brokers
- **API-First**: RESTful APIs with OpenAPI documentation
- **Schema-Driven**: Centralized schema registry for data validation
- **Cloud-Agnostic**: Deploy on any cloud or on-premises

### Technology Stack

**Full stack details**: See [`docs/technology-stack.md`](docs/technology-stack.md)

| Category | Technology |
|----------|-----------|
| **Frontend Web** | React 18 + Next.js 14, shadcn/ui, Tailwind CSS |
| **Mobile App** | .NET MAUI (iOS/Android), NFC support |
| **Backend Runtime** | .NET 8 (C# 12) |
| **API Framework** | ASP.NET Core Web API |
| **Messaging** | Apache Kafka, NATS, MQTT |
| **Time-Series DB** | TimescaleDB (PostgreSQL extension) |
| **Relational DB** | PostgreSQL 15+ |
| **Cache** | Redis 7+ |
| **Object Storage** | S3-Compatible (MinIO, AWS S3, Azure Blob) |
| **Search** | OpenSearch / Elasticsearch |
| **Authentication** | Keycloak (OIDC/JWT) |
| **Container Orchestration** | Kubernetes + Helm |
| **IaC** | Terraform |
| **Observability** | Prometheus, Grafana, OpenTelemetry, Jaeger |

## 📁 Project Structure

```
Sensormine/
├── src/
│   ├── Web/                   # Frontend Applications
│   │   ├── sensormine-web/    # React + Next.js web app
│   │   ├── device-simulator/  # Device simulator for testing
│   │   └── Sensormine.Mobile.Maui/ # .NET MAUI mobile app (iOS/Android)
│   ├── Services/              # Microservices
│   │   ├── Edge.Gateway/      # MQTT/OPC UA gateway
│   │   ├── Ingestion.Service/ # Data ingestion pipeline
│   │   ├── StreamProcessing.Service/ # Real-time processing
│   │   ├── Device.API/        # Device management
│   │   ├── SchemaRegistry.API/# Schema management
│   │   ├── Query.API/         # Time-series queries
│   │   ├── Alerts.API/        # Alerting system
│   │   ├── DigitalTwin.API/   # Digital twin operations
│   │   ├── VideoMetadata.API/ # Video/CAD/Lidar metadata
│   │   └── ApiGateway/        # API gateway
│   └── Shared/                # Shared libraries
│       ├── Sensormine.Core/   # Core models & interfaces
│       ├── Sensormine.Messaging/ # Message broker abstractions
│       ├── Sensormine.Storage/   # Storage repositories
│       ├── Sensormine.AI/        # ML inference & embeddings
│       └── Sensormine.Schemas/   # Schema validation
├── infrastructure/
│   ├── helm/                  # Kubernetes Helm charts
│   ├── terraform/             # Infrastructure as Code
│   └── mqtt/                  # MQTT broker configuration
├── tests/                     # Unit & integration tests
├── docker-compose.yml         # Local development environment
└── Sensormine.sln            # Solution file
```

## 🚀 Getting Started

### Prerequisites

- [.NET 9+ SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) (for frontend development)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Kubernetes](https://kubernetes.io/) (for production deployment)
- [Terraform](https://www.terraform.io/) (for infrastructure provisioning)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Orion
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

   This starts 9 containers:
   - **Kafka** (port 9092) - Event streaming
   - **MQTT Broker** (ports 1883, 9001) - IoT device connectivity  
   - **TimescaleDB** (port 5452) - **Time-series telemetry data**
   - **PostgreSQL** (port 5433) - **Configuration & metadata**
   - **Redis** (port 6379) - Cache & sessions
   - **MinIO** (ports 9000, 9090) - Object storage
   - **OpenSearch** (port 9200) - Full-text search
   - **Jaeger** (port 16686) - Distributed tracing
   - **Kafka UI** (port 8080) - Kafka management
   
   > **📚 Infrastructure Guides**: 
   > - [local-infrastructure.md](docs/local-infrastructure.md) - Complete setup guide
   > - [database-architecture.md](docs/database-architecture.md) - **Database strategy & best practices**

3. **Restore dependencies**
   ```bash
   dotnet restore
   ```

4. **Build the solution**
   ```bash
   dotnet build
   ```

5. **Run a service** (example: Device.API)
   ```bash
   cd src/Services/Device.API
   dotnet run
   ```

6. **Start frontend** (optional)
   ```bash
   cd src/Web/sensormine-web
   npm install
   npm run dev
   ```

7. **Build Mobile App** (.NET MAUI - optional, requires MAUI workload)
   ```bash
   # Install MAUI workload (one-time)
   dotnet workload install maui
   
   # Navigate to MAUI project
   cd src/Web/Sensormine.Mobile.Maui
   
   # Restore dependencies
   dotnet restore
   
   # Build for Android
   dotnet build -f net8.0-android
   
   # Build for iOS (macOS only)
   dotnet build -f net8.0-ios
   
   # Run on Android emulator
   dotnet build -t:Run -f net8.0-android
   ```
   
   > **📱 MAUI Requirements**:
   > - See [src/Web/Sensormine.Mobile.Maui/README.md](src/Web/Sensormine.Mobile.Maui/README.md) for detailed setup
   > - iOS development requires macOS and Xcode 15+
   > - Android development requires Android SDK API 26+
   > - For complete mobile app requirements, see [docs/mobile-maui-requirements.md](docs/mobile-maui-requirements.md)

8. **Access services**
   - Frontend Web App: http://localhost:3020
   - Device API: http://localhost:5293/swagger
   - Schema Registry API: http://localhost:5021/swagger
   - Kafka UI: http://localhost:8080
   - MinIO Console: http://localhost:9090 (minio/minio123)
   - Jaeger UI: http://localhost:16686

## 🔧 Configuration

Each microservice uses `appsettings.json` with environment-specific overrides:

```json
{
  "ConnectionStrings": {
    "TimescaleDB": "Host=localhost;Port=5432;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123",
    "PostgreSQL": "Host=localhost;Port=5433;Database=sensormine_metadata;Username=sensormine;Password=sensormine123",
    "Redis": "localhost:6379"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "GroupId": "sensormine-group"
  },
  "MQTT": {
    "BrokerAddress": "localhost",
    "Port": 1883
  },
  "ObjectStorage": {
    "Endpoint": "localhost:9000",
    "AccessKey": "minio",
    "SecretKey": "minio123",
    "UseSsl": false
  }
}
```

## 🧩 Microservices

### Edge & Connectivity Layer
- **Edge.Gateway**: MQTT/OPC UA protocol gateway, device connectivity

### Ingestion Pipeline
- **Ingestion.Service**: Kafka consumer, schema validation, multi-tenant routing

### Stream Processing
- **StreamProcessing.Service**: Real-time data processing, ML inference (ONNX)

### API Layer
- **Device.API**: Device CRUD, registration, metadata management
- **SchemaRegistry.API**: Schema registration, validation, versioning
- **Query.API**: Time-series and metadata queries
- **Alerts.API**: Alert configuration, notification management
- **DigitalTwin.API**: Digital twin state management
- **VideoMetadata.API**: Video, CAD, Lidar file metadata
- **ApiGateway**: Unified API gateway (Ocelot/YARP)

## 🐳 Docker Support

### Build all services
```bash
docker-compose build
```

### Run specific service
```bash
docker-compose up edge-gateway
```

## ☸️ Kubernetes Deployment

### Using Helm

1. **Install Helm chart**
   ```bash
   helm install sensormine infrastructure/helm/sensormine-platform \
     --namespace sensormine \
     --create-namespace \
     --values infrastructure/helm/sensormine-platform/values.yaml
   ```

2. **Upgrade deployment**
   ```bash
   helm upgrade sensormine infrastructure/helm/sensormine-platform
   ```

3. **Uninstall**
   ```bash
   helm uninstall sensormine --namespace sensormine
   ```

### Using Terraform

1. **Initialize Terraform**
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

2. **Plan infrastructure**
   ```bash
   terraform plan -var="cluster_name=sensormine-prod"
   ```

3. **Apply infrastructure**
   ```bash
   terraform apply -var="cluster_name=sensormine-prod"
   ```

## 🧪 Testing

### Run all tests
```bash
dotnet test
```

### Run specific test project
```bash
dotnet test tests/Sensormine.Core.Tests
```

### Integration tests
```bash
dotnet test --filter Category=Integration
```

## 📊 Monitoring & Observability

- **OpenTelemetry**: Distributed tracing and metrics
- **Jaeger**: Trace visualization (http://localhost:16686)
- **Health Checks**: `/health` endpoint on all services
- **Prometheus Metrics**: `/metrics` endpoint

## 🔐 Security

- Multi-tenant isolation at application and data layers
- API authentication via JWT tokens
- TLS/SSL for all external communications
- Secrets management via Kubernetes Secrets or cloud provider key vaults

## 🌐 Deployment Targets

The platform supports multiple deployment scenarios:

- ✅ **Cloud Kubernetes**: AWS EKS, Azure AKS, Google GKE
- ✅ **On-Premises**: Self-managed Kubernetes clusters
- ✅ **Hybrid**: Mix of cloud and on-premises
- ✅ **Air-Gapped**: Fully disconnected environments

## 📚 Additional Resources

- [Architecture Documentation](docs/architecture.md) - System design and patterns
- [Technology Stack](docs/technology-stack.md) - Complete technology choices
- [Development Guide](docs/development.md) - Local development workflow
- [Local Infrastructure](docs/local-infrastructure.md) - Container configuration and troubleshooting
- [Deployment Guide](docs/deployment.md) - Production deployment
- [User Stories](docs/user-stories.md) - Feature requirements and planning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ using .NET 8 and cloud-native technologies**
