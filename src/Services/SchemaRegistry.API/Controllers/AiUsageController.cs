using Microsoft.AspNetCore.Mvc;
using Sensormine.AI.Services;

namespace SchemaRegistry.API.Controllers;

/// <summary>
/// Controller for AI usage monitoring and metering
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AiUsageController : ControllerBase
{
    private readonly IAiMeteringService _meteringService;
    private readonly ILogger<AiUsageController> _logger;

    public AiUsageController(
        IAiMeteringService meteringService,
        ILogger<AiUsageController> logger)
    {
        _meteringService = meteringService;
        _logger = logger;
    }

    /// <summary>
    /// Get AI usage statistics for a specific tenant
    /// </summary>
    /// <param name="tenantId">Tenant identifier</param>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    /// <returns>Usage statistics</returns>
    [HttpGet("tenant/{tenantId}")]
    public async Task<ActionResult<AiUsageStatistics>> GetTenantUsage(
        string tenantId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var stats = await _meteringService.GetUsageStatisticsAsync(tenantId, startDate, endDate);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving AI usage statistics for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Failed to retrieve usage statistics" });
        }
    }

    /// <summary>
    /// Get AI usage statistics across all tenants
    /// </summary>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    /// <returns>List of usage statistics by tenant</returns>
    [HttpGet("all")]
    public async Task<ActionResult<List<AiUsageStatistics>>> GetAllUsage(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var stats = await _meteringService.GetAllUsageStatisticsAsync(startDate, endDate);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all AI usage statistics");
            return StatusCode(500, new { error = "Failed to retrieve usage statistics" });
        }
    }

    /// <summary>
    /// Get current tenant's AI usage statistics
    /// </summary>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    /// <returns>Usage statistics for current tenant</returns>
    [HttpGet("current")]
    public async Task<ActionResult<AiUsageStatistics>> GetCurrentTenantUsage(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            // TODO: Get tenant ID from authentication context
            var tenantId = "default-tenant";
            
            var stats = await _meteringService.GetUsageStatisticsAsync(tenantId, startDate, endDate);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current tenant AI usage statistics");
            return StatusCode(500, new { error = "Failed to retrieve usage statistics" });
        }
    }
}
