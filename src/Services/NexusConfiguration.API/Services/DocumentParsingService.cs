using NexusConfiguration.API.DTOs;
using NexusConfiguration.API.Models;
using System.Text;
using System.Text.Json;

namespace NexusConfiguration.API.Services;

public class DocumentParsingService : IDocumentParsingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DocumentParsingService> _logger;
    private readonly string _apiKey;
    private const string MODEL_NAME = "claude-haiku-4-5";
    private const string ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    public DocumentParsingService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DocumentParsingService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
        _apiKey = configuration["Anthropic:ApiKey"] ?? "";
        
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    }

    public async Task<ParseDocumentResponse> ParseDocumentAsync(
        ParseDocumentRequest request,
        Guid tenantId,
        string? userId = null)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            _logger.LogInformation("Parsing document: {FileName} ({FileType})", request.FileName, request.FileType);

            // Decode file content if base64 encoded
            string textContent = request.FileContent;
            if (request.FileType.ToLower() == "pdf")
            {
                // For PDF, assume it's base64 encoded
                try
                {
                    var bytes = Convert.FromBase64String(request.FileContent);
                    textContent = Encoding.UTF8.GetString(bytes);
                }
                catch
                {
                    // If not base64, treat as plain text
                    textContent = request.FileContent;
                }
            }

            // Build prompt for Claude
            var prompt = BuildParsingPrompt(textContent, request.FileType);

            // Call Claude API
            var requestBody = new
            {
                model = MODEL_NAME,
                max_tokens = 8192,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var httpResponse = await _httpClient.PostAsync(ANTHROPIC_API_URL, content);
            
            if (!httpResponse.IsSuccessStatusCode)
            {
                var error = await httpResponse.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Anthropic API error: {httpResponse.StatusCode} - {error}");
            }

            var responseText = await httpResponse.Content.ReadAsStringAsync();
            var response = JsonSerializer.Deserialize<AnthropicResponse>(responseText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            // Log AI usage
            var duration = DateTime.UtcNow - startTime;
            var inputTokens = response?.Usage?.InputTokens ?? 0;
            var outputTokens = response?.Usage?.OutputTokens ?? 0;
            _logger.LogInformation(
                "Document parsing completed - TenantId: {TenantId}, Model: {Model}, Duration: {Duration}ms, InputTokens: {InputTokens}, OutputTokens: {OutputTokens}",
                tenantId, MODEL_NAME, duration.TotalMilliseconds, inputTokens, outputTokens);

            // Parse Claude's response
            var contentText = response?.Content?.FirstOrDefault()?.Text ?? string.Empty;
            var parsedConfig = ParseClaudeResponse(contentText);

            if (parsedConfig == null)
            {
                return new ParseDocumentResponse
                {
                    Success = false,
                    ErrorMessage = "Failed to parse AI response into configuration",
                    ConfidenceScore = 0.0,
                    TokensUsed = (response?.Usage?.InputTokens ?? 0) + (response?.Usage?.OutputTokens ?? 0),
                    AiModel = MODEL_NAME
                };
            }

            // Add document info
            parsedConfig.SourceDocument = new DocumentInfo
            {
                FileName = request.FileName,
                FileType = request.FileType,
                FileSizeBytes = textContent.Length,
                UploadedAt = DateTime.UtcNow,
                AiParsed = true,
                AiModel = MODEL_NAME,
                AiConfidenceScore = CalculateConfidenceScore(parsedConfig)
            };

            parsedConfig.TenantId = tenantId;
            parsedConfig.Status = "Draft";

            return new ParseDocumentResponse
            {
                Success = true,
                ParsedConfiguration = parsedConfig,
                ConfidenceScore = parsedConfig.SourceDocument?.AiConfidenceScore ?? 0.5,
                Suggestions = GenerateSuggestions(parsedConfig),
                AiModel = MODEL_NAME,
                TokensUsed = (response?.Usage?.InputTokens ?? 0) + (response?.Usage?.OutputTokens ?? 0)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing document: {FileName}", request.FileName);

            // Log failed AI usage
            var duration = DateTime.UtcNow - startTime;
            _logger.LogError(ex, 
                "Document parsing failed - TenantId: {TenantId}, Model: {Model}, Duration: {Duration}ms",
                tenantId, MODEL_NAME, duration.TotalMilliseconds);

            return new ParseDocumentResponse
            {
                Success = false,
                ErrorMessage = $"Error parsing document: {ex.Message}",
                ConfidenceScore = 0.0,
                AiModel = MODEL_NAME
            };
        }
    }

    private string BuildParsingPrompt(string documentContent, string fileType)
    {
        return $@"You are an expert in industrial IoT systems and Nexus device configurations. 
Analyze the following technical document and extract device configuration information.

Document Type: {fileType}
Document Content:
{documentContent}

Extract and structure the following information in JSON format:
1. Device name and description
2. Probe configurations (sensor type, protocol, communication interface, units, sampling intervals)
3. Communication settings (protocol, transmission intervals, batching)
4. Alert rule templates (conditions, thresholds, severity)
5. Any calibration or transformation formulas

Return a JSON object with this structure:
{{
  ""name"": ""<device name>"",
  ""description"": ""<description>"",
  ""probeConfigurations"": [
    {{
      ""probeId"": ""<unique id>"",
      ""probeName"": ""<name>"",
      ""probeType"": ""<RS485|RS232|OneWire|Analog420mA|Digital>"",
      ""sensorType"": ""<Temperature|Pressure|Flow|Level|etc>"",
      ""unit"": ""<unit>"",
      ""protocolSettings"": {{}},
      ""samplingIntervalSeconds"": 60,
      ""transformationFormula"": ""<optional formula>""
    }}
  ],
  ""communicationSettings"": {{
    ""protocol"": ""MQTT"",
    ""transmissionIntervalSeconds"": 300,
    ""enableBatching"": true,
    ""maxBatchSize"": 10
  }},
  ""alertRuleTemplates"": [
    {{
      ""name"": ""<alert name>"",
      ""condition"": ""<condition expression>"",
      ""severity"": ""<Low|Medium|High|Critical>"",
      ""message"": ""<alert message>"",
      ""enabled"": true
    }}
  ],
  ""tags"": [""<tag1>"", ""<tag2>""]
}}

If information is missing or unclear, use reasonable defaults for industrial IoT applications.
Only return the JSON object, no additional explanation.";
    }

    private NexusConfigurationDto? ParseClaudeResponse(string response)
    {
        try
        {
            // Try to extract JSON from response (Claude sometimes adds explanatory text)
            var jsonStart = response.IndexOf('{');
            var jsonEnd = response.LastIndexOf('}');

            if (jsonStart == -1 || jsonEnd == -1)
            {
                _logger.LogWarning("No JSON found in Claude response");
                return null;
            }

            var jsonContent = response.Substring(jsonStart, jsonEnd - jsonStart + 1);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var config = JsonSerializer.Deserialize<NexusConfigurationDto>(jsonContent, options);
            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Claude JSON response");
            return null;
        }
    }

    private double CalculateConfidenceScore(NexusConfigurationDto config)
    {
        // Calculate confidence based on completeness of configuration
        double score = 0.0;

        if (!string.IsNullOrEmpty(config.Name)) score += 0.2;
        if (!string.IsNullOrEmpty(config.Description)) score += 0.1;
        if (config.ProbeConfigurations?.Any() == true) score += 0.3;
        if (config.CommunicationSettings != null) score += 0.2;
        if (config.AlertRuleTemplates?.Any() == true) score += 0.1;
        if (config.Tags?.Any() == true) score += 0.1;

        return Math.Round(score, 2);
    }

    private List<string> GenerateSuggestions(NexusConfigurationDto config)
    {
        var suggestions = new List<string>();

        if (config.ProbeConfigurations?.Count == 0)
        {
            suggestions.Add("No probes detected. Consider adding probe configurations manually.");
        }

        if (config.AlertRuleTemplates?.Count == 0)
        {
            suggestions.Add("No alert rules found. Consider adding alert templates for monitoring.");
        }

        if (config.CommunicationSettings?.TransmissionIntervalSeconds > 600)
        {
            suggestions.Add("Transmission interval is high (>10 minutes). Consider reducing for more real-time monitoring.");
        }

        if (config.ProbeConfigurations?.Any(p => p.SamplingIntervalSeconds < 10) == true)
        {
            suggestions.Add("Some probes have very high sampling rates (<10 seconds). This may impact battery life.");
        }

        return suggestions;
    }

    private class AnthropicResponse
    {
        public string? Id { get; set; }
        public List<AnthropicContent>? Content { get; set; }
        public AnthropicUsage? Usage { get; set; }
    }

    private class AnthropicContent
    {
        public string? Type { get; set; }
        public string? Text { get; set; }
    }

    private class AnthropicUsage
    {
        public int InputTokens { get; set; }
        public int OutputTokens { get; set; }
    }
}
