-- Migration: Add Custom Widget System
-- Date: 2025-12-13
-- Description: Add tables for custom widget registry, permissions, and usage tracking

-- =====================================================
-- 1. custom_widgets table
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    widget_id VARCHAR(255) NOT NULL,           -- e.g., "com.example.custom-gauge"
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    author_organization VARCHAR(255),
    category VARCHAR(100),                     -- chart, table, map, metric, custom
    tags TEXT[],
    icon_url TEXT,
    storage_path TEXT NOT NULL,                -- MinIO path: {tenantId}/{widgetId}/{version}/
    manifest JSONB NOT NULL,                   -- Full manifest.json content
    status VARCHAR(50) DEFAULT 'active' NOT NULL, -- active, deprecated, disabled
    download_count INTEGER DEFAULT 0,
    file_size_bytes BIGINT,                    -- Package size in bytes
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_widget_version UNIQUE(tenant_id, widget_id, version),
    CONSTRAINT chk_status CHECK (status IN ('active', 'deprecated', 'disabled'))
);

-- Indexes for custom_widgets
CREATE INDEX idx_custom_widgets_tenant_id ON custom_widgets(tenant_id);
CREATE INDEX idx_custom_widgets_widget_id ON custom_widgets(widget_id);
CREATE INDEX idx_custom_widgets_status ON custom_widgets(status);
CREATE INDEX idx_custom_widgets_category ON custom_widgets(category);
CREATE INDEX idx_custom_widgets_created_at ON custom_widgets(created_at DESC);
CREATE INDEX idx_custom_widgets_manifest ON custom_widgets USING gin(manifest);

-- Comments
COMMENT ON TABLE custom_widgets IS 'Registry of custom dashboard widgets uploaded by developers';
COMMENT ON COLUMN custom_widgets.widget_id IS 'Unique widget identifier in reverse domain format (e.g., com.example.custom-gauge)';
COMMENT ON COLUMN custom_widgets.manifest IS 'Complete widget manifest including config schema, permissions, and metadata';
COMMENT ON COLUMN custom_widgets.storage_path IS 'Path to widget bundle in MinIO object storage';


-- =====================================================
-- 2. widget_permissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS widget_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES custom_widgets(id) ON DELETE CASCADE,
    permission_type VARCHAR(100) NOT NULL,     -- api.query, api.devices, resource.telemetry
    permission_scope VARCHAR(255),             -- Optional scope restriction (e.g., "deviceType:temperature")
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for widget_permissions
CREATE INDEX idx_widget_permissions_widget_id ON widget_permissions(widget_id);
CREATE INDEX idx_widget_permissions_type ON widget_permissions(permission_type);

-- Comments
COMMENT ON TABLE widget_permissions IS 'API and resource permissions granted to custom widgets';
COMMENT ON COLUMN widget_permissions.permission_type IS 'Permission identifier (e.g., api.query, api.devices)';
COMMENT ON COLUMN widget_permissions.permission_scope IS 'Optional scope limitation for the permission';


-- =====================================================
-- 3. widget_usage_log table
-- =====================================================
CREATE TABLE IF NOT EXISTS widget_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES custom_widgets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    user_id UUID,
    dashboard_id UUID,
    event_type VARCHAR(50) NOT NULL,           -- load, error, api_call, permission_denied
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_event_type CHECK (event_type IN ('load', 'error', 'api_call', 'permission_denied', 'unload'))
);

-- Indexes for widget_usage_log
CREATE INDEX idx_widget_usage_log_widget_id ON widget_usage_log(widget_id);
CREATE INDEX idx_widget_usage_log_tenant_id ON widget_usage_log(tenant_id);
CREATE INDEX idx_widget_usage_log_created_at ON widget_usage_log(created_at DESC);
CREATE INDEX idx_widget_usage_log_event_type ON widget_usage_log(event_type);

-- Partitioning setup for usage log (optional, for high-volume environments)
-- This can be enabled later if needed:
-- SELECT create_hypertable('widget_usage_log', 'created_at', if_not_exists => TRUE);

