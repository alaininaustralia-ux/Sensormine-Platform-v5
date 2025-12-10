# Database Architecture - Separation of Concerns

## ⚡ Quick Reference

**Container:** `sensormine-timescaledb` (one container, two databases)  
**Host Port:** `5452` (maps to container port 5432)  
**Credentials:** Username `sensormine`, Password `sensormine123`

| Database | Purpose | Used By | Connection String |
|----------|---------|---------|-------------------|
| `sensormine_metadata` | Devices, Assets, Dashboards, Config | Device.API, Dashboard.API, DigitalTwin.API, Alerts.API | `Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123` |
| `sensormine_timeseries` | Telemetry, Metrics, Time-series Data | Query.API, Ingestion.Service, StreamProcessing.Service | `Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123` |

> **⚠️ Important:** The PostgreSQL container on port 5433 is **deprecated and unused**. All data is in TimescaleDB on port 5452.

---

## Overview
The Sensormine platform uses two separate PostgreSQL databases to optimize for different data access patterns and scalability requirements.

## Database: sensormine_metadata

**Container:** TimescaleDB (sensormine-timescaledb)  
**Host Port:** 5452 (mapped to container port 5432)  
**Purpose:** Operational metadata and configuration data

**Tables:**
- **Device Management**
  - `devices` - Device registry and configuration
  - `device_types` - Device type definitions
  - `device_type_versions` - Version history of device types
  - `device_type_audit_logs` - Audit trail for device type changes
  - `schemas` - Data validation schemas
  - `schema_versions` - Schema version history

- **Digital Twin & Assets**
  - `assets` - Asset hierarchy (sites, buildings, zones, equipment)
  - `asset_states` - Current state of assets
  - `data_point_mappings` - Mapping between devices and asset data points
  - `asset_rollup_configs` - Configuration for data aggregation
  - `asset_rollup_data` - Pre-aggregated asset data
  - `asset_audit_log` - Asset change history

- **Dashboard & UI**
  - `dashboards` - Dashboard definitions
  - `user_preferences` - User-specific settings
  - `site_configurations` - Site-wide configuration

- **Alerting**
  - `alert_rules` - Alert rule definitions
  - `alert_instances` - Active/historical alert instances
  - `alert_delivery_channels` - Notification channel configuration

**Services Using This Database:**
- Device.API (port 5293)
- SchemaRegistry.API (port 5021)
- DigitalTwin.API (port 5297)
- Dashboard.API (port 5299)
- Alerts.API (port 5295)
- Preferences.API (port 5296)

**Characteristics:**
- OLTP (Online Transaction Processing)
- Normalized relational schema
- ACID transactions
- Low to moderate data volume
- Frequent reads and updates

## Database: sensormine_timeseries

**Container:** TimescaleDB (sensormine-timescaledb)  
**Host Port:** 5452 (mapped to container port 5432)  
**Purpose:** High-volume time-series telemetry data

**Tables:**
- `telemetry` - Raw sensor readings (hypertable for time-series optimization)
- `events` - Device events and state changes
- `metrics` - Calculated metrics and KPIs

**Services Using This Database:**
- Ingestion.Service (port 5022)
- Query.API (port 5079)
- StreamProcessing.Service (port 5138)

**Characteristics:**
- OLAP (Online Analytical Processing)
- Time-series optimized (TimescaleDB hypertables)
- Append-mostly workload
- High data volume (millions of records/day)
- Time-based partitioning
- Compression and data retention policies
- Optimized for time-range queries and aggregations

## Migration Status

### ✅ Completed
- Created `device_type_versions` and `device_type_audit_logs` in sensormine_metadata
- Created EF Migrations history table in sensormine_metadata
- Updated Device.API connection string to use sensormine_metadata

### ⚠️ Cleanup Required
- Remove duplicate tables from sensormine_timeseries:
  - `devices`, `device_types`, `schemas`, `device_applied_schema`, `device_type_schema`, `device_status_history`
- These should only exist in sensormine_metadata

## Connection String Format

**For Development (from host machine):**
```json
{
  "ConnectionStrings": {
    "MetadataConnection": "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123",
    "TimeseriesConnection": "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123"
  }
}
```

**Note:** Port 5452 is the host port mapped to the TimescaleDB container (internal port 5432). Both databases are in the same container.

## Best Practices

1. **Metadata Changes:** Always update sensormine_metadata first, then reference via foreign keys in queries
2. **Telemetry Ingestion:** Write directly to sensormine_timeseries, include device_id for joins
3. **Cross-Database Queries:** Use application-level joins when querying both databases
4. **Migrations:** Run EF migrations only against sensormine_metadata
5. **Backups:** Different schedules - metadata (daily), timeseries (weekly with continuous archival)

## Future Considerations

- Consider separate PostgreSQL instances for true isolation
- Implement read replicas for Query.API against sensormine_timeseries
- Archive old telemetry data to object storage (S3/Azure Blob)
