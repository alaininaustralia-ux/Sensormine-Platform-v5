-- TimescaleDB Schema for Sensormine Platform
-- This script creates the time-series tables (hypertables) for telemetry data

-- Create telemetry table
CREATE TABLE IF NOT EXISTS telemetry (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    value DOUBLE PRECISION,
    unit VARCHAR(50),
    tags JSONB,
    metadata JSONB
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('telemetry', 'time', if_not_exists => TRUE);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time ON telemetry (tenant_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_metric ON telemetry (metric_name, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_tags ON telemetry USING GIN (tags);

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

-- Create continuous aggregates for common queries (optional, for performance)
-- Example: 1-hour averages for telemetry
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    device_id,
    tenant_id,
    metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as count_value
FROM telemetry
GROUP BY bucket, device_id, tenant_id, metric_name;

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
