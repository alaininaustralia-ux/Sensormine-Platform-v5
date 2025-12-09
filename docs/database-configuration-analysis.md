# Database Configuration Analysis
**Date**: December 9, 2025  
**Analysis**: Investigation of database containers, connection strings, and data distribution

---

## Executive Summary

The Sensormine Platform uses **THREE separate PostgreSQL databases** across **TWO Docker containers**:

1. **TimescaleDB Container** (`sensormine-timescaledb`) - Port 5452
   - `sensormine_metadata`: Metadata for devices, device types, assets, digital twin
   - `sensormine_timeseries`: Time-series telemetry data (hypertables)

2. **PostgreSQL Container** (`sensormine-postgres`) - Port 5433
   - `sensormine`: Application metadata for most services
   - `sensormine_identity`: Identity/authentication data

**CRITICAL ISSUE IDENTIFIED**: Table duplication and inconsistent service configurations across databases.

---

## Docker Container Configuration

### Container 1: TimescaleDB (sensormine-timescaledb)
```yaml
# docker-compose.yml
timescaledb:
  container_name: sensormine-timescaledb
  ports:
    - "5452:5432"  # Host port 5452 -> Container port 5432
  environment:
    - POSTGRES_USER=sensormine
    - POSTGRES_PASSWORD=sensormine123
    - POSTGRES_DB=sensormine_timeseries  # Default database
```

**Status**: ✅ Running (Up 25 hours)

### Container 2: PostgreSQL (sensormine-postgres)
```yaml
# docker-compose.yml
postgres:
  image: postgres:16
  container_name: sensormine-postgres
  ports:
    - "5433:5432"  # Host port 5433 -> Container port 5432
  environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
    - POSTGRES_DB=sensormine  # Default database
```

**Status**: ✅ Running (Up 25 hours)

---

## Database Inventory

### TimescaleDB Container (Port 5452)

#### Database: sensormine_metadata (18 MB)
- **Owner**: sensormine (superuser)
- **Purpose**: Operational metadata for devices, assets, digital twin
- **Tables** (13):
  ```
  - __EFMigrationsHistory       (EF Core migrations tracking)
  - asset_audit_log              (Asset change history)
  - asset_rollup_configs         (Asset aggregation configuration)
  - asset_rollup_data            (Aggregated asset data)
  - asset_states                 (Current asset states)
  - assets                       (Asset hierarchy definitions)
  - data_point_mappings          (Device-to-asset data mappings)
  - device_type_audit_logs       (Device type change history)
  - device_type_versions         (Device type version snapshots)
  - device_types                 (Device type definitions)
  - devices                      (Device registrations)
  - schemas                      (Data schemas for devices)
  - spatial_ref_sys              (PostGIS spatial reference systems)
  ```

#### Database: sensormine_timeseries (9.8 MB)
- **Owner**: sensormine (superuser)
- **Purpose**: High-volume time-series telemetry data
- **Tables** (4):
  ```
  - __EFMigrationsHistory       (EF Core migrations tracking)
  - events                       (Event log data)
  - metrics                      (Performance metrics)
  - telemetry                    (TimescaleDB hypertable for sensor data)
  ```

---

### PostgreSQL Container (Port 5433)

#### Database: sensormine (Default size)
- **Owner**: postgres (superuser)
- **Purpose**: Primary application metadata for most services
- **Tables** (17):
  ```
  - __EFMigrationsHistory        (EF Core migrations tracking)
  - alert_delivery_channels      (Alert notification channels)
  - alert_instances              (Triggered alert instances)
  - alert_rules                  (Alert rule definitions)
  - dashboards                   (Dashboard configurations)
  - device_type_audit_logs       (Device type change history) ⚠️ DUPLICATE
  - device_type_versions         (Device type version snapshots) ⚠️ DUPLICATE
  - device_types                 (Device type definitions) ⚠️ DUPLICATE
  - devices                      (Device registrations) ⚠️ DUPLICATE
  - nexus_configurations         (Nexus configuration settings)
  - schema_versions              (Schema version tracking) ⚠️ DUPLICATE
  - schemas                      (Data schemas) ⚠️ DUPLICATE
  - site_configurations          (Site-level configuration)
  - tenants                      (Multi-tenant data)
  - user_invitations             (User invitation tracking)
  - user_preferences             (User preference settings)
  - users                        (User accounts)
  ```

