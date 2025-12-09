-- Device Management Schema Initialization
-- This script creates the necessary tables for Device.API

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Device Types Table
CREATE TABLE IF NOT EXISTS device_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    protocol VARCHAR(50) NOT NULL,
    protocol_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_id UUID,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    alert_templates JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    CONSTRAINT uq_device_types_tenant_name UNIQUE (tenant_id, name)
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE RESTRICT,
    asset_id UUID,
    serial_number VARCHAR(255),
    custom_field_values JSONB DEFAULT '{}'::jsonb,
    location JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_devices_tenant_device_id UNIQUE (tenant_id, device_id)
);

-- Schemas Table (for data validation)
CREATE TABLE IF NOT EXISTS schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    schema_type VARCHAR(50) NOT NULL,
    schema_definition JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_schemas_tenant_name_version UNIQUE (tenant_id, name, version)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_device_types_tenant_id ON device_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_types_protocol ON device_types(protocol);
CREATE INDEX IF NOT EXISTS idx_device_types_tags ON device_types USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_device_types_active ON device_types(is_active);

CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_type_id ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_asset_id ON devices(asset_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen_at ON devices(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_schemas_tenant_id ON schemas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schemas_name ON schemas(name);
CREATE INDEX IF NOT EXISTS idx_schemas_is_active ON schemas(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_device_types_updated_at ON device_types;
CREATE TRIGGER update_device_types_updated_at
    BEFORE UPDATE ON device_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schemas_updated_at ON schemas;
CREATE TRIGGER update_schemas_updated_at
    BEFORE UPDATE ON schemas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default device types
DO $$
BEGIN
    -- Create a default temperature sensor device type
    INSERT INTO device_types (id, tenant_id, name, description, protocol)
    VALUES (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        '00000000-0000-0000-0000-000000000001',
        'Temperature Sensor',
        'Standard temperature monitoring sensor',
        'MQTT'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Create a default industrial equipment device type
    INSERT INTO device_types (id, tenant_id, name, description, protocol)
    VALUES (
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        '00000000-0000-0000-0000-000000000001',
        'Industrial Equipment',
        'Generic industrial equipment',
        'HTTP'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sensormine;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sensormine;
