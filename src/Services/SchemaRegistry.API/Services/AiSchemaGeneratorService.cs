using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Sensormine.AI.Services;

namespace SchemaRegistry.API.Services;

/// <summary>
/// Configuration for Anthropic Claude API
/// </summary>
public class AnthropicConfig
{
    public required string ApiKey { get; set; }
    public required string Model { get; set; }
    public int MaxTokens { get; set; } = 8192;
    public int TimeoutMinutes { get; set; } = 5;
}

/// <summary>
/// Service for generating JSON Schemas using AI (Claude API)
/// </summary>
public interface IAiSchemaGeneratorService
{
    Task<(bool Success, object? Schema, string? Error, string? Confidence, List<string>? Suggestions)> GenerateSchemaAsync(
        string data,
        string? fileName = null,
        string? dataType = null,
        string? description = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Implementation of AI-powered schema generator using Anthropic Claude with centralized metering
/// </summary>
public class AnthropicSchemaGeneratorService : IAiSchemaGeneratorService
{
    private readonly HttpClient _httpClient;
    private readonly AnthropicConfig _config;
    private readonly ILogger<AnthropicSchemaGeneratorService> _logger;
    private readonly IAiMeteringService _meteringService;
    private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";

    public AnthropicSchemaGeneratorService(
        HttpClient httpClient,
        AnthropicConfig config,
        ILogger<AnthropicSchemaGeneratorService> logger,
        IAiMeteringService meteringService)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        _meteringService = meteringService;

        // Configure HttpClient
        _httpClient.Timeout = TimeSpan.FromMinutes(_config.TimeoutMinutes);
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _config.ApiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    }

    public async Task<(bool Success, object? Schema, string? Error, string? Confidence, List<string>? Suggestions)> GenerateSchemaAsync(
        string data,
        string? fileName = null,
        string? dataType = null,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        // Build prompt
        var prompt = BuildPrompt(data, fileName, dataType, description);

        // Prepare request
        var requestBody = new
        {
            model = _config.Model,
            max_tokens = _config.MaxTokens,
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };

        // Call AI with metering
        var meteredResponse = await _meteringService.CallAiAsync(
            provider: "anthropic",
            model: _config.Model,
            operation: "schema-generation",
            request: requestBody,
            callFunc: async (req) => await CallAnthropicApiAsync(req, cancellationToken)
        );

        if (!meteredResponse.Success)
        {
            _logger.LogError("Schema generation failed: {Error}", meteredResponse.Error);
            return (false, null, meteredResponse.Error, null, null);
        }

        try
        {
            var contentText = meteredResponse.Response;

            if (string.IsNullOrEmpty(contentText))
            {
                return (false, null, "Empty response from AI", null, null);
            }

            // Extract schema, confidence, and suggestions
            var schema = ExtractSchema(contentText);
            var confidence = ExtractConfidence(contentText);
            var suggestions = ExtractSuggestions(contentText);

            if (schema == null)
            {
                return (false, null, "Failed to extract valid schema from AI response", null, null);
            }

            // Validate schema
            if (!ValidateSchema(schema))
            {
                return (false, null, "Generated schema is invalid", null, null);
            }

            // Assess confidence if not provided by AI
            confidence ??= AssessConfidence(data, schema);

            _logger.LogInformation("Successfully generated schema with {Confidence} confidence", confidence);

            return (true, schema, null, confidence, suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating schema with AI");
            return (false, null, ex.Message, null, null);
        }
    }

    private static string BuildPrompt(string data, string? fileName, string? dataType, string? description)
    {
        var contextInfo = new StringBuilder();
        if (!string.IsNullOrEmpty(fileName))
            contextInfo.AppendLine($"File name: {fileName}");
        if (!string.IsNullOrEmpty(dataType))
            contextInfo.AppendLine($"Data type: {dataType}");
        if (!string.IsNullOrEmpty(description))
            contextInfo.AppendLine($"Description: {description}");

        var truncatedData = data.Length > 10000 ? data[..10000] + "...(truncated)" : data;

        return $@"You are an expert at analyzing IoT sensor data and creating JSON Schema definitions.

{contextInfo}

Analyze the following sample data and generate a valid JSON Schema that describes the data structure:

```
{truncatedData}
```

Requirements:
1. Generate a valid JSON Schema (Draft 7 or later)
2. Include appropriate data types for each field
3. Add descriptions for fields when their purpose is clear
4. Mark required fields based on data analysis
5. Include validation rules (min, max, pattern) when appropriate
6. For numeric fields, detect if they represent measurements (temperature, pressure, etc.)
7. Detect timestamps and use appropriate format
8. For IoT sensor data, identify device/sensor metadata vs telemetry data

Return your response in this format:

SCHEMA:
```json
{{
  ""type"": ""object"",
  ""properties"": {{ ... }}
}}
```

CONFIDENCE: high/medium/low

SUGGESTIONS:
- List any recommendations for improving the schema
- Note any ambiguities in the data
- Suggest additional fields that might be useful

Focus on creating a practical, reusable schema for IoT sensor data ingestion.\";
    }

    /// <summary>
    /// Call Anthropic API and return the text content
    /// </summary>
    private async Task<string> CallAnthropicApiAsync(object requestBody, CancellationToken cancellationToken)
    {
        var requestJson = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(AnthropicApiUrl, content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Anthropic API error: {response.StatusCode} - {errorText}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);

        // Extract content text from response
        var contentText = responseObj
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString();

        return contentText ?? throw new InvalidOperationException("No content in AI response");
    }

    private static object? ExtractSchema(string response)
    {
        try
        {
            // Look for JSON between ```json and ``` markers after SCHEMA:
            var schemaMatch = Regex.Match(response, @"SCHEMA:\s*```json\s*(\{[\s\S]*?\})\s*```", RegexOptions.Multiline);

            if (schemaMatch.Success)
            {
                var schemaJson = schemaMatch.Groups[1].Value;
                return JsonSerializer.Deserialize<object>(schemaJson);
            }

            // Fallback: try to find any JSON object
            var jsonMatch = Regex.Match(response, @"\{[\s\S]*\}", RegexOptions.Multiline);
            if (jsonMatch.Success)
            {
                return JsonSerializer.Deserialize<object>(jsonMatch.Value);
            }

            return null;
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static string? ExtractConfidence(string response)
    {
        var match = Regex.Match(response, @"CONFIDENCE:\s*(high|medium|low)", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.ToLower() : null;
    }

    private static List<string>? ExtractSuggestions(string response)
    {
        var suggestions = new List<string>();

        // Look for SUGGESTIONS section
        var suggestionsMatch = Regex.Match(response, @"SUGGESTIONS:\s*([\s\S]*?)(?:\n\n|$)", RegexOptions.Multiline);

        if (suggestionsMatch.Success)
        {
            var suggestionText = suggestionsMatch.Groups[1].Value;
            var bullets = Regex.Matches(suggestionText, @"^[-*]\s*(.+)$", RegexOptions.Multiline);

            foreach (Match bullet in bullets)
            {
                suggestions.Add(bullet.Groups[1].Value.Trim());
            }
        }

        return suggestions.Count > 0 ? suggestions : null;
    }

    private static bool ValidateSchema(object schema)
    {
        try
        {
            var schemaJson = JsonSerializer.Serialize(schema);
            var schemaObj = JsonSerializer.Deserialize<JsonElement>(schemaJson);

            // Basic validation
            if (schemaObj.ValueKind != JsonValueKind.Object)
                return false;

            if (!schemaObj.TryGetProperty("type", out _))
                return false;

            if (!schemaObj.TryGetProperty("properties", out var properties))
                return false;

            if (properties.ValueKind != JsonValueKind.Object)
                return false;

            // Check if properties has at least one field
            var propsEnumerator = properties.EnumerateObject();
            return propsEnumerator.Any();
        }
        catch
        {
            return false;
        }
    }

    private static string AssessConfidence(string data, object schema)
    {
        var dataLength = data.Length;
        var schemaJson = JsonSerializer.Serialize(schema);
        var schemaObj = JsonSerializer.Deserialize<JsonElement>(schemaJson);

        var propertyCount = 0;
        if (schemaObj.TryGetProperty("properties", out var properties))
        {
            propertyCount = properties.EnumerateObject().Count();
        }

        // High confidence: good data size, reasonable number of properties
        if (dataLength > 500 && propertyCount >= 3 && propertyCount <= 50)
        {
            return "high";
        }

        // Low confidence: very little data or unusual structure
        if (dataLength < 100 || propertyCount < 2 || propertyCount > 100)
        {
            return "low";
        }

        return "medium";
    }
}
