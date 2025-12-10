# Infrastructure Architecture

**Last Updated:** December 10, 2025  
**Status:** Production-Ready  
**Environment:** Docker Compose (Development), Kubernetes (Production)

---

## 🎯 Overview

The Sensormine Platform infrastructure consists of containerized services orchestrated via Docker Compose for local development and Kubernetes for production deployments.

---

## 📦 Container Architecture

### Core Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Sensormine Platform                      │
├─────────────────────────────────────────────────────────────┤
│  Data Storage Layer                                         │
│  ├─ TimescaleDB (Port 5452)                                │
│  │  ├─ sensormine_metadata (operational data)              │
│  │  └─ sensormine_timeseries (telemetry data)             │
│  ├─ Redis (Port 6379) - Caching & Session                  │
│  └─ MinIO (Ports 9000, 9090) - Object Storage             │
├─────────────────────────────────────────────────────────────┤
│  Message Brokers                                            │
│  ├─ Kafka (Port 9092) - Event Streaming                    │
│  └─ MQTT (Ports 1883, 9001) - Device Connectivity         │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (Microservices)                          │
│  ├─ ApiGateway (Port 5000)                                 │
│  ├─ Device.API (Port 5293)                                 │
│  ├─ SchemaRegistry.API (Port 5021)                         │
│  ├─ DigitalTwin.API (Port 5297)                            │
│  ├─ Dashboard.API (Port 5299)                              │
│  ├─ Query.API (Port 5079)                                  │
│  ├─ Ingestion.Service (Port 5022)                          │
│  ├─ Edge.Gateway (Port 5023)                               │
│  ├─ Alerts.API (Port 5295)                                 │
│  └─ [Additional Services...]                               │
├─────────────────────────────────────────────────────────────┤
│  Frontend Applications                                      │
│  ├─ Sensormine Web (Port 3020)                            │
│  └─ Device Simulator (Port 3021)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Storage

### 1. TimescaleDB Container
**Image:** Custom (built from `infrastructure/timescaledb/Dockerfile`)  
**Container Name:** `sensormine-timescaledb`  
**Host Port:** `5452` → Container Port `5432`

**Databases:**
- `sensormine_metadata` - Devices, assets, dashboards, schemas, users
- `sensormine_timeseries` - Telemetry, events, metrics (hypertables)

**Credentials:**
```
Username: sensormine
Password: sensormine123
```

**Connection Strings:**
```
Metadata:    Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123
Timeseries:  Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123
```

**Volume:** `timescaledb_data`

**Configuration:**
- Max Connections: 500
- Shared Buffers: 256MB
- Effective Cache Size: 1GB
- Work Memory: 16MB

### 2. Redis
**Image:** `redis:7-alpine`  
**Container Name:** `sensormine-redis`  
**Port:** `6379`

**Purpose:**
- API response caching
- Session storage
- Rate limiting counters
- Pub/Sub for SignalR
- Distributed locks

**Persistence:** AOF (Append-Only File) enabled  
**Volume:** `redis_data`

### 3. MinIO (S3-Compatible Storage)
**Image:** `minio/minio:latest`  
**Container Name:** `sensormine-minio`  
**Ports:**
- `9000` - S3 API
- `9090` - Management Console

**Credentials:**
```
Access Key: minio
Secret Key: minio123
```

**Console URL:** http://localhost:9090  
**Volume:** `minio_data`

---

## 📨 Message Brokers

### 1. Apache Kafka
**Image:** `confluentinc/cp-kafka:7.5.0`  
**Container Name:** `sensormine-kafka`  
**Port:** `9092`

**Mode:** KRaft (without Zookeeper)

**Configuration:**
- Node ID: 1
- Replication Factor: 1 (dev), 3 (prod)
- Listeners: PLAINTEXT, CONTROLLER, PLAINTEXT_HOST

**Volume:** `kafka_data`

**Topics:**
- `device.telemetry` - Raw telemetry data
- `device.events` - Device state changes
- `asset.updates` - Asset hierarchy changes
- `alerts.triggered` - Alert notifications

### 2. MQTT Broker (Mosquitto)
**Image:** `eclipse-mosquitto:2.0`  
**Container Name:** `sensormine-mqtt`  
**Ports:**
- `1883` - MQTT Protocol
- `9001` - WebSocket

**Config:** `infrastructure/mqtt/mosquitto.conf`  
**Volumes:**
- Config: `./infrastructure/mqtt/mosquitto.conf`
- Data: `mqtt_data`
- Logs: `mqtt_logs`

---

## 🌐 Networking

**Network Name:** `sensormine-network`  
**Driver:** Bridge

**DNS Resolution:**
- Services communicate using container names
- Example: `kafka:29092`, `mqtt:1883`, `timescaledb:5432`

