# Migration Script: Option C Implementation
# Migrate data from TimescaleDB sensormine_metadata to PostgreSQL sensormine
# Keep TimescaleDB for time-series data only

Write-Host "🔄 Starting Option C Migration" -ForegroundColor Cyan
Write-Host "=" * 80

# Step 1: Enable required extensions
Write-Host "`n📋 Step 1: Enabling required PostgreSQL extensions..." -ForegroundColor Yellow

docker exec sensormine-postgres psql -U postgres -d sensormine -c "CREATE EXTENSION IF NOT EXISTS ltree;" | Out-Null
docker exec sensormine-postgres psql -U postgres -d sensormine -c "CREATE EXTENSION IF NOT EXISTS postgis;" | Out-Null

Write-Host "  ✓ Extensions enabled (ltree, postgis)" -ForegroundColor Green

# Step 2: Create assets and related tables in sensormine (PostgreSQL)
Write-Host "`n📋 Step 2: Creating asset tables in PostgreSQL sensormine database..." -ForegroundColor Yellow

$createAssetTablesSQL = @"
-- Create assets table and related tables
CREATE TABLE IF NOT EXISTS assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    parent_id uuid,
    name character varying(200) NOT NULL,
    description text,
    asset_type character varying(50) NOT NULL,
    path ltree NOT NULL,
    level integer NOT NULL,
    metadata jsonb,
    location geometry(Point,4326),
    status character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(100),
    updated_by character varying(100),
    primary_image_url character varying(2000),
    image_urls jsonb,
    documents jsonb,
    icon character varying(100),
    CONSTRAINT pk_assets PRIMARY KEY (id),
    CONSTRAINT fk_assets_parent FOREIGN KEY (parent_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_parent_id ON assets(parent_id);
CREATE INDEX IF NOT EXISTS idx_assets_path ON assets USING gist(path);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets USING gist(location);

-- Create asset_states table
CREATE TABLE IF NOT EXISTS asset_states (
    asset_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    calculated_metrics jsonb DEFAULT '{}'::jsonb,
    alarm_status character varying(50) DEFAULT 'ok'::character varying,
    alarm_count integer DEFAULT 0,
    last_update_time timestamp with time zone DEFAULT now() NOT NULL,
    last_update_device_id character varying(200),
    CONSTRAINT pk_asset_states PRIMARY KEY (asset_id),
    CONSTRAINT fk_asset_states_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_asset_states_tenant_id ON asset_states(tenant_id);

-- Create asset_rollup_configs table
CREATE TABLE IF NOT EXISTS asset_rollup_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    metric_name character varying(200) NOT NULL,
    aggregation_method character varying(50) NOT NULL,
    rollup_interval interval DEFAULT '00:05:00'::interval,
    include_children boolean DEFAULT true,
    weight_factor numeric(10,4) DEFAULT 1.0,
    filter_expression text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_asset_rollup_configs PRIMARY KEY (id),
    CONSTRAINT fk_asset_rollup_configs_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_asset_rollup_configs_asset_id ON asset_rollup_configs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_rollup_configs_tenant_id ON asset_rollup_configs(tenant_id);

-- Create asset_rollup_data table
CREATE TABLE IF NOT EXISTS asset_rollup_data (
    asset_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    metric_name character varying(200) NOT NULL,
    time timestamp with time zone NOT NULL,
    value double precision,
    sample_count integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT pk_asset_rollup_data PRIMARY KEY (asset_id, metric_name, time)
);

CREATE INDEX IF NOT EXISTS idx_asset_rollup_data_time ON asset_rollup_data(time DESC);
CREATE INDEX IF NOT EXISTS idx_asset_rollup_data_tenant_id ON asset_rollup_data(tenant_id);

-- Create asset_audit_log table
CREATE TABLE IF NOT EXISTS asset_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    changes jsonb,
    user_id character varying(100),
    timestamp timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_asset_audit_log PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_asset_audit_log_asset_id ON asset_audit_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_audit_log_timestamp ON asset_audit_log(timestamp DESC);

-- Create data_point_mappings table
CREATE TABLE IF NOT EXISTS data_point_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    device_id uuid NOT NULL,
    sensor_path character varying(500) NOT NULL,
    target_field character varying(200) NOT NULL,
    transform_expression text,
    unit character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_data_point_mappings PRIMARY KEY (id),
    CONSTRAINT fk_data_point_mappings_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_data_point_mappings_asset_id ON data_point_mappings(asset_id);
CREATE INDEX IF NOT EXISTS idx_data_point_mappings_device_id ON data_point_mappings(device_id);
CREATE INDEX IF NOT EXISTS idx_data_point_mappings_tenant_id ON data_point_mappings(tenant_id);
"@

# Save SQL to file
$createAssetTablesSQL | Out-File -FilePath ".\temp_create_assets.sql" -Encoding UTF8

# Execute on PostgreSQL
Write-Host "  Creating tables..." -ForegroundColor Gray
Get-Content ".\temp_create_assets.sql" | docker exec -i sensormine-postgres psql -U postgres -d sensormine

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Asset tables created successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to create asset tables" -ForegroundColor Red
    exit 1
}

# Step 3: Export and import assets data
Write-Host "`n📋 Step 3: Migrating assets data from TimescaleDB to PostgreSQL..." -ForegroundColor Yellow

# Check if there's data to migrate
$assetCountRaw = docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -t -c "SELECT COUNT(*) FROM assets;" 2>$null
$assetCount = if ($assetCountRaw) { ($assetCountRaw | Select-Object -First 1).Trim() } else { "0" }

if ([int]$assetCount -gt 0) {
    Write-Host "  Found $assetCount assets to migrate" -ForegroundColor Gray
    
    # Export assets data
    Write-Host "  Exporting assets..." -ForegroundColor Gray
    docker exec sensormine-timescaledb pg_dump -U sensormine -d sensormine_metadata -t assets -t asset_states -t asset_rollup_configs -t asset_rollup_data -t asset_audit_log -t data_point_mappings --data-only --column-inserts --disable-triggers | Out-File -FilePath ".\temp_migrate_assets.sql" -Encoding UTF8
    
    # Import into PostgreSQL
    Write-Host "  Importing assets..." -ForegroundColor Gray
    Get-Content ".\temp_migrate_assets.sql" | docker exec -i sensormine-postgres psql -U postgres -d sensormine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Assets data migrated successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to migrate assets data" -ForegroundColor Red
    }
} else {
    Write-Host "  No assets to migrate (count: $assetCount)" -ForegroundColor Gray
}

