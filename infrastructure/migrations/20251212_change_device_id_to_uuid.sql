-- Migration: Change device_id column from text to uuid in telemetry table
-- Date: 2025-12-12
-- Purpose: Enforce GUID/UUID for device identifiers instead of strings

-- Step 1: Add a new temporary uuid column
ALTER TABLE telemetry ADD COLUMN device_id_temp UUID;

-- Step 2: Update the new column with converted values
-- This assumes existing device_id values are valid UUIDs in text format
UPDATE telemetry SET device_id_temp = device_id::uuid;

-- Step 3: Drop the old text column
ALTER TABLE telemetry DROP COLUMN device_id;

-- Step 4: Rename the temporary column to device_id
ALTER TABLE telemetry RENAME COLUMN device_id_temp TO device_id;

-- Step 5: Add NOT NULL constraint
ALTER TABLE telemetry ALTER COLUMN device_id SET NOT NULL;

-- Step 6: Recreate primary key with new column type
ALTER TABLE telemetry DROP CONSTRAINT IF EXISTS telemetry_pkey;
ALTER TABLE telemetry ADD PRIMARY KEY (device_id, time);

-- Step 7: Recreate indexes with new column type
DROP INDEX IF EXISTS idx_telemetry_device_time;
DROP INDEX IF EXISTS idx_telemetry_tenant_time;
DROP INDEX IF EXISTS idx_telemetry_device_type;
DROP INDEX IF EXISTS idx_telemetry_time_desc;

CREATE INDEX idx_telemetry_device_time ON telemetry(device_id, time DESC);
CREATE INDEX idx_telemetry_tenant_time ON telemetry(tenant_id, time DESC);
CREATE INDEX idx_telemetry_device_type ON telemetry(device_type, time DESC);
CREATE INDEX idx_telemetry_time_desc ON telemetry(time DESC);

-- Step 8: Update continuous aggregates if any exist
-- Note: This would need to be adjusted based on your specific continuous aggregates
-- You may need to recreate them manually

COMMENT ON COLUMN telemetry.device_id IS 'Device UUID identifier (changed from text to uuid 2025-12-12)';

SELECT 'Migration completed: device_id is now UUID type' as result;