#### Database: sensormine_identity
- **Owner**: sensormine (role with CreateDB privilege)
- **Purpose**: Identity and authentication data (Separate concern)

---

## User/Role Configuration

### TimescaleDB Container Roles
```sql
Role: sensormine
Attributes: Superuser, Create role, Create DB, Replication, Bypass RLS
Password: sensormine123
Databases Owned: sensormine_metadata, sensormine_timeseries, postgres, template0, template1
```

### PostgreSQL Container Roles
```sql
Role: postgres
Attributes: Superuser, Create role, Create DB, Replication, Bypass RLS
Password: postgres
Databases Owned: sensormine, postgres, template0, template1

Role: sensormine
Attributes: Create DB
Databases Owned: sensormine_identity
```

---

## Service Connection String Analysis

### Services Using TimescaleDB (Port 5452)

✅ **Device.API** - `sensormine_metadata`
```json
"DefaultConnection": "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123"
```
**Status**: ✅ CORRECT - Uses metadata database for device/device type operations

✅ **DigitalTwin.API** - `sensormine_metadata`
```json
"DefaultConnection": "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123"
```
**Status**: ✅ CORRECT - Uses metadata database for asset operations

---

### Services Using PostgreSQL (Port 5433)

⚠️ **SchemaRegistry.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ⚠️ INCONSISTENT - Schemas table exists in BOTH `sensormine` and `sensormine_metadata`

⚠️ **Query.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
"TelemetryConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ❌ INCORRECT - Should use `sensormine_timeseries` on port 5452 for telemetry queries

⚠️ **Preferences.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ✅ CORRECT - User preferences are in `sensormine` database

⚠️ **Identity.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ⚠️ QUESTIONABLE - Identity data exists in separate `sensormine_identity` database, but users table is in `sensormine`

⚠️ **NexusConfiguration.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ✅ CORRECT - Nexus configurations are in `sensormine` database

⚠️ **Dashboard.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ✅ CORRECT - Dashboards are in `sensormine` database

⚠️ **Alerts.API** - `sensormine`
```json
"DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```
**Status**: ✅ CORRECT - Alert rules/instances are in `sensormine` database

---

## Critical Issues Identified

### 🔴 Issue 1: Table Duplication Across Databases

**Duplicated Tables**:
- `device_types` - EXISTS IN BOTH `sensormine_metadata` AND `sensormine`
- `devices` - EXISTS IN BOTH `sensormine_metadata` AND `sensormine`
- `device_type_versions` - EXISTS IN BOTH `sensormine_metadata` AND `sensormine`
- `device_type_audit_logs` - EXISTS IN BOTH `sensormine_metadata` AND `sensormine`
- `schemas` - EXISTS IN BOTH `sensormine_metadata` AND `sensormine`
- `schema_versions` - Exists in `sensormine` but NOT in `sensormine_metadata`

**Impact**:
- Data inconsistency risk
- Unclear source of truth
- Services may be reading from different databases
- Potential for duplicate or conflicting data

**Current Situation**:
- Device.API and DigitalTwin.API use `sensormine_metadata` (TimescaleDB)
- SchemaRegistry.API, Preferences.API, and other services use `sensormine` (PostgreSQL)
- This means device/schema operations could be split across two databases

---

### 🟡 Issue 2: Query.API Using Wrong Database

**Current Configuration**:
```json
"TelemetryConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
```

**Expected Configuration**:
```json
"TelemetryConnection": "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123"
```

**Impact**: Query.API cannot access telemetry data (hypertables) because it's connecting to the wrong database.

---

### 🟡 Issue 3: SchemaRegistry.API Database Inconsistency

**Current**: Connects to `sensormine` on port 5433 (PostgreSQL)  
**Device.API Expectation**: Schemas should be in `sensormine_metadata` on port 5452 (TimescaleDB)

