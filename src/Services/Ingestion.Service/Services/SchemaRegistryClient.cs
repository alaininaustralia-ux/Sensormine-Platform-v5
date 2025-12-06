using System.Net.Http.Json;
using System.Text.Json;
using Sensormine.Core.Models;

namespace Ingestion.Service.Services;

/// <summary>
/// HTTP client for SchemaRegistry.API
/// </summary>
public interface ISchemaRegistryClient
{
    Task<SchemaValidationResult> ValidatePayloadAsync(string deviceId, string payload, CancellationToken cancellationToken = default);
    Task<Schema?> GetSchemaByDeviceIdAsync(string deviceId, CancellationToken cancellationToken = default);
}

public class SchemaRegistryClient : ISchemaRegistryClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SchemaRegistryClient> _logger;
    private readonly IConfiguration _configuration;

    public SchemaRegistryClient(
        HttpClient httpClient,
        ILogger<SchemaRegistryClient> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;

        var baseUrl = _configuration["SchemaRegistry:BaseUrl"] ?? "http://localhost:5021";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public async Task<SchemaValidationResult> ValidatePayloadAsync(
        string deviceId,
        string payload,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // First, get the device's schema
            var schema = await GetSchemaByDeviceIdAsync(deviceId, cancellationToken);
            if (schema == null)
            {
                return new SchemaValidationResult
                {
                    IsValid = false,
                    Errors = new List<string> { $"No schema found for device {deviceId}" }
                };
            }

            // Validate the payload against the schema
            var validateRequest = new
            {
                schemaId = schema.Id,
                data = payload
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"/api/schemas/{schema.Id}/versions/validate",
                validateRequest,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Schema validation request failed: {StatusCode}", response.StatusCode);
                return new SchemaValidationResult
                {
                    IsValid = false,
                    Errors = new List<string> { $"Validation service returned {response.StatusCode}" }
                };
            }

            var validationResult = await response.Content.ReadFromJsonAsync<ValidationResult>(cancellationToken);
            
            return new SchemaValidationResult
            {
                IsValid = validationResult?.IsValid ?? false,
                Errors = validationResult?.Errors?.Select(e => e.Message).ToList() ?? new List<string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating payload for device {DeviceId}", deviceId);
            return new SchemaValidationResult
            {
                IsValid = false,
                Errors = new List<string> { $"Validation error: {ex.Message}" }
            };
        }
    }

    public async Task<Schema?> GetSchemaByDeviceIdAsync(string deviceId, CancellationToken cancellationToken = default)
    {
        try
        {
            // For now, use a simple naming convention: deviceType is part of deviceId
            // Real implementation would query Device.API for device metadata
            var deviceTypeFromId = ExtractDeviceType(deviceId);
            
            var response = await _httpClient.GetAsync(
                $"/api/schemas/by-name/{deviceTypeFromId}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogDebug("Schema not found for device type {DeviceType}", deviceTypeFromId);
                return null;
            }

            return await response.Content.ReadFromJsonAsync<Schema>(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching schema for device {DeviceId}", deviceId);
            return null;
        }
    }

    private string ExtractDeviceType(string deviceId)
    {
        // Extract device type from device ID
        // Format: {type}-{number} e.g., "temp-sensor-001" -> "temp-sensor"
        var lastDash = deviceId.LastIndexOf('-');
        if (lastDash > 0 && int.TryParse(deviceId.Substring(lastDash + 1), out _))
        {
            return deviceId.Substring(0, lastDash);
        }
        return deviceId;
    }
}

public class SchemaValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<ValidationError> Errors { get; set; } = new();
}

public class ValidationError
{
    public string Path { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ErrorType { get; set; } = string.Empty;
}
