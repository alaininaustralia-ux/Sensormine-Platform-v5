using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;
using NexusConfiguration.API.DTOs;
using Sensormine.AI.Services;
using System.Text;
using System.Text.Json;

namespace NexusConfiguration.API.Services;

public class CustomLogicService : ICustomLogicService
{
    private readonly HttpClient _httpClient;
    private readonly IAiMeteringService _meteringService;
    private readonly ILogger<CustomLogicService> _logger;
    private readonly string _apiKey;
    private const string MODEL_NAME = "claude-haiku-4-5";
    private const string ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    public CustomLogicService(
        IHttpClientFactory httpClientFactory,
        IAiMeteringService meteringService,
        IConfiguration configuration,
        ILogger<CustomLogicService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _meteringService = meteringService;
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

            // Track AI usage
            var duration = DateTime.UtcNow - startTime;
            await _meteringService.TrackUsageAsync(new Sensormine.AI.Models.AiUsageEvent
            {
                TenantId = tenantId,
                UserId = userId,
                Model = MODEL_NAME,
                Operation = "custom_logic_generation",
                InputTokens = response?.Usage?.InputTokens ?? 0,
                OutputTokens = response?.Usage?.OutputTokens ?? 0,
                TotalTokens = (response?.Usage?.InputTokens ?? 0) + (response?.Usage?.OutputTokens ?? 0),
                DurationMs = (int)duration.TotalMilliseconds,
                Success = true,
                Timestamp = DateTime.UtcNow
            });

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

            // Track failed AI usage
            var duration = DateTime.UtcNow - startTime;
            await _meteringService.TrackUsageAsync(new Sensormine.AI.Models.AiUsageEvent
            {
                TenantId = tenantId,
                UserId = userId,
                Model = MODEL_NAME,
                Operation = "custom_logic_generation",
                DurationMs = (int)duration.TotalMilliseconds,
                Success = false,
                ErrorMessage = ex.Message,
                Timestamp = DateTime.UtcNow
            });

            return new GenerateCustomLogicResponse
            {
                Success = false,
                ErrorMessage = $"Error generating custom logic: {ex.Message}"
            };
        }
    }

    public async Task<ValidateCustomLogicResponse> ValidateLogicAsync(ValidateCustomLogicRequest request)
    {
        try
        {
            _logger.LogInformation("Validating custom logic ({Language})", request.Language);

            if (request.Language.ToLower() == "csharp")
            {
                return await ValidateCSharpCodeAsync(request.Code);
            }
            else
            {
                return new ValidateCustomLogicResponse
                {
                    IsValid = true,
                    Warnings = new List<string> { $"Validation not implemented for {request.Language}. Assuming valid." }
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating custom logic");
            
            return new ValidateCustomLogicResponse
            {
                IsValid = false,
                Errors = new List<string> { $"Validation error: {ex.Message}" }
            };
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

    private async Task<ValidateCustomLogicResponse> ValidateCSharpCodeAsync(string code)
    {
        var errors = new List<string>();
        var warnings = new List<string>();

        try
        {
            // Parse the code to check for syntax errors
            var syntaxTree = CSharpSyntaxTree.ParseText(code);
            var diagnostics = syntaxTree.GetDiagnostics();

            foreach (var diagnostic in diagnostics)
            {
                if (diagnostic.Severity == DiagnosticSeverity.Error)
                {
                    errors.Add($"Line {diagnostic.Location.GetLineSpan().StartLinePosition.Line + 1}: {diagnostic.GetMessage()}");
                }
                else if (diagnostic.Severity == DiagnosticSeverity.Warning)
                {
                    warnings.Add($"Line {diagnostic.Location.GetLineSpan().StartLinePosition.Line + 1}: {diagnostic.GetMessage()}");
                }
            }

            // Try to compile the code
            if (errors.Count == 0)
            {
                try
                {
                    var options = ScriptOptions.Default
                        .AddReferences(typeof(object).Assembly, typeof(Console).Assembly, typeof(Dictionary<,>).Assembly)
                        .AddImports("System", "System.Collections.Generic", "System.Linq");

                    var script = CSharpScript.Create(code, options);
                    var compilation = script.GetCompilation();
                    var compilationDiagnostics = compilation.GetDiagnostics();

                    foreach (var diagnostic in compilationDiagnostics)
                    {
                        if (diagnostic.Severity == DiagnosticSeverity.Error)
                        {
                            errors.Add(diagnostic.GetMessage());
                        }
                        else if (diagnostic.Severity == DiagnosticSeverity.Warning)
                        {
                            warnings.Add(diagnostic.GetMessage());
                        }
                    }
                }
                catch (Exception ex)
                {
                    errors.Add($"Compilation error: {ex.Message}");
                }
            }

            return new ValidateCustomLogicResponse
            {
                IsValid = errors.Count == 0,
                Errors = errors,
                Warnings = warnings
            };
        }
        catch (Exception ex)
        {
            return new ValidateCustomLogicResponse
            {
                IsValid = false,
                Errors = new List<string> { $"Validation exception: {ex.Message}" }
            };
        }

        await Task.CompletedTask; // Make async
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
