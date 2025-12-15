# Sensormine Platform v5 - Quick Help Guide

## 🆘 Getting Help

### Documentation Files
- **README.md** - Project overview and getting started
- **.agent/current-state.md** - Current development status and completed work
- **docs/APPLICATION.md** - Microservices architecture and API reference
- **docs/DATABASE.md** - Database schema, tables, and queries
- **docs/INFRASTRUCTURE.md** - Container setup and deployment
- **docs/LOCAL-DEVELOPMENT.md** - Development environment setup
- **docs/custom-widget-system-complete.md** - Complete custom widget guide
- **docs/custom-widget-quick-start.md** - 10-minute widget tutorial
- **docs/device-type-architecture.md** - Device Type-centric architecture
- **docs/user-stories.md** - Feature requirements (122 stories)
- **docs/technology-stack.md** - Technology choices and rationale

### Developer Resources
- **Widget Development**: http://localhost:3020/help/developer#widgets
- **API Reference**: http://localhost:3020/help/developer#api
- **How-To Guides**: http://localhost:3020/help/developer#guides
- **Widget Gallery**: http://localhost:3020/widgets
- **Widget Upload**: http://localhost:3020/widgets/upload

---

## 🚀 Quick Start

### Start Everything
```powershell
# Start infrastructure (PostgreSQL, Kafka, Redis, MQTT, etc.)
docker-compose up -d

# Start Device.API
cd src/Services/Device.API
dotnet run

# Start frontend (in new terminal)
cd src/Web/sensormine-web
npm run dev
```

### Access Applications
- **Frontend**: http://localhost:3020
- **Device API**: http://localhost:5293
- **Schema Registry API**: http://localhost:5021

---

## 🔧 Common Commands

### Backend (.NET)
```powershell
# Restore packages
dotnet restore

# Build solution
dotnet build

# Run tests
dotnet test

# Run specific service
cd src/Services/Device.API
dotnet run

# Add migration
cd src/Services/Device.API
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update
```

### Frontend (Next.js)
```powershell
cd src/Web/sensormine-web

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npx vitest

# Run linter
npm run lint
```

### Docker
```powershell
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres

# Remove all volumes (clean slate)
docker-compose down -v
```

---

## 🗄️ Database Information

### Connection Strings

**TimescaleDB** (Time-series data)
```
Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123
```

**PostgreSQL** (Metadata - Device.API, Schema Registry)
```
Host=localhost;Port=5433;Database=sensormine_metadata;Username=sensormine;Password=sensormine123
```

**Redis** (Cache)
```
localhost:6379
```

### Database Tools
```powershell
# Connect to PostgreSQL
docker exec -it sensormine-postgres psql -U sensormine -d sensormine_metadata

# Connect to TimescaleDB
docker exec -it sensormine-timescaledb psql -U sensormine -d sensormine_timeseries

# Connect to Redis
docker exec -it sensormine-redis redis-cli
```

---

## 📁 Project Structure

```
src/
├── Web/
│   └── sensormine-web/        # Frontend (Next.js + React + TypeScript)
│       ├── src/
│       │   ├── app/           # Pages (App Router)
│       │   │   ├── settings/  # Settings section
│       │   │   │   ├── device-types/  # Device Type management
│       │   │   │   └── schemas/       # Schema management
│       │   │   ├── dashboard/
│       │   │   ├── devices/
│       │   │   └── charts/
│       │   ├── components/    # UI components
│       │   │   ├── layout/    # Layout components
│       │   │   ├── ui/        # shadcn/ui components
│       │   │   └── schemas/   # Schema-specific components
│       │   └── lib/
│       │       └── api/       # API client
│       └── __tests__/         # Vitest tests
│
├── Services/                  # Backend Microservices
│   ├── Device.API/            # Device & Device Type management (port 5293)
│   ├── SchemaRegistry.API/    # Schema management (port 5021)
│   ├── Query.API/             # Time-series queries
│   ├── Alerts.API/            # Alerting system
│   ├── Edge.Gateway/          # MQTT/OPC UA gateway
│   ├── Ingestion.Service/     # Data ingestion
│   └── ApiGateway/            # API gateway
│
└── Shared/                    # Shared Libraries
    ├── Sensormine.Core/       # Domain models
    ├── Sensormine.Storage/    # Data access
    ├── Sensormine.Messaging/  # Kafka/NATS
    ├── Sensormine.AI/         # ML & AI services
    └── Sensormine.Connectors/ # Industrial protocols
```

---

## 🎯 Current Development Status

### Completed Features (12 stories, 136 points)
- ✅ Frontend project setup (Next.js 14 + React + TypeScript)
- ✅ **Device Type Management** (Settings → Device Types)
  - Create, list, search, filter device types
  - Protocol configurations (MQTT, HTTP, WebSocket, OPC UA, Modbus, BACnet, EtherNet/IP)
  - Custom field definitions
  - Alert rule templates
