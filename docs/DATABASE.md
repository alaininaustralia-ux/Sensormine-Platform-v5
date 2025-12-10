# Database Architecture

**Last Updated:** December 10, 2025  
**Status:** Production-Ready  
**Architecture:** Two-Database Separation (Metadata + Timeseries)

---

## ⚡ Quick Reference

> **📌 CRITICAL:** All databases are in the **TimescaleDB container** on **port 5452**

**Container:** `sensormine-timescaledb`  
**Host Port:** `5452` (maps to container port 5432)  
**Credentials:** Username `sensormine`, Password `sensormine123`

| Database | Purpose | Used By | Connection String |
|----------|---------|---------|-------------------|
| `sensormine_metadata` | Devices, Assets, Dashboards, Configuration | Device.API, Dashboard.API, DigitalTwin.API, Alerts.API, SchemaRegistry.API, Preferences.API | `Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123` |
| `sensormine_timeseries` | Telemetry, Metrics, Time-series Data | Query.API, Ingestion.Service, StreamProcessing.Service | `Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123` |
| `sensormine_identity` | Users, Tenants, Authentication | Identity.API | `Host=localhost;Port=5452;Database=sensormine_identity;Username=sensormine;Password=sensormine123` |

---

## 🏗️ Architecture Principles

### Separation of Concerns
The platform uses **two separate databases** within the same PostgreSQL/TimescaleDB instance:

1. **sensormine_metadata** - OLTP (Online Transaction Processing)
2. **sensormine_timeseries** - OLAP (Online Analytical Processing)

### Why Two Databases?

**Performance:**
- Different access patterns require different optimizations
- Timeseries uses hypertables, automatic partitioning, and compression
- Metadata uses normalized schemas with foreign keys and transactions

**Scalability:**
- Timeseries data grows rapidly (millions of records/day)
- Metadata grows slowly (thousands of records/day)
- Independent scaling strategies

**Backup/Retention:**
- Metadata: Daily backups, indefinite retention
- Timeseries: Continuous archival, 90-day hot storage

**Query Optimization:**
- Metadata: Index-heavy, ACID transactions
- Timeseries: Time-based queries, aggregations, compression

---

## 📊 Database: sensormine_metadata

### Purpose
Operational metadata and configuration data (OLTP workload)

**Note:** Identity/user management data is now in separate `sensormine_identity` database.

### Schema Overview

#### Device Management
```sql
-- Device Types and Schemas
device_types (id, tenant_id, name, description, custom_fields, created_at, updated_at)
device_type_versions (id, device_type_id, version, snapshot, created_at)
device_type_audit_logs (id, device_type_id, action, changes, created_by, created_at)
field_mappings (id, device_type_id, field_name, friendly_name, data_type, is_queryable, ...)

-- Device Instances
devices (id, tenant_id, device_type_id, name, serial_number, location, metadata, last_seen_at)

-- Schema Registry
schemas (id, tenant_id, name, version, schema_definition, created_at)
schema_versions (id, schema_id, version, definition, created_at)
```

#### Digital Twin & Assets
```sql
-- Asset Hierarchy
assets (id, tenant_id, parent_id, name, type, level, path, icon, metadata, location, created_at)
asset_states (id, asset_id, state, health_score, last_updated_at)
asset_audit_log (id, asset_id, action, changes, created_by, created_at)

-- Device-to-Asset Mapping
data_point_mappings (id, asset_id, device_id, data_point_name, aggregation_method, created_at)

-- Pre-Aggregated Data
asset_rollup_configs (id, asset_id, aggregation_rules, interval, created_at)
asset_rollup_data (id, asset_id, timestamp, aggregated_values)
```

#### Dashboard & UI
```sql
-- Dashboards
dashboards (id, tenant_id, name, description, layout, widgets, created_by, created_at, updated_at)

-- User Preferences
user_preferences (id, user_id, tenant_id, preferences, created_at, updated_at)

-- Site Configuration
site_configurations (id, tenant_id, settings, created_at, updated_at)
```

#### Alerting
```sql
-- Alert Rules
alert_rules (id, tenant_id, name, condition, device_type_id, severity, enabled, created_at)

-- Alert Instances
alert_instances (id, alert_rule_id, device_id, triggered_at, resolved_at, status, metadata)

-- Delivery Channels
alert_delivery_channels (id, tenant_id, type, configuration, created_at)
```

### Indexes

