# AI Agent Multi-Turn Enhancement

**Date**: December 15, 2025  
**Feature**: Iterative Tool Calling with Claude AI  
**Status**: ✅ Complete

---

## 🎯 What Changed

Enhanced the AI agent to support **multi-turn conversations** with Claude AI, allowing it to:
- Make multiple tool calls (up to 10) to reach a human-readable answer
- Iterate through reasoning steps until it finds what the user needs
- Automatically determine which device has the most data by querying multiple devices
- Generate chart-ready data from telemetry queries

---

## 🏗️ Architecture Overview

### Before (Single-Turn)
```
User Query → Claude (interpret) → Execute 1 Tool → Claude (format) → Response
```

### After (Multi-Turn)
```
User Query → Claude → Tool Call 1 → Results → Claude → Tool Call 2 → Results → ... → Claude → Final Answer
                ↑______________________________________________|
                    (Loop up to 10 iterations)
```

---

## 📦 Files Modified

### 1. **IAnthropicService.cs** - New Interface Methods
**Location**: `src/Services/AI.API/Services/IAnthropicService.cs`

**Changes**:
- Added `GenerateWithToolsAsync()` method for tool-use API
- New models: `AnthropicMessage`, `ContentBlock`, `AnthropicTool`, `AnthropicResponse`
- Supports multi-turn conversation with tool results

### 2. **AnthropicService.cs** - Tool Use Implementation
**Location**: `src/Services/AI.API/Services/AnthropicService.cs`

**Changes**:
- Implemented `GenerateWithToolsAsync()` method
- Handles three content types:
  - `text`: Regular text messages
  - `tool_use`: Claude wants to call a tool
  - `tool_result`: Results from tool execution
- Parses Claude's `stop_reason` to determine next action

### 3. **AiAgentService.cs** - Iterative Loop
**Location**: `src/Services/AI.API/Services/AiAgentService.cs`

**Changes**:
- Completely rewrote `ProcessQueryAsync()` to support iteration
- Loop up to 10 times until Claude provides a final answer
- Maintains conversation history (messages array)
- Executes tools when Claude requests them
- Sends tool results back to Claude for further processing
- Added `BuildToolDefinitions()` method with detailed tool schemas

**Key Logic**:
```csharp
for (int iteration = 0; iteration < maxIterations; iteration++)
{
    var response = await _anthropicService.GenerateWithToolsAsync(systemPrompt, messages, toolDefinitions);
    
    if (response.StopReason == "end_turn")
        return final_answer;
    
    if (response.StopReason == "tool_use")
        execute_tools_and_add_results_to_messages();
}
```

### 4. **launch.json** - AI.API Configuration
**Location**: `.vscode/launch.json`

**Changes**:
- Updated AI.API configuration to disable browser launch
- Added `launchBrowser: { enabled: false }`

---

## 🧪 Example: "Which device has the most data?"

### User Query
```
"Which device has the most data?"
```

### AI Agent Workflow

**Iteration 1**: Claude decides to get list of devices
```json
Tool: query_devices
Arguments: { "tenantId": "00000000-0000-0000-0000-000000000001" }
Result: [Device1, Device2, Device3, Device4, Device5]
```

**Iteration 2**: Claude queries telemetry count for first batch
```json
Tool: query_telemetry
Arguments: {
  "deviceIds": ["device1", "device2", "device3"],
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-12-31T23:59:59Z",
  "aggregation": "count"
}
Result: { Device1: 1523, Device2: 2891, Device3: 456 }
```

**Iteration 3**: Claude queries remaining devices
```json
Tool: query_telemetry
Arguments: {
  "deviceIds": ["device4", "device5"],
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-12-31T23:59:59Z",
  "aggregation": "count"
}
Result: { Device4: 3421, Device5: 987 }
```

**Iteration 4**: Claude provides final answer
```
"Based on my analysis, Device4 (UUID: device4) has the most data with 3,421 
telemetry records in 2024. This is followed by Device2 with 2,891 records."
```

---

## 🛠️ Tool Definitions

The AI agent has access to these MCP tools:

### 1. query_devices
**Purpose**: Search and filter devices  
**Returns**: Device details (IDs, names, types, status)  
**Arguments**:
- `tenantId` (required): Tenant UUID
- `filters` (optional): `{ "status": "online|offline|error", "deviceType": "string" }`
- `limit` (optional): Max devices to return (default: 100)

### 2. query_telemetry
**Purpose**: Query time-series telemetry data  
**Returns**: Raw data or aggregated metrics  
**Arguments**:
- `deviceIds` (required): Array of device UUIDs
- `fields` (optional): Specific fields to query (e.g. `["temperature", "humidity"]`)
- `startTime` (required): ISO datetime (e.g. `"2025-12-15T00:00:00Z"`)
- `endTime` (required): ISO datetime
- `aggregation` (optional): `"raw"`, `"avg"`, `"min"`, `"max"`, `"sum"`, `"count"`
- `interval` (optional): Time bucket (e.g. `"1h"`, `"15m"`, `"1d"`)

**Special Note**: Use `"aggregation": "count"` to count data points per device

### 3. query_asset_hierarchy
**Purpose**: Navigate asset relationships and hierarchies  
**Returns**: Tree structure of assets with device associations  
**Arguments**:
- `tenantId` (required): Tenant UUID
- `rootAssetId` (optional): Start from specific asset UUID
- `includeDevices` (optional): Include device associations (default: true)
- `includeMetrics` (optional): Include calculated metrics (default: false)
- `maxDepth` (optional): Maximum hierarchy depth (default: 10)

