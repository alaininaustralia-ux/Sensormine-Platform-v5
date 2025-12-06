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
    /// Tenant ID for multi-tenancy
    /// </summary>
    public string TenantId { get; set; } = string.Empty;

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
    /// Soft delete flag
    /// </summary>
    public bool IsDeleted { get; set; }
}
