using System.Text.Json;

namespace Sensormine.Core.Models;

public class Template : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public string SchemaVersion { get; set; } = "1.0";
    public string? Description { get; set; }
    public string? Author { get; set; }
    public string? AuthorEmail { get; set; }
    public JsonDocument TemplateJson { get; set; } = null!;
    public string[]? Tags { get; set; }
    public string? Category { get; set; }
    public string? License { get; set; }
    public bool IsPublic { get; set; } = false;
    public bool IsVerified { get; set; } = false;
    public int DownloadCount { get; set; } = 0;
    public decimal Rating { get; set; } = 0;
    public string? CreatedBy { get; set; }
}

public class TemplateImportHistory : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid TemplateId { get; set; }
    public Template Template { get; set; } = null!;
    public string TemplateVersion { get; set; } = "1.0.0";
    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;
    public string? ImportedBy { get; set; }
    public string Status { get; set; } = "success"; // success, partial, failed
    public JsonDocument? ImportedCount { get; set; }
    public JsonDocument? SkippedCount { get; set; }
    public JsonDocument? Errors { get; set; }
}
