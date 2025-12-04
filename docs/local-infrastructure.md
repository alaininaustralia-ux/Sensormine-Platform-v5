# Local Infrastructure Setup

This document explains all the containers configured in `docker-compose.yml` for local development.

## Overview

The Sensormine Platform uses Docker Compose to run a complete local infrastructure stack that mimics the production environment. This enables full-stack development and testing without requiring cloud resources.

## Quick Start

```powershell
# Start all infrastructure services
docker-compose up -d

# Check service status
docker-compose ps

# View logs for a specific service
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

Or use the VS Code tasks:
- **start-infrastructure**: Starts all containers
- **stop-infrastructure**: Stops all containers

---

## Services Configuration

### 1. Message Brokers

#### Kafka (Apache Kafka)
**Image**: `confluentinc/cp-kafka:7.5.0`  
**Container**: `sensormine-kafka`  
**Ports**: 
- `9092` - Client connections (localhost)
- `29092` - Internal broker communication

**Purpose**: Event streaming platform for microservices communication, data ingestion pipelines, and event sourcing.

**Configuration**:
- KRaft mode (no ZooKeeper dependency)
- Single-node cluster for local development
- Replication factor: 1

**Use Cases**:
- Device telemetry ingestion
- Inter-service event messaging
- Stream processing pipeline inputs/outputs
- Audit log streaming

**Connection String**: `localhost:9092`

**Management UI**: Available via Kafka UI (see below)

---

#### MQTT Broker (Eclipse Mosquitto)
**Image**: `eclipse-mosquitto:2.0`  
**Container**: `sensormine-mqtt`  
**Ports**: 
- `1883` - MQTT protocol
- `9001` - WebSocket connections

**Purpose**: Lightweight pub/sub messaging for IoT devices and edge gateways.

**Configuration File**: `infrastructure/mqtt/mosquitto.conf`

**Use Cases**:
- Edge device connectivity
- Sensor data collection
- Real-time device commands
- Mobile app notifications

**Connection String**: `mqtt://localhost:1883`

**Volumes**:
- Configuration: `./infrastructure/mqtt/mosquitto.conf`
- Data: `mqtt_data`
- Logs: `mqtt_logs`

---

### 2. Databases

#### TimescaleDB (Time-Series Database)
**Image**: `timescale/timescaledb:latest-pg16`  
**Container**: `sensormine-timescaledb`  
**Port**: `5452` (mapped to internal 5432)

**Purpose**: High-performance time-series database for sensor data, metrics, and telemetry.

**Credentials**:
- Username: `sensormine`
- Password: `sensormine123`
- Database: `sensormine_timeseries`

**Connection String**: 
```
Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123
```

**Use Cases**:
- Sensor readings and telemetry
- Time-series metrics
- Historical data queries
- Aggregations and downsampling

**Features**:
- Automatic partitioning (hypertables)
- Compression for older data
- Continuous aggregates
- Time-based retention policies

**Volume**: `timescaledb_data`

---

#### PostgreSQL (Metadata Database)
**Image**: `postgres:16`  
**Container**: `sensormine-postgres`  
**Port**: `5433` (mapped to internal 5432)

**Purpose**: Relational database for application metadata, configuration, and business data.

**Credentials**:
- Username: `sensormine`
- Password: `sensormine123`
- Database: `sensormine_metadata`

**Connection String**: 
```
Host=localhost;Port=5433;Database=sensormine_metadata;Username=sensormine;Password=sensormine123
```

**Use Cases**:
- User accounts and profiles
- Device registrations
- Dashboard configurations
- Alert rules and definitions
- Schema registry metadata
- Billing records

**Volume**: `postgres_data`

---

### 3. Cache & Session Store

#### Redis
**Image**: `redis:7-alpine`  
**Container**: `sensormine-redis`  
**Port**: `6379`

**Purpose**: In-memory data store for caching, session management, and real-time features.

**Configuration**: Append-only file (AOF) persistence enabled

**Connection String**: `localhost:6379`

**Use Cases**:
- API response caching
- Session storage
- Rate limiting counters
- Real-time leaderboards
- Pub/Sub for SignalR backplane
- Distributed locks
- Job queues

**Volume**: `redis_data` (for AOF persistence)

---

### 4. Object Storage

#### MinIO (S3-Compatible Storage)
**Image**: `minio/minio:latest`  
**Container**: `sensormine-minio`  
**Ports**: 
- `9000` - S3 API
- `9090` - Management Console

