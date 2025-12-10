-- Migration: Add schema_id to device_types table
-- Date: 2025-12-10
-- Description: Add schema_id column to device_types to link devices to their telemetry schemas

-- Add schema_id column to device_types
ALTER TABLE device_types 
ADD COLUMN IF NOT EXISTS schema_id UUID;

-- Add index for schema_id lookups
CREATE INDEX IF NOT EXISTS idx_device_types_schema_id ON device_types(schema_id);

-- Add foreign key constraint to schemas table (if schemas table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schemas') THEN
        ALTER TABLE device_types 
        ADD CONSTRAINT fk_device_types_schema_id 
        FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing device types with a default schema (optional - you may want to do this manually)
-- Uncomment if you have a default schema you want to assign
-- UPDATE device_types 
-- SET schema_id = (SELECT id FROM schemas WHERE name = 'Default Device Schema' LIMIT 1)
-- WHERE schema_id IS NULL;

COMMENT ON COLUMN device_types.schema_id IS 'Reference to the schema that defines the telemetry structure for devices of this type';
