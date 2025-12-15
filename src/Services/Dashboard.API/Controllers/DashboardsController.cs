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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        // If ParentDashboardId is provided, verify parent exists
        if (request.ParentDashboardId.HasValue)
        {
            var parent = await _repository.GetByIdAsync(request.ParentDashboardId.Value, tenantId);
            if (parent == null)
            {
                return BadRequest(new { message = "Parent dashboard not found" });
            }
        }

        var dashboard = new Sensormine.Core.Models.Dashboard
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = Guid.Parse(tenantId),
            Name = request.Name,
            Description = request.Description,
            Layout = JsonSerializer.Serialize(request.Layout ?? new object[] {}),
            Widgets = JsonSerializer.Serialize(request.Widgets ?? new object[] {}),
            IsTemplate = request.IsTemplate,
            TemplateCategory = request.TemplateCategory,
            SharedWith = request.SharedWith != null ? JsonSerializer.Serialize(request.SharedWith) : null,
            Tags = request.Tags != null ? JsonSerializer.Serialize(request.Tags) : null,
            ParentDashboardId = request.ParentDashboardId,
            DisplayOrder = request.DisplayOrder,
            DashboardType = request.DashboardType
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
        userId ??= "demo-user";
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        var dashboard = await _repository.GetByIdAsync(id, tenantId);
        
        if (dashboard == null)
        {
            return NotFound(new { message = "Dashboard not found" });
        }

        // Optimistic locking: Check version if provided
        if (request.ExpectedVersion.HasValue && dashboard.Version != request.ExpectedVersion.Value)
        {
            _logger.LogWarning("Dashboard {DashboardId} version conflict. Expected: {Expected}, Current: {Current}", 
                id, request.ExpectedVersion.Value, dashboard.Version);
            return Conflict(new { 
                message = "Dashboard was modified by another user. Please reload and try again.",
                currentVersion = dashboard.Version,
                expectedVersion = request.ExpectedVersion.Value
            });
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
        
        if (request.DisplayOrder.HasValue)
            dashboard.DisplayOrder = request.DisplayOrder.Value;

        // Increment version and track modifier
        dashboard.Version++;
        dashboard.LastModifiedBy = userId;
        dashboard.UpdatedAt = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(dashboard);
        
        _logger.LogInformation("Dashboard {DashboardId} updated to version {Version} by user {UserId}", 
            id, updated.Version, userId);
        
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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        var dashboards = await _repository.SearchAsync(tenantId, q, tags);
        return Ok(dashboards.Select(MapToDto));
    }

    /// <summary>
    /// Get all root dashboards (dashboards without a parent)
    /// </summary>
    [HttpGet("roots")]
    public async Task<ActionResult<IEnumerable<DashboardDto>>> GetRootDashboards(
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        userId ??= "demo-user";
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        var dashboards = await _repository.GetRootDashboardsAsync(tenantId, userId);
        return Ok(dashboards.Select(MapToDto));
    }

    /// <summary>
    /// Get all subpages for a dashboard
    /// </summary>
    [HttpGet("{id:guid}/subpages")]
    public async Task<ActionResult<IEnumerable<DashboardDto>>> GetSubPages(
        Guid id,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        var subPages = await _repository.GetSubPagesAsync(id, tenantId);
        return Ok(subPages.Select(MapToDto));
    }

    /// <summary>
    /// Create a new subpage under a parent dashboard
    /// </summary>
    [HttpPost("{parentId:guid}/subpages")]
    public async Task<ActionResult<DashboardDto>> CreateSubPage(
        Guid parentId,
        [FromBody] CreateDashboardRequest request,
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        userId ??= "demo-user";
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        // Verify parent exists
        var parent = await _repository.GetByIdAsync(parentId, tenantId);
        if (parent == null)
        {
            return NotFound(new { message = "Parent dashboard not found" });
        }

        var dashboard = new Sensormine.Core.Models.Dashboard
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = Guid.Parse(tenantId),
            Name = request.Name,
            Description = request.Description,
            Layout = JsonSerializer.Serialize(request.Layout ?? new object[] {}),
            Widgets = JsonSerializer.Serialize(request.Widgets ?? new object[] {}),
            IsTemplate = request.IsTemplate,
            TemplateCategory = request.TemplateCategory,
            SharedWith = request.SharedWith != null ? JsonSerializer.Serialize(request.SharedWith) : null,
            Tags = request.Tags != null ? JsonSerializer.Serialize(request.Tags) : null,
            ParentDashboardId = parentId,
            DisplayOrder = request.DisplayOrder,
            DashboardType = request.DashboardType
        };

        var created = await _repository.CreateAsync(dashboard);
        
        _logger.LogInformation("Subpage {DashboardId} created under parent {ParentId} by user {UserId}", 
            created.Id, parentId, userId);
        
        return CreatedAtAction(
            nameof(GetDashboard), 
            new { id = created.Id }, 
            MapToDto(created));
    }

    /// <summary>
    /// Reorder subpages within a parent dashboard
    /// </summary>
    [HttpPut("{parentId:guid}/subpages/reorder")]
    public async Task<ActionResult> ReorderSubPages(
        Guid parentId,
        [FromBody] Dictionary<Guid, int> displayOrders,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        var success = await _repository.ReorderSubPagesAsync(parentId, tenantId, displayOrders);
        
        if (!success)
        {
            return NotFound(new { message = "Parent dashboard or subpages not found" });
        }

        _logger.LogInformation("Subpages reordered for parent {ParentId}", parentId);
        
        return NoContent();
    }

    private static DashboardDto MapToDto(Sensormine.Core.Models.Dashboard dashboard)
    {
        // Count widgets if SubPages is loaded
        var widgetCount = 0;
        if (dashboard.Widgets != null)
        {
            var widgets = JsonSerializer.Deserialize<object[]>(dashboard.Widgets);
            widgetCount = widgets?.Length ?? 0;
        }

        return new DashboardDto
        {
            Id = dashboard.Id,
            UserId = dashboard.UserId,
            TenantId = dashboard.TenantId.ToString(),
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
            Version = dashboard.Version,
            LastModifiedBy = dashboard.LastModifiedBy,
            CreatedAt = dashboard.CreatedAt,
            UpdatedAt = dashboard.UpdatedAt ?? dashboard.CreatedAt,
            ParentDashboardId = dashboard.ParentDashboardId,
            ParentDashboardName = dashboard.ParentDashboard?.Name,
            DisplayOrder = dashboard.DisplayOrder,
            DashboardType = dashboard.DashboardType,
            SubPages = dashboard.SubPages?.Select(sp => new SubPageSummaryDto
            {
                Id = sp.Id,
                Name = sp.Name,
                Description = sp.Description,
                DashboardType = sp.DashboardType,
                DisplayOrder = sp.DisplayOrder,
                WidgetCount = sp.Widgets != null 
                    ? (JsonSerializer.Deserialize<object[]>(sp.Widgets)?.Length ?? 0) 
                    : 0
            }).OrderBy(sp => sp.DisplayOrder).ToList()
        };
    }
}
