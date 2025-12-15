using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sensormine.MCP.Server.Models;
using Sensormine.MCP.Server.Services;
using System.Text.Json;

namespace Sensormine.MCP.Server.Controllers;

/// <summary>
/// Model Context Protocol (MCP) endpoint
/// </summary>
[ApiController]
[Route("mcp")]
[AllowAnonymous] // Allow anonymous for development - TODO: Enable [Authorize] in production
public class McpController : ControllerBase
{
    private readonly IEnumerable<IResourceProvider> _resourceProviders;
    private readonly IEnumerable<IToolHandler> _toolHandlers;
    private readonly ILogger<McpController> _logger;

    public McpController(
        IEnumerable<IResourceProvider> resourceProviders,
        IEnumerable<IToolHandler> toolHandlers,
        ILogger<McpController> logger)
    {
        _resourceProviders = resourceProviders;
        _toolHandlers = toolHandlers;
        _logger = logger;
    }

    /// <summary>
    /// MCP JSON-RPC 2.0 endpoint
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(McpResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> HandleRequest([FromBody] McpRequest request, CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString() ?? string.Empty;
        
        _logger.LogInformation("MCP Request: {Method} (ID: {Id}, Tenant: {TenantId})", 
            request.Method, request.Id, tenantId);

        try
        {
            var result = request.Method switch
            {
                "resources/list" => await HandleListResources(request.Params, cancellationToken),
                "resources/read" => await HandleReadResource(request.Params, cancellationToken),
                "tools/list" => await HandleListTools(),
                "tools/call" => await HandleCallTool(request.Params, tenantId, cancellationToken),
                "prompts/list" => await HandleListPrompts(),
                "initialize" => await HandleInitialize(),
                _ => throw new Exception($"Method not found: {request.Method}")
            };

            return Ok(new McpResponse
            {
                Id = request.Id,
                Result = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling MCP request {Method}", request.Method);
            
            return Ok(new McpResponse
            {
                Id = request.Id,
                Error = new McpError
                {
                    Code = McpErrorCodes.InternalError,
                    Message = ex.Message,
                    Data = new { type = ex.GetType().Name }
                }
            });
        }
    }

    private async Task<object> HandleListResources(object? @params, CancellationToken cancellationToken)
    {
        var uriPattern = @params?.GetType().GetProperty("uri")?.GetValue(@params)?.ToString();

        // Determine which provider based on URI pattern
        var provider = DetermineResourceProvider(uriPattern);
        
        if (provider == null)
        {
            // Return all available resource types
            return new ListResourcesResponse
            {
                Resources = new List<McpResource>
                {
                    new McpResource { Uri = "device:///", Name = "Devices", Description = "Device catalog" },
                    new McpResource { Uri = "asset:///", Name = "Assets", Description = "Asset hierarchy" },
                    new McpResource { Uri = "schema:///", Name = "Schemas", Description = "Schema registry" },
                    new McpResource { Uri = "telemetry:///", Name = "Telemetry", Description = "Telemetry streams" }
                }
            };
        }

        return await provider.ListResourcesAsync(uriPattern, cancellationToken);
    }

    private async Task<object> HandleReadResource(object? @params, CancellationToken cancellationToken)
    {
        var uri = @params?.GetType().GetProperty("uri")?.GetValue(@params)?.ToString();
        
        if (string.IsNullOrEmpty(uri))
            throw new ArgumentException("URI is required");

        var provider = DetermineResourceProvider(uri);
        
        if (provider == null)
            throw new Exception($"No provider found for URI: {uri}");

        return await provider.ReadResourceAsync(uri, cancellationToken);
    }

    private Task<object> HandleListTools()
    {
        var tools = _toolHandlers.Select(h => new McpTool
        {
            Name = h.ToolName,
            Description = h.Description,
            InputSchema = h.InputSchema
        }).ToList();

        return Task.FromResult<object>(new ListToolsResponse { Tools = tools });
    }

    private async Task<object> HandleCallTool(object? @params, string tenantId, CancellationToken cancellationToken)
    {
        var paramsJson = JsonSerializer.Serialize(@params);
        var paramsDict = JsonSerializer.Deserialize<Dictionary<string, object>>(paramsJson)!;
        
        var toolName = paramsDict["name"].ToString();
        var arguments = paramsDict.ContainsKey("arguments") ? paramsDict["arguments"] : new { };

        var handler = _toolHandlers.FirstOrDefault(h => h.ToolName == toolName);
        
        if (handler == null)
            throw new Exception($"Tool not found: {toolName}");

        return await handler.ExecuteAsync(arguments, tenantId, cancellationToken);
    }

    private Task<object> HandleListPrompts()
    {
        var prompts = new List<McpPrompt>
        {
            new McpPrompt
            {
                Name = "analyze_device_performance",
                Description = "Comprehensive analysis of device health and performance",
                Arguments = new List<McpPromptArgument>
                {
                    new McpPromptArgument { Name = "deviceId", Description = "Device ID to analyze", Required = true },
                    new McpPromptArgument { Name = "duration", Description = "Analysis period (e.g., '24h', '7d')", Required = true }
                }
            },
            new McpPrompt
            {
                Name = "detect_fleet_anomalies",
                Description = "Identify unusual patterns across multiple devices",
                Arguments = new List<McpPromptArgument>
                {
                    new McpPromptArgument { Name = "deviceType", Description = "Device type to analyze", Required = true },
                    new McpPromptArgument { Name = "duration", Description = "Analysis period", Required = true }
                }
            }
        };

        return Task.FromResult<object>(new ListPromptsResponse { Prompts = prompts });
    }

    private Task<object> HandleInitialize()
    {
        return Task.FromResult<object>(new
        {
            protocolVersion = "2024-11-05",
            capabilities = new
            {
                resources = new { },
                tools = new { },
                prompts = new { }
            },
            serverInfo = new
            {
                name = "Sensormine MCP Server",
                version = "1.0.0"
            }
        });
    }

    private IResourceProvider? DetermineResourceProvider(string? uri)
    {
        if (string.IsNullOrEmpty(uri))
            return null;

        if (uri.StartsWith("device:"))
            return _resourceProviders.FirstOrDefault(p => p.GetType().Name.Contains("Device"));
        
        if (uri.StartsWith("asset:"))
            return _resourceProviders.FirstOrDefault(p => p.GetType().Name.Contains("Asset"));

        return null;
    }
}
