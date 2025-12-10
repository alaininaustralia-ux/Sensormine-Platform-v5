# Sensormine Platform v5 - Documentation Hub

**Last Updated**: December 10, 2025 | **Version**: 5.0 | **Branch**: master

> 🚀 **Latest Update**: Documentation consolidation complete - 5 core AI-optimized documents created

---

## 📖 Documentation Overview

The Sensormine Platform v5 is a cloud-agnostic industrial IoT platform designed for high-throughput data ingestion, real-time processing, and advanced analytics at scale.

---

## ⚡ Core Documentation (Start Here)

> **These 5 documents contain everything you need to understand and work with the platform.**

| Document | Purpose | Read When |
|----------|---------|-----------|
| **[APPLICATION.md](APPLICATION.md)** | Microservices architecture, APIs, domain models, communication patterns | Starting any backend work |
| **[DATABASE.md](DATABASE.md)** | Database schema, tables, indexes, queries, multi-tenancy | Working with data layer |
| **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)** | Containers, networking, volumes, deployment, monitoring | Infrastructure or DevOps tasks |
| **[LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md)** | Setup, build, test, debug, troubleshooting | Setting up environment |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Docker Compose, Kubernetes, cloud providers, production deployment | Deploying to any environment |

### 🗝️ Quick Reference

| Document | Purpose | Read When |
|----------|---------|-----------|
| **[DATABASE-QUICK-REFERENCE.md](DATABASE-QUICK-REFERENCE.md)** | Connection strings, common commands | Quick database lookups |
| **[service-ports.md](service-ports.md)** | Port assignments and service endpoints | Port conflicts or service discovery |

---

## 📚 Supporting Documentation

### **Technology & Architecture**
- **[technology-stack.md](technology-stack.md)** - Technologies, frameworks, and rationale
- **[requirements.md](requirements.md)** - Platform requirements and specifications

### **User Management & Security**
- **[user-management-overview.md](user-management-overview.md)** - User management and authentication
- **[permissions-matrix.md](permissions-matrix.md)** - Role-based access control matrix

### **Project Management**
- **[user-stories.md](user-stories.md)** - User stories and epics
- **[PLATFORM-STATUS.md](PLATFORM-STATUS.md)** - Current platform status and progress

---

## 🗄️ Archived Documentation

Older documentation has been archived to `archive/` folder:
- Historical implementation notes
- Completed feature summaries
- Superseded architecture documents
- Detailed specifications (now in core docs or user stories)

**See [archive/README.md](archive/README.md)** for complete list and migration guide.

---

## 🎯 Feature Implementation Status

### **✅ Completed Features**

#### **Digital Twin & Asset Hierarchy**
- ✅ **Asset Hierarchy System** - LTREE-based hierarchical assets with GPS support
- ✅ **Asset State Management** - Real-time state tracking and aggregation
- ✅ **Data Point Mapping** - Schema-to-asset relationship management
- ✅ **Asset Rollup Configuration** - Hierarchical data aggregation rules

#### **Dashboard Asset Integration** *(Completed December 9-10, 2025)*
- ✅ **Story 1/6**: Asset Hierarchy Selector Component - Tree view with search and lazy loading
- ✅ **Story 2/6**: Query API Asset-Based Endpoints - Aggregated telemetry by asset
- ✅ **Story 3/6**: Device List Widget with Telemetry - Real-time device tables
- ✅ **Story 4/6**: Chart Widget with Asset Filtering - Time-series visualization
- ✅ **Story 5/6**: KPI and Gauge Widgets - Single-value metrics with trends
- ✅ **Story 6/6**: Widget Configuration Panel - Asset selector integration

#### **Core Platform Services**
- ✅ **Multi-Tenant Architecture** - UUID-based tenant isolation
- ✅ **Database Migration** - Dashboard.API moved to sensormine_metadata
- ✅ **MQTT Edge Gateway** - Industrial protocol support
- ✅ **Time-Series Ingestion** - High-throughput telemetry pipeline
- ✅ **Real-Time Query API** - Asset-based aggregation with caching
- ✅ **Device Management** - CRUD operations with type configuration
- ✅ **User Preferences** - Personalization and settings management

### **🚧 In Progress**
- 🔄 **Schema Registry Enhancement** - Dynamic schema validation and versioning
- 🔄 **Billing Integration** - Stripe-based metering and subscription management
- 🔄 **Advanced Analytics** - ML pipelines and anomaly detection