**Performance-Critical Indexes:**
```sql
-- Device lookups
CREATE INDEX idx_devices_tenant_id ON devices(tenant_id);
CREATE INDEX idx_devices_device_type_id ON devices(device_type_id);
CREATE INDEX idx_devices_serial_number ON devices(serial_number);

-- Asset hierarchy
CREATE INDEX idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX idx_assets_parent_id ON assets(parent_id);
CREATE INDEX idx_assets_path ON assets USING gin(path);
CREATE INDEX idx_assets_type ON assets(type);

-- Field mappings
CREATE INDEX idx_field_mappings_device_type_id ON field_mappings(device_type_id);
CREATE INDEX idx_field_mappings_is_queryable ON field_mappings(is_queryable) WHERE is_queryable = true;

-- Multi-tenancy
CREATE INDEX idx_<table>_tenant_id ON <table>(tenant_id);  -- All tenant-aware tables
```

### Migrations

**EF Core Migrations Location:** `src/Shared/Sensormine.Storage/Migrations/`

**Migration Commands:**
```powershell
# Create migration
dotnet ef migrations add <MigrationName> --project src/Shared/Sensormine.Storage --startup-project src/Services/Device.API

# Apply migrations
dotnet ef database update --project src/Shared/Sensormine.Storage --startup-project src/Services/Device.API

# Rollback migration
dotnet ef database update <PreviousMigrationName> --project src/Shared/Sensormine.Storage --startup-project src/Services/Device.API
```

**SQL Migrations Location:** `infrastructure/migrations/`

### Services Using This Database

| Service | Port | Purpose |
|---------|------|---------|
| Device.API | 5293 | Device CRUD operations |
| SchemaRegistry.API | 5021 | Schema management |
| DigitalTwin.API | 5297 | Asset hierarchy management |
| Dashboard.API | 5299 | Dashboard configuration |
| Alerts.API | 5295 | Alert rule management |
| Preferences.API | 5296 | User preferences |

---

## ⏱️ Database: sensormine_timeseries

### Purpose
High-volume time-series telemetry data (OLAP workload)

### Schema Overview

#### Telemetry (Hypertable)
```sql
-- TimescaleDB Hypertable for sensor data
telemetry (
    time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    data JSONB NOT NULL,           -- Flexible schema for sensor values
    metadata JSONB,                 -- Additional context
    PRIMARY KEY (time, device_id)
);

-- Hypertable configuration
SELECT create_hypertable('telemetry', 'time', chunk_time_interval => INTERVAL '1 day');

-- Compression policy (data older than 7 days)
ALTER TABLE telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id,tenant_id'
);

SELECT add_compression_policy('telemetry', INTERVAL '7 days');

-- Retention policy (drop data older than 90 days)
SELECT add_retention_policy('telemetry', INTERVAL '90 days');
```

#### Events
```sql
-- Device events and state changes
events (
    time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    metadata JSONB,
    PRIMARY KEY (time, device_id, event_type)
);

-- Hypertable
SELECT create_hypertable('events', 'time', chunk_time_interval => INTERVAL '1 day');
```

#### Metrics
```sql
-- Calculated metrics and KPIs
metrics (
    time TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    tags JSONB,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (time, metric_name)
);

-- Hypertable
SELECT create_hypertable('metrics', 'time', chunk_time_interval => INTERVAL '1 hour');
```

### Continuous Aggregates

```sql
-- Hourly aggregations for fast queries
CREATE MATERIALIZED VIEW telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    device_id,
    tenant_id,
    jsonb_object_agg(
        key, 
        jsonb_build_object(
            'avg', avg((value->>'value')::float),
            'min', min((value->>'value')::float),
            'max', max((value->>'value')::float),
            'count', count(*)
        )
    ) AS aggregated_data
FROM telemetry, jsonb_each(data)
GROUP BY bucket, device_id, tenant_id;

-- Refresh policy
SELECT add_continuous_aggregate_policy('telemetry_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### Indexes

```sql
-- Tenant isolation
CREATE INDEX idx_telemetry_tenant_id ON telemetry(tenant_id, time DESC);

-- Device queries
CREATE INDEX idx_telemetry_device_time ON telemetry(device_id, time DESC);

