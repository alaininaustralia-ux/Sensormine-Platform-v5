namespace Template.API.Models;

public class ExportRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? AuthorEmail { get; set; }
    public List<string> Tags { get; set; } = new();
    public string Category { get; set; } = "General";
    public ResourceSelection IncludeResources { get; set; } = new();
    public ExportOptions ExportOptions { get; set; } = new();
}

public class ResourceSelection
{
    public bool Schemas { get; set; } = true;
    public List<Guid> DeviceTypeIds { get; set; } = new();
    public List<Guid> DashboardIds { get; set; } = new();
    public List<Guid> AlertRuleIds { get; set; } = new();
    public List<Guid> AssetIds { get; set; } = new();
    public List<Guid> NexusConfigurationIds { get; set; } = new();
    public bool IncludeDevices { get; set; } = false;
}

public class ExportOptions
{
    public bool IncludeData { get; set; } = false;
    public bool Anonymize { get; set; } = false;
}

public class ImportRequest
{
    public Template Template { get; set; } = new();
    public ImportOptions ImportOptions { get; set; } = new();
}

public class ImportResult
{
    public bool Success { get; set; }
    public ImportCounts Imported { get; set; } = new();
    public Dictionary<string, List<string>> Skipped { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public Dictionary<string, Guid> Mappings { get; set; } = new();
}

public class ImportCounts
{
    public int Schemas { get; set; }
    public int DeviceTypes { get; set; }
    public int Dashboards { get; set; }
    public int AlertRules { get; set; }
    public int Assets { get; set; }
    public int NexusConfigurations { get; set; }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<ValidationError> Errors { get; set; } = new();
    public List<ValidationWarning> Warnings { get; set; } = new();
}

public class ValidationError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ResourceType { get; set; }
    public string? ResourceId { get; set; }
}

public class ValidationWarning
{
    public string Message { get; set; } = string.Empty;
    public string? ResourceType { get; set; }
}

public class ImportPreview
{
    public ImportCounts WillImport { get; set; } = new();
    public List<ConflictInfo> Conflicts { get; set; } = new();
    public List<string> MissingDependencies { get; set; } = new();
}

public class ConflictInfo
{
    public string ResourceType { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public string LocalId { get; set; } = string.Empty;
    public string ConflictReason { get; set; } = string.Empty;
}
