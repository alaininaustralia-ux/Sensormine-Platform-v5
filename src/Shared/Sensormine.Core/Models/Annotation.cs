namespace Sensormine.Core.Models;

/// <summary>
/// Annotation on a dashboard for collaborative documentation
/// </summary>
public class Annotation : BaseEntity
{
    /// <summary>
    /// Dashboard this annotation belongs to
    /// </summary>
    public Guid DashboardId { get; set; }
    
    /// <summary>
    /// Navigation property to dashboard
    /// </summary>
    public Dashboard Dashboard { get; set; } = null!;
    
    /// <summary>
    /// User who created the annotation
    /// </summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Display name of user who created annotation
    /// </summary>
    public string UserName { get; set; } = string.Empty;
    
    /// <summary>
    /// Annotation content (plain text or rich text HTML/JSON)
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of annotation (Info, Warning, Critical, Note)
    /// </summary>
    public AnnotationType Type { get; set; } = AnnotationType.Info;
    
    /// <summary>
    /// How the annotation is anchored (Dashboard, Widget, Timestamp)
    /// </summary>
    public AnnotationAnchorType AnchorType { get; set; } = AnnotationAnchorType.Dashboard;
    
    /// <summary>
    /// Widget ID if pinned to a specific widget
    /// </summary>
    public Guid? WidgetId { get; set; }
    
    /// <summary>
    /// Timestamp if pinned to a time-series data point
    /// </summary>
    public DateTime? Timestamp { get; set; }
    
    /// <summary>
    /// Free-form position on dashboard (JSON: { x, y })
    /// </summary>
    public string? Position { get; set; }
    
    /// <summary>
    /// Parent annotation ID for threaded replies
    /// </summary>
    public Guid? ParentAnnotationId { get; set; }
    
    /// <summary>
    /// Navigation property to parent annotation
    /// </summary>
    public Annotation? ParentAnnotation { get; set; }
    
    /// <summary>
    /// Navigation property to replies
    /// </summary>
    public ICollection<Annotation> Replies { get; set; } = new List<Annotation>();
    
    /// <summary>
    /// User IDs mentioned in annotation (JSON array)
    /// </summary>
    public string? Mentions { get; set; }
    
    /// <summary>
    /// Whether annotation is marked as resolved
    /// </summary>
    public bool IsResolved { get; set; }
    
    /// <summary>
    /// When annotation was resolved
    /// </summary>
    public DateTime? ResolvedAt { get; set; }
    
    /// <summary>
    /// User who resolved the annotation
    /// </summary>
    public string? ResolvedBy { get; set; }
    
    /// <summary>
    /// When annotation was last edited
    /// </summary>
    public DateTime? EditedAt { get; set; }
    
    /// <summary>
    /// Number of times annotation has been edited
    /// </summary>
    public int EditCount { get; set; }
}

/// <summary>
/// Annotation type/severity
/// </summary>
public enum AnnotationType
{
    /// <summary>
    /// Informational note
    /// </summary>
    Info = 0,
    
    /// <summary>
    /// Warning or attention needed
    /// </summary>
    Warning = 1,
    
    /// <summary>
    /// Critical issue or urgent note
    /// </summary>
    Critical = 2,
    
    /// <summary>
    /// General note
    /// </summary>
    Note = 3
}

/// <summary>
/// How annotation is positioned/anchored
/// </summary>
public enum AnnotationAnchorType
{
    /// <summary>
    /// Free-floating on dashboard at specific coordinates
    /// </summary>
    Dashboard = 0,
    
    /// <summary>
    /// Pinned to a specific widget
    /// </summary>
    Widget = 1,
    
    /// <summary>
    /// Pinned to a timestamp in time-series data
    /// </summary>
    Timestamp = 2
}
