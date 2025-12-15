-- Add Alerts Tables
-- Description: Creates alert_rules and alert_instances tables for the Alerts.API service
-- Date: 2025-12-12

-- Alert Rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_type VARCHAR(50) NOT NULL, -- 'Device', 'DeviceType', 'Asset', etc.
    device_ids TEXT[], -- Array of device IDs (when targeting specific devices)
    device_type_ids TEXT[], -- Array of device type IDs (when targeting device types)
    conditions JSONB NOT NULL, -- Alert conditions in JSON format
    condition_logic VARCHAR(10) DEFAULT 'AND', -- 'AND' or 'OR'
    severity VARCHAR(20) NOT NULL, -- 'Info', 'Warning', 'Critical'
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    evaluation_frequency_seconds INTEGER NOT NULL DEFAULT 60, -- How often to evaluate
    time_window_seconds INTEGER, -- Time window for aggregations
    cooldown_minutes INTEGER DEFAULT 15, -- Cooldown period between alerts
    delivery_channels JSONB, -- Array of delivery channel configs
    recipients JSONB, -- Array of recipient emails/phones/webhooks
    escalation_rule JSONB, -- Escalation configuration
    tags TEXT[], -- Tags for categorization
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert Instances table
CREATE TABLE IF NOT EXISTS alert_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    alert_rule_id UUID NOT NULL,
    device_id UUID, -- Device that triggered the alert
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active', 'Acknowledged', 'Resolved', 'Escalated'
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB, -- Context data (sensor values, thresholds, etc.)
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_alert_rule FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
);

-- Indexes for alert_rules
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant_id ON alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_enabled ON alert_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_target_type ON alert_rules(target_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_tags ON alert_rules USING gin(tags);

-- Indexes for alert_instances
CREATE INDEX IF NOT EXISTS idx_alert_instances_tenant_id ON alert_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_instances_alert_rule_id ON alert_instances(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_instances_device_id ON alert_instances(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_instances_status ON alert_instances(status);
CREATE INDEX IF NOT EXISTS idx_alert_instances_triggered_at ON alert_instances(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_instances_active ON alert_instances(status, triggered_at DESC) WHERE status = 'Active';

-- Update trigger for alert_rules
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_rules_updated_at
BEFORE UPDATE ON alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_alert_rules_updated_at();

-- Update trigger for alert_instances
CREATE OR REPLACE FUNCTION update_alert_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_instances_updated_at
BEFORE UPDATE ON alert_instances
FOR EACH ROW
EXECUTE FUNCTION update_alert_instances_updated_at();