**Purpose**: Local S3-compatible object storage for files, videos, and large data objects.

**Credentials**:
- Access Key: `minio`
- Secret Key: `minio123`

**Console URL**: http://localhost:9090

**S3 Endpoint**: `http://localhost:9000`

**Use Cases**:
- Video file storage
- CAD model files
- LiDAR point cloud data
- Report generation output
- Backup archives
- User uploads

**Volume**: `minio_data`

**Buckets to Create**:
- `videos` - Video recordings
- `models` - 3D CAD models
- `lidar` - Point cloud data
- `exports` - Data exports
- `uploads` - User uploads

---

### 5. Search Engine

#### OpenSearch
**Image**: `opensearchproject/opensearch:2.11.0`  
**Container**: `sensormine-opensearch`  
**Ports**: 
- `9200` - REST API
- `9600` - Performance Analyzer

**Purpose**: Full-text search and analytics engine for logs, events, and metadata.

**Configuration**:
- Single-node cluster
- Security plugin disabled (for local dev)
- 512MB heap size

**REST API URL**: http://localhost:9200

**Use Cases**:
- Log aggregation and search
- Device search by properties
- Full-text search in documents
- Alert event history
- Audit trail queries
- Analytics dashboards

**Volume**: `opensearch_data`

**Indices**:
- `logs-*` - Application logs
- `events-*` - System events
- `devices` - Device metadata
- `alerts` - Alert history

---

### 6. Observability

#### Jaeger (Distributed Tracing)
**Image**: `jaegertracing/all-in-one:1.52`  
**Container**: `sensormine-jaeger`  
**Ports**: 
- `16686` - Jaeger UI
- `4317` - OTLP gRPC (OpenTelemetry)
- `4318` - OTLP HTTP (OpenTelemetry)

**Purpose**: Distributed tracing for microservices debugging and performance monitoring.

**UI URL**: http://localhost:16686

**Use Cases**:
- Request tracing across microservices
- Performance bottleneck identification
- Dependency mapping
- Latency analysis
- Error tracking

**Features**:
- OpenTelemetry Protocol (OTLP) support
- Service dependency graph
- Trace comparison
- Root cause analysis

---

### 7. Management UIs

#### Kafka UI
**Image**: `provectuslabs/kafka-ui:latest`  
**Container**: `sensormine-kafka-ui`  
**Port**: `8080`

**Purpose**: Web interface for managing and monitoring Kafka.

**UI URL**: http://localhost:8080

**Features**:
- Topic management (create, delete, configure)
- Message browser
- Consumer group monitoring
- Schema registry integration
- Cluster health metrics

**Dependencies**: Requires Kafka to be running

---

## Network Configuration

All services run on a custom bridge network: `sensormine-network`

This allows:
- Service discovery by container name
- Isolated network for the platform
- Inter-service communication without exposing ports

**Service-to-Service Communication**:
- Use container names as hostnames (e.g., `kafka:29092`, `redis:6379`)
- External applications use `localhost` and mapped ports

---

## Data Persistence

### Volumes

All data is persisted in Docker volumes:

| Volume | Service | Purpose |
|--------|---------|---------|
| `kafka_data` | Kafka | Message logs and metadata |
| `mqtt_data` | MQTT | Retained messages |
| `mqtt_logs` | MQTT | Broker logs |
| `timescaledb_data` | TimescaleDB | Time-series data |
| `postgres_data` | PostgreSQL | Metadata and configuration |
| `redis_data` | Redis | AOF persistence file |
| `minio_data` | MinIO | Object storage |
| `opensearch_data` | OpenSearch | Indices and documents |

**⚠️ Warning**: Running `docker-compose down -v` will delete all volumes and data!

### Backing Up Data

```powershell
# Backup TimescaleDB
docker exec sensormine-timescaledb pg_dump -U sensormine sensormine_timeseries > backup_timeseries.sql

# Backup PostgreSQL
docker exec sensormine-postgres pg_dump -U sensormine sensormine_metadata > backup_metadata.sql

# Backup MinIO buckets
docker exec sensormine-minio mc mirror /data ./minio-backup
```

---

## Resource Requirements

**Minimum System Requirements**:
- **RAM**: 8GB (16GB recommended)
- **CPU**: 4 cores (8 cores recommended)
- **Disk**: 20GB free space

**Container Resource Usage** (approximate):