-- Event queries
CREATE INDEX idx_events_device_type ON events(device_id, event_type, time DESC);
CREATE INDEX idx_events_severity ON events(severity, time DESC) WHERE severity IN ('Critical', 'Error');
```

### Services Using This Database

| Service | Port | Purpose |
|---------|------|---------|
| Ingestion.Service | 5022 | Write telemetry data |
| Query.API | 5079 | Read telemetry data |
| StreamProcessing.Service | 5138 | Real-time processing |

---

## 🔄 Cross-Database Operations

### Application-Level Joins

**Problem:** Need device metadata + telemetry data  
**Solution:** Fetch from both databases and join in application

```csharp
// Example: Get device with latest telemetry
public async Task<DeviceWithTelemetry> GetDeviceWithTelemetryAsync(Guid deviceId)
{
    // 1. Get device from metadata database
    var device = await _metadataContext.Devices
        .Include(d => d.DeviceType)
        .FirstOrDefaultAsync(d => d.Id == deviceId);
    
    // 2. Get latest telemetry from timeseries database
    var telemetry = await _timeseriesContext.Telemetry
        .Where(t => t.DeviceId == deviceId)
        .OrderByDescending(t => t.Time)
        .Take(1)
        .FirstOrDefaultAsync();
    
    // 3. Combine in application
    return new DeviceWithTelemetry 
    {
        Device = device,
        LatestTelemetry = telemetry
    };
}
```

### Foreign Key References

**Device ID as Link:**
- Metadata stores device record with UUID
- Timeseries references device_id in telemetry records
- No database-level foreign keys (cross-database constraint not supported)
- Application enforces referential integrity

---

## 🔐 Multi-Tenancy

### Tenant Isolation Strategy

**All tables include `tenant_id` column:**
```sql
tenant_id UUID NOT NULL
```

**Row-Level Security (RLS):**
```sql
-- Enable RLS on all tenant-aware tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON devices
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Application-Level Filtering:**
```csharp
// Set tenant context
await _context.Database.ExecuteSqlRawAsync(
    "SET app.current_tenant_id = {0}", tenantId);

// All queries automatically filtered
var devices = await _context.Devices.ToListAsync();
```

---

## 💾 Backup & Recovery

### Metadata Database

**Frequency:** Daily full backup + continuous WAL archiving

```powershell
# Full backup
docker exec sensormine-timescaledb pg_dump -U sensormine -Fc sensormine_metadata > backup_metadata_full.dump

# Restore
docker exec -i sensormine-timescaledb pg_restore -U sensormine -d sensormine_metadata < backup_metadata_full.dump
```

**Retention:** Indefinite (critical operational data)

### Timeseries Database

**Frequency:** Weekly full backup + continuous archival to S3

```powershell
# Backup recent data only (last 90 days)
docker exec sensormine-timescaledb pg_dump -U sensormine -Fc sensormine_timeseries \
    --where="time > NOW() - INTERVAL '90 days'" > backup_timeseries_recent.dump

# Archive old data to S3
SELECT timescaledb_experimental.move_chunk('telemetry_chunk', 's3_archive');
```

**Retention:** 90 days hot (database) + 2 years cold (S3)

---

## 📈 Performance Optimization

### Query Performance

**Use Continuous Aggregates:**
```sql
-- BAD: Calculate on every query
SELECT avg(value) FROM telemetry WHERE time > NOW() - INTERVAL '24 hours';

-- GOOD: Use pre-aggregated view
SELECT avg FROM telemetry_hourly WHERE bucket > NOW() - INTERVAL '24 hours';
```

**Partition Pruning:**
```sql
-- GOOD: Enables chunk exclusion
SELECT * FROM telemetry 
WHERE time BETWEEN '2025-01-01' AND '2025-01-02'
AND device_id = 'xxx';

-- BAD: Full table scan
SELECT * FROM telemetry WHERE device_id = 'xxx';
```

**Index Usage:**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Connection Pooling

**Configuration (Program.cs):**
```csharp
services.AddDbContext<MetadataContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
        npgsqlOptions.CommandTimeout(30);
        npgsqlOptions.MaxBatchSize(100);
    }));
```

**Npgsql Connection String:**
```
Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123;
Pooling=true;MinPoolSize=5;MaxPoolSize=100;ConnectionIdleLifetime=300;ConnectionPruningInterval=10;
```

---

## 🔧 Maintenance

### Vacuum & Analyze

```sql
-- Manual vacuum (run weekly)
VACUUM ANALYZE devices;
VACUUM ANALYZE telemetry;

-- Auto-vacuum settings (pg_hba.conf)
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 60s
```

### Chunk Management

```sql
-- View chunks
SELECT * FROM timescaledb_information.chunks WHERE hypertable_name = 'telemetry';

-- Drop old chunks manually
SELECT drop_chunks('telemetry', older_than => INTERVAL '90 days');

-- Compress old chunks
SELECT compress_chunk(chunk_name) FROM timescaledb_information.chunks 
WHERE NOT is_compressed AND hypertable_name = 'telemetry';
```

### Health Checks

```sql
-- Check table sizes
SELECT 
    schemaname, 
    tablename, 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check database connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Check slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
```

---

## 📚 Related Documentation

- **[DATABASE-QUICK-REFERENCE.md](./DATABASE-QUICK-REFERENCE.md)** - Quick copy-paste guide
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Container and infrastructure details
- **[service-ports.md](./service-ports.md)** - Service-to-database mapping

---

**Last Review:** December 10, 2025  
**Next Review:** January 10, 2026  
**Owner:** Platform Team
