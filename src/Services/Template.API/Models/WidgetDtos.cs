using System.Text.Json;

namespace Template.API.Models;

/// <summary>
/// Response DTO for widget details
/// </summary>
public class WidgetResponse
{
    public Guid Id { get; set; }
    public string WidgetId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = string.Empty;
    public WidgetAuthor? Author { get; set; }
    public string? Category { get; set; }
    public string[]? Tags { get; set; }
    public string? IconUrl { get; set; }
    public JsonDocument Manifest { get; set; } = JsonDocument.Parse("{}");
    public string Status { get; set; } = string.Empty;
    public int DownloadCount { get; set; }
    public long? FileSizeBytes { get; set; }
    public string DownloadUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WidgetAuthor
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Organization { get; set; }
}

/// <summary>
/// List response with pagination
/// </summary>
public class WidgetListResponse
{
    public List<WidgetResponse> Widgets { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// Upload response
/// </summary>
public class WidgetUploadResponse
{
    public Guid Id { get; set; }
    public string WidgetId { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Widget manifest structure (matches architecture design)
/// </summary>
public class WidgetManifest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public WidgetManifestAuthor? Author { get; set; }
    public string? License { get; set; }
    public string EntryPoint { get; set; } = "index.js";
    public string? Icon { get; set; }
    public string? Category { get; set; }
    public string[]? Tags { get; set; }
    public WidgetPermissions? Permissions { get; set; }
    public WidgetConfig? Config { get; set; }
    public WidgetSize? Size { get; set; }
}

public class WidgetManifestAuthor
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Organization { get; set; }
}

public class WidgetPermissions
{
    public string[]? Apis { get; set; }
    public string[]? Resources { get; set; }
}

public class WidgetConfig
{
    public List<WidgetConfigInput>? Inputs { get; set; }
}

public class WidgetConfigInput
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Label { get; set; }
    public bool Required { get; set; }
    public string? Description { get; set; }
    public object? Default { get; set; }
}

public class WidgetSize
{
    public int MinWidth { get; set; }
    public int MinHeight { get; set; }
    public int MaxWidth { get; set; }
    public int MaxHeight { get; set; }
    public int DefaultWidth { get; set; }
    public int DefaultHeight { get; set; }
}
