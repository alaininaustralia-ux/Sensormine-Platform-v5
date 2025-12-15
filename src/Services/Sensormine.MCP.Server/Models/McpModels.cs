namespace Sensormine.MCP.Server.Models;

/// <summary>
/// MCP Protocol JSON-RPC 2.0 Request
/// </summary>
public class McpRequest
{
    public string Jsonrpc { get; set; } = "2.0";
    public string? Id { get; set; }
    public string Method { get; set; } = string.Empty;
    public object? Params { get; set; }
}

/// <summary>
/// MCP Protocol JSON-RPC 2.0 Response
/// </summary>
public class McpResponse
{
    public string Jsonrpc { get; set; } = "2.0";
    public string? Id { get; set; }
    public object? Result { get; set; }
    public McpError? Error { get; set; }
}

/// <summary>
/// MCP Protocol Error
/// </summary>
public class McpError
{
    public int Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
}

/// <summary>
/// MCP Resource
/// </summary>
public class McpResource
{
    public string Uri { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string MimeType { get; set; } = "application/json";
    public object? Contents { get; set; }
}

/// <summary>
/// MCP Tool Definition
/// </summary>
public class McpTool
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public object InputSchema { get; set; } = new { };
}

/// <summary>
/// MCP Prompt Definition
/// </summary>
public class McpPrompt
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<McpPromptArgument> Arguments { get; set; } = new();
}

public class McpPromptArgument
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Required { get; set; }
}

/// <summary>
/// List Resources Response
/// </summary>
public class ListResourcesResponse
{
    public List<McpResource> Resources { get; set; } = new();
    public string? NextCursor { get; set; }
}

/// <summary>
/// Read Resource Response
/// </summary>
public class ReadResourceResponse
{
    public List<ResourceContent> Contents { get; set; } = new();
}

public class ResourceContent
{
    public string Uri { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/json";
    public string? Text { get; set; }
    public string? Blob { get; set; }
}

/// <summary>
/// List Tools Response
/// </summary>
public class ListToolsResponse
{
    public List<McpTool> Tools { get; set; } = new();
}

/// <summary>
/// Call Tool Response
/// </summary>
public class CallToolResponse
{
    public List<ToolContent> Content { get; set; } = new();
    public bool IsError { get; set; }
}

public class ToolContent
{
    public string Type { get; set; } = "text";
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// List Prompts Response
/// </summary>
public class ListPromptsResponse
{
    public List<McpPrompt> Prompts { get; set; } = new();
}

/// <summary>
/// Error Codes (JSON-RPC 2.0)
/// </summary>
public static class McpErrorCodes
{
    public const int ParseError = -32700;
    public const int InvalidRequest = -32600;
    public const int MethodNotFound = -32601;
    public const int InvalidParams = -32602;
    public const int InternalError = -32603;
    
    // Custom MCP errors
    public const int ResourceNotFound = -32001;
    public const int ToolNotFound = -32002;
    public const int ToolExecutionError = -32003;
    public const int Unauthorized = -32004;
    public const int RateLimitExceeded = -32005;
}
