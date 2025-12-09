using System.Text.Json;

namespace Query.API.Services;

/// <summary>
/// Service for parsing telemetry data according to device schemas
/// </summary>
public interface ITelemetryParserService
{
    /// <summary>
    /// Parse telemetry custom fields using the device's schema
    /// </summary>
    /// <param name="customFields">Raw custom fields dictionary from telemetry</param>
    /// <param name="schemaId">Schema ID from device type</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Flattened dictionary with all sensor data at top level</returns>
    Task<Dictionary<string, object>> ParseCustomFieldsAsync(
        Dictionary<string, object> customFields,
        Guid? schemaId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Implementation of telemetry parser service
/// </summary>
public class TelemetryParserService : ITelemetryParserService
{
    private readonly ISchemaRegistryClient _schemaRegistryClient;
    private readonly ILogger<TelemetryParserService> _logger;

    public TelemetryParserService(
        ISchemaRegistryClient schemaRegistryClient,
        ILogger<TelemetryParserService> logger)
    {
        _schemaRegistryClient = schemaRegistryClient;
        _logger = logger;
    }

    public async Task<Dictionary<string, object>> ParseCustomFieldsAsync(
        Dictionary<string, object> customFields,
        Guid? schemaId,
        CancellationToken cancellationToken = default)
    {
        if (customFields == null || customFields.Count == 0)
        {
            return new Dictionary<string, object>();
        }

        var result = new Dictionary<string, object>();

        // First, check if there's a nested "customFields" that's a JSON string
        if (customFields.TryGetValue("customFields", out var nestedCustomFieldsObj))
        {
            try
            {
                string nestedJson;
                
                // Handle both string and JsonElement types
                if (nestedCustomFieldsObj is string nestedStr)
                {
                    nestedJson = nestedStr;
                }
                else if (nestedCustomFieldsObj is JsonElement nestedElement && 
                         nestedElement.ValueKind == JsonValueKind.String)
                {
                    nestedJson = nestedElement.GetString() ?? "";
                }
                else
                {
                    nestedJson = nestedCustomFieldsObj.ToString() ?? "";
                }

                // Parse the nested JSON string
                if (!string.IsNullOrEmpty(nestedJson))
                {
                    var nestedFields = JsonSerializer.Deserialize<Dictionary<string, object>>(nestedJson);
                    
                    if (nestedFields != null)
                    {
                        _logger.LogDebug("Parsed nested customFields JSON, found {Count} fields", 
                            nestedFields.Count);

                        // Add all nested fields to result
                        foreach (var kvp in nestedFields)
                        {
                            result[kvp.Key] = ConvertJsonElement(kvp.Value);
                        }
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse nested customFields JSON");
            }
        }

        // Add all top-level custom fields (except the nested customFields string itself)
        foreach (var kvp in customFields)
        {
            // Skip the nested customFields string we already processed
            if (kvp.Key == "customFields")
                continue;

            // Add or overwrite with top-level value (top-level takes precedence)
            result[kvp.Key] = ConvertJsonElement(kvp.Value);
        }

        _logger.LogDebug("Final parsed custom fields: {Count} fields", result.Count);

        return result;
    }

    /// <summary>
    /// Convert JsonElement to appropriate .NET type
    /// </summary>
    private object ConvertJsonElement(object value)
    {
        if (value is not JsonElement element)
            return value;

        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? "",
            JsonValueKind.Number => element.TryGetInt64(out var longVal) ? longVal :
                                  element.TryGetDouble(out var doubleVal) ? doubleVal : 0,
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null!,
            JsonValueKind.Array => element.EnumerateArray()
                .Select(e => ConvertJsonElement(e))
                .ToList(),
            JsonValueKind.Object => element.EnumerateObject()
                .ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value)),
            _ => element.ToString()
        };
    }
}