-- Comments
COMMENT ON TABLE widget_usage_log IS 'Audit log for custom widget usage and API calls';
COMMENT ON COLUMN widget_usage_log.event_type IS 'Type of event (load, error, api_call, permission_denied)';
COMMENT ON COLUMN widget_usage_log.event_data IS 'Additional event context (error details, API call info, etc.)';


-- =====================================================
-- 4. widget_versions view
-- =====================================================
-- Helper view to get latest version of each widget
CREATE OR REPLACE VIEW widget_versions AS
SELECT 
    widget_id,
    tenant_id,
    MAX(version) as latest_version,
    COUNT(*) as version_count,
    MAX(updated_at) as last_updated
FROM custom_widgets
WHERE status = 'active'
GROUP BY widget_id, tenant_id;

COMMENT ON VIEW widget_versions IS 'Summary view showing latest version of each widget';


-- =====================================================
-- 5. Functions and Triggers
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_custom_widgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_widgets_updated_at
    BEFORE UPDATE ON custom_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_widgets_updated_at();


-- Increment download count
CREATE OR REPLACE FUNCTION increment_widget_download_count(p_widget_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE custom_widgets
    SET download_count = download_count + 1
    WHERE id = p_widget_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_widget_download_count IS 'Increment download counter when widget is downloaded';


-- =====================================================
-- 6. Sample Data (Development Only)
-- =====================================================

-- Insert a sample custom widget for testing
-- This should be removed or commented out in production
INSERT INTO custom_widgets (
    tenant_id,
    widget_id,
    name,
    description,
    version,
    author_name,
    author_email,
    category,
    tags,
    storage_path,
    manifest,
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'io.sensormine.example.gauge',
    'Example Gauge Widget',
    'A sample custom gauge widget for demonstration',
    '1.0.0',
    'Sensormine Platform Team',
    'dev@sensormine.io',
    'chart',
    ARRAY['gauge', 'metric', 'example'],
    '00000000-0000-0000-0000-000000000001/io.sensormine.example.gauge/1.0.0/',
    '{
        "id": "io.sensormine.example.gauge",
        "name": "Example Gauge Widget",
        "version": "1.0.0",
        "entryPoint": "index.js",
        "permissions": {
            "apis": ["query", "devices"],
            "resources": ["telemetry"]
        },
        "config": {
            "inputs": [
                {"name": "deviceId", "type": "string", "required": true},
                {"name": "metric", "type": "string", "required": true}
            ]
        }
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (tenant_id, widget_id, version) DO NOTHING;

-- Insert permissions for sample widget
INSERT INTO widget_permissions (widget_id, permission_type)
SELECT id, unnest(ARRAY['api.query', 'api.devices'])
FROM custom_widgets
WHERE widget_id = 'io.sensormine.example.gauge'
ON CONFLICT DO NOTHING;


-- =====================================================
-- 7. Grant Permissions
-- =====================================================

-- Grant access to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_widgets TO sensormine;
GRANT SELECT, INSERT, UPDATE, DELETE ON widget_permissions TO sensormine;
GRANT SELECT, INSERT ON widget_usage_log TO sensormine;
GRANT SELECT ON widget_versions TO sensormine;
GRANT EXECUTE ON FUNCTION increment_widget_download_count TO sensormine;


-- =====================================================
-- Verification Queries
-- =====================================================

-- List all custom widgets
-- SELECT widget_id, name, version, status, category FROM custom_widgets ORDER BY created_at DESC;

-- Get widget with permissions
-- SELECT 
--     cw.widget_id,
--     cw.name,
--     cw.version,
--     array_agg(wp.permission_type) as permissions
-- FROM custom_widgets cw
-- LEFT JOIN widget_permissions wp ON cw.id = wp.widget_id
-- GROUP BY cw.id, cw.widget_id, cw.name, cw.version;

-- Get usage statistics
-- SELECT 
--     cw.widget_id,
--     cw.name,
--     COUNT(wul.id) as usage_count,
--     COUNT(DISTINCT wul.user_id) as unique_users
-- FROM custom_widgets cw
-- LEFT JOIN widget_usage_log wul ON cw.id = wul.widget_id
-- GROUP BY cw.id, cw.widget_id, cw.name
-- ORDER BY usage_count DESC;
