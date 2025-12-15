using System.Text.Json;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sensormine.Core.Models;

/// <summary>
/// Represents a custom dashboard widget uploaded by developers
/// </summary>
[Table("custom_widgets")]
public class CustomWidget
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("tenant_id")]
    public Guid TenantId { get; set; }
    
    /// <summary>
    /// Unique widget identifier in reverse domain format (e.g., com.example.custom-gauge)
    /// </summary>
    [Column("widget_id")]
    [Required]
    [MaxLength(255)]
    public string WidgetId { get; set; } = string.Empty;
    
    [Column("name")]
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Column("description")]
    public string? Description { get; set; }
    
    [Column("version")]
    [Required]
    [MaxLength(50)]
    public string Version { get; set; } = string.Empty;
    
    [Column("author_name")]
    [MaxLength(255)]
    public string? AuthorName { get; set; }
    
    [Column("author_email")]
    [MaxLength(255)]
    public string? AuthorEmail { get; set; }
    
    [Column("author_organization")]
    [MaxLength(255)]
    public string? AuthorOrganization { get; set; }
    
    [Column("category")]
    [MaxLength(100)]
    public string? Category { get; set; }
    
    [Column("tags")]
    public string[]? Tags { get; set; }
    
    [Column("icon_url")]
    [MaxLength(1000)]
    public string? IconUrl { get; set; }
    
    /// <summary>
    /// Path to widget bundle in MinIO object storage
    /// </summary>
    [Column("storage_path")]
    [Required]
    [MaxLength(1000)]
    public string StoragePath { get; set; } = string.Empty;
    
    /// <summary>
    /// Complete widget manifest including config schema, permissions, and metadata
    /// </summary>
    [Column("manifest", TypeName = "jsonb")]
    public JsonDocument Manifest { get; set; } = JsonDocument.Parse("{}");
    
    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "active"; // active, deprecated, disabled
    
    [Column("download_count")]
    public int DownloadCount { get; set; }
    
    [Column("file_size_bytes")]
    public long? FileSizeBytes { get; set; }
    
    [Column("created_by")]
    public Guid CreatedBy { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Widget permission entry
/// </summary>
[Table("widget_permissions")]
public class WidgetPermission
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("widget_id")]
    public Guid WidgetId { get; set; }
    
    /// <summary>
    /// Permission identifier (e.g., api.query, api.devices)
    /// </summary>
    [Column("permission_type")]
    [Required]
    [MaxLength(100)]
    public string PermissionType { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional scope limitation for the permission
    /// </summary>
    [Column("permission_scope")]
    [MaxLength(255)]
    public string? PermissionScope { get; set; }
    
    [Column("granted_at")]
    public DateTime GrantedAt { get; set; }
    
    [ForeignKey(nameof(WidgetId))]
    public CustomWidget? Widget { get; set; }
}

/// <summary>
/// Widget usage audit log entry
/// </summary>
[Table("widget_usage_log")]
public class WidgetUsageLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("widget_id")]
    public Guid WidgetId { get; set; }
    
    [Column("tenant_id")]
    public Guid TenantId { get; set; }
    
    [Column("user_id")]
    public Guid? UserId { get; set; }
    
    [Column("dashboard_id")]
    public Guid? DashboardId { get; set; }
    
    /// <summary>
    /// Type of event (load, error, api_call, permission_denied)
    /// </summary>
    [Column("event_type")]
    [Required]
    [MaxLength(100)]
    public string EventType { get; set; } = string.Empty;
    
    /// <summary>
    /// Additional event context (error details, API call info, etc.)
    /// </summary>
    [Column("event_data", TypeName = "jsonb")]
    public JsonDocument? EventData { get; set; }
    
    [Column("ip_address")]
    [MaxLength(50)]
    public string? IpAddress { get; set; }
    
    [Column("user_agent")]
    [MaxLength(500)]
    public string? UserAgent { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [ForeignKey(nameof(WidgetId))]
    public CustomWidget? Widget { get; set; }
}