### **📅 Planned Features**
- 📅 **Mobile MAUI App** - Cross-platform mobile application
- 📅 **Video Metadata Processing** - Video analytics integration
- 📅 **Advanced Alerting** - Rule engine and notification system
- 📅 **SSO Integration** - Enterprise authentication providers

---

## 📊 Implementation Progress

| Epic | Stories | Completed | Progress |
|------|---------|-----------|----------|
| Digital Twin Core | 8 | 8 | ✅ 100% |
| Dashboard Asset Integration | 6 | 6 | ✅ 100% |
| Device Type Management | 12 | 8 | 🔄 67% |
| Data Ingestion Pipeline | 10 | 9 | 🔄 90% |
| Real-Time Analytics | 15 | 10 | 🔄 67% |
| Mobile Application | 8 | 0 | 📅 0% |
| Billing & Subscription | 10 | 3 | 🔄 30% |
| **Overall Platform** | **69** | **44** | **🔄 64%** |

---

## 🔗 API Documentation

### **Service Endpoints** (Local Development)
- **API Gateway**: http://localhost:5000 - Main entry point
- **Dashboard.API**: http://localhost:5298 - Dashboard management
- **DigitalTwin.API**: http://localhost:5297 - Asset hierarchy and digital twins
- **Query.API**: http://localhost:5299 - Time-series data queries
- **Device.API**: http://localhost:5001 - Device management
- **Edge.Gateway**: http://localhost:5002 - MQTT broker and protocol gateway
- **Preferences.API**: http://localhost:5295 - User preferences and settings

### **Database Connections**
- **sensormine_metadata**: localhost:5452 - Dashboards, assets, preferences, users
- **sensormine_timeseries**: localhost:5433 - Telemetry data (TimescaleDB)
- **sensormine (legacy)**: localhost:5433 - Legacy data (69 dashboards not migrated)

---

## 📋 User Stories & Requirements

- **[Complete User Story Catalog](user-stories.md)** - All platform requirements organized by epic
- **[Platform Requirements](requirements.md)** - Functional and non-functional requirements
- **[Permissions Matrix](permissions-matrix.md)** - Role-based access control design
- **[User Management Overview](user-management-overview.md)** - Authentication and authorization

---

## 🛠️ Development Resources

### **Setup & Configuration**
- **[Authentication Setup](authentication-setup.md)** - Configure auth providers and JWT
- **[Database Configuration](database-configuration-analysis.md)** - Multi-database setup guide
- **[Monitoring Requirements](monitoring-requirements.md)** - Observability and alerting

### **Device Integration**
- **[Device Type Architecture](device-type-architecture.md)** - Device configuration and protocol support
- **[Schema Integration](device-schema-integration.md)** - Dynamic schema validation

### **Testing & Quality**
- **[Frontend Test Report](test-report-frontend.md)** - Test coverage and results
- **[Query API Lessons Learned](lessons-learned-query-api.md)** - Performance optimizations

---

## 🏆 Recent Achievements

### **Dashboard Asset Integration (December 9-10, 2025)**
**Completed 6-story implementation enabling asset-based dashboard filtering:**

1. **AssetHierarchySelector Component** - Tree navigation with search and lazy loading
2. **Query.API Asset Endpoints** - `/by-asset` aggregation with 4 methods (avg/sum/min/max)
3. **DeviceListWidget Enhancement** - Real-time telemetry table with asset filtering
4. **ChartWidgetWithAsset** - Time-series visualization with asset scope
5. **KPI/GaugeWidgetWithAsset** - Single-value metrics with trend indicators
6. **Configuration Panel Integration** - Asset selector in widget config UI

**Impact**: Users can now create dashboards scoped to facility areas (e.g., "Building A Temperature Overview") with automatic device aggregation and real-time updates.

### **Database Architecture Consolidation (December 6, 2025)**
- **Dashboard.API** migrated to `sensormine_metadata` database
- **Three-database strategy** implemented for optimal separation of concerns
- **Multi-tenant isolation** verified across all database layers

---

## 🗂️ Legacy & Archive

The following documents contain historical context but may be superseded by current implementations:

- [Digital Twin Session Notes](digital-twin-session-2025-12-09.md) - Implementation session log
- [Tenant GUID Migration](tenant-guid-fix-status.md) - Database migration notes
- [Option C Implementation](option-c-implementation-summary.md) - Architecture decision context
- [Phase 4 Widget Enhancements](phase4-widget-enhancements.md) - Widget system evolution

---

*Last Updated: December 10, 2025 | Next Review: January 2026*