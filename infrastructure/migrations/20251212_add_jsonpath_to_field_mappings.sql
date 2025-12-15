-- Migration: Add JsonPath column to field_mappings table
-- Date: 2025-12-12
-- Purpose: Enable dynamic JSONB queries by specifying extraction path for each field

-- Add JsonPath column to field_mappings
ALTER TABLE field_mappings
ADD COLUMN IF NOT EXISTS json_path VARCHAR(500);

-- Add comment
COMMENT ON COLUMN field_mappings.json_path IS 'JSON path for extracting value from custom_fields JSONB column (e.g., $.customFields.temperature)';

-- Update existing field mappings with default JSON paths based on field source
-- For Schema fields, assume they are in the root of customFields
UPDATE field_mappings
SET json_path = CONCAT('$.', field_name)
WHERE field_source = 'Schema' AND json_path IS NULL;

-- For CustomField fields, also assume root level
UPDATE field_mappings
SET json_path = CONCAT('$.', field_name)
WHERE field_source = 'CustomField' AND json_path IS NULL;

-- For System fields, they are stored as direct columns, not in JSONB
-- Leave json_path as NULL for system fields

-- Create index for better query performance on json_path lookups
CREATE INDEX IF NOT EXISTS idx_field_mappings_json_path 
ON field_mappings(json_path) 
WHERE json_path IS NOT NULL;

-- Verify migration
SELECT 
    COUNT(*) as total_mappings,
    COUNT(json_path) as with_json_path,
    COUNT(*) - COUNT(json_path) as without_json_path
FROM field_mappings;
