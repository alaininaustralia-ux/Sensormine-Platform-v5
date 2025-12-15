-- Migration: Add templates table
-- Created: December 13, 2025
-- Description: Add support for configuration templates

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    author_email VARCHAR(255),
    template_json JSONB NOT NULL,
    tags TEXT[],
    category VARCHAR(100),
    license VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_templates_tenant_id ON templates(tenant_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_public ON templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_tags ON templates USING gin(tags);

-- Template import history table
CREATE TABLE IF NOT EXISTS template_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL,
    template_version VARCHAR(50) NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_by VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    imported_count JSONB,
    skipped_count JSONB,
    errors JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_template_imports_template FOREIGN KEY (template_id)
        REFERENCES templates(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_template_imports_tenant_id ON template_imports(tenant_id);
CREATE INDEX idx_template_imports_template_id ON template_imports(template_id);

-- Comments
COMMENT ON TABLE templates IS 'Configuration templates for sharing across tenants';
COMMENT ON TABLE template_imports IS 'History of template imports';
COMMENT ON COLUMN templates.template_json IS 'Complete template JSON including metadata and resources';
COMMENT ON COLUMN templates.is_public IS 'Whether template is available to all tenants';
COMMENT ON COLUMN templates.is_verified IS 'Whether template has been verified by Sensormine';