**Impact**: Device types reference schemas that may exist in a different database than the device type itself.

---

## Recommended Architecture

### Option A: Consolidate Around TimescaleDB (Recommended)

**Rationale**: TimescaleDB provides both OLTP and OLAP capabilities, reducing complexity.

```
TimescaleDB Container (Port 5452)
├── sensormine_metadata (OLTP)
│   ├── devices, device_types, schemas
│   ├── assets, dashboards, alerts
│   ├── user_preferences, site_configurations
│   ├── nexus_configurations
│   └── tenants, users, user_invitations
│
└── sensormine_timeseries (OLAP)
    ├── telemetry (hypertable)
    ├── events
    └── metrics

PostgreSQL Container (Port 5433)
└── sensormine_identity (Optional - if strict separation needed)
    └── Identity/authentication data
```

**Migration Path**:
1. Move tables from `sensormine` to `sensormine_metadata`
2. Update all service connection strings to port 5452
3. Keep `sensormine_identity` separate (optional)
4. Retire `sensormine` database on PostgreSQL container

---

### Option B: Keep Current Split (Not Recommended)

**Rationale**: Maintain separation between TimescaleDB (for time-series) and PostgreSQL (for everything else).

```
PostgreSQL Container (Port 5433)
└── sensormine (OLTP)
    ├── devices, device_types, schemas
    ├── assets, dashboards, alerts
    ├── user_preferences, site_configurations
    ├── nexus_configurations
    └── tenants, users, user_invitations

TimescaleDB Container (Port 5452)
└── sensormine_timeseries (OLAP)
    ├── telemetry (hypertable)
    ├── events
    └── metrics
```

**Required Changes**:
1. Move device/schema tables from `sensormine_metadata` to `sensormine`
2. Update Device.API and DigitalTwin.API to use port 5433
3. Update Query.API to use `sensormine_timeseries` on port 5452
4. Clean up duplicate tables

---

## Immediate Action Items

### Priority 1: Fix Query.API Connection 🔴
```json
// Query.API appsettings.json - CHANGE THIS
"TelemetryConnection": "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123"
```

### Priority 2: Resolve Table Duplication 🔴
**Decision Required**: Choose Option A or Option B above

**If Option A (Consolidate to TimescaleDB)**:
1. Migrate tables from `sensormine` to `sensormine_metadata`
2. Update all services to use port 5452
3. Drop duplicate tables from `sensormine`

**If Option B (Keep Separate)**:
1. Drop tables from `sensormine_metadata`: devices, device_types, schemas, device_type_versions, device_type_audit_logs
2. Update Device.API and DigitalTwin.API to use port 5433 and `sensormine` database
3. Keep only assets/asset-related tables in `sensormine_metadata`

### Priority 3: Document Service-Database Mapping 🟡
Create a definitive mapping document:
```
Service Name -> Database Name -> Container -> Port -> Purpose
```

### Priority 4: Create Migration Scripts 🟡
- Data migration scripts (if consolidating)
- Connection string update scripts
- Table cleanup scripts

---

## Testing Recommendations

1. **Connection Testing**: Verify each service can connect to its configured database
2. **Data Consistency**: Compare record counts between duplicate tables
3. **Foreign Key Constraints**: Check for cross-database FK violations
4. **Application Testing**: Test device creation, schema registration, telemetry ingestion end-to-end
5. **Performance Testing**: Benchmark query performance after consolidation

---

## Notes

- The current configuration evolved over time, leading to inconsistencies
- Device.API was recently updated to use `sensormine_metadata` (port 5452)
- Most other services still use `sensormine` (port 5433)
- This split configuration is causing operational confusion
- A definitive architectural decision is needed to prevent future issues

---

## References

- `docker-compose.yml` - Container definitions
- `src/Services/*/appsettings*.json` - Service connection strings
- `docs/database-separation.md` - Earlier documentation of TimescaleDB separation
- `infrastructure/timescaledb/init-*.sql` - Database initialization scripts