- ✅ **Schema Management** (Settings → Schemas)
  - AI-powered schema generation
  - Schema CRUD operations
  - Version management
- ✅ Dashboard builder with drag-and-drop
- ✅ Time-series charts (Recharts)
- ✅ GIS map widget (Leaflet)
- ✅ Gauge and KPI widgets
- ✅ Industrial protocol connectors (OPC UA, Modbus, BACnet, EtherNet/IP)
- ✅ Time-series query API (TimescaleDB)

### Active Development
- 🎯 **Epic 1**: Device Type Configuration (1 of 5 stories complete)
- 🎯 **Epic 4**: Visualization & Dashboards (5 of 11 stories complete)

### Next Stories
1. **Story 1.2**: Edit Device Type Configuration
2. **Story 1.3**: Schema Assignment to Device Type
3. **Story 4.3**: Video Timeline Widget

---

## 🏗️ Architecture Highlights

### Device Type-Centric Design
- **Device Types** define configuration templates
- Devices inherit configuration from their type
- Protocol settings, custom fields, and alert rules are defined at the type level
- Centralized management in Settings → Device Types

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Context + Zustand
- **API Client**: Custom TypeScript client with error handling

### Backend Architecture
- **Style**: Microservices with event-driven communication
- **Runtime**: .NET 9 with C# 12
- **Database**: PostgreSQL + TimescaleDB
- **Messaging**: Kafka (primary), NATS (edge)
- **Patterns**: Repository pattern, CQRS (planned), Clean Architecture

---

## 🧪 Testing

### Run All Tests
```powershell
# Backend tests
dotnet test

# Frontend tests
cd src/Web/sensormine-web
npx vitest
```

### Test Status
- Device.API Controller: 14/14 tests passing (100%)
- Device.API Repository: 24/26 tests passing (92%)
- Schema Registry: All tests passing
- Query API: 27/27 tests passing (100%)

---

## 🐛 Troubleshooting

### Frontend Issues

**Cannot connect to API (CORS error)**
- Check Device.API is running on port 5293
- Verify .env.local has correct API URL: `NEXT_PUBLIC_API_BASE_URL=http://localhost:5293`
- Check Device.API Program.cs has CORS policy for localhost:3020

**UI not updating after changes**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Restart Next.js dev server: `npm run dev`

### Backend Issues

**Database connection failed**
- Check Docker containers: `docker-compose ps`
- Restart PostgreSQL: `docker-compose restart postgres`
- Verify connection string in appsettings.Development.json

**Migration errors**
```powershell
# Reset database and reapply migrations
docker-compose down -v
docker-compose up -d postgres
cd src/Services/Device.API
dotnet ef database update
```

**Port already in use**
- Kill process on port: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5293).OwningProcess -Force`
- Or change port in launchSettings.json

### Docker Issues

**Containers not starting**
```powershell
# Check container logs
docker-compose logs postgres
docker-compose logs kafka

# Restart all containers
docker-compose restart

# Clean restart
docker-compose down
docker-compose up -d
```

**Out of disk space**
```powershell
# Remove unused images and volumes
docker system prune -a --volumes
```

---

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3020 | http://localhost:3020 |
| Device Simulator | 3021 | http://localhost:3021 |
| Device.API | 5293 | http://localhost:5293 |
| SchemaRegistry.API | 5021 | http://localhost:5021 |
| PostgreSQL | 5433 | localhost:5433 |
| TimescaleDB | 5452 | localhost:5452 |
| Redis | 6379 | localhost:6379 |
| Kafka | 9092 | localhost:9092 |
| Kafka UI | 8080 | http://localhost:8080 |
| MQTT | 1883 | mqtt://localhost:1883 |
| MinIO | 9000, 9090 | http://localhost:9090 |
| OpenSearch | 9200 | http://localhost:9200 |
| Jaeger | 16686 | http://localhost:16686 |

---

## 🔐 Default Credentials

**PostgreSQL**
- Username: `sensormine`
- Password: `sensormine123`

**MinIO**
- Access Key: `minio`
- Secret Key: `minio123`

**MQTT**
- No authentication (development mode)

---

## 📞 Support

### Getting Help
1. Check this HELP.md file
2. Read documentation in `docs/` folder
3. Check `.agent/current-state.md` for current status
4. Review GitHub Issues: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues

### Reporting Issues
1. Check if issue already exists
2. Provide clear reproduction steps
3. Include error messages and logs
4. Specify environment (OS, .NET version, Node version)

---

**Last Updated**: December 6, 2025
