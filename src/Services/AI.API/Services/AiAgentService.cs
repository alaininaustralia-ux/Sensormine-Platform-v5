using AI.API.Models;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AI.API.Services;

public class AiAgentService : IAiAgentService
{
    private readonly IAnthropicService _anthropicService;
    private readonly IMcpClient _mcpClient;
    private readonly ILogger<AiAgentService> _logger;

    public AiAgentService(
        IAnthropicService anthropicService,
        IMcpClient mcpClient,
        ILogger<AiAgentService> logger)
    {
        _anthropicService = anthropicService;
        _mcpClient = mcpClient;
        _logger = logger;
    }

    public async Task<AiQueryResponse> ProcessQueryAsync(string userQuery, string tenantId)
    {
        _logger.LogInformation("Processing AI query: '{Query}' for tenant: {TenantId}", userQuery, tenantId);
        
        const int maxIterations = 10;
        var systemPrompt = BuildSystemPrompt();
        var toolDefinitions = BuildToolDefinitions(tenantId);
        var toolsCalled = new List<string>();
        
        // Initialize conversation with user's query
        var messages = new List<AnthropicMessage>
        {
            new AnthropicMessage
            {
                Role = "user",
                Content = new List<ContentBlock>
                {
                    new ContentBlock { Type = "text", Text = userQuery }
                }
            }
        };

        // Iterative loop: Claude thinks → calls tools → receives results → thinks again
        for (int iteration = 0; iteration < maxIterations; iteration++)
        {
            _logger.LogInformation("AI Agent iteration {Iteration}/{Max}", iteration + 1, maxIterations);
            
            // Call Claude with tool use API
            var response = await _anthropicService.GenerateWithToolsAsync(systemPrompt, messages, toolDefinitions);
            
            // Add Claude's response to conversation
            messages.Add(new AnthropicMessage
            {
                Role = "assistant",
                Content = response.Content
            });

            // Check stop reason
            if (response.StopReason == "end_turn")
            {
                // Claude is done - extract final response
                var finalText = response.Content
                    .Where(c => c.Type == "text")
                    .Select(c => c.Text)
                    .FirstOrDefault() ?? "No response generated";

                _logger.LogInformation("Claude finished after {Iterations} iterations", iteration + 1);

                return new AiQueryResponse
                {
                    Response = finalText,
                    ChartData = null, // Will be extracted separately if needed
                    ToolsCalled = toolsCalled
                };
            }
            else if (response.StopReason == "tool_use")
            {
                // Claude wants to use tools - execute them
                var toolResults = new List<ContentBlock>();

                foreach (var content in response.Content.Where(c => c.Type == "tool_use"))
                {
                    var toolName = content.Name!;
                    var toolInput = content.Input as Dictionary<string, object> ?? new Dictionary<string, object>();
                    
                    _logger.LogInformation("Calling MCP tool: {Tool} with input: {Input}", toolName, JsonSerializer.Serialize(toolInput));
                    toolsCalled.Add(toolName);

                    // Ensure tenantId is in arguments
                    if ((toolName == "query_devices" || toolName == "query_asset_hierarchy") && 
                        !toolInput.ContainsKey("tenantId"))
                    {
                        toolInput["tenantId"] = tenantId;
                    }

                    try
                    {
                        // Execute MCP tool
                        var mcpResponse = await _mcpClient.CallToolAsync(toolName, toolInput, tenantId);
                        var extractedData = ExtractMcpData(mcpResponse.Result);
                        var resultJson = JsonSerializer.Serialize(extractedData);

                        _logger.LogInformation("Tool {Tool} returned: {Result}", toolName, resultJson);

                        toolResults.Add(new ContentBlock
                        {
                            Type = "tool_result",
                            ToolUseId = content.Id,
                            Content = resultJson
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error calling MCP tool {Tool}", toolName);
                        
                        toolResults.Add(new ContentBlock
                        {
                            Type = "tool_result",
                            ToolUseId = content.Id,
                            Content = $"Error: {ex.Message}"
                        });
                    }
                }

                // Add tool results to conversation
                messages.Add(new AnthropicMessage
                {
                    Role = "user",
                    Content = toolResults
                });

                // Continue loop - Claude will process tool results and decide next action
            }
            else if (response.StopReason == "max_tokens")
            {
                _logger.LogWarning("Claude hit max tokens limit");
                return new AiQueryResponse
                {
                    Response = "I apologize, but my response exceeded the length limit. Please try asking a more specific question.",
                    ChartData = null,
                    ToolsCalled = toolsCalled
                };
            }
        }

        _logger.LogWarning("Reached maximum iterations ({Max}) without completion", maxIterations);
        return new AiQueryResponse
        {
            Response = "I'm sorry, but I couldn't complete your request within the iteration limit. Please try simplifying your query.",
            ChartData = null,
            ToolsCalled = toolsCalled
        };
    }

    private string BuildSystemPrompt()
    {
        return @"You are an AI assistant for the Sensormine IoT platform. You help users query device data, visualize telemetry, and explore asset hierarchies.

You have access to tools that connect to an MCP (Model Context Protocol) server with these capabilities:
- Device management (list, filter devices)
- Telemetry queries (time-series data with aggregations)
- Asset hierarchy navigation

Guidelines:
1. Use tools iteratively to gather information needed to answer the user's question
2. If you need device IDs, first call query_devices to get them
3. For questions about data volumes or comparisons, query multiple devices and analyze results
4. Always provide a clear, human-readable final answer with specific numbers/findings
5. When showing telemetry data, describe trends and notable values
6. Use current date/time for relative time calculations: " + DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") + @" UTC

Be thorough, accurate, and conversational.";
    }

    private List<AnthropicTool> BuildToolDefinitions(string tenantId)
    {
        return new List<AnthropicTool>
        {
            new AnthropicTool
            {
                Name = "query_devices",
                Description = "Search and filter devices in the system. Returns device details including IDs, names, types, and status.",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        tenantId = new
                        {
                            type = "string",
                            description = $"Tenant UUID (use: {tenantId})"
                        },
                        filters = new
                        {
                            type = "object",
                            description = "Optional filters",
                            properties = new
                            {
                                status = new { type = "string", @enum = new[] { "online", "offline", "error" } },
                                deviceType = new { type = "string" }
                            }
                        },
                        limit = new
                        {
                            type = "integer",
                            description = "Max devices to return (default: 100)"
                        }
                    },
                    required = new[] { "tenantId" }
                }
            },
            new AnthropicTool
            {
                Name = "query_telemetry",
                Description = "Query time-series telemetry data from devices. Can aggregate data and filter by time range. Use 'count' aggregation to count data points.",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        deviceIds = new
                        {
                            type = "array",
                            description = "Array of device UUIDs to query",
                            items = new { type = "string" }
                        },
                        fields = new
                        {
                            type = "array",
                            description = "Optional: specific fields to query (e.g. ['temperature', 'humidity'])",
                            items = new { type = "string" }
                        },
                        startTime = new
                        {
                            type = "string",
                            description = "ISO datetime (e.g. '2025-12-15T00:00:00Z'). Calculate from relative phrases like 'last 24 hours'."
                        },
                        endTime = new
                        {
                            type = "string",
                            description = "ISO datetime (e.g. '2025-12-15T23:59:59Z')"
                        },
                        aggregation = new
                        {
                            type = "string",
                            description = "Aggregation method",
                            @enum = new[] { "raw", "avg", "min", "max", "sum", "count" }
                        },
                        interval = new
                        {
                            type = "string",
                            description = "Time bucket for aggregation (e.g. '1h', '15m', '1d')"
                        }
                    },
                    required = new[] { "deviceIds", "startTime", "endTime" }
                }
            },
            new AnthropicTool
            {
                Name = "query_asset_hierarchy",
                Description = "Navigate asset relationships and hierarchies. Returns tree structure of assets with optional device associations.",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        tenantId = new
                        {
                            type = "string",
                            description = $"Tenant UUID (use: {tenantId})"
                        },
                        rootAssetId = new
                        {
                            type = "string",
                            description = "Optional: Start from specific asset UUID"
                        },
                        includeDevices = new
                        {
                            type = "boolean",
                            description = "Include device associations (default: true)"
                        },
                        includeMetrics = new
                        {
                            type = "boolean",
                            description = "Include calculated metrics (default: false)"
                        },
                        maxDepth = new
                        {
                            type = "integer",
                            description = "Maximum hierarchy depth (default: 10)"
                        }
                    },
                    required = new[] { "tenantId" }
                }
            }
        };
    }

    private (string Tool, Dictionary<string, object> Arguments, bool NeedsVisualization) ParseToolCall(string json)
    {
        try
        {
            // Clean up markdown code blocks if present
            json = Regex.Replace(json, @"```json\s*|\s*```", "").Trim();
            
            var toolCall = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
            
            if (toolCall == null)
                throw new Exception("Failed to parse tool call JSON");

            var tool = toolCall["tool"].GetString() ?? "query_devices";
            var needsViz = toolCall.TryGetValue("needsVisualization", out var viz) && viz.GetBoolean();
            
            var arguments = new Dictionary<string, object>();
            if (toolCall.TryGetValue("arguments", out var args) && args.ValueKind == JsonValueKind.Object)
            {
                arguments = ParseJsonElement(args);
            }

            _logger.LogInformation("Parsed tool call - Tool: {Tool}, Arguments: {Arguments}", tool, JsonSerializer.Serialize(arguments));

            return (tool, arguments, needsViz);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing tool call JSON: {Json}", json);
            return ("query_devices", new Dictionary<string, object>(), false);
        }
    }

    private Dictionary<string, object> ParseJsonElement(JsonElement element)
    {
        var result = new Dictionary<string, object>();
        
        foreach (var prop in element.EnumerateObject())
        {
            result[prop.Name] = prop.Value.ValueKind switch
            {
                JsonValueKind.String => prop.Value.GetString()!,
                JsonValueKind.Number => prop.Value.TryGetInt32(out var i) ? (object)i : prop.Value.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Object => ParseJsonElement(prop.Value),
                JsonValueKind.Array => prop.Value.EnumerateArray()
                    .Select(e => {
                        if (e.ValueKind == JsonValueKind.String) return (object)e.GetString()!;
                        if (e.ValueKind == JsonValueKind.Object) return ParseJsonElement(e);
                        return e.ToString();
                    })
                    .ToList(),
                _ => prop.Value.ToString()
            };
        }
        
        return result;
    }

    private object? ExtractMcpData(object? mcpResult)
    {
        if (mcpResult == null) return null;

        try
        {
            // MCP Server returns: { "content": [{ "type": "text", "text": "{...json...}" }] }
            var json = JsonSerializer.Serialize(mcpResult);
            var wrapper = JsonSerializer.Deserialize<JsonElement>(json);
            
            if (wrapper.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
            {
                var firstContent = content.EnumerateArray().FirstOrDefault();
                if (firstContent.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                {
                    var textJson = textElement.GetString();
                    if (!string.IsNullOrEmpty(textJson))
                    {
                        // Parse the nested JSON string
                        return JsonSerializer.Deserialize<object>(textJson);
                    }
                }
            }
            
            // If not in MCP format, return as-is
            return mcpResult;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract MCP data, returning raw result");
            return mcpResult;
        }
    }

    private ChartData? ExtractChartData(object? mcpResult)
    {
        if (mcpResult == null) return null;

        try
        {
            var json = JsonSerializer.Serialize(mcpResult);
            var data = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
            
            if (data?.TryGetValue("data", out var dataElement) == true &&
                dataElement.TryGetProperty("series", out var seriesElement))
            {
                var series = new List<ChartSeries>();
                
                foreach (var seriesItem in seriesElement.EnumerateArray())
                {
                    var dataPoints = new List<ChartDataPoint>();
                    
                    if (seriesItem.TryGetProperty("dataPoints", out var points))
                    {
                        foreach (var point in points.EnumerateArray())
                        {
                            dataPoints.Add(new ChartDataPoint
                            {
                                Timestamp = point.GetProperty("timestamp").GetString() ?? "",
                                Value = point.GetProperty("value").GetDouble()
                            });
                        }
                    }

                    series.Add(new ChartSeries
                    {
                        Name = seriesItem.GetProperty("fieldName").GetString() ?? "Data",
                        Data = dataPoints
                    });
                }

                return new ChartData
                {
                    Type = "line",
                    Series = series
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting chart data");
        }

        return null;
    }
}
