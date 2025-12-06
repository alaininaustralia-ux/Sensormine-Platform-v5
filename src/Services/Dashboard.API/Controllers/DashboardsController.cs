using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.DTOs;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using System.Text.Json;

namespace Dashboard.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardsController : ControllerBase
{
    private readonly IDashboardRepository _repository;
    private readonly ILogger<DashboardsController> _logger;

    public DashboardsController(
        IDashboardRepository repository,
        ILogger<DashboardsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get all dashboards for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DashboardDto>>> GetDashboards(
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        // TODO: Get from JWT claims in production
        userId ??= "demo-user";
        tenantId ??= "default";

        var dashboards = await _repository.GetByUserIdAsync(userId, tenantId);
        return Ok(dashboards.Select(MapToDto));
    }

    /// <summary>
    /// Get a specific dashboard by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DashboardDto>> GetDashboard(
        Guid id,
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        tenantId ??= "default";

        var dashboard = await _repository.GetByIdAsync(id, tenantId);
        
        if (dashboard == null)
        {
            return NotFound(new { message = "Dashboard not found" });
        }

        return Ok(MapToDto(dashboard));
    }

    /// <summary>
    /// Create a new dashboard
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DashboardDto>> CreateDashboard(
        [FromBody] CreateDashboardRequest request,
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        // TODO: Get from JWT claims in production
        userId ??= "demo-user";
        tenantId ??= "default";

        var dashboard = new Sensormine.Core.Models.Dashboard
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            Layout = JsonSerializer.Serialize(request.Layout ?? new object[] {}),
            Widgets = JsonSerializer.Serialize(request.Widgets ?? new object[] {}),
            IsTemplate = request.IsTemplate,
            TemplateCategory = request.TemplateCategory,
            SharedWith = request.SharedWith != null ? JsonSerializer.Serialize(request.SharedWith) : null,
            Tags = request.Tags != null ? JsonSerializer.Serialize(request.Tags) : null
        };

        var created = await _repository.CreateAsync(dashboard);
        
        _logger.LogInformation("Dashboard {DashboardId} created by user {UserId}", created.Id, userId);
        
        return CreatedAtAction(
            nameof(GetDashboard), 
            new { id = created.Id }, 
            MapToDto(created));
    }

    /// <summary>
    /// Update an existing dashboard
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DashboardDto>> UpdateDashboard(
        Guid id,
        [FromBody] UpdateDashboardRequest request,
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        tenantId ??= "default";

        var dashboard = await _repository.GetByIdAsync(id, tenantId);
        
        if (dashboard == null)
        {
            return NotFound(new { message = "Dashboard not found" });
        }

        // Update fields if provided
        if (request.Name != null)
            dashboard.Name = request.Name;
        
        if (request.Description != null)
            dashboard.Description = request.Description;
        
        if (request.Layout != null)
            dashboard.Layout = JsonSerializer.Serialize(request.Layout);
        
        if (request.Widgets != null)
            dashboard.Widgets = JsonSerializer.Serialize(request.Widgets);
        
        if (request.IsTemplate.HasValue)
            dashboard.IsTemplate = request.IsTemplate.Value;
        
        if (request.TemplateCategory != null)
            dashboard.TemplateCategory = request.TemplateCategory;
        
        if (request.SharedWith != null)
            dashboard.SharedWith = JsonSerializer.Serialize(request.SharedWith);
        
        if (request.Tags != null)
            dashboard.Tags = JsonSerializer.Serialize(request.Tags);

        var updated = await _repository.UpdateAsync(dashboard);
        
        _logger.LogInformation("Dashboard {DashboardId} updated", id);
        
        return Ok(MapToDto(updated));
    }

    /// <summary>
    /// Delete a dashboard
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteDashboard(
        Guid id,
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        tenantId ??= "default";

        var success = await _repository.DeleteAsync(id, tenantId);
        
        if (!success)
        {
            return NotFound(new { message = "Dashboard not found" });
        }

        _logger.LogInformation("Dashboard {DashboardId} deleted", id);
        
        return NoContent();
    }

    /// <summary>
    /// Search dashboards
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<DashboardDto>>> SearchDashboards(
        [FromQuery] string? q,
        [FromQuery] string[]? tags,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        tenantId ??= "default";

        var dashboards = await _repository.SearchAsync(tenantId, q, tags);
        return Ok(dashboards.Select(MapToDto));
    }

    private static DashboardDto MapToDto(Sensormine.Core.Models.Dashboard dashboard)
    {
        return new DashboardDto
        {
            Id = dashboard.Id,
            UserId = dashboard.UserId,
            TenantId = dashboard.TenantId,
            Name = dashboard.Name,
            Description = dashboard.Description,
            Layout = JsonSerializer.Deserialize<object>(dashboard.Layout) ?? new object(),
            Widgets = JsonSerializer.Deserialize<object>(dashboard.Widgets) ?? new object(),
            IsTemplate = dashboard.IsTemplate,
            TemplateCategory = dashboard.TemplateCategory,
            SharedWith = dashboard.SharedWith != null 
                ? JsonSerializer.Deserialize<string[]>(dashboard.SharedWith) 
                : null,
            Tags = dashboard.Tags != null 
                ? JsonSerializer.Deserialize<string[]>(dashboard.Tags) 
                : null,
            CreatedAt = dashboard.CreatedAt,
            UpdatedAt = dashboard.UpdatedAt ?? dashboard.CreatedAt
        };
    }
}
