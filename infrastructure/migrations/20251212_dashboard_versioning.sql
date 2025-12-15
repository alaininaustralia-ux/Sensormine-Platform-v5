-- Dashboard Versioning and Optimistic Locking
-- Adds version control to prevent concurrent edit conflicts
-- Created: December 12, 2025

-- Add version column
ALTER TABLE dashboards 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Create index for version-based queries
CREATE INDEX IF NOT EXISTS ix_dashboards_version ON dashboards(id, version);

-- Update existing dashboards to version 1
UPDATE dashboards SET version = 1 WHERE version IS NULL;

-- Make version NOT NULL after setting default
ALTER TABLE dashboards ALTER COLUMN version SET NOT NULL;

COMMENT ON COLUMN dashboards.version IS 'Version number for optimistic locking (incremented on each update)';
COMMENT ON COLUMN dashboards.last_modified_by IS 'User ID who last modified the dashboard';