| Service | Memory | CPU |
|---------|--------|-----|
| Kafka | 1GB | 0.5 |
| MQTT | 128MB | 0.1 |
| TimescaleDB | 512MB | 0.5 |
| PostgreSQL | 256MB | 0.3 |
| Redis | 256MB | 0.1 |
| MinIO | 256MB | 0.2 |
| OpenSearch | 1GB | 0.5 |
| Jaeger | 256MB | 0.2 |
| Kafka UI | 256MB | 0.1 |
| **Total** | **~4GB** | **2.5** |

---

## Troubleshooting

### Services Won't Start

```powershell
# Check Docker Desktop is running
docker version

# Check port conflicts
netstat -ano | findstr "9092|5432|6379"

# View service logs
docker-compose logs [service-name]

# Restart a specific service
docker-compose restart [service-name]
```

### Performance Issues

```powershell
# Check container stats
docker stats

# Increase Docker Desktop resources
# Settings → Resources → Advanced
# Increase Memory to 8GB+ and CPUs to 4+
```

### Data Corruption

```powershell
# Stop all services
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Connection Refused Errors

- Ensure all services are fully started: `docker-compose ps`
- Wait for health checks to pass (Kafka takes ~30s to start)
- Check service logs for errors: `docker-compose logs -f [service-name]`

---

## Development Workflow

### 1. Starting Fresh

```powershell
# Clean slate
docker-compose down -v

# Start infrastructure
docker-compose up -d

# Wait for services to be healthy
Start-Sleep -Seconds 30

# Run database migrations
dotnet ef database update --project src/Services/Device.API

# Seed test data
dotnet run --project scripts/SeedData
```

### 2. Daily Development

```powershell
# Start infrastructure (reuses existing data)
docker-compose up -d

# Check what's running
docker-compose ps

# View combined logs
docker-compose logs -f
```

### 3. Cleanup

```powershell
# Stop but keep data
docker-compose down

# Stop and remove everything
docker-compose down -v
```

---

## Production Differences

The local infrastructure differs from production in several ways:

| Aspect | Local | Production |
|--------|-------|------------|
| **High Availability** | Single node | Multi-node clusters |
| **Persistence** | Docker volumes | Cloud block storage |
| **Security** | Disabled/basic | TLS, authentication, RBAC |
| **Backups** | Manual | Automated snapshots |
| **Monitoring** | Jaeger only | Full observability stack |
| **Scaling** | Fixed resources | Auto-scaling |
| **Networking** | Bridge network | VPC with security groups |

**Transition to Production**:
- Use managed services (Azure IoT Hub, Event Hubs, PostgreSQL)
- Enable authentication and TLS for all services
- Implement proper secret management (Key Vault)
- Set up monitoring and alerting
- Configure automated backups and disaster recovery

---

## Related Documentation

- **Architecture**: `docs/architecture.md` - Overall system design
- **Development Guide**: `docs/development.md` - Development workflow
- **Deployment**: `docs/deployment.md` - Production deployment
- **Technology Stack**: `docs/technology-stack.md` - Technology choices

---

## Quick Reference

### All Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Kafka UI | http://localhost:8080 | N/A |
| MinIO Console | http://localhost:9090 | minio / minio123 |
| Jaeger UI | http://localhost:16686 | N/A |
| OpenSearch | http://localhost:9200 | N/A |

### All Connection Strings

```bash
# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# MQTT
MQTT_SERVER=mqtt://localhost:1883

# TimescaleDB
TIMESCALE_CONNECTION=Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123

# PostgreSQL
POSTGRES_CONNECTION=Host=localhost;Port=5433;Database=sensormine_metadata;Username=sensormine;Password=sensormine123

# Redis
REDIS_CONNECTION=localhost:6379

# MinIO (S3-compatible)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

# OpenSearch
OPENSEARCH_URL=http://localhost:9200

# Jaeger (OTLP)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Environment Variables Template

Create a `.env` file in the root directory:

```env
# Databases
TIMESCALE_CONNECTION=Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123
POSTGRES_CONNECTION=Host=localhost;Port=5433;Database=sensormine_metadata;Username=sensormine;Password=sensormine123

# Messaging
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
MQTT_SERVER=mqtt://localhost:1883

# Cache
REDIS_CONNECTION=localhost:6379

# Object Storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

# Search
OPENSEARCH_URL=http://localhost:9200

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831

# Application
ASPNETCORE_ENVIRONMENT=Development
```
