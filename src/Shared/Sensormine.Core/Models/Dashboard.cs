namespace Sensormine.Core.Models;

/// <summary>
/// Dashboard configuration stored in the database
/// </summary>
public class Dashboard : BaseEntity
{
    /// <summary>
    /// User ID who created the dashboard
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Tenant ID for multi-tenancy (shadows BaseEntity.TenantId)
    /// </summary>
    public new string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// Dashboard name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Dashboard description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Grid layout configuration stored as JSON
    /// </summary>
    public string Layout { get; set; } = "[]";

    /// <summary>
    /// Widgets configuration stored as JSON
    /// </summary>
    public string Widgets { get; set; } = "[]";

    /// <summary>
    /// Whether this is a template dashboard
    /// </summary>
    public bool IsTemplate { get; set; }

    /// <summary>
    /// Template category (operations, maintenance, security, custom)
    /// </summary>
    public string? TemplateCategory { get; set; }

    /// <summary>
    /// Users/teams this dashboard is shared with (JSON array)
    /// </summary>
    public string? SharedWith { get; set; }

    /// <summary>
    /// Dashboard tags for organization (JSON array)
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// Parent dashboard ID for subpage hierarchy (null for root dashboards)
    /// </summary>
    public Guid? ParentDashboardId { get; set; }

    /// <summary>
    /// Navigation property to parent dashboard
    /// </summary>
    public Dashboard? ParentDashboard { get; set; }

    /// <summary>
    /// Navigation property to child dashboards (subpages)
    /// </summary>
    public ICollection<Dashboard> SubPages { get; set; } = new List<Dashboard>();

    /// <summary>
    /// Display order within parent dashboard (for subpage sorting)
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Type of dashboard: Root, DeviceDetail, DeviceTypeList, Custom
    /// </summary>
    public DashboardType DashboardType { get; set; } = DashboardType.Root;

    /// <summary>
    /// Soft delete flag
    /// </summary>
    public bool IsDeleted { get; set; }
}

/// <summary>
/// Type of dashboard for navigation hierarchy
/// </summary>
public enum DashboardType
{
    /// <summary>
    /// Top-level dashboard
    /// </summary>
    Root = 0,
    
    /// <summary>
    /// Detail page for a single device
    /// </summary>
    DeviceDetail = 1,
    
    /// <summary>
    /// List page for a device type
    /// </summary>
    DeviceTypeList = 2,
    
    /// <summary>
    /// Custom subpage
    /// </summary>
    Custom = 3
}
