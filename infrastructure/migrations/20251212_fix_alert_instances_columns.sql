-- Migration: Fix alert_instances column names to match C# model
-- Date: 2025-12-12
-- Description: Adds missing columns and renames 'notes' to 'acknowledgment_notes' and 'resolution_notes'

-- Add new columns for detailed notes
ALTER TABLE alert_instances 
ADD COLUMN IF NOT EXISTS acknowledgment_notes TEXT,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS field_values JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMPTZ;

-- Migrate existing 'notes' data to 'acknowledgment_notes' if any exist
UPDATE alert_instances 
SET acknowledgment_notes = notes 
WHERE notes IS NOT NULL AND acknowledgment_notes IS NULL;

-- Drop the old 'notes' column
ALTER TABLE alert_instances DROP COLUMN IF EXISTS notes;

-- Drop the 'resolved_by' column (not in C# model)
ALTER TABLE alert_instances DROP COLUMN IF EXISTS resolved_by;

-- Drop the old 'metadata' column and replace with 'details'
-- First migrate data if needed
UPDATE alert_instances 
SET details = 'Migrated from metadata: ' || metadata::text 
WHERE metadata IS NOT NULL AND details IS NULL;

ALTER TABLE alert_instances DROP COLUMN IF EXISTS metadata;

-- Add index for escalated alerts
CREATE INDEX IF NOT EXISTS idx_alert_instances_escalated 
ON alert_instances(is_escalated, escalated_at) 
WHERE is_escalated = true;

-- Add comment
COMMENT ON TABLE alert_instances IS 'Stores triggered alert instances with their lifecycle (triggered -> acknowledged -> resolved)';
