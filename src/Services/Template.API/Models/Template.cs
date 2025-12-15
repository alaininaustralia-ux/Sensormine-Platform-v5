namespace Template.API.Models;

public class Template
{
    public TemplateMetadata Metadata { get; set; } = new();
    public TemplateResources Resources { get; set; } = new();
    public TemplateMappings Mappings { get; set; } = new();
    public ImportOptions? ImportOptions { get; set; }
}

public class TemplateMetadata
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public string SchemaVersion { get; set; } = "1.0";
    public string Description { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? AuthorEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<string> Tags { get; set; } = new();
    public string Category { get; set; } = "General";
    public string License { get; set; } = "MIT";
    public List<string> Dependencies { get; set; } = new();
    public TemplateCompatibility Compatibility { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class TemplateCompatibility
{
    public string MinPlatformVersion { get; set; } = "5.0.0";
    public string? MaxPlatformVersion { get; set; }
}

public class TemplateResources
{
    public List<SchemaResource> Schemas { get; set; } = new();
    public List<DeviceTypeResource> DeviceTypes { get; set; } = new();
    public List<AssetResource> Assets { get; set; } = new();
    public List<DashboardResource> Dashboards { get; set; } = new();
    public List<AlertRuleResource> AlertRules { get; set; } = new();
    public List<NexusConfigurationResource> NexusConfigurations { get; set; } = new();
    public List<NavigationResource> Navigation { get; set; } = new();
}

public class TemplateMappings
{
    public Dictionary<string, List<string>> References { get; set; } = new();
}

public class ImportOptions
{
    public ConflictResolution ConflictResolution { get; set; } = ConflictResolution.Skip;
    public bool PreserveIds { get; set; } = false;
    public bool ImportDevices { get; set; } = false;
    public bool ImportData { get; set; } = false;
    public Dictionary<string, Guid>? ExistingMappings { get; set; }
}

public enum ConflictResolution
{
    Skip,
    Overwrite,
    Rename
}
