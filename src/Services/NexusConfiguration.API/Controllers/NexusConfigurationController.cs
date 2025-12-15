using Microsoft.AspNetCore.Mvc;
using NexusConfiguration.API.DTOs;
using NexusConfiguration.API.Models;
using NexusConfiguration.API.Repositories;
using NexusConfiguration.API.Services;

namespace NexusConfiguration.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NexusConfigurationController : ControllerBase
{
    private readonly INexusConfigurationRepository _repository;
    private readonly IDocumentParsingService _documentParsingService;
    private readonly ICustomLogicService _customLogicService;
    private readonly IDeploymentService _deploymentService;
    private readonly ILogger<NexusConfigurationController> _logger;

    public NexusConfigurationController(
        INexusConfigurationRepository repository,
        IDocumentParsingService documentParsingService,
        ICustomLogicService customLogicService,
        IDeploymentService deploymentService,
        ILogger<NexusConfigurationController> logger)
    {
        _repository = repository;
        _documentParsingService = documentParsingService;
        _customLogicService = customLogicService;
        _deploymentService = deploymentService;
        _logger = logger;
    }

    /// <summary>
    /// Get all Nexus configurations for the tenant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<NexusConfigurationDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var tenantId = GetTenantId();
        var configurations = await _repository.GetAllAsync(tenantId, page, pageSize);
        
