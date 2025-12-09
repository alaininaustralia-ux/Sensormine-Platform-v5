-- Migration: Add icon column to assets table
-- Date: 2025-12-09
-- Description: Adds optional icon field to allow custom icons for asset tree visualization

-- Add icon column to assets table
ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS icon VARCHAR(100);

COMMENT ON COLUMN assets.icon IS 'Custom icon name for UI (e.g., factory, server, thermometer). Uses default based on asset_type if null.';

-- Create index for faster filtering by icon (optional, useful if filtering by icon)
CREATE INDEX IF NOT EXISTS idx_assets_icon ON assets(icon) WHERE icon IS NOT NULL;
