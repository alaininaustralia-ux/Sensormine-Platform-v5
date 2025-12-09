-- Digital Twin Asset Hierarchy Schema
-- Requires PostgreSQL with LTREE extension and PostGIS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Asset hierarchy table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    asset_type VARCHAR(50) NOT NULL, -- Site, Building, Area, Line, Equipment, Component
    path LTREE NOT NULL, -- Materialized path for efficient queries
    level INTEGER NOT NULL, -- Depth in hierarchy (0 = root)
    metadata JSONB DEFAULT '{}', -- Custom properties
    location GEOGRAPHY(POINT), -- GPS coordinates using PostGIS
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, offline, decommissioned
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT unique_asset_name_per_parent UNIQUE(tenant_id, parent_id, name)
);

CREATE INDEX idx_assets_tenant ON assets(tenant_id);
CREATE INDEX idx_assets_parent ON assets(parent_id);
CREATE INDEX idx_assets_path ON assets USING GIST(path);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_location ON assets USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX idx_assets_level ON assets(level);

-- Asset state (current values) - optimized for reads
CREATE TABLE IF NOT EXISTS asset_states (
    asset_id UUID PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    state JSONB NOT NULL DEFAULT '{}', -- Current data point values
    calculated_metrics JSONB DEFAULT '{}', -- Derived KPIs (uptime, OEE, etc.)
    alarm_status VARCHAR(50) DEFAULT 'ok', -- ok, warning, critical
    alarm_count INTEGER DEFAULT 0,
    last_update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_update_device_id VARCHAR(200),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_asset_states_tenant ON asset_states(tenant_id);
CREATE INDEX idx_asset_states_alarm ON asset_states(alarm_status);
CREATE INDEX idx_asset_states_last_update ON asset_states(last_update_time);

-- Data point to asset mappings
CREATE TABLE IF NOT EXISTS data_point_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    schema_id UUID NOT NULL, -- FK to schemas table
    schema_version VARCHAR(50) NOT NULL,
    json_path VARCHAR(500) NOT NULL, -- JSONPath expression (e.g., $.temperature)
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL, -- Human-readable name
    description TEXT,
    unit VARCHAR(50), -- e.g., °C, kW, rpm
    aggregation_method VARCHAR(50) DEFAULT 'last', -- last, avg, sum, min, max, count
    rollup_enabled BOOLEAN DEFAULT true,
    transform_expression TEXT, -- Optional: JavaScript/SQL expression for transformation
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT unique_mapping UNIQUE(tenant_id, schema_id, json_path, asset_id)
);

CREATE INDEX idx_mappings_tenant ON data_point_mappings(tenant_id);
CREATE INDEX idx_mappings_schema ON data_point_mappings(schema_id);
CREATE INDEX idx_mappings_asset ON data_point_mappings(asset_id);
CREATE INDEX idx_mappings_json_path ON data_point_mappings(json_path);

-- Asset rollup configuration
CREATE TABLE IF NOT EXISTS asset_rollup_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    metric_name VARCHAR(200) NOT NULL,
    aggregation_method VARCHAR(50) NOT NULL, -- avg, sum, min, max, count, last
    rollup_interval INTERVAL DEFAULT '5 minutes', -- How often to compute
    include_children BOOLEAN DEFAULT true,
    weight_factor NUMERIC(10, 4) DEFAULT 1.0, -- For weighted averages
    filter_expression TEXT, -- Optional: WHERE clause to filter children
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT unique_rollup UNIQUE(tenant_id, asset_id, metric_name)
);

CREATE INDEX idx_rollup_configs_tenant ON asset_rollup_configs(tenant_id);
CREATE INDEX idx_rollup_configs_asset ON asset_rollup_configs(asset_id);

-- Pre-computed rollups (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS asset_rollup_data (
    asset_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION,
    sample_count INTEGER,
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (asset_id, metric_name, time)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('asset_rollup_data', 'time', if_not_exists => TRUE);

CREATE INDEX idx_rollup_data_asset ON asset_rollup_data(asset_id, time DESC);
CREATE INDEX idx_rollup_data_tenant ON asset_rollup_data(tenant_id, time DESC);
CREATE INDEX idx_rollup_data_metric ON asset_rollup_data(metric_name, time DESC);

-- Asset audit log
CREATE TABLE IF NOT EXISTS asset_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete, move
    changes JSONB, -- Before/after diff
    user_id VARCHAR(100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_asset ON asset_audit_log(asset_id, timestamp DESC);
CREATE INDEX idx_audit_tenant ON asset_audit_log(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_time ON asset_audit_log(timestamp DESC);

-- Helper function to update asset path when parent changes
CREATE OR REPLACE FUNCTION update_asset_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path LTREE;
    parent_level INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Root level asset
        NEW.path = text2ltree(NEW.id::TEXT);
        NEW.level = 0;
    ELSE
        -- Get parent's path and level
        SELECT path, level INTO parent_path, parent_level
        FROM assets
        WHERE id = NEW.parent_id AND tenant_id = NEW.tenant_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Parent asset not found';
        END IF;
        
        NEW.path = parent_path || text2ltree(NEW.id::TEXT);
        NEW.level = parent_level + 1;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update path on insert/update
DROP TRIGGER IF EXISTS trigger_update_asset_path ON assets;
CREATE TRIGGER trigger_update_asset_path
    BEFORE INSERT OR UPDATE OF parent_id
    ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_path();

-- Helper function to get all descendants of an asset
CREATE OR REPLACE FUNCTION get_asset_descendants(p_asset_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(200),
    asset_type VARCHAR(50),
    level INTEGER,
    path LTREE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.asset_type, a.level, a.path
    FROM assets a
    WHERE a.path <@ (SELECT path FROM assets WHERE id = p_asset_id)
    ORDER BY a.path;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get all ancestors of an asset
CREATE OR REPLACE FUNCTION get_asset_ancestors(p_asset_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(200),
    asset_type VARCHAR(50),
    level INTEGER,
    path LTREE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.asset_type, a.level, a.path
    FROM assets a
    WHERE (SELECT path FROM assets WHERE id = p_asset_id) <@ a.path
    ORDER BY a.level;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON assets TO sensormine;
GRANT ALL ON asset_states TO sensormine;
GRANT ALL ON data_point_mappings TO sensormine;
GRANT ALL ON asset_rollup_configs TO sensormine;
GRANT ALL ON asset_rollup_data TO sensormine;
GRANT ALL ON asset_audit_log TO sensormine;

-- Insert default asset types for reference
COMMENT ON COLUMN assets.asset_type IS 'Asset type: Site, Building, Area, Line, Equipment, Component, Sensor';
COMMENT ON COLUMN assets.path IS 'Materialized path using LTREE for efficient hierarchical queries';
COMMENT ON COLUMN assets.level IS 'Depth in hierarchy (0 = root level)';
COMMENT ON COLUMN assets.status IS 'Asset status: active, maintenance, offline, decommissioned';
