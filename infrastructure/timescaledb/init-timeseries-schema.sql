-- TimescaleDB Schema for Sensormine Platform
-- This script creates the time-series tables (hypertables) for telemetry data

-- Create telemetry table with JSONB for flexible schema
CREATE TABLE IF NOT EXISTS telemetry (
    time           TIMESTAMPTZ NOT NULL,
    device_id      TEXT        NOT NULL,
    tenant_id      UUID        NOT NULL,
    device_type    TEXT        NOT NULL,

    -- Static system-level fields (always present)
    battery_level  DOUBLE PRECISION,
    signal_strength DOUBLE PRECISION,
    latitude       DOUBLE PRECISION,
    longitude      DOUBLE PRECISION,
    altitude       DOUBLE PRECISION,

    -- All user-configurable sensor fields
    custom_fields  JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    quality        JSONB,
    
    PRIMARY KEY (device_id, time)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('telemetry', 'time', if_not_exists => TRUE);

-- Create indexes for common queries
-- Composite index for tenant isolation (CRITICAL for multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_device_time ON telemetry (tenant_id, device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time ON telemetry (tenant_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_type_time ON telemetry (tenant_id, device_type, time DESC);

-- GIN index for JSONB queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_telemetry_custom_fields ON telemetry USING GIN (custom_fields);

-- Row Level Security (RLS) for tenant isolation
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation_policy ON telemetry
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for service accounts (can see all data)
CREATE POLICY service_account_policy ON telemetry
    USING (current_setting('app.current_tenant_id', true) IS NULL OR 
           current_setting('app.is_service_account', true)::boolean = true);

-- Enable compression (retain raw data for 7 days, compress older)
ALTER TABLE telemetry SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('telemetry', INTERVAL '7 days');

-- Retention policy (keep data for 2 years)
SELECT add_retention_policy('telemetry', INTERVAL '2 years');

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    details JSONB
);

-- Convert to hypertable
SELECT create_hypertable('events', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_device_time ON events (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_events_tenant_time ON events (tenant_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events (severity, time DESC);

-- Create metrics table for aggregated data
CREATE TABLE IF NOT EXISTS metrics (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    avg_value DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    sum_value DOUBLE PRECISION,
    count_value BIGINT
);

-- Convert to hypertable
SELECT create_hypertable('metrics', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_metrics_device_time ON metrics (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant_time ON metrics (tenant_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_metric ON metrics (metric_name, time DESC);

-- Create device status history table
CREATE TABLE IF NOT EXISTS device_status_history (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    reason TEXT,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('device_status_history', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_device_status_device_time ON device_status_history (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_device_status_tenant_time ON device_status_history (tenant_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_device_status_status ON device_status_history (status, time DESC);

-- Device type schema table (stores user-configurable schemas)
CREATE TABLE IF NOT EXISTS device_type_schema (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    device_type    TEXT NOT NULL,
    version        INT NOT NULL DEFAULT 1,
    schema_json    JSONB NOT NULL,
    description    TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    created_by     TEXT,
    
    UNIQUE(tenant_id, device_type, version)
);

CREATE INDEX IF NOT EXISTS idx_device_type_schema_tenant ON device_type_schema (tenant_id, device_type);
CREATE INDEX IF NOT EXISTS idx_device_type_schema_active ON device_type_schema (tenant_id, device_type, is_active) WHERE is_active = true;

-- Row Level Security for device_type_schema
ALTER TABLE device_type_schema ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_schema ON device_type_schema
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY service_account_schema ON device_type_schema
    USING (current_setting('app.current_tenant_id', true) IS NULL OR 
           current_setting('app.is_service_account', true)::boolean = true);

-- Device applied schema table (per-device schema versioning)
CREATE TABLE IF NOT EXISTS device_applied_schema (
    device_id      TEXT PRIMARY KEY,
    tenant_id      UUID NOT NULL,
    device_type    TEXT NOT NULL,
    schema_version INT NOT NULL,
    applied_schema JSONB NOT NULL,
    config_json    JSONB,
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_applied_schema_tenant ON device_applied_schema (tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_applied_schema_type ON device_applied_schema (tenant_id, device_type);

-- Row Level Security for device_applied_schema
ALTER TABLE device_applied_schema ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_device_schema ON device_applied_schema
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY service_account_device_schema ON device_applied_schema
    USING (current_setting('app.current_tenant_id', true) IS NULL OR 
           current_setting('app.is_service_account', true)::boolean = true);

-- Example continuous aggregate for a specific custom field
-- This can be created dynamically when users define new fields
-- CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_temperature_hourly
-- WITH (timescaledb.continuous) AS
-- SELECT
--     device_id,
--     time_bucket('1 hour', time) AS bucket,
--     AVG((custom_fields->>'temperature')::double precision) AS avg_temperature,
--     MIN((custom_fields->>'temperature')::double precision) AS min_temperature,
--     MAX((custom_fields->>'temperature')::double precision) AS max_temperature,
--     COUNT(*) as count
-- FROM telemetry
-- WHERE custom_fields ? 'temperature'
-- GROUP BY device_id, bucket;

-- Add refresh policy (refresh every hour)
SELECT add_continuous_aggregate_policy('telemetry_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- Set up data retention policies (optional - keeps last 90 days of raw data)
-- Uncomment these lines if you want automatic data retention
-- SELECT add_retention_policy('telemetry', INTERVAL '90 days', if_not_exists => TRUE);
-- SELECT add_retention_policy('events', INTERVAL '90 days', if_not_exists => TRUE);
-- SELECT add_retention_policy('metrics', INTERVAL '365 days', if_not_exists => TRUE);
-- SELECT add_retention_policy('device_status_history', INTERVAL '180 days', if_not_exists => TRUE);

-- Create compression policies for older data (saves storage)
ALTER TABLE telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id, tenant_id'
);

SELECT add_compression_policy('telemetry', INTERVAL '7 days', if_not_exists => TRUE);

ALTER TABLE events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id, tenant_id'
);

SELECT add_compression_policy('events', INTERVAL '7 days', if_not_exists => TRUE);
