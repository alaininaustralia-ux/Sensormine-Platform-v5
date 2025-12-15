-- Migration: Add video_analytics_configurations table
-- Date: December 12, 2025
-- Description: Table for storing video analytics configurations (camera streams + AI models)

CREATE TABLE IF NOT EXISTS video_analytics_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL, -- rtsp, azure-blob, hls, webrtc
    source_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    processing_model VARCHAR(100) NOT NULL, -- object-detection, person-detection, etc.
    model_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT true,
    device_id UUID, -- Generated device ID for dashboard integration
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_video_analytics_tenant_id ON video_analytics_configurations(tenant_id);
CREATE INDEX idx_video_analytics_enabled ON video_analytics_configurations(enabled);
CREATE INDEX idx_video_analytics_tenant_name ON video_analytics_configurations(tenant_id, name);
CREATE INDEX idx_video_analytics_device_id ON video_analytics_configurations(device_id) WHERE device_id IS NOT NULL;

-- Comments
COMMENT ON TABLE video_analytics_configurations IS 'Video analytics configurations with camera streams and AI processing models';
COMMENT ON COLUMN video_analytics_configurations.source_type IS 'Type of video source: rtsp, azure-blob, hls, webrtc';
COMMENT ON COLUMN video_analytics_configurations.source_config IS 'JSON configuration for the video source (URLs, credentials, etc.)';
COMMENT ON COLUMN video_analytics_configurations.processing_model IS 'AI model type to apply to video stream';
COMMENT ON COLUMN video_analytics_configurations.model_configuration IS 'JSON configuration for the AI model (thresholds, parameters, etc.)';
COMMENT ON COLUMN video_analytics_configurations.device_id IS 'Associated device ID for dashboard integration - appears as a selectable device';