---

## 📂 Volume Management

### Persistent Volumes

| Volume Name | Purpose | Backup Priority |
|-------------|---------|-----------------|
| `timescaledb_data` | All PostgreSQL data | **Critical** - Daily |
| `kafka_data` | Kafka logs/topics | High - Daily |
| `redis_data` | AOF persistence | Medium - Daily |
| `minio_data` | Object storage | High - Daily |
| `mqtt_data` | MQTT persistence | Low - Weekly |
| `mqtt_logs` | MQTT logs | Low - Not backed up |

### Backup Commands

```powershell
# Backup TimescaleDB (metadata)
docker exec sensormine-timescaledb pg_dump -U sensormine sensormine_metadata > backup_metadata_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Backup TimescaleDB (timeseries)
docker exec sensormine-timescaledb pg_dump -U sensormine sensormine_timeseries > backup_timeseries_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Backup Redis
docker exec sensormine-redis redis-cli SAVE
docker cp sensormine-redis:/data/dump.rdb ./backup_redis_$(Get-Date -Format 'yyyyMMdd_HHmmss').rdb

# Backup MinIO
docker exec sensormine-minio mc mirror /data ./backup_minio_$(Get-Date -Format 'yyyyMMdd_HHmmss')
```

---

## 🚀 Deployment

### Development (Docker Compose)

**Start Infrastructure:**
```powershell
cd C:\Users\AlainBlanchette\code\Orion
docker-compose up -d
```

**Verify Services:**
```powershell
docker ps
docker logs sensormine-timescaledb
docker logs sensormine-kafka
```

**Stop Infrastructure:**
```powershell
docker-compose down
```

**Clean Reset:**
```powershell
docker-compose down -v  # WARNING: Deletes all volumes
```

### Production (Kubernetes)

**Helm Charts Location:** `infrastructure/helm/sensormine-platform/`

**Install:**
```bash
helm install sensormine ./infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --create-namespace \
  --values values-production.yaml
```

**Upgrade:**
```bash
helm upgrade sensormine ./infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values values-production.yaml
```

---

## 🔒 Security

### Network Security
- All services within `sensormine-network` (isolated bridge network)
- Only necessary ports exposed to host
- No direct internet exposure in production (behind API Gateway)

### Data Security
- TLS/SSL for all external communications
- Encrypted volumes in production
- Secret management via Kubernetes Secrets or Azure Key Vault
- Database connection strings stored in environment variables

### Authentication
- API Gateway handles authentication via JWT tokens
- Service-to-service communication uses mTLS in production
- MQTT uses username/password authentication

---

## 📊 Monitoring & Observability

### Health Checks
Each service exposes:
- `/health` - Liveness probe
- `/health/ready` - Readiness probe

### Metrics
- Prometheus format metrics at `/metrics`
- Custom business metrics (device count, telemetry rate, etc.)

### Logging
- Structured JSON logging
- Centralized log aggregation via OpenTelemetry
- Log levels: Debug, Information, Warning, Error, Critical

### Tracing
- Distributed tracing via OpenTelemetry
- Trace IDs propagated across services
- Jaeger for trace visualization

---

## 🔧 Troubleshooting

### Common Issues

**1. Container Won't Start**
```powershell
# Check logs
docker logs sensormine-timescaledb --tail 50

# Check resource usage
docker stats

# Verify network
docker network inspect sensormine-network
```

**2. Database Connection Failed**
```powershell
# Verify database is running
docker exec sensormine-timescaledb psql -U sensormine -d postgres -c "\l"

# Test connection from host
Test-NetConnection -ComputerName localhost -Port 5452
```

**3. Port Already in Use**
```powershell
# Find process using port
netstat -ano | findstr :5452

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

**4. Volume Permission Issues**
```powershell
# Reset Docker volumes
docker-compose down -v
docker-compose up -d
```

---

## 📚 Related Documentation

- **[DATABASE-QUICK-REFERENCE.md](./DATABASE-QUICK-REFERENCE.md)** - Database connection strings
- **[database-separation.md](./database-separation.md)** - Database architecture details
- **[service-ports.md](./service-ports.md)** - Complete port mapping
- **[deployment.md](./deployment.md)** - Production deployment guide

---

## 🔄 Infrastructure as Code

### Docker Compose
**Location:** `docker-compose.yml`  
**Purpose:** Local development environment

### Terraform
**Location:** `infrastructure/terraform/`  
**Providers:** AWS, Azure, GCP (cloud-agnostic design)

### Helm Charts
**Location:** `infrastructure/helm/sensormine-platform/`  
**Includes:** All microservices, databases, message brokers

---

**Last Review:** December 10, 2025  
**Next Review:** January 10, 2026  
**Owner:** Platform Team