        return Ok(configurations.Select(MapToDto).ToList());
    }

    /// <summary>
    /// Get configuration by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NexusConfigurationDto>> GetById(Guid id)
    {
        var tenantId = GetTenantId();
        var configuration = await _repository.GetByIdAsync(id, tenantId);
        
        if (configuration == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        return Ok(MapToDto(configuration));
    }

    /// <summary>
    /// Get configuration templates
    /// </summary>
    [HttpGet("templates")]
    public async Task<ActionResult<List<NexusConfigurationDto>>> GetTemplates(
        [FromQuery] string? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var configurations = await _repository.GetTemplatesAsync(category, page, pageSize);
        
        return Ok(configurations.Select(MapToDto).ToList());
    }

    /// <summary>
    /// Search configurations
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<NexusConfigurationDto>>> Search(
        [FromQuery] string searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return BadRequest(new { message = "Search term is required" });
        }

        var tenantId = GetTenantId();
        var configurations = await _repository.SearchAsync(tenantId, searchTerm, page, pageSize);
        
        return Ok(configurations.Select(MapToDto).ToList());
    }

    /// <summary>
    /// Create a new Nexus configuration
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<NexusConfigurationDto>> Create([FromBody] CreateNexusConfigurationRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var configuration = new Models.NexusConfiguration
        {
            Name = request.Name,
            Description = request.Description,
            TenantId = tenantId,
            ProbeConfigurations = request.ProbeConfigurations ?? new List<Models.ProbeConfig>(),
            SchemaFieldMappings = request.SchemaFieldMappings ?? new Dictionary<string, string>(),
            CommunicationSettings = request.CommunicationSettings ?? new Models.CommunicationSettings(),
            CustomLogic = request.CustomLogic,
            CustomLogicLanguage = request.CustomLogicLanguage,
            AlertRuleTemplates = request.AlertRuleTemplates ?? new List<Models.AlertRuleTemplate>(),
            Tags = request.Tags ?? new List<string>(),
            IsTemplate = request.IsTemplate,
            TemplateCategory = request.TemplateCategory,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var created = await _repository.CreateAsync(configuration);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
    }

    /// <summary>
    /// Update an existing configuration
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<NexusConfigurationDto>> Update(Guid id, [FromBody] UpdateNexusConfigurationRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var configuration = await _repository.GetByIdAsync(id, tenantId);
        if (configuration == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        // Update fields if provided
        if (request.Name != null) configuration.Name = request.Name;
        if (request.Description != null) configuration.Description = request.Description;
        if (request.ProbeConfigurations != null) configuration.ProbeConfigurations = request.ProbeConfigurations;
        if (request.SchemaFieldMappings != null) configuration.SchemaFieldMappings = request.SchemaFieldMappings;
        if (request.CommunicationSettings != null) configuration.CommunicationSettings = request.CommunicationSettings;
        if (request.CustomLogic != null) configuration.CustomLogic = request.CustomLogic;
        if (request.CustomLogicLanguage != null) configuration.CustomLogicLanguage = request.CustomLogicLanguage;
        if (request.AlertRuleTemplates != null) configuration.AlertRuleTemplates = request.AlertRuleTemplates;
        if (request.Tags != null) configuration.Tags = request.Tags;
        if (request.Status != null) configuration.Status = request.Status;

        configuration.UpdatedBy = userId;

        var updated = await _repository.UpdateAsync(configuration);

        return Ok(MapToDto(updated));
    }

    /// <summary>
    /// Delete a configuration
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetTenantId();
        var deleted = await _repository.DeleteAsync(id, tenantId);

        if (!deleted)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Parse a datasheet or technical document and generate configuration
    /// </summary>
    [HttpPost("parse-document")]
    public async Task<ActionResult<ParseDocumentResponse>> ParseDocument([FromBody] ParseDocumentRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var response = await _documentParsingService.ParseDocumentAsync(request, tenantId, userId);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Generate custom logic code using AI
    /// </summary>
    [HttpPost("generate-logic")]
    public async Task<ActionResult<GenerateCustomLogicResponse>> GenerateLogic([FromBody] GenerateCustomLogicRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var response = await _customLogicService.GenerateLogicAsync(request, tenantId, userId);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Validate custom logic code
    /// </summary>
    [HttpPost("validate-logic")]
    public async Task<ActionResult<ValidateCustomLogicResponse>> ValidateLogic([FromBody] ValidateCustomLogicRequest request)
    {
        var response = await _customLogicService.ValidateLogicAsync(request);

        return Ok(response);
    }

    /// <summary>
    /// Deploy configuration (create Device Type and Schema)
    /// </summary>
    [HttpPost("deploy")]
    public async Task<ActionResult<DeployConfigurationResponse>> Deploy([FromBody] DeployConfigurationRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var response = await _deploymentService.DeployConfigurationAsync(request, tenantId, userId);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    private Guid GetTenantId()
    {
        // TODO: Get from authentication context
        // For now, use a default tenant ID
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return tenantId;
        }
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    private string? GetUserId()
    {
        // TODO: Get from authentication context
        return Request.Headers["X-User-Id"].FirstOrDefault();
    }

    /// <summary>
    /// Get available probe types for configuration builder
    /// </summary>
    [HttpGet("probe-types")]
    public ActionResult<List<ProbeTypeInfo>> GetProbeTypes()
    {
        var probeTypes = new List<ProbeTypeInfo>
        {
            new ProbeTypeInfo
            {
                Type = "RS485",
                DisplayName = "RS-485",
                Description = "Industrial RS-485 Modbus RTU communication",
                SupportedProtocols = new List<string> { "Modbus RTU", "Modbus ASCII" },
                DefaultSettings = new Dictionary<string, string>
                {
                    { "BaudRate", "9600" },
                    { "DataBits", "8" },
                    { "StopBits", "1" },
                    { "Parity", "None" }
                }
            },
            new ProbeTypeInfo
            {
                Type = "RS232",
                DisplayName = "RS-232",
                Description = "Serial RS-232 communication",
                SupportedProtocols = new List<string> { "ASCII", "Binary", "Custom" },
                DefaultSettings = new Dictionary<string, string>
                {
                    { "BaudRate", "9600" },
                    { "DataBits", "8" },
                    { "StopBits", "1" },
                    { "Parity", "None" }
                }
            },
            new ProbeTypeInfo
            {
                Type = "OneWire",
                DisplayName = "1-Wire",
                Description = "Dallas 1-Wire digital temperature sensors",
                SupportedProtocols = new List<string> { "1-Wire" },
                DefaultSettings = new Dictionary<string, string>
                {
                    { "Resolution", "12bit" },
                    { "SamplingTime", "750ms" }
                }
            },
            new ProbeTypeInfo
            {
                Type = "Analog420mA",
                DisplayName = "4-20mA Analog",
                Description = "Industrial 4-20mA current loop sensors",
                SupportedProtocols = new List<string> { "Analog" },
                DefaultSettings = new Dictionary<string, string>
                {
                    { "MinCurrent", "4" },
                    { "MaxCurrent", "20" },
                    { "SamplingRate", "1000ms" }
                }
            },
            new ProbeTypeInfo
            {
                Type = "Digital",
                DisplayName = "Digital I/O",
                Description = "Digital input/output sensors",
                SupportedProtocols = new List<string> { "GPIO", "Digital" },
                DefaultSettings = new Dictionary<string, string>
                {
                    { "PullResistor", "None" },
                    { "Debounce", "50ms" }
                }
            }
        };

        return Ok(probeTypes);
    }

    /// <summary>
    /// Get available sensor types for configuration builder
    /// </summary>
    [HttpGet("sensor-types")]
    public ActionResult<List<SensorTypeInfo>> GetSensorTypes([FromQuery] string? probeType = null)
    {
        var sensorTypes = new List<SensorTypeInfo>
        {
            new SensorTypeInfo
            {
                Type = "Temperature",
                DisplayName = "Temperature",
                Description = "Temperature measurement",
                DefaultUnit = "°C",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "OneWire", "Analog420mA" },
                TypicalMinValue = -40,
                TypicalMaxValue = 125,
                CommonUnits = new List<string> { "°C", "°F", "K" }
            },
            new SensorTypeInfo
            {
                Type = "Humidity",
                DisplayName = "Humidity",
                Description = "Relative humidity measurement",
                DefaultUnit = "%RH",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 100,
                CommonUnits = new List<string> { "%RH" }
            },
            new SensorTypeInfo
            {
                Type = "Pressure",
                DisplayName = "Pressure",
                Description = "Atmospheric or differential pressure",
                DefaultUnit = "kPa",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 1000,
                CommonUnits = new List<string> { "kPa", "bar", "psi", "mmHg" }
            },
            new SensorTypeInfo
            {
                Type = "Flow",
                DisplayName = "Flow Rate",
                Description = "Liquid or gas flow measurement",
                DefaultUnit = "L/min",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 1000,
                CommonUnits = new List<string> { "L/min", "m³/h", "GPM" }
            },
            new SensorTypeInfo
            {
                Type = "Level",
                DisplayName = "Level",
                Description = "Tank or reservoir level measurement",
                DefaultUnit = "m",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 100,
                CommonUnits = new List<string> { "m", "cm", "ft", "in", "%" }
            },
            new SensorTypeInfo
            {
                Type = "Vibration",
                DisplayName = "Vibration",
                Description = "Vibration and acceleration measurement",
                DefaultUnit = "g",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 16,
                CommonUnits = new List<string> { "g", "m/s²", "mm/s" }
            },
            new SensorTypeInfo
            {
                Type = "pH",
                DisplayName = "pH Level",
                Description = "Water quality pH measurement",
                DefaultUnit = "pH",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 14,
                CommonUnits = new List<string> { "pH" }
            },
            new SensorTypeInfo
            {
                Type = "Conductivity",
                DisplayName = "Electrical Conductivity",
                Description = "Water conductivity measurement",
                DefaultUnit = "µS/cm",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 20000,
                CommonUnits = new List<string> { "µS/cm", "mS/cm" }
            },
            new SensorTypeInfo
            {
                Type = "DissolvedOxygen",
                DisplayName = "Dissolved Oxygen",
                Description = "Water quality dissolved oxygen",
                DefaultUnit = "mg/L",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 20,
                CommonUnits = new List<string> { "mg/L", "ppm", "%" }
            },
            new SensorTypeInfo
            {
                Type = "Power",
                DisplayName = "Electrical Power",
                Description = "Electrical power consumption",
                DefaultUnit = "W",
                CompatibleProbeTypes = new List<string> { "RS485", "RS232", "Analog420mA" },
                TypicalMinValue = 0,
                TypicalMaxValue = 100000,
                CommonUnits = new List<string> { "W", "kW", "MW" }
            },
            new SensorTypeInfo
            {
                Type = "DigitalInput",
                DisplayName = "Digital Input",
                Description = "Binary state sensor (on/off, open/closed)",
                DefaultUnit = "state",
                CompatibleProbeTypes = new List<string> { "Digital" },
                TypicalMinValue = 0,
                TypicalMaxValue = 1,
                CommonUnits = new List<string> { "state", "boolean" }
            }
        };

        // Filter by probe type if specified
        if (!string.IsNullOrWhiteSpace(probeType))
        {
            sensorTypes = sensorTypes
                .Where(s => s.CompatibleProbeTypes.Contains(probeType, StringComparer.OrdinalIgnoreCase))
                .ToList();
        }

        return Ok(sensorTypes);
    }

    /// <summary>
    /// Get available communication protocols
    /// </summary>
    [HttpGet("communication-protocols")]
    public ActionResult<List<CommunicationProtocolInfo>> GetCommunicationProtocols()
    {
        var protocols = new List<CommunicationProtocolInfo>
        {
            new CommunicationProtocolInfo
            {
                Protocol = "MQTT",
                DisplayName = "MQTT",
                Description = "Lightweight messaging protocol for IoT",
                RequiresBrokerUrl = true,
                SupportsCompression = true,
                SupportsBatching = true,
                DefaultSettings = new Dictionary<string, object>
                {
                    { "BrokerUrl", "mqtt://localhost" },
                    { "Port", 1883 },
                    { "QoS", 1 },
                    { "TopicPattern", "sensormine/tenants/{tenantId}/devices/{deviceId}/telemetry" },
                    { "UseTls", false }
                }
            },
            new CommunicationProtocolInfo
            {
                Protocol = "Sensormine",
                DisplayName = "Sensormine",
                Description = "Direct integration with Sensormine platform",
                RequiresBrokerUrl = false,
                SupportsCompression = true,
                SupportsBatching = true,
                DefaultSettings = new Dictionary<string, object>
                {
                    { "Endpoint", "http://localhost:5022/api/telemetry" },
                    { "Method", "POST" },
                    { "UseTls", false }
                }
            },
            new CommunicationProtocolInfo
            {
                Protocol = "Azure IoT Hub",
                DisplayName = "Azure IoT Hub",
                Description = "Microsoft Azure IoT Hub with DPS provisioning",
                RequiresBrokerUrl = false,
                SupportsCompression = true,
                SupportsBatching = true,
                DefaultSettings = new Dictionary<string, object>
                {
                    { "ScopeId", "" },
                    { "UseDps", true },
                    { "IotHubHostname", "" }
                }
            }
        };

        return Ok(protocols);
    }

    /// <summary>
    /// Validate configuration before saving or deploying
    /// </summary>
    [HttpPost("validate")]
    public ActionResult<ValidateConfigurationResponse> ValidateConfiguration([FromBody] ValidateConfigurationRequest request)
    {
        var response = new ValidateConfigurationResponse { IsValid = true };

        // Validate name
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            response.Errors.Add(new ValidationError
            {
                Field = "Name",
                Message = "Configuration name is required",
                Code = "REQUIRED"
            });
            response.IsValid = false;
        }

        // Validate probe configurations
        if (request.ProbeConfigurations != null && request.ProbeConfigurations.Any())
        {
            var probeIds = new HashSet<string>();
            foreach (var probe in request.ProbeConfigurations)
            {
                // Check for duplicate probe IDs
                if (!probeIds.Add(probe.ProbeId))
                {
                    response.Errors.Add(new ValidationError
                    {
                        Field = $"ProbeConfigurations[{probe.ProbeId}]",
                        Message = $"Duplicate probe ID: {probe.ProbeId}",
                        Code = "DUPLICATE"
                    });
                    response.IsValid = false;
                }

                // Validate sampling interval
                if (probe.SamplingIntervalSeconds < 1)
                {
                    response.Errors.Add(new ValidationError
                    {
                        Field = $"ProbeConfigurations[{probe.ProbeId}].SamplingIntervalSeconds",
                        Message = "Sampling interval must be at least 1 second",
                        Code = "INVALID_RANGE"
                    });
                    response.IsValid = false;
                }
                else if (probe.SamplingIntervalSeconds < 10)
                {
                    response.Warnings.Add(new ValidationWarning
                    {
                        Field = $"ProbeConfigurations[{probe.ProbeId}].SamplingIntervalSeconds",
                        Message = "Very short sampling interval may impact device battery life"
                    });
                }

                // Validate probe type
                var validProbeTypes = new[] { "RS485", "RS232", "OneWire", "Analog420mA", "Digital" };
                if (!validProbeTypes.Contains(probe.ProbeType))
                {
                    response.Errors.Add(new ValidationError
                    {
                        Field = $"ProbeConfigurations[{probe.ProbeId}].ProbeType",
                        Message = $"Invalid probe type: {probe.ProbeType}",
                        Code = "INVALID_VALUE"
                    });
                    response.IsValid = false;
                }
            }
        }
        else
        {
            response.Warnings.Add(new ValidationWarning
            {
                Field = "ProbeConfigurations",
                Message = "No probe configurations defined"
            });
        }

        // Validate communication settings
        if (request.CommunicationSettings != null)
        {
            if (request.CommunicationSettings.TransmissionIntervalSeconds < 1)
            {
                response.Errors.Add(new ValidationError
                {
                    Field = "CommunicationSettings.TransmissionIntervalSeconds",
                    Message = "Transmission interval must be at least 1 second",
                    Code = "INVALID_RANGE"
                });
                response.IsValid = false;
            }

            if (request.CommunicationSettings.EnableBatching && request.CommunicationSettings.MaxBatchSize < 1)
            {
                response.Errors.Add(new ValidationError
                {
                    Field = "CommunicationSettings.MaxBatchSize",
                    Message = "Batch size must be at least 1 when batching is enabled",
                    Code = "INVALID_RANGE"
                });
                response.IsValid = false;
            }

            // Validate MQTT settings
            if (request.CommunicationSettings.Protocol == "MQTT" && request.CommunicationSettings.MqttSettings != null)
            {
                if (string.IsNullOrWhiteSpace(request.CommunicationSettings.MqttSettings.BrokerUrl))
                {
                    response.Errors.Add(new ValidationError
                    {
                        Field = "CommunicationSettings.MqttSettings.BrokerUrl",
                        Message = "MQTT broker URL is required when using MQTT protocol",
                        Code = "REQUIRED"
                    });
                    response.IsValid = false;
                }

                if (request.CommunicationSettings.MqttSettings.QoS < 0 || request.CommunicationSettings.MqttSettings.QoS > 2)
                {
                    response.Errors.Add(new ValidationError
                    {
                        Field = "CommunicationSettings.MqttSettings.QoS",
                        Message = "MQTT QoS must be 0, 1, or 2",
                        Code = "INVALID_RANGE"
                    });
                    response.IsValid = false;
                }
            }

            // Validate Azure IoT Hub settings
            if (request.CommunicationSettings.Protocol == "Azure IoT Hub" && request.CommunicationSettings.AzureIoTSettings != null)
            {
                if (string.IsNullOrWhiteSpace(request.CommunicationSettings.AzureIoTSettings.ScopeId))
                {
                    response.Errors.Add(new ValidationError
                    {
                        Field = "CommunicationSettings.AzureIoTSettings.ScopeId",
                        Message = "Azure IoT Hub Scope ID is required",
                        Code = "REQUIRED"
                    });
                    response.IsValid = false;
                }
            }
        }

        // Add suggestions
        if (response.IsValid)
        {
            response.Suggestions.Add("Configuration looks good! You can save or deploy it.");
            
            if (request.ProbeConfigurations != null && request.ProbeConfigurations.Count == 1)
            {
                response.Suggestions.Add("Consider adding more probe configurations to fully utilize device capabilities.");
            }

            if (request.SchemaFieldMappings == null || !request.SchemaFieldMappings.Any())
            {
                response.Suggestions.Add("Define schema field mappings to structure your telemetry data.");
            }
        }

        return Ok(response);
    }

    private NexusConfigurationDto MapToDto(Models.NexusConfiguration config)
    {
        return new NexusConfigurationDto
        {
            Id = config.Id,
            Name = config.Name,
            Description = config.Description,
            TenantId = config.TenantId,
            DeviceTypeId = config.DeviceTypeId,
            SchemaId = config.SchemaId,
            SourceDocument = config.SourceDocument,
            ProbeConfigurations = config.ProbeConfigurations,
            SchemaFieldMappings = config.SchemaFieldMappings,
            CommunicationSettings = config.CommunicationSettings,
            CustomLogic = config.CustomLogic,
            CustomLogicLanguage = config.CustomLogicLanguage,
            AlertRuleTemplates = config.AlertRuleTemplates,
            Tags = config.Tags,
            Status = config.Status,
            IsTemplate = config.IsTemplate,
            TemplateCategory = config.TemplateCategory,
            AiInsights = config.AiInsights,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt,
            CreatedBy = config.CreatedBy,
            UpdatedBy = config.UpdatedBy
        };
    }
}
