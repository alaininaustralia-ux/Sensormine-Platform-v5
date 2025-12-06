# Database Architecture

## Overview

The Sensormine Platform uses a **dual-database architecture** to optimize for both transactional and time-series workloads:

1. **PostgreSQL** - Configuration and metadata
2. **TimescaleDB** - Time-series telemetry data

## Database Strategy

### PostgreSQL (Port 5433)
**Database:** `sensormine`
**Purpose:** Transactional data and configuration

**Tables:**
- `schemas` - Data validation schemas
- `schema_versions` - Schema version history
- `device_types` - Device type templates and configurations
- `device_type_versions` - Device type version history
- `device_type_audit_logs` - Audit trail for device type changes
- `devices` - Device registry and metadata
- `alert_rules` - Alert rule definitions
- `users` - User accounts and authentication
- `tenants` - Multi-tenancy configuration

**Services Using This Database:**
- Device.API
- SchemaRegistry.API
- Alerts.API
- DigitalTwin.API
- VideoMetadata.API
- Billing.API

**Connection String Format:**
```
Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres
```

### TimescaleDB (Port 5452)
**Database:** `sensormine_timeseries`
**Purpose:** High-volume time-series data

**Hypertables:**
- `telemetry` - Raw device telemetry data (partitioned by time)
- `events` - System and device events
- `metrics` - Aggregated metrics and analytics
- `device_status_history` - Device online/offline state changes

**Services Using This Database:**
- Ingestion.Service
- Query.API
- StreamProcessing.Service

**Connection String Format:**
```
Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123
```

## Why Two Databases?

### Performance Optimization
- **PostgreSQL**: Optimized for OLTP (Online Transaction Processing)
  - ACID compliance for configuration changes
  - Complex joins and relationships
  - Referential integrity with foreign keys
  
- **TimescaleDB**: Optimized for time-series data
  - Automatic time-based partitioning (hypertables)
  - Compression for old data
  - Continuous aggregates for real-time analytics
  - Retention policies for automatic data cleanup

### Scalability
- Configuration data grows slowly and predictably
- Time-series data grows continuously at high velocity
- Separate databases allow independent scaling strategies

### Operational Benefits
- **Backup strategies**: Different retention policies for config vs telemetry
- **Disaster recovery**: Critical config data can be backed up more frequently
- **Maintenance windows**: Can be scheduled independently
- **Resource allocation**: Can allocate more resources to time-series workload

## Architecture Decision: No Foreign Keys Between Databases

### Problem
Originally, `device_types.schema_id` had a foreign key constraint to `schemas.id`. This caused errors when:
- SchemaRegistry.API and Device.API used separate databases
- A device type referenced a schema ID that existed in SchemaRegistry but not in Device.API's database

### Solution
**Remove database-level foreign key constraints between services.**

Instead, use:
1. **Application-level validation**: Services validate references via API calls
2. **GUIDs as references**: Schema IDs are stored as GUIDs without FK constraints
3. **Eventual consistency**: Accept that references may briefly be out of sync
4. **API contracts**: Services communicate via well-defined DTOs

### Example
```csharp
// Device.API - No FK constraint on schema_id
public class DeviceType
{
    public Guid? SchemaId { get; set; }  // Reference to schema, validated via API
}

// Validation happens at application layer
var schema = await _schemaApiClient.GetSchemaById(deviceType.SchemaId);
if (schema == null)
{
    return BadRequest("Schema not found");
}
```

## Migration Strategy

### Initial Setup
1. Both databases start empty
2. Each service runs its own migrations
3. Tables are created independently in appropriate database

### Development
- Use `docker-compose` to run both databases locally
- Services automatically create tables on first startup
- Seed data scripts can populate both databases

### Production
- Use managed database services (Azure Database for PostgreSQL, TimescaleDB Cloud)
- Separate backup policies for each database
- Monitor both databases independently

## Configuration Examples

### Device.API (appsettings.Development.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5433;Database=sensormine;Username=postgres;Password=postgres"
  }
}
```

### Query.API (appsettings.Development.json)
```json
{
  "ConnectionStrings": {
    "TimeSeries": "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123"
  }
}
```

## Best Practices

### DO
✅ Store device metadata in PostgreSQL  
✅ Store telemetry/sensor readings in TimescaleDB  
✅ Use GUIDs for cross-database references  
✅ Validate references via API calls  
✅ Design for eventual consistency  
✅ Use TimescaleDB compression for old data  
✅ Implement retention policies in TimescaleDB  

### DON'T
❌ Create foreign keys between databases  
❌ Join data across databases at DB level  
❌ Store time-series data in regular PostgreSQL  
❌ Store configuration in TimescaleDB  
❌ Assume strong consistency across services  
❌ Use transactions spanning both databases  

## Troubleshooting

### "Foreign key constraint violation"
**Cause**: Service trying to use FK constraint to other database  
**Solution**: Remove FK constraint, add application-level validation

### "Schema not found"
**Cause**: Schema exists in SchemaRegistry but reference validation failing  
**Solution**: Ensure SchemaRegistry.API is running and accessible

### "Connection refused"
**Cause**: Database container not running  
**Solution**: `docker-compose up -d postgres timescaledb`

## Future Considerations

### Read Replicas
- PostgreSQL: Create read replicas for query-heavy services
- TimescaleDB: Use continuous aggregates for pre-computed analytics

### Sharding
- TimescaleDB: Partition by tenant_id for multi-tenancy at scale
- PostgreSQL: Consider logical replication for geo-distributed deployments

### Caching
- Use Redis for frequently accessed configuration data
- Cache schema definitions to reduce cross-service calls
- Implement cache invalidation strategy

---

**Last Updated**: December 6, 2025  
**Version**: 1.0  
**Status**: Active
