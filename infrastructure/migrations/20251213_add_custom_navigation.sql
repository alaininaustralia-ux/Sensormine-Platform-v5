-- Migration: Add CustomNavigation column to user_preferences table
-- Date: 2025-12-13
-- Description: Adds support for user-defined custom navigation items in the sidebar

-- Add CustomNavigation column
ALTER TABLE user_preferences 
ADD COLUMN custom_navigation TEXT NOT NULL DEFAULT '[]';

-- Add comment
COMMENT ON COLUMN user_preferences.custom_navigation IS 'Custom navigation items (user-defined sidebar links) stored as JSON array';
