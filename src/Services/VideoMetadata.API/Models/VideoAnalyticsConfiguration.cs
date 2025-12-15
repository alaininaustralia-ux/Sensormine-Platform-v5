using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoMetadata.API.Models;

/// <summary>
/// Video Analytics Configuration entity
/// Represents a configured video source with AI processing model
/// </summary>
[Table("video_analytics_configurations")]
public class VideoAnalyticsConfiguration
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    [Required]
    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("source_type")]
    [MaxLength(50)]
    public string SourceType { get; set; } = string.Empty; // rtsp, azure-blob, hls, webrtc

    [Required]
    [Column("source_config", TypeName = "jsonb")]
    public string SourceConfig { get; set; } = "{}"; // JSON configuration for source

    [Required]
    [Column("processing_model")]
    [MaxLength(100)]
    public string ProcessingModel { get; set; } = string.Empty;

    [Required]
    [Column("model_configuration", TypeName = "jsonb")]
    public string ModelConfiguration { get; set; } = "{}"; // JSON configuration for model

    [Column("enabled")]
    public bool Enabled { get; set; } = true;

    [Column("device_id")]
    public Guid? DeviceId { get; set; } // Generated device ID once configured

    [Column("tags", TypeName = "text[]")]
    public string[]? Tags { get; set; }

    [Column("metadata", TypeName = "jsonb")]
    public string? Metadata { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    [MaxLength(255)]
    public string? CreatedBy { get; set; }
}
