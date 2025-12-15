-- AI Agent Conversation Storage
-- Date: 2025-12-15
-- Purpose: Store user conversations with AI agent for persistence and history

-- Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_tenant_id ON ai_conversations(tenant_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_conversations_user_updated ON ai_conversations(user_id, updated_at DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tools_called JSONB,
    chart_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(conversation_id, created_at ASC);

-- Comments
COMMENT ON TABLE ai_conversations IS 'Stores AI agent conversation sessions per user';
COMMENT ON TABLE ai_messages IS 'Stores individual messages within conversations (user queries and AI responses)';
COMMENT ON COLUMN ai_messages.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN ai_messages.tools_called IS 'Array of MCP tools called for this message (for assistant messages)';
COMMENT ON COLUMN ai_messages.chart_data IS 'Chart configuration data (for assistant messages with visualizations)';

-- Apply to correct database
\connect sensormine_metadata;
