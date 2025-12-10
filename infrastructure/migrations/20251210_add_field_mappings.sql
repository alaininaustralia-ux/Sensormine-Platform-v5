-- Migration: Add field_mappings table for device field metadata
-- Date: 2025-12-10
-- Purpose: Store field mappings with friendly names for dashboard design and query operations

-- Create field_mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
    
    -- Field identification
    field_name VARCHAR(255) NOT NULL, -- The actual field name in telemetry data
    field_source VARCHAR(50) NOT NULL, -- 'schema' or 'custom_field' or 'system'
    
    -- Display metadata
    friendly_name VARCHAR(255) NOT NULL, -- User-friendly display name
    description TEXT, -- Field description
    unit VARCHAR(50), -- Unit of measurement (e.g., "°C", "hPa", "%")
    
    -- Data type and validation
    data_type VARCHAR(50) NOT NULL, -- number, string, boolean, timestamp, etc.
    min_value DOUBLE PRECISION, -- For numeric fields
    max_value DOUBLE PRECISION, -- For numeric fields
    
    -- Query and display configuration
    is_queryable BOOLEAN NOT NULL DEFAULT true, -- Can be used in queries/dashboards
    is_visible BOOLEAN NOT NULL DEFAULT true, -- Visible in UI
    display_order INTEGER NOT NULL DEFAULT 0, -- Order for display
    
    -- Categorization
    category VARCHAR(100), -- Group fields (e.g., "Environmental", "System", "Status")
    tags JSONB DEFAULT '[]'::jsonb, -- Additional tags for filtering
    
    -- Aggregation hints for Query API
    default_aggregation VARCHAR(50), -- avg, sum, min, max, count, last
    supports_aggregations JSONB DEFAULT '["avg", "min", "max", "count", "last"]'::jsonb,
    
    -- Formatting hints for display
    format_string VARCHAR(100), -- e.g., "0.00" for 2 decimals, "0,0" for thousands
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Ensure unique field mapping per device type
    CONSTRAINT uq_field_mappings_device_type_field UNIQUE (device_type_id, field_name)
);

-- Create indexes for performance
CREATE INDEX idx_field_mappings_tenant_id ON field_mappings(tenant_id);
CREATE INDEX idx_field_mappings_device_type_id ON field_mappings(device_type_id);
CREATE INDEX idx_field_mappings_field_source ON field_mappings(field_source);
CREATE INDEX idx_field_mappings_is_queryable ON field_mappings(is_queryable) WHERE is_queryable = true;
CREATE INDEX idx_field_mappings_category ON field_mappings(category) WHERE category IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_field_mappings_updated_at
    BEFORE UPDATE ON field_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE field_mappings IS 'Field metadata mapping device type and schema fields to friendly names for dashboard design and queries';
COMMENT ON COLUMN field_mappings.field_source IS 'Source of the field: schema (from SchemaRegistry), custom_field (DeviceType.CustomFields), or system (built-in like batteryLevel)';
COMMENT ON COLUMN field_mappings.friendly_name IS 'User-friendly display name for dashboards and UI';
COMMENT ON COLUMN field_mappings.default_aggregation IS 'Suggested aggregation method for time-series queries';

-- Sample data for system fields (common to all device types)
-- Note: These would be tenant-specific in production, but shown as example
INSERT INTO field_mappings (tenant_id, device_type_id, field_name, field_source, friendly_name, description, data_type, is_queryable, is_visible, display_order, category, default_aggregation, supports_aggregations)
SELECT 
    dt.tenant_id,
    dt.id,
    'batteryLevel',
    'system',
    'Battery Level',
    'Device battery charge percentage',
    'number',
    true,
    true,
    100,
    'System',
    'last',
    '["avg", "min", "max", "last"]'::jsonb
FROM device_types dt
WHERE NOT EXISTS (
    SELECT 1 FROM field_mappings fm 
    WHERE fm.device_type_id = dt.id AND fm.field_name = 'batteryLevel'
)
ON CONFLICT (device_type_id, field_name) DO NOTHING;

INSERT INTO field_mappings (tenant_id, device_type_id, field_name, field_source, friendly_name, description, data_type, is_queryable, is_visible, display_order, category, default_aggregation, supports_aggregations)
SELECT 
    dt.tenant_id,
    dt.id,
    'signalStrength',
    'system',
    'Signal Strength',
    'Network signal strength',
    'number',
    true,
    true,
    101,
    'System',
    'avg',
    '["avg", "min", "max", "last"]'::jsonb
FROM device_types dt
WHERE NOT EXISTS (
    SELECT 1 FROM field_mappings fm 
    WHERE fm.device_type_id = dt.id AND fm.field_name = 'signalStrength'
)
ON CONFLICT (device_type_id, field_name) DO NOTHING;
