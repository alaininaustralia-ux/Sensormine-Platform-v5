using Sensormine.Core.Models;

namespace Sensormine.Core.DTOs;

/// <summary>
/// Dashboard DTO for API responses
/// </summary>
public class DashboardDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object Layout { get; set; } = new object();
    public object Widgets { get; set; } = new object();
    public bool IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
    public string[]? SharedWith { get; set; }
    public string[]? Tags { get; set; }
    public Guid? ParentDashboardId { get; set; }
    public string? ParentDashboardName { get; set; }
    public List<SubPageSummaryDto> SubPages { get; set; } = new();
    public int DisplayOrder { get; set; }
    public DashboardType DashboardType { get; set; } = DashboardType.Root;
    public int Version { get; set; }
    public string? LastModifiedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>
/// Create dashboard request
/// </summary>
public class CreateDashboardRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object? Layout { get; set; }
    public object? Widgets { get; set; }
    public bool IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
    public string[]? SharedWith { get; set; }
    public string[]? Tags { get; set; }
    public Guid? ParentDashboardId { get; set; }
    public int DisplayOrder { get; set; }
    public DashboardType DashboardType { get; set; } = DashboardType.Root;
}

/// <summary>
/// Update dashboard request
/// </summary>
public class UpdateDashboardRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public object? Layout { get; set; }
    public object? Widgets { get; set; }
    public bool? IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
    public string[]? SharedWith { get; set; }
    public string[]? Tags { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ExpectedVersion { get; set; }  // For optimistic locking
}

/// <summary>
/// Summary DTO for subpages in dashboard list
/// </summary>
public class SubPageSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DashboardType DashboardType { get; set; }
    public int DisplayOrder { get; set; }
    public int WidgetCount { get; set; }
}
