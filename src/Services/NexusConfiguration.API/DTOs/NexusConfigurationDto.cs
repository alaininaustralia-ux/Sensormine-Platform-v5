using NexusConfiguration.API.Models;

namespace NexusConfiguration.API.DTOs;

public class NexusConfigurationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TenantId { get; set; }
    public Guid? DeviceTypeId { get; set; }
    public Guid? SchemaId { get; set; }
    public DocumentInfo? SourceDocument { get; set; }
    public List<ProbeConfig> ProbeConfigurations { get; set; } = new();
    public Dictionary<string, string> SchemaFieldMappings { get; set; } = new();
    public CommunicationSettings CommunicationSettings { get; set; } = new();
    public string? CustomLogic { get; set; }
    public string? CustomLogicLanguage { get; set; }
    public List<AlertRuleTemplate> AlertRuleTemplates { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public string Status { get; set; } = "Draft";
    public bool IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
    public string? AiInsights { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class CreateNexusConfigurationRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<ProbeConfig>? ProbeConfigurations { get; set; }
    public Dictionary<string, string>? SchemaFieldMappings { get; set; }
    public CommunicationSettings? CommunicationSettings { get; set; }
    public string? CustomLogic { get; set; }
    public string? CustomLogicLanguage { get; set; }
    public List<AlertRuleTemplate>? AlertRuleTemplates { get; set; }
    public List<string>? Tags { get; set; }
    public bool IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
}

public class UpdateNexusConfigurationRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<ProbeConfig>? ProbeConfigurations { get; set; }
    public Dictionary<string, string>? SchemaFieldMappings { get; set; }
    public CommunicationSettings? CommunicationSettings { get; set; }
    public string? CustomLogic { get; set; }
    public string? CustomLogicLanguage { get; set; }
    public List<AlertRuleTemplate>? AlertRuleTemplates { get; set; }
    public List<string>? Tags { get; set; }
    public string? Status { get; set; }
}

public class ParseDocumentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string FileContent { get; set; } = string.Empty; // Base64 encoded for PDFs, plain text for MD/TXT
    public string FileType { get; set; } = string.Empty; // PDF, MD, TXT
}

public class ParseDocumentResponse
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public NexusConfigurationDto? ParsedConfiguration { get; set; }
    public double ConfidenceScore { get; set; }
    public List<string> Suggestions { get; set; } = new();
    public string AiModel { get; set; } = string.Empty;
    public int TokensUsed { get; set; }
}

public class DeployConfigurationRequest
{
    public Guid ConfigurationId { get; set; }
    public bool CreateDeviceType { get; set; } = true;
    public bool CreateSchema { get; set; } = true;
    public string? DeviceTypeName { get; set; }
    public string? SchemaName { get; set; }
}

public class DeployConfigurationResponse
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? DeviceTypeId { get; set; }
    public Guid? SchemaId { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class GenerateCustomLogicRequest
{
    public string Prompt { get; set; } = string.Empty;
    public List<ProbeConfig>? ProbeConfigurations { get; set; }
    public string? ExistingLogic { get; set; }
    public string Language { get; set; } = "CSharp";
}

public class GenerateCustomLogicResponse
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string GeneratedCode { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public List<string> Suggestions { get; set; } = new();
    public int TokensUsed { get; set; }
}

public class ValidateCustomLogicRequest
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = "CSharp";
}

public class ValidateCustomLogicResponse
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
