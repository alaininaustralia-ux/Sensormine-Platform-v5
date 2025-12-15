using NexusConfiguration.API.Models;

namespace NexusConfiguration.API.DTOs;

/// <summary>
/// Probe type information for configuration builder
/// </summary>
public class ProbeTypeInfo
{
    public string Type { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> SupportedProtocols { get; set; } = new();
    public Dictionary<string, string> DefaultSettings { get; set; } = new();
}

/// <summary>
/// Sensor type information for configuration builder
/// </summary>
public class SensorTypeInfo
{
    public string Type { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DefaultUnit { get; set; } = string.Empty;
    public List<string> CompatibleProbeTypes { get; set; } = new();
    public double? TypicalMinValue { get; set; }
    public double? TypicalMaxValue { get; set; }
    public List<string> CommonUnits { get; set; } = new();
}

/// <summary>
/// Communication protocol information
/// </summary>
public class CommunicationProtocolInfo
{
    public string Protocol { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool RequiresBrokerUrl { get; set; }
    public bool SupportsCompression { get; set; }
    public bool SupportsBatching { get; set; }
    public Dictionary<string, object> DefaultSettings { get; set; } = new();
}

/// <summary>
/// Configuration validation request
/// </summary>
public class ValidateConfigurationRequest
{
    public string Name { get; set; } = string.Empty;
    public List<ProbeConfig>? ProbeConfigurations { get; set; }
    public Dictionary<string, string>? SchemaFieldMappings { get; set; }
    public CommunicationSettings? CommunicationSettings { get; set; }
    public string? CustomLogic { get; set; }
    public string? CustomLogicLanguage { get; set; }
}

/// <summary>
/// Configuration validation response
/// </summary>
public class ValidateConfigurationResponse
{
    public bool IsValid { get; set; }
    public List<ValidationError> Errors { get; set; } = new();
    public List<ValidationWarning> Warnings { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

public class ValidationError
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class ValidationWarning
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
