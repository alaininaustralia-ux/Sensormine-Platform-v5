/**
 * AI Agent Page
 * Chat interface for querying device telemetry using MCP server
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiAgentService, type ChartConfiguration } from '@/lib/mcp-client';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Uncomment when auth is fully implemented:
// import { useAuth } from '@/lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: unknown;
  chartConfig?: ChartConfiguration;
  timestamp: Date;
}

const EXAMPLE_QUERIES = [
  'Show me temperature data for the last 24 hours',
  'List all online devices',
  'Show battery levels over time',
  'Display asset hierarchy',
];

export default function AiAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentService = useRef<AiAgentService | null>(null);

  useEffect(() => {
    // Initialize AI agent service with auth context
    // For now, use default tenant. In production, extract from useAuth()
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    agentService.current = new AiAgentService(tenantId, token || undefined);

    // Welcome message
    setMessages([
      {
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant powered by the Sensormine MCP server. I can help you query device data, visualize telemetry, and explore your asset hierarchy. What would you like to know?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !agentService.current) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await agentService.current.processQuery(input);
      
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: result.response,
        data: result.data,
        chartConfig: result.chartConfig,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 1 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Try these examples:
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {EXAMPLE_QUERIES.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto py-3"
                    onClick={() => handleExampleClick(query)}
                  >
                    {query}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={`rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.chartConfig && message.data ? (
                    <div className="mt-4">
                      <ChartRenderer
                        data={message.data as Record<string, unknown>[]}
                        config={message.chartConfig}
                      />
                    </div>
                  ) : null}

                  {message.data && !message.chartConfig ? (
                    <div className="mt-4">
                      <DataRenderer data={message.data as Record<string, unknown>[] | Record<string, unknown>} />
                    </div>
                  ) : null}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex-1 max-w-3xl">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white dark:bg-gray-900 p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about your devices, telemetry, or assets..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chart Renderer Component
 */
function ChartRenderer({ data, config }: { data: unknown; config: ChartConfiguration }): React.ReactElement {
  const chartData = processChartData(data, config);

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/50 dark:bg-gray-900/50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">No data available for chart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-base">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {config.type === 'line' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xField} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={config.yField}
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          )}
          {config.type === 'area' && (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xField} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={config.yField}
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
          {config.type === 'bar' && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xField} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={config.yField} fill="#3b82f6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Data Renderer Component
 */
function DataRenderer({ data }: { data: unknown }): React.ReactElement | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return (
    <Card className="bg-white/50 dark:bg-gray-900/50 mt-4">
      <CardContent className="p-4">
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

/**
 * Process chart data from MCP response
 */
function processChartData(data: unknown, config: ChartConfiguration): Array<Record<string, unknown>> {
  if (!data || typeof data !== 'object') return [];

  // Handle telemetry response format
  const telemetryData = data as any;
  
  if (telemetryData.series && Array.isArray(telemetryData.series)) {
    // Flatten series data
    const flatData: Array<Record<string, unknown>> = [];
    
    telemetryData.series.forEach((series: any) => {
      if (series.dataPoints && Array.isArray(series.dataPoints)) {
        series.dataPoints.forEach((point: any) => {
          flatData.push({
            timestamp: new Date(point.timestamp).toLocaleTimeString(),
            [config.yField]: point.value,
            deviceName: series.deviceName,
          });
        });
      }
    });
    
    return flatData;
  }

  // Handle devices response format
  if (telemetryData.devices && Array.isArray(telemetryData.devices)) {
    return telemetryData.devices.map((device: any) => ({
      name: device.name,
      status: device.status,
      type: device.deviceType,
    }));
  }

  return [];
}
