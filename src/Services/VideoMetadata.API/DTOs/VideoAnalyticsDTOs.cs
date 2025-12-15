namespace VideoMetadata.API.DTOs;

public enum VideoSourceType
{
    Rtsp,
    AzureBlob,
    Hls,
    WebRTC
}

public enum ProcessingModelType
{
    ObjectDetection,
    PersonDetection,
    VehicleDetection,
    BehaviorAnalysis,
    NearMissDetection,
    Custom
}

public class CreateVideoAnalyticsRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SourceType { get; set; } = string.Empty;
    public object SourceConfig { get; set; } = new { };
    public string ProcessingModel { get; set; } = string.Empty;
    public object ModelConfiguration { get; set; } = new { };
    public bool Enabled { get; set; } = true;
    public string[]? Tags { get; set; }
}

public class UpdateVideoAnalyticsRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public object? SourceConfig { get; set; }
    public object? ModelConfiguration { get; set; }
    public bool? Enabled { get; set; }
    public string[]? Tags { get; set; }
}

public class VideoAnalyticsResponse
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SourceType { get; set; } = string.Empty;
    public object SourceConfig { get; set; } = new { };
    public string ProcessingModel { get; set; } = string.Empty;
    public object ModelConfiguration { get; set; } = new { };
    public bool Enabled { get; set; }
    public Guid? DeviceId { get; set; }
    public string[]? Tags { get; set; }
    public object? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class VideoAnalyticsListResponse
{
    public List<VideoAnalyticsResponse> Configurations { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class TestConnectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public object SourceConfig { get; set; } = new { };
    public string ProcessingModel { get; set; } = string.Empty;
    public object ModelConfiguration { get; set; } = new { };
}

public class TestConnectionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
