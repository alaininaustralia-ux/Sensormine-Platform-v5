# PostgreSQL Flexible Server with TimescaleDB Module

This module creates an Azure PostgreSQL Flexible Server with TimescaleDB extension for time-series data storage.

## Features

- **TimescaleDB Extension**: Pre-configured for time-series workloads
- **High Availability**: Zone-redundant deployment with automatic failover
- **Private Network**: Delegated subnet with private DNS zone
- **Auto-scaling Storage**: Automatic storage growth enabled
- **Backup & Recovery**: 35-day retention with geo-redundant backups
- **Multiple Databases**: Supports creating multiple databases

## Usage

```hcl
module "postgresql" {
  source = "./modules/postgresql"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  server_name         = "psql-sensormine-prod"
  subnet_id           = azurerm_subnet.database.id
  vnet_id             = azurerm_virtual_network.main.id
  
  administrator_login    = "sensormineadmin"
  administrator_password = var.db_admin_password
  sku_name              = "GP_Standard_D4s_v3"
  storage_mb            = 131072  # 128 GB
  
  databases = [
    "sensormine",
    "timeseries",
    "metadata"
  ]
  
  tags = {
    Environment = "production"
    Project     = "Sensormine"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | string | - | yes |
| location | Azure region | string | - | yes |
| server_name | Name of the PostgreSQL server | string | - | yes |
| subnet_id | Subnet ID for private endpoint | string | - | yes |
| vnet_id | Virtual network ID for DNS link | string | - | yes |
| administrator_login | Admin username | string | - | yes |
| administrator_password | Admin password | string | - | yes |
| sku_name | PostgreSQL SKU | string | GP_Standard_D4s_v3 | no |
| storage_mb | Storage size in MB | number | 131072 | no |
| databases | List of databases to create | list(string) | ["sensormine"] | no |
| allow_azure_services | Allow Azure services access | bool | false | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| server_id | The ID of the PostgreSQL server |
| fqdn | The FQDN of the server |
| connection_string | Main database connection string |
| timeseries_connection_string | TimescaleDB connection string |
| metadata_connection_string | Metadata database connection string |
| database_names | List of created databases |

## SKU Tiers and Sizing

### Burstable (B-series)
- **Use Case**: Development, testing, low-traffic workloads
- **SKUs**: B_Standard_B1ms, B_Standard_B2s, B_Standard_B2ms, B_Standard_B4ms
- **Cost**: Lowest cost option

### General Purpose (GP-series)
- **Use Case**: Production workloads with moderate performance needs
- **SKUs**: GP_Standard_D2s_v3, GP_Standard_D4s_v3, GP_Standard_D8s_v3
- **Cost**: Mid-range

### Memory Optimized (MO-series)
- **Use Case**: High-performance, memory-intensive workloads
- **SKUs**: MO_Standard_E2s_v3, MO_Standard_E4s_v3, MO_Standard_E8s_v3
- **Cost**: Highest cost, best performance

## Recommended SKUs by Environment

| Environment | SKU | vCores | Memory | Storage | Monthly Cost* |
|-------------|-----|--------|--------|---------|---------------|
| Development | B_Standard_B2s | 2 | 4 GB | 32 GB | ~$50 |
| Staging | GP_Standard_D2s_v3 | 2 | 8 GB | 128 GB | ~$150 |
| Production | GP_Standard_D4s_v3 | 4 | 16 GB | 256 GB | ~$300 |
| Production HA | GP_Standard_D8s_v3 | 8 | 32 GB | 512 GB | ~$600 |

*Approximate costs as of 2024, East US region

## TimescaleDB Configuration

TimescaleDB is automatically enabled via the `shared_preload_libraries` configuration. After deployment, you need to enable the extension in each database:

```sql
-- Connect to your database
\c sensormine

-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create a hypertable for telemetry data
CREATE TABLE telemetry (
  time TIMESTAMPTZ NOT NULL,
  device_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value DOUBLE PRECISION,
  unit TEXT,
  tags JSONB
);

-- Convert to hypertable
SELECT create_hypertable('telemetry', 'time');

-- Create indexes for common queries
CREATE INDEX ON telemetry (device_id, time DESC);
CREATE INDEX ON telemetry (metric_name, time DESC);
```

## High Availability

This module configures zone-redundant high availability:

- **Primary Server**: Zone 1
- **Standby Server**: Zone 2
- **Automatic Failover**: < 60 seconds typical
- **Zero Data Loss**: Synchronous replication

## Backup and Recovery

- **Retention**: 35 days
- **Type**: Geo-redundant (replicated to paired region)
- **Point-in-Time Restore**: Any point within retention period
- **Automatic**: No manual intervention required

## Maintenance Window

Configured for Sunday at 3:00 AM UTC to minimize impact on business operations. Adjust in variables if needed.

## Private Network Access

The server is deployed with:
1. **Delegated Subnet**: Dedicated subnet for PostgreSQL
2. **Private DNS Zone**: Auto-created private DNS for name resolution
3. **No Public Access**: Only accessible from within VNet

## Connecting to the Database

### From Azure VM or AKS

```bash
# Using psql
psql "Host=psql-sensormine-prod.postgres.database.azure.com;Database=sensormine;Username=sensormineadmin;Password=your_password;SSL Mode=Require"

# Using connection string
export DATABASE_URL="Host=psql-sensormine-prod.postgres.database.azure.com;Database=sensormine;Username=sensormineadmin;Password=your_password;SSL Mode=Require"
```

### From .NET Application

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SensormineContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL"),
        npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null)));
```

## Monitoring and Diagnostics

- **Metrics**: CPU, Memory, Storage, Connections, Replication Lag
- **Alerts**: Set up alerts for high CPU, connection limits, storage
- **Query Performance**: Query Store enabled for troubleshooting slow queries
- **Logs**: Integrated with Log Analytics workspace

## Performance Optimization

1. **Connection Pooling**: Use PgBouncer or application-level pooling
2. **Indexes**: Create indexes on frequently queried columns
3. **Compression**: TimescaleDB automatic compression for old data
4. **Partitioning**: TimescaleDB chunks data automatically
5. **Read Replicas**: Add read replicas for read-heavy workloads

## Security Best Practices

1. **Strong Password**: Use Azure Key Vault for password storage
2. **Private Network Only**: Disable public access
3. **SSL/TLS Required**: Always use encrypted connections
4. **Managed Identity**: Use for Azure service authentication
5. **Firewall Rules**: Minimal and specific IP allowlists
6. **Audit Logging**: Enable for compliance requirements

## Cost Optimization

1. **Right-size SKU**: Start small, scale up based on metrics
2. **Auto-grow Storage**: Only pay for what you use
3. **Burstable Tiers**: Use for non-production environments
4. **Reserved Capacity**: 1-year or 3-year reservations save up to 65%
5. **Backup Retention**: Adjust retention period based on requirements

## Migration from On-Premises

```bash
# Using pg_dump and pg_restore
pg_dump -h localhost -U postgres -d sensormine -Fc -f sensormine.dump
pg_restore -h psql-sensormine-prod.postgres.database.azure.com -U sensormineadmin -d sensormine sensormine.dump

# Using Azure Database Migration Service
az dms project create --name sensormine-migration \
  --service-name dms-sensormine \
  --source-platform PostgreSQL \
  --target-platform AzureDbForPostgreSQL
```

## References

- [Azure PostgreSQL Flexible Server Documentation](https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [PostgreSQL Best Practices on Azure](https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-best-practices)
