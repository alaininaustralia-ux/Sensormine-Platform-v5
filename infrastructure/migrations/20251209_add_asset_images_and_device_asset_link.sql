-- Migration: Add image fields to assets and AssetId to devices
-- Date: 2025-12-09
-- Description: Adds PrimaryImageUrl, ImageUrls, Documents to assets table
--              Adds AssetId to devices table to link devices to digital twin assets

-- Add image fields to assets table
ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS primary_image_url VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;

-- Add asset_id to devices table
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;

-- Create index on devices.asset_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_asset_id ON devices(asset_id);

-- Add comments
COMMENT ON COLUMN assets.primary_image_url IS 'Primary/featured image URL for the asset';
COMMENT ON COLUMN assets.image_urls IS 'Array of additional image URLs (gallery)';
COMMENT ON COLUMN assets.documents IS 'Document attachments as name->URL key-value pairs';
COMMENT ON COLUMN devices.asset_id IS 'Link to digital twin asset (optional)';
