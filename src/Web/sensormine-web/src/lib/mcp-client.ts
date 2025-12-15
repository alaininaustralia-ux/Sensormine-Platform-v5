/**
 * MCP (Model Context Protocol) Client
 * Connects to Sensormine.MCP.Server for AI agent capabilities via API Gateway
 */

// Use API Gateway instead of direct MCP server connection
const MCP_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface McpRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: unknown;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class McpClient {
  private baseUrl: string;
  private tenantId: string;
  private token?: string;

  constructor(tenantId: string, token?: string) {
    this.baseUrl = MCP_BASE_URL;
    this.tenantId = tenantId;
    this.token = token;
  }

  private async call<T>(method: string, params?: unknown): Promise<T> {
    const requestId = Math.random().toString(36).substring(2, 15);
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }

    const mcpResponse: McpResponse = await response.json();

    if (mcpResponse.error) {
      throw new Error(mcpResponse.error.message);
    }

    return mcpResponse.result as T;
  }

  async initialize(): Promise<{ protocolVersion: string; capabilities: unknown }> {
    return this.call('initialize');
  }

  async listTools(): Promise<{ tools: McpTool[] }> {
    return this.call('tools/list');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text?: string; data?: unknown }> }> {
    return this.call('tools/call', {
      name,
      arguments: args,
    });
  }

  async listResources(): Promise<{ resources: McpResource[] }> {
    return this.call('resources/list');
  }

  async readResource(uri: string): Promise<{ contents: Array<{ uri: string; text?: string; blob?: string }> }> {
    return this.call('resources/read', { uri });
  }

  async listPrompts(): Promise<{ prompts: Array<{ name: string; description?: string }> }> {
    return this.call('prompts/list');
  }
}

/**
 * AI Agent Service
 * High-level interface for querying devices and telemetry via natural language
 */
export class AiAgentService {
  private client: McpClient;

  constructor(tenantId: string, token?: string) {
    this.client = new McpClient(tenantId, token);
  }

  async queryDevices(filters?: {
    deviceType?: string;
    status?: string;
    location?: string;
  }): Promise<unknown> {
    const result = await this.client.callTool('query_devices', {
      tenantId: this.client['tenantId'],
      filters: filters || {},
      limit: 50,
    });

    return result.content[0]?.data || JSON.parse(result.content[0]?.text || '{}');
  }

  async queryTelemetry(params: {
    deviceIds: string[];
    fields: string[];
    startTime?: string;
    endTime?: string;
    aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
    interval?: string;
  }): Promise<unknown> {
    const result = await this.client.callTool('query_telemetry', params);
    return result.content[0]?.data || JSON.parse(result.content[0]?.text || '{}');
  }

  async queryAssetHierarchy(rootAssetId?: string): Promise<unknown> {
    const result = await this.client.callTool('query_asset_hierarchy', {
      tenantId: this.client['tenantId'],
      rootAssetId,
      includeDevices: true,
      includeMetrics: true,
      maxDepth: 5,
    });

    return result.content[0]?.data || JSON.parse(result.content[0]?.text || '{}');
  }

  /**
   * Natural language query processing via AI.API
   * Uses Claude to interpret user intent and format responses
   */
  async processQuery(query: string): Promise<{
    response: string;
    data?: unknown;
    chartConfig?: ChartConfiguration;
  }> {
    // Call AI.API which handles Claude interpretation and MCP coordination
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.client['tenantId'],
    };

    if (this.client['token']) {
      headers['Authorization'] = `Bearer ${this.client['token']}`;
    }

    const response = await fetch(`${MCP_BASE_URL}/api/ai/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`AI query failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();

    // Convert AI.API response to expected format
    return {
      response: aiResponse.response,
      data: aiResponse.chartData,
      chartConfig: this.convertToChartConfig(aiResponse.chartData),
    };
  }

  private convertToChartConfig(chartData?: { type: string; series: Array<{ name: string; data: Array<{ timestamp: string; value: number }> }> }): ChartConfiguration | undefined {
    if (!chartData || !chartData.series || chartData.series.length === 0) return undefined;

    // Use first series name as yField, could be enhanced to support multiple series
    return {
      type: (chartData.type as 'line' | 'bar' | 'area') || 'line',
      xField: 'timestamp',
      yField: chartData.series[0].name,
      title: `${chartData.series[0].name} over time`,
    };
  }

  // Deprecated: Old local intent analysis (now handled by Claude in AI.API)
  private async processQueryLocal_DEPRECATED(query: string): Promise<{
    response: string;
    data?: unknown;
    chartConfig?: ChartConfiguration;
  }> {
    const lowerQuery = query.toLowerCase();

    // Device queries
    if (lowerQuery.includes('device') || lowerQuery.includes('sensor')) {
      const data = await this.queryDevices();
      const devicesResponse = data as { totalCount?: number; devices?: unknown[] };
      return {
        response: `Found ${devicesResponse.totalCount || 0} devices.`,
        data,
      };
    }

    // Telemetry queries with chart detection
    if (lowerQuery.includes('temperature') || 
        lowerQuery.includes('humidity') || 
        lowerQuery.includes('pressure') ||
        lowerQuery.includes('telemetry') ||
        lowerQuery.includes('data') ||
        lowerQuery.includes('chart') ||
        lowerQuery.includes('graph')) {
      
      // Extract field name
      const field = this.extractField(lowerQuery);
      const timeRange = this.extractTimeRange(lowerQuery);
      
      // Get devices first
      const devicesData = await this.queryDevices();
      const devicesResponse = devicesData as { devices?: Array<{ id: string; name: string }> };
      const devices = devicesResponse.devices || [];
      
      if (devices.length === 0) {
        return {
          response: 'No devices found to query telemetry data.',
        };
      }

      const deviceIds = devices.slice(0, 5).map((d) => d.id);
      
      const telemetryData = await this.queryTelemetry({
        deviceIds,
        fields: [field],
        ...timeRange,
        aggregation: 'avg',
        interval: '15m',
      });

      return {
        response: `Retrieved ${field} data for ${deviceIds.length} devices.`,
        data: telemetryData,
        chartConfig: {
          type: 'line',
          xField: 'timestamp',
          yField: field,
          title: `${field.charAt(0).toUpperCase() + field.slice(1)} Over Time`,
        },
      };
    }

    // Asset queries
    if (lowerQuery.includes('asset') || lowerQuery.includes('hierarchy')) {
      const data = await this.queryAssetHierarchy();
      return {
        response: 'Retrieved asset hierarchy.',
        data,
      };
    }

    return {
      response: 'I can help you query devices, telemetry data, or asset hierarchies. Try asking about temperature, devices, or assets.',
    };
  }

  private extractField(query: string): string {
    const fields = ['temperature', 'humidity', 'pressure', 'battery_level', 'rssi', 'voltage'];
    for (const field of fields) {
      if (query.includes(field)) {
        return field;
      }
    }
    return 'temperature'; // default
  }

  private extractTimeRange(query: string): { startTime?: string; endTime?: string } {
    const now = new Date();
    const endTime = now.toISOString();
    
    if (query.includes('last hour') || query.includes('past hour')) {
      const startTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      return { startTime, endTime };
    }
    
    if (query.includes('last 24') || query.includes('today') || query.includes('day')) {
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      return { startTime, endTime };
    }
    
    if (query.includes('week')) {
      const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return { startTime, endTime };
    }

    // Default: last 24 hours
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    return { startTime, endTime };
  }
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'area';
  xField: string;
  yField: string;
  title: string;
}
