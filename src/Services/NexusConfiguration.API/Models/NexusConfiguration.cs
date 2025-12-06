using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexusConfiguration.API.Models;

/// <summary>
/// Represents a Nexus device configuration including probe settings, schema mappings, and custom logic
/// </summary>
public class NexusConfiguration
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Tenant ID for multi-tenancy support
    /// </summary>
    [Required]
    public Guid TenantId { get; set; }

    /// <summary>
    /// Associated Device Type ID (optional - may be created during deployment)
    /// </summary>
    public Guid? DeviceTypeId { get; set; }

    /// <summary>
    /// Associated Schema ID (optional - may be created during deployment)
    /// </summary>
    public Guid? SchemaId { get; set; }

    /// <summary>
    /// Source document information if uploaded
    /// </summary>
    [Column(TypeName = "jsonb")]
    public DocumentInfo? SourceDocument { get; set; }

    /// <summary>
    /// Probe configurations (RS485, RS232, OneWire, 4-20mA analog)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<ProbeConfig> ProbeConfigurations { get; set; } = new();

    /// <summary>
    /// Schema field mappings (probe output -> schema field)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public Dictionary<string, string> SchemaFieldMappings { get; set; } = new();

    /// <summary>
    /// Communication settings for Nexus device
    /// </summary>
    [Column(TypeName = "jsonb")]
    public CommunicationSettings CommunicationSettings { get; set; } = new();

    /// <summary>
    /// Custom logic/scripting for data transformation or business rules
    /// </summary>
    [MaxLength(50000)]
    public string? CustomLogic { get; set; }

    /// <summary>
    /// Custom logic language (CSharp, JavaScript, Python)
    /// </summary>
    [MaxLength(50)]
    public string? CustomLogicLanguage { get; set; } = "CSharp";

    /// <summary>
    /// Alert rule templates for this configuration
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<AlertRuleTemplate> AlertRuleTemplates { get; set; } = new();

    /// <summary>
    /// Tags for categorization
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Configuration status
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Validated, Deployed

    /// <summary>
    /// Whether this configuration is a template for reuse
    /// </summary>
    public bool IsTemplate { get; set; }

    /// <summary>
    /// Template category if IsTemplate is true
    /// </summary>
    [MaxLength(100)]
    public string? TemplateCategory { get; set; }

    /// <summary>
    /// AI-generated insights or suggestions for this configuration
    /// </summary>
    [MaxLength(5000)]
    public string? AiInsights { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    public string? CreatedBy { get; set; }

    [MaxLength(200)]
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// Information about uploaded source document
/// </summary>
public class DocumentInfo
{
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty; // PDF, MD, TXT, DOCX
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? StoragePath { get; set; }
    public bool AiParsed { get; set; }
    public string? AiModel { get; set; }
    public double? AiConfidenceScore { get; set; }
}

/// <summary>
/// Probe configuration for Nexus device
/// </summary>
public class ProbeConfig
{
    public string ProbeId { get; set; } = string.Empty;
    public string ProbeName { get; set; } = string.Empty;
    public string ProbeType { get; set; } = string.Empty; // RS485, RS232, OneWire, Analog420mA, Digital
    public string SensorType { get; set; } = string.Empty; // Temperature, Pressure, Flow, Level, etc.
    public string Unit { get; set; } = string.Empty;
    
    /// <summary>
    /// Protocol-specific settings (e.g., Modbus register addresses, OneWire device IDs)
    /// </summary>
    public Dictionary<string, object> ProtocolSettings { get; set; } = new();

    /// <summary>
    /// Calibration settings
    /// </summary>
    public CalibrationSettings? Calibration { get; set; }

    /// <summary>
    /// Data transformation formula (e.g., "(x * 0.1) + 32" for Fahrenheit conversion)
    /// </summary>
    public string? TransformationFormula { get; set; }

    /// <summary>
    /// Sampling interval in seconds
    /// </summary>
    public int SamplingIntervalSeconds { get; set; } = 60;
}

/// <summary>
/// Calibration settings for probe
/// </summary>
public class CalibrationSettings
{
    public double Offset { get; set; }
    public double Scale { get; set; } = 1.0;
    public double? MinValue { get; set; }
    public double? MaxValue { get; set; }
    public DateTime? LastCalibrationDate { get; set; }
    public DateTime? NextCalibrationDate { get; set; }
}

/// <summary>
/// Communication settings for Nexus device
/// </summary>
public class CommunicationSettings
{
    /// <summary>
    /// Protocol: MQTT, HTTP, Azure IoT Hub
    /// </summary>
    public string Protocol { get; set; } = "MQTT";

    /// <summary>
    /// Data transmission interval in seconds
    /// </summary>
    public int TransmissionIntervalSeconds { get; set; } = 300;

    /// <summary>
    /// Whether to batch multiple readings
    /// </summary>
    public bool EnableBatching { get; set; } = true;

    /// <summary>
    /// Max batch size if batching enabled
    /// </summary>
    public int MaxBatchSize { get; set; } = 10;

    /// <summary>
    /// Enable data compression
    /// </summary>
    public bool EnableCompression { get; set; } = false;

    /// <summary>
    /// MQTT-specific settings
    /// </summary>
    public MqttSettings? MqttSettings { get; set; }

    /// <summary>
    /// Azure IoT Hub settings
    /// </summary>
    public AzureIoTSettings? AzureIoTSettings { get; set; }
}

public class MqttSettings
{
    public string BrokerUrl { get; set; } = "mqtt://localhost";
    public int Port { get; set; } = 1883;
    public string TopicPattern { get; set; } = "devices/{deviceId}/telemetry";
    public int QoS { get; set; } = 1;
    public bool UseTls { get; set; } = false;
}

public class AzureIoTSettings
{
    public string ScopeId { get; set; } = string.Empty;
    public bool UseDps { get; set; } = true;
    public string? IotHubHostname { get; set; }
}

/// <summary>
/// Alert rule template
/// </summary>
public class AlertRuleTemplate
{
    public string Name { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty; // e.g., "temperature > 50"
    public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Message { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}