---

## 🚀 How to Use

### Start AI Agent Stack
```powershell
# Option 1: Use VS Code launch configuration
# Press F5 and select "AI Agent Stack"

# Option 2: Manual start
cd C:\Users\AlainBlanchette\code\Orion

# Start infrastructure
docker-compose up -d

# Start MCP Server (Terminal 1)
cd src/Services/Sensormine.MCP.Server
dotnet run

# Start AI.API (Terminal 2)
cd src/Services/AI.API
dotnet run

# Start Frontend (Terminal 3)
cd src/Web/sensormine-web
npm run dev
```

### Access AI Agent
1. Navigate to http://localhost:3020/ai-agent
2. Ask complex questions that require multiple tool calls

### Example Queries

**Simple (1-2 iterations)**:
- "List all devices"
- "Show temperature data for device X"

**Complex (3-5 iterations)**:
- "Which device has the most data?"
- "Compare temperature trends across all sensors"
- "Find the device with the highest average humidity last week"

**Advanced (5-10 iterations)**:
- "Show me anomalies in battery levels"
- "Which site has the most offline devices?"
- "Rank devices by data volume and show their types"

---

## 📊 Chart Data Support

The AI agent can now extract chart-ready data from telemetry queries.

**When Chart Data is Generated**:
- User asks for time-series data visualization
- Query includes aggregation (avg, min, max, sum)
- Response includes multiple data points

**Chart Data Format**:
```json
{
  "type": "line",
  "series": [
    {
      "name": "temperature",
      "data": [
        { "timestamp": "2025-12-15T00:00:00Z", "value": 22.5 },
        { "timestamp": "2025-12-15T01:00:00Z", "value": 23.1 }
      ]
    }
  ]
}
```

**Supported Chart Types**:
- Line charts (time-series)
- Area charts (trends)
- Bar charts (comparisons)

---

## ⚙️ Configuration

### Environment Variables

**AI.API** (`src/Services/AI.API/appsettings.json`):
```json
{
  "Anthropic": {
    "ApiKey": "your-anthropic-api-key",
    "Model": "claude-sonnet-4-20250514",
    "MaxTokens": 4096
  },
  "McpServer": {
    "BaseUrl": "http://localhost:5400"
  }
}
```

**MCP Server** (`src/Services/Sensormine.MCP.Server/appsettings.json`):
```json
{
  "ApiClients": {
    "DeviceApi": "http://localhost:5293",
    "QueryApi": "http://localhost:5079",
    "DigitalTwinApi": "http://localhost:5297"
  }
}
```

### Iteration Limit
Current limit: **10 iterations**

To change:
```csharp
// In AiAgentService.cs
const int maxIterations = 10; // Change this value
```

---

## 🧪 Testing

### Manual Test Script
```powershell
# Test multi-turn capabilities
$body = @'
{
  "query": "Which device has the most data?"
}
'@

Invoke-RestMethod -Uri "http://localhost:5401/api/ai/query" `
  -Method POST `
  -Headers @{"X-Tenant-Id"="00000000-0000-0000-0000-000000000001"; "Content-Type"="application/json"} `
  -Body $body | ConvertTo-Json -Depth 10
```

### Expected Response
```json
{
  "response": "Based on my analysis, Device 'Temperature Sensor 1' (UUID: 1a0e632b-da75-4d33-820b-8e11ff375511) has the most telemetry data with 3,421 records in 2024.",
  "chartData": null,
  "toolsCalled": ["query_devices", "query_telemetry", "query_telemetry"]
}
```

---

## 🔧 Troubleshooting

### Claude Stops at Max Iterations
**Problem**: Response says "couldn't complete within iteration limit"  
**Solution**: 
- Check if MCP tools are returning data
- Verify device IDs are valid
- Increase `maxIterations` if needed

### Tool Execution Fails
**Problem**: Error in tool results  
**Solution**:
- Check MCP Server is running (http://localhost:5400/health)
- Verify Device.API, Query.API are accessible
- Check tenant ID matches test data

### No Chart Data Generated
**Problem**: `chartData` is always null  
**Solution**:
- Ensure query includes time-series data
- Use aggregation (avg, min, max, sum)
- Check `ExtractChartData()` method logic

---

## 📚 Related Documentation

- [APPLICATION.md](./APPLICATION.md) - AI.API and MCP Server architecture
- [mcp-server-design.md](./mcp-server-design.md) - MCP protocol details
- [AI-AGENT-COMPLETE.md](../AI-AGENT-COMPLETE.md) - Original AI agent implementation

---

## ✅ Verification Checklist

- [x] AI.API builds without errors
- [x] MCP Server builds without errors
- [x] Multi-turn conversation logic implemented
- [x] Tool definitions include all 3 MCP tools
- [x] Launch configuration updated (no browser)
- [x] Claude API integration complete
- [x] Tool result parsing working
- [x] Iteration limit enforced (10 max)
- [x] Error handling for failed tool calls
- [x] Logging for debugging
- [ ] Frontend updated to handle longer responses (future)
- [ ] Chart data extraction from multi-turn results (future)

---

**Last Updated**: December 15, 2025  
**Next Review**: When adding chart visualization support  
**Owner**: AI Agent Team
