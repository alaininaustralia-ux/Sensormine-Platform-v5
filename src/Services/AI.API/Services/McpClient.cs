using AI.API.Models;
using System.Text.Json;

namespace AI.API.Services;

public class McpClient : IMcpClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<McpClient> _logger;

    public McpClient(HttpClient httpClient, ILogger<McpClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<McpResponse> CallToolAsync(string toolName, object arguments, string tenantId)
    {
        var request = new McpRequest
        {
            Jsonrpc = "2.0",
            Method = "tools/call",
            Params = new { name = toolName, arguments },
            Id = "1"
        };

        return await SendRequestAsync(request, tenantId);
    }

    public async Task<McpResponse> ListToolsAsync()
    {
        var request = new McpRequest
        {
            Jsonrpc = "2.0",
            Method = "tools/list",
            Id = "1"
        };

        return await SendRequestAsync(request, string.Empty);
    }

    private async Task<McpResponse> SendRequestAsync(McpRequest request, string tenantId)
    {
        try
        {
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, "/mcp");
            requestMessage.Content = JsonContent.Create(request);
            
            if (!string.IsNullOrEmpty(tenantId))
            {
                requestMessage.Headers.Add("X-Tenant-Id", tenantId);
            }

            var response = await _httpClient.SendAsync(requestMessage);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var mcpResponse = JsonSerializer.Deserialize<McpResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return mcpResponse ?? throw new Exception("Empty response from MCP server");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling MCP server: {Method}", request.Method);
            throw;
        }
    }
}
