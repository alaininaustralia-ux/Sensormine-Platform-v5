using AI.API.Models;

namespace AI.API.Services;

public interface IMcpClient
{
    Task<McpResponse> CallToolAsync(string toolName, object arguments, string tenantId);
    Task<McpResponse> ListToolsAsync();
}
