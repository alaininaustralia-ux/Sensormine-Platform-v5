using NexusConfiguration.API.DTOs;
using System.Text;
using System.Text.Json;

namespace NexusConfiguration.API.Services;

public class CustomLogicService : ICustomLogicService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CustomLogicService> _logger;
    private readonly string _apiKey;
    private const string MODEL_NAME = "claude-haiku-4-5";
    private const string ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    public CustomLogicService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<CustomLogicService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
        _apiKey = configuration["Anthropic:ApiKey"] ?? "";
        
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    }

    public async Task<GenerateCustomLogicResponse> GenerateLogicAsync(
        GenerateCustomLogicRequest request,
        Guid tenantId,
        string? userId = null)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            _logger.LogInformation("Generating custom logic for prompt: {Prompt}", request.Prompt);

            // Build prompt for Claude
            var prompt = BuildLogicGenerationPrompt(request);

            // Call Claude API
            var requestBody = new
            {
                model = MODEL_NAME,
                max_tokens = 4096,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.2
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
                "Custom logic generation completed - TenantId: {TenantId}, Model: {Model}, Duration: {Duration}ms, InputTokens: {InputTokens}, OutputTokens: {OutputTokens}",
                tenantId, MODEL_NAME, duration.TotalMilliseconds, inputTokens, outputTokens);

            // Parse Claude's response
            var contentText = response?.Content?.FirstOrDefault()?.Text ?? string.Empty;
            var (code, explanation, suggestions) = ParseLogicResponse(contentText);

            return new GenerateCustomLogicResponse
            {
                Success = true,
                GeneratedCode = code,
                Explanation = explanation,
                Suggestions = suggestions,
                TokensUsed = (response?.Usage?.InputTokens ?? 0) + (response?.Usage?.OutputTokens ?? 0)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating custom logic");

            // Log failed AI usage
            var duration = DateTime.UtcNow - startTime;
            _logger.LogError(ex,
                "Custom logic generation failed - TenantId: {TenantId}, Model: {Model}, Duration: {Duration}ms",
                tenantId, MODEL_NAME, duration.TotalMilliseconds);

            return new GenerateCustomLogicResponse
            {
                Success = false,
                ErrorMessage = $"Error generating custom logic: {ex.Message}"
            };
        }
    }

    public Task<ValidateCustomLogicResponse> ValidateLogicAsync(ValidateCustomLogicRequest request)
    {
        try
        {
            _logger.LogInformation("Validating custom logic ({Language})", request.Language);

            // Simple validation - check for common syntax issues
            var warnings = new List<string>();
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                errors.Add("Code cannot be empty");
            }

            if (request.Language.ToLower() == "csharp")
            {
                // Basic C# syntax checks
                if (!request.Code.Contains("return") && !request.Code.Contains("=>"))
                {
                    warnings.Add("Code may not return a value");
                }
                
                // Count braces
                var openBraces = request.Code.Count(c => c == '{');
                var closeBraces = request.Code.Count(c => c == '}');
                if (openBraces != closeBraces)
                {
                    errors.Add($"Mismatched braces: {openBraces} opening vs {closeBraces} closing");
                }

                // Check for common keywords
                if (request.Code.Contains("Dictionary") && !request.Code.Contains("using System.Collections.Generic"))
                {
                    warnings.Add("May need 'using System.Collections.Generic;' directive");
                }
            }

            return Task.FromResult(new ValidateCustomLogicResponse
            {
                IsValid = errors.Count == 0,
                Errors = errors,
                Warnings = warnings
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating custom logic");
            
            return Task.FromResult(new ValidateCustomLogicResponse
            {
                IsValid = false,
                Errors = new List<string> { $"Validation error: {ex.Message}" }
            });
        }
    }

    private string BuildLogicGenerationPrompt(GenerateCustomLogicRequest request)
    {
        var probesInfo = request.ProbeConfigurations != null
            ? JsonSerializer.Serialize(request.ProbeConfigurations, new JsonSerializerOptions { WriteIndented = true })
            : "No probe configurations provided";

        var existingLogic = !string.IsNullOrEmpty(request.ExistingLogic)
            ? $"\n\nExisting Logic:\n```{request.Language}\n{request.ExistingLogic}\n```"
            : "";

        return $@"You are an expert software engineer specializing in industrial IoT systems.
Generate {request.Language} code for a custom data transformation or business logic function.

User Request:
{request.Prompt}

Available Probe Configurations:
{probesInfo}
{existingLogic}

Requirements:
1. Write clean, production-ready {request.Language} code
2. Include proper error handling
3. Add comments explaining the logic
4. Use the probe configurations to access sensor data
5. Return a function that can be executed in an IoT data pipeline

For C#, create a function with signature:
```csharp
public static Dictionary<string, object> Transform(Dictionary<string, object> input)
{{
    // Your logic here
    return output;
}}
```

Return your response in this format:
CODE:
```{request.Language}
<your code here>
```

EXPLANATION:
<explain what the code does>

SUGGESTIONS:
- <suggestion 1>
- <suggestion 2>
";
    }

    private (string code, string explanation, List<string> suggestions) ParseLogicResponse(string response)
    {
        var code = "";
        var explanation = "";
        var suggestions = new List<string>();

        // Extract code block
        var codeStart = response.IndexOf("```");
        if (codeStart != -1)
        {
            var codeBlockStart = response.IndexOf('\n', codeStart) + 1;
            var codeEnd = response.IndexOf("```", codeBlockStart);
            if (codeEnd != -1)
            {
                code = response.Substring(codeBlockStart, codeEnd - codeBlockStart).Trim();
            }
        }

        // Extract explanation
        var explanationMarker = "EXPLANATION:";
        var explanationStart = response.IndexOf(explanationMarker);
        if (explanationStart != -1)
        {
            var explanationTextStart = explanationStart + explanationMarker.Length;
            var suggestionsMarker = "SUGGESTIONS:";
            var suggestionsStart = response.IndexOf(suggestionsMarker, explanationTextStart);
            var explanationEnd = suggestionsStart != -1 ? suggestionsStart : response.Length;
            explanation = response.Substring(explanationTextStart, explanationEnd - explanationTextStart).Trim();
        }

        // Extract suggestions
        var suggestionsMarker2 = "SUGGESTIONS:";
        var suggestionsStart2 = response.IndexOf(suggestionsMarker2);
        if (suggestionsStart2 != -1)
        {
            var suggestionsText = response.Substring(suggestionsStart2 + suggestionsMarker2.Length).Trim();
            var lines = suggestionsText.Split('\n');
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("- "))
                {
                    suggestions.Add(trimmed.Substring(2));
                }
            }
        }

        return (code, explanation, suggestions);
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