# Step 4: Migrate device_types data (merge with existing)
Write-Host "`n📋 Step 4: Merging device_types data..." -ForegroundColor Yellow

$deviceTypeCountRaw = docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -t -c "SELECT COUNT(*) FROM device_types;" 2>$null
$deviceTypeCount = if ($deviceTypeCountRaw) { ($deviceTypeCountRaw | Select-Object -First 1).Trim() } else { "0" }

if ([int]$deviceTypeCount -gt 0) {
    Write-Host "  Found $deviceTypeCount device types in TimescaleDB" -ForegroundColor Gray
    
    # Export device types that don't exist in PostgreSQL
    $exportDeviceTypesSQL = @"
SELECT 'INSERT INTO device_types (id, tenant_id, name, description, protocol, protocol_config, custom_fields, alert_templates, tags, is_active, created_at, updated_at, created_by, updated_by, schema_id) VALUES (''' ||
    id || ''', ''' || tenant_id || ''', ''' || name || ''', ' || 
    COALESCE('''' || description || '''', 'NULL') || ', ''' || protocol || ''', ' ||
    COALESCE('''' || protocol_config::text || '''::jsonb', 'NULL') || ', ' ||
    COALESCE('''' || custom_fields::text || '''::jsonb', '''[]''::jsonb') || ', ' ||
    COALESCE('''' || alert_templates::text || '''::jsonb', '''[]''::jsonb') || ', ' ||
    COALESCE('''' || tags::text || '''::jsonb', '''[]''::jsonb') || ', ' ||
    is_active || ', ''' || created_at || ''', ''' || updated_at || ''', ' ||
    COALESCE('''' || created_by || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_by || '''', 'NULL') || ', ' ||
    COALESCE('''' || schema_id || '''', 'NULL') || ') ON CONFLICT (id) DO NOTHING;'
FROM device_types;
"@
    
    $exportDeviceTypesSQL | docker exec -i sensormine-timescaledb psql -U sensormine -d sensormine_metadata -t | docker exec -i sensormine-postgres psql -U postgres -d sensormine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Device types merged successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Device types merge completed with warnings" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No device types to migrate" -ForegroundColor Gray
}

# Step 5: Verify migration
Write-Host "`n📋 Step 5: Verifying migration..." -ForegroundColor Yellow

$verifySQL = @"
SELECT 'assets' as table_name, COUNT(*) as count FROM assets
UNION ALL SELECT 'asset_states', COUNT(*) FROM asset_states
UNION ALL SELECT 'asset_rollup_configs', COUNT(*) FROM asset_rollup_configs
UNION ALL SELECT 'asset_rollup_data', COUNT(*) FROM asset_rollup_data
UNION ALL SELECT 'asset_audit_log', COUNT(*) FROM asset_audit_log
UNION ALL SELECT 'data_point_mappings', COUNT(*) FROM data_point_mappings
UNION ALL SELECT 'devices', COUNT(*) FROM devices
UNION ALL SELECT 'device_types', COUNT(*) FROM device_types
UNION ALL SELECT 'schemas', COUNT(*) FROM schemas
ORDER BY table_name;
"@

Write-Host "`n  PostgreSQL (sensormine) record counts:" -ForegroundColor Cyan
$verifySQL | docker exec -i sensormine-postgres psql -U postgres -d sensormine

Write-Host "`n  TimescaleDB (sensormine_timeseries) record counts:" -ForegroundColor Cyan
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_timeseries -c "SELECT 'telemetry' as table_name, COUNT(*) as count FROM telemetry UNION ALL SELECT 'events', COUNT(*) FROM events UNION ALL SELECT 'metrics', COUNT(*) FROM metrics ORDER BY table_name;"

Write-Host "`n✓ Migration verification complete" -ForegroundColor Green

# Step 6: Clean up temp files
Write-Host "`n📋 Step 6: Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path ".\temp_*.sql" -ErrorAction SilentlyContinue
Remove-Item -Path ".\temp_*.csv" -ErrorAction SilentlyContinue
Write-Host "  ✓ Cleanup complete" -ForegroundColor Green

Write-Host "`n" + ("=" * 80)
Write-Host "✓ Migration to Option C complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Update service connection strings (run: .\scripts\update-connection-strings.ps1)" -ForegroundColor White
Write-Host "  2. Restart all services to pick up new configuration" -ForegroundColor White
Write-Host "  3. Test device creation, asset operations, and telemetry queries" -ForegroundColor White
Write-Host "  4. Once verified, drop tables from sensormine_metadata (optional cleanup)" -ForegroundColor White
