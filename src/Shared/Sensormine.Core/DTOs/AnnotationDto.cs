using Sensormine.Core.Models;

namespace Sensormine.Core.DTOs;

/// <summary>
/// DTO for annotation responses
/// </summary>
public class AnnotationDto
{
    public Guid Id { get; set; }
    public Guid DashboardId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public AnnotationType Type { get; set; }
    
    // Positioning
    public AnnotationAnchorType AnchorType { get; set; }
    public Guid? WidgetId { get; set; }
    public DateTime? Timestamp { get; set; }
    public string? Position { get; set; }
    
    // Threading
    public Guid? ParentAnnotationId { get; set; }
    public List<AnnotationDto>? Replies { get; set; }
    
    // Metadata
    public List<string>? Mentions { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    
    // Audit
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public int EditCount { get; set; }
}

/// <summary>
/// Request to create an annotation
/// </summary>
public class CreateAnnotationRequest
{
    public string Content { get; set; } = string.Empty;
    public AnnotationType Type { get; set; } = AnnotationType.Info;
    
    // Positioning
    public AnnotationAnchorType AnchorType { get; set; } = AnnotationAnchorType.Dashboard;
    public Guid? WidgetId { get; set; }
    public DateTime? Timestamp { get; set; }
    public string? Position { get; set; }
    
    // Metadata
    public List<string>? Mentions { get; set; }
}

/// <summary>
/// Request to update an annotation
/// </summary>
public class UpdateAnnotationRequest
{
    public string? Content { get; set; }
    public AnnotationType? Type { get; set; }
    public string? Position { get; set; }
}

/// <summary>
/// Request to reply to an annotation
/// </summary>
public class CreateReplyRequest
{
    public string Content { get; set; } = string.Empty;
    public List<string>? Mentions { get; set; }
}

/// <summary>
/// Filter for querying annotations
/// </summary>
public class AnnotationFilter
{
    public string? UserId { get; set; }
    public AnnotationType? Type { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? Resolved { get; set; }
    public Guid? WidgetId { get; set; }
    public string? SearchText { get; set; }
}

/// <summary>
/// Annotation export container
/// </summary>
public class AnnotationExport
{
    public Guid DashboardId { get; set; }
    public string DashboardName { get; set; } = string.Empty;
    public List<AnnotationDto> Annotations { get; set; } = new();
    public DateTime ExportedAt { get; set; }
    public string ExportedBy { get; set; } = string.Empty;
}
