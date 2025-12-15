using AI.API.Models;
using AI.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AI.API.Controllers;

[ApiController]
[Route("api/ai")]
public class AiAgentController : ControllerBase
{
    private readonly IAiAgentService _aiAgentService;
    private readonly ILogger<AiAgentController> _logger;

    public AiAgentController(IAiAgentService aiAgentService, ILogger<AiAgentController> logger)
    {
        _aiAgentService = aiAgentService;
        _logger = logger;
    }

    /// <summary>
    /// Process natural language query and return results with optional charts
    /// </summary>
    [HttpPost("query")]
    public async Task<IActionResult> Query([FromBody] AiQueryRequest request)
    {
        var tenantId = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        
        if (string.IsNullOrEmpty(tenantId))
        {
            _logger.LogWarning("AI query received without tenant ID");
            return BadRequest(new { error = "X-Tenant-Id header is required" });
        }
        
        _logger.LogInformation("AI Query: {Query} (Tenant: {TenantId})", request.Query, tenantId);

        try
        {
            var result = await _aiAgentService.ProcessQueryAsync(request.Query, tenantId);
            _logger.LogInformation("AI query completed successfully");
            return Ok(result);
        }
        catch (HttpRequestException httpEx)
        {
            _logger.LogError(httpEx, "HTTP error calling MCP server for query: {Query}", request.Query);
            return StatusCode(502, new { error = $"Unable to reach MCP server: {httpEx.Message}", details = "The MCP server may not be running on port 5400" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AI query: {Query}", request.Query);
            return StatusCode(500, new { error = $"Failed to process query: {ex.Message}", stackTrace = ex.StackTrace });
        }
    }
}
