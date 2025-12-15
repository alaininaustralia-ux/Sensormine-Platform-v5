# AI Agent Feature - Quick Start Guide

## ✨ What Was Added

A complete AI Agent interface integrated with the Sensormine MCP Server, allowing natural language queries for device telemetry with inline chart visualization.

---

## 📁 New Files Created

### 1. **MCP Client Library** (`src/lib/mcp-client.ts`)
- `McpClient`: Low-level JSON-RPC 2.0 client for MCP protocol
- `AiAgentService`: High-level service for natural language queries
- Tool wrappers: `query_devices`, `query_telemetry`, `query_asset_hierarchy`
- Chart configuration types

### 2. **AI Agent Page** (`src/app/ai-agent/page.tsx`)
- Chat interface with message history
- Inline chart rendering (line, area, bar charts)
- Data table fallback for non-chart responses
- Example queries for quick start
- Real-time loading states

### 3. **Navigation Update** (`src/components/layout/Sidebar.tsx`)
- Added "AI Agent" menu item with Sparkles icon
- Positioned between Alerts and Settings

### 4. **Environment Configuration** (`.env.local`)
- Added `NEXT_PUBLIC_MCP_URL=http://localhost:5400`

---

## 🚀 How to Use

### 1. Start the MCP Server
```powershell
# Option 1: Using quick start script
.\src\Services\Sensormine.MCP.Server\start-mcp-server.ps1

# Option 2: Manual start
cd src/Services/Sensormine.MCP.Server
dotnet run
```

**Verify**: http://localhost:5400/health should return `Healthy`

### 2. Start the Frontend
```powershell
cd src/Web/sensormine-web
npm run dev
```

**Access**: http://localhost:3020

### 3. Navigate to AI Agent
- Click **"AI Agent"** in the left sidebar (sparkles icon ✨)
- Or go directly to: http://localhost:3020/ai-agent

---

## 💬 Example Queries

Try these natural language queries:

### Device Queries
```
Show me all devices
List online devices
How many sensors do I have?
```

### Telemetry Queries (with Charts)
```
Show me temperature data for the last 24 hours
Display battery levels over time
Graph humidity trends for the past week
Show pressure data for today
```

### Asset Queries
```
Show asset hierarchy
Display my asset tree
What assets do I have?
```

---

## 📊 Chart Features

The AI Agent automatically generates charts when:
- Query mentions telemetry fields (temperature, humidity, pressure, battery_level)
- Query includes time-based keywords (chart, graph, over time, trends)
- Data is available from Query.API

**Chart Types:**
- **Line Chart**: Default for time-series data
- **Area Chart**: Configurable (future)
- **Bar Chart**: Configurable (future)

**Chart Configuration:**
```typescript
{
  type: 'line',
  xField: 'timestamp',
  yField: 'temperature',
  title: 'Temperature Over Time'
}
```

---

## 🔧 Technical Details

### MCP Protocol Integration

**Endpoint**: `POST http://localhost:5400/mcp`

**Request Format** (JSON-RPC 2.0):
```json
{
  "jsonrpc": "2.0",
  "id": "uuid",
  "method": "tools/call",
  "params": {
    "name": "query_telemetry",
    "arguments": {
      "deviceIds": ["DEV-001"],
      "fields": ["temperature"],
      "startTime": "2025-12-12T00:00:00Z",
      "endTime": "2025-12-12T23:59:59Z",
      "aggregation": "avg",
      "interval": "15m"
    }
  }
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "uuid",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"series\":[...]}",
        "data": {"series": [...]}
      }
    ]
  }
}
```

### Natural Language Processing

The `AiAgentService.processQuery()` method:
1. **Analyzes intent** using keyword matching
2. **Extracts parameters** (fields, time ranges)
3. **Calls appropriate MCP tools**
4. **Formats response** with chart config if applicable

**Keyword Mappings**:
- `device`, `sensor` → `query_devices`
- `temperature`, `humidity`, `chart`, `graph` → `query_telemetry`
- `asset`, `hierarchy` → `query_asset_hierarchy`

**Time Range Extraction**:
- "last hour" → 1 hour ago to now
- "last 24 hours", "today", "day" → 24 hours
- "week" → 7 days
- Default → 24 hours

---

## 🎨 UI Components

### Message Types
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: unknown;                // Raw data from MCP
  chartConfig?: ChartConfiguration; // Chart rendering config
  timestamp: Date;
}
```

### Chart Renderer
- Uses `recharts` library
- Responsive container (100% width, 300px height)
- Automatic data processing from MCP response
- Supports multiple devices/series

### Data Renderer
- Fallback for non-chart data
- JSON pretty-print in card
- Scrollable for large datasets

---

## 🔐 Security & Multi-Tenancy

**Tenant Isolation**:
- Tenant ID hardcoded for now: `00000000-0000-0000-0000-000000000001`
- TODO: Extract from auth context (JWT claims)
- Passed to all MCP requests via `X-Tenant-Id` header

**Authentication**:
- Optional JWT bearer token support
- MCP server validates tenant access

---

## 🐛 Troubleshooting

### "MCP request failed: Connection refused"
**Problem**: MCP server not running  
**Solution**: Start MCP server on port 5400

### "No devices found to query telemetry data"
**Problem**: No devices in database  
**Solution**: Use device simulator or create test devices

### Chart not rendering
**Problem**: Data format mismatch  
**Solution**: Check `processChartData()` function handles your data structure

### "Unexpected token < in JSON"
**Problem**: MCP server returning HTML (error page) instead of JSON  
**Solution**: Check MCP server logs, ensure correct endpoint URL

---

## 📈 Future Enhancements

### Phase 2: Advanced Query Features
- [ ] Multi-device comparison charts
- [ ] Custom date range picker
- [ ] Export chart as PNG/CSV
- [ ] Share query results

### Phase 3: AI Improvements
- [ ] Use OpenAI/Claude for true NLU (not keyword matching)
- [ ] Query suggestions based on history
- [ ] Anomaly detection integration
- [ ] Predictive analytics

### Phase 4: Collaboration
- [ ] Save queries as bookmarks
- [ ] Share chat sessions
- [ ] Team annotations
- [ ] Alert creation from chat

---

## 📚 Related Documentation

- **MCP Server Design**: [docs/mcp-server-design.md](../../../docs/mcp-server-design.md)
- **MCP Server Implementation**: [docs/mcp-server-implementation-summary.md](../../../docs/mcp-server-implementation-summary.md)
- **MCP Protocol**: https://modelcontextprotocol.io

---

## 🎯 Success Metrics

**Technical**:
- ✅ Chat interface with message history
- ✅ MCP client with JSON-RPC 2.0
- ✅ Natural language query processing
- ✅ Inline chart rendering (line charts)
- ✅ Navigation integration

**User Experience**:
- ✅ Example queries for onboarding
- ✅ Loading states during query
- ✅ Error handling with user-friendly messages
- ✅ Responsive layout (mobile-ready)

---

**Status**: ✅ Phase 1 Complete  
**Ready for**: User Testing & Feedback  
**Next Step**: Add real authentication and expand NLU capabilities

Last Updated: December 12, 2025
