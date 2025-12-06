using NexusConfiguration.API.DTOs;
using NexusConfiguration.API.Repositories;
using System.Text;
using System.Text.Json;

namespace NexusConfiguration.API.Services;

public class DeploymentService : IDeploymentService
{
    private readonly INexusConfigurationRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeploymentService> _logger;

    public DeploymentService(
        INexusConfigurationRepository repository,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DeploymentService> logger)
    {
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DeployConfigurationResponse> DeployConfigurationAsync(
        DeployConfigurationRequest request,
        Guid tenantId,
        string? userId = null)
    {
        var warnings = new List<string>();
        Guid? deviceTypeId = null;
        Guid? schemaId = null;

        try
        {
            _logger.LogInformation("Deploying configuration: {ConfigurationId}", request.ConfigurationId);

            // Get configuration
            var config = await _repository.GetByIdAsync(request.ConfigurationId, tenantId);
            if (config == null)
            {
                return new DeployConfigurationResponse
                {
                    Success = false,
                    ErrorMessage = "Configuration not found"
                };
            }

            // Step 1: Create Schema if requested
            if (request.CreateSchema)
            {
                schemaId = await CreateSchemaAsync(config, request.SchemaName, tenantId, userId, warnings);
                if (schemaId == null)
                {
                    warnings.Add("Failed to create schema, but continuing deployment");
                }
                else
                {
                    config.SchemaId = schemaId;
                }
            }

            // Step 2: Create Device Type if requested
            if (request.CreateDeviceType)
            {
                deviceTypeId = await CreateDeviceTypeAsync(config, request.DeviceTypeName, schemaId, tenantId, userId, warnings);
                if (deviceTypeId == null)
                {
                    return new DeployConfigurationResponse
                    {
                        Success = false,
                        ErrorMessage = "Failed to create device type",
                        SchemaId = schemaId,
                        Warnings = warnings
                    };
                }
                else
                {
                    config.DeviceTypeId = deviceTypeId;
                }
            }

            // Step 3: Update configuration status
            config.Status = "Deployed";
            config.UpdatedAt = DateTime.UtcNow;
            config.UpdatedBy = userId;
            await _repository.UpdateAsync(config);

            _logger.LogInformation(
                "Successfully deployed configuration: {ConfigurationId}, DeviceType: {DeviceTypeId}, Schema: {SchemaId}",
                request.ConfigurationId, deviceTypeId, schemaId);

            return new DeployConfigurationResponse
            {
                Success = true,
                DeviceTypeId = deviceTypeId,
                SchemaId = schemaId,
                Warnings = warnings
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deploying configuration: {ConfigurationId}", request.ConfigurationId);

            return new DeployConfigurationResponse
            {
                Success = false,
                ErrorMessage = $"Deployment error: {ex.Message}",
                DeviceTypeId = deviceTypeId,
                SchemaId = schemaId,
                Warnings = warnings
            };
        }
    }

    private async Task<Guid?> CreateSchemaAsync(
        Models.NexusConfiguration config,
        string? schemaName,
        Guid tenantId,
        string? userId,
        List<string> warnings)
    {
        try
        {
            var deviceApiUrl = _configuration["Services:SchemaRegistry:Url"] ?? "http://localhost:5021";
            var httpClient = _httpClientFactory.CreateClient();

            // Build JSON schema from probe configurations
            var jsonSchema = BuildJsonSchemaFromProbes(config.ProbeConfigurations);

            var schemaRequest = new
            {
                name = schemaName ?? $"{config.Name} Schema",
                description = $"Auto-generated schema for {config.Name}",
                version = "1.0.0",
                schemaType = "JSONSchema",
                schemaContent = jsonSchema,
                tags = config.Tags,
                isActive = true
            };

            var content = new StringContent(
                JsonSerializer.Serialize(schemaRequest),
                Encoding.UTF8,
                "application/json");

            // Add tenant header
            httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
            if (userId != null)
            {
                httpClient.DefaultRequestHeaders.Add("X-User-Id", userId);
            }

            var response = await httpClient.PostAsync($"{deviceApiUrl}/api/schemas", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to create schema: {Error}", error);
                warnings.Add($"Schema creation failed: {error}");
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var schemaResponse = JsonSerializer.Deserialize<SchemaResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return schemaResponse?.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating schema");
            warnings.Add($"Schema creation error: {ex.Message}");
            return null;
        }
    }

    private async Task<Guid?> CreateDeviceTypeAsync(
        Models.NexusConfiguration config,
        string? deviceTypeName,
        Guid? schemaId,
        Guid tenantId,
        string? userId,
        List<string> warnings)
    {
        try
        {
            var deviceApiUrl = _configuration["Services:Device:Url"] ?? "http://localhost:5293";
            var httpClient = _httpClientFactory.CreateClient();

            // Map communication settings to protocol config
            var protocolConfig = BuildProtocolConfig(config.CommunicationSettings);

            // Map probe configurations to custom fields
            var customFields = BuildCustomFieldsFromProbes(config.ProbeConfigurations);

            var deviceTypeRequest = new
            {
                name = deviceTypeName ?? config.Name,
                description = config.Description,
                protocol = config.CommunicationSettings.Protocol,
                protocolConfig = protocolConfig,
                schemaId = schemaId,
                customFields = customFields,
                alertRuleTemplates = config.AlertRuleTemplates,
                tags = config.Tags
            };

            var content = new StringContent(
                JsonSerializer.Serialize(deviceTypeRequest),
                Encoding.UTF8,
                "application/json");

            // Add tenant header
            httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
            if (userId != null)
            {
                httpClient.DefaultRequestHeaders.Add("X-User-Id", userId);
            }

            var response = await httpClient.PostAsync($"{deviceApiUrl}/api/DeviceType", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to create device type: {Error}", error);
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var deviceTypeResponse = JsonSerializer.Deserialize<DeviceTypeResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return deviceTypeResponse?.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating device type");
            return null;
        }
    }

    private string BuildJsonSchemaFromProbes(List<Models.ProbeConfig> probes)
    {
        var properties = new Dictionary<string, object>();

        properties["deviceId"] = new { type = "string", description = "Device identifier" };
        properties["timestamp"] = new { type = "string", format = "date-time", description = "Timestamp of the reading" };

        foreach (var probe in probes)
        {
            var fieldName = probe.ProbeId.ToLower().Replace(" ", "_");
            properties[fieldName] = new
            {
                type = "number",
                description = $"{probe.SensorType} reading from {probe.ProbeName}",
                unit = probe.Unit
            };
        }

        var schema = new
        {
            @type = "object",
            properties = properties,
            required = new[] { "deviceId", "timestamp" }
        };

        return JsonSerializer.Serialize(schema, new JsonSerializerOptions { WriteIndented = true });
    }

    private Dictionary<string, object> BuildProtocolConfig(Models.CommunicationSettings settings)
    {
        var config = new Dictionary<string, object>
        {
            ["protocol"] = settings.Protocol,
            ["transmissionIntervalSeconds"] = settings.TransmissionIntervalSeconds,
            ["enableBatching"] = settings.EnableBatching,
            ["maxBatchSize"] = settings.MaxBatchSize,
            ["enableCompression"] = settings.EnableCompression
        };

        if (settings.MqttSettings != null)
        {
            config["mqtt"] = new
            {
                brokerUrl = settings.MqttSettings.BrokerUrl,
                port = settings.MqttSettings.Port,
                topicPattern = settings.MqttSettings.TopicPattern,
                qos = settings.MqttSettings.QoS,
                useTls = settings.MqttSettings.UseTls
            };
        }

        if (settings.AzureIoTSettings != null)
        {
            config["azureIoT"] = new
            {
                scopeId = settings.AzureIoTSettings.ScopeId,
                useDps = settings.AzureIoTSettings.UseDps,
                iotHubHostname = settings.AzureIoTSettings.IotHubHostname
            };
        }

        return config;
    }

    private List<object> BuildCustomFieldsFromProbes(List<Models.ProbeConfig> probes)
    {
        var fields = new List<object>();

        foreach (var probe in probes)
        {
            fields.Add(new
            {
                name = probe.ProbeId,
                label = probe.ProbeName,
                type = "Text",
                required = false,
                helpText = $"{probe.SensorType} - {probe.ProbeType}",
                defaultValue = ""
            });
        }

        return fields;
    }

    private class SchemaResponse
    {
        public Guid Id { get; set; }
    }

    private class DeviceTypeResponse
    {
        public Guid Id { get; set; }
    }
}
