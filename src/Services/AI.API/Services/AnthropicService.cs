using System.Text;
using System.Text.Json;

namespace AI.API.Services;

/// <summary>
/// Service for interacting with the Anthropic Claude API
/// </summary>
public class AnthropicService : IAnthropicService
{
    private readonly HttpClient _httpClient;
    private readonly string _model;
    private readonly int _maxTokens;
    private readonly ILogger<AnthropicService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="AnthropicService"/> class
    /// </summary>
    public AnthropicService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<AnthropicService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"] 
            ?? throw new InvalidOperationException("Anthropic API key not configured");
        
        _model = configuration["Anthropic:Model"] ?? "claude-sonnet-4-20250514";
        _maxTokens = configuration.GetValue<int>("Anthropic:MaxTokens", 4096);
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _logger = logger;
    }

    /// <summary>
    /// Generates a response from Claude based on the system prompt and user message
    /// </summary>
    public async Task<string> GenerateResponseAsync(string systemPrompt, string userMessage)
    {
        try
        {
            var requestBody = new
            {
                model = _model,
                max_tokens = _maxTokens,
                temperature = 0.0m,
                system = systemPrompt,
                messages = new[]
                {
                    new { role = "user", content = userMessage }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("https://api.anthropic.com/v1/messages", content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            
            var contentArray = doc.RootElement.GetProperty("content");
            foreach (var item in contentArray.EnumerateArray())
            {
                if (item.GetProperty("type").GetString() == "text")
                {
                    return item.GetProperty("text").GetString() ?? "No response generated";
                }
            }

            return "No response generated";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Anthropic API");
            throw;
        }
    }

    /// <summary>
    /// Generates a response with tool use support (multi-turn conversation)
    /// </summary>
    public async Task<AnthropicResponse> GenerateWithToolsAsync(string systemPrompt, List<AnthropicMessage> messages, List<AnthropicTool> tools)
    {
        try
        {
            var requestBody = new
            {
                model = _model,
                max_tokens = _maxTokens,
                temperature = 0.0m,
                system = systemPrompt,
                messages = messages.Select(m => new
                {
                    role = m.Role,
                    content = m.Content.Select(c =>
                    {
                        if (c.Type == "text")
                            return (object)new { type = "text", text = c.Text };
                        else if (c.Type == "tool_use")
                            return (object)new { type = "tool_use", id = c.Id, name = c.Name, input = c.Input };
                        else if (c.Type == "tool_result")
                            return (object)new { type = "tool_result", tool_use_id = c.ToolUseId, content = c.Content };
                        return (object)new { type = c.Type };
                    }).ToList()
                }).ToList(),
                tools = tools.Select(t => new
                {
                    name = t.Name,
                    description = t.Description,
                    input_schema = t.InputSchema
                }).ToList()
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("https://api.anthropic.com/v1/messages", content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Anthropic API response: {Response}", responseJson);
            
            using var doc = JsonDocument.Parse(responseJson);
            
            var stopReason = doc.RootElement.GetProperty("stop_reason").GetString() ?? "end_turn";
            var contentArray = doc.RootElement.GetProperty("content");
            var contentBlocks = new List<ContentBlock>();

            foreach (var item in contentArray.EnumerateArray())
            {
                var type = item.GetProperty("type").GetString();
                
                if (type == "text")
                {
                    contentBlocks.Add(new ContentBlock
                    {
                        Type = "text",
                        Text = item.GetProperty("text").GetString()
                    });
                }
                else if (type == "tool_use")
                {
                    var inputElement = item.GetProperty("input");
                    var inputDict = JsonSerializer.Deserialize<Dictionary<string, object>>(inputElement.GetRawText());
                    
                    contentBlocks.Add(new ContentBlock
                    {
                        Type = "tool_use",
                        Id = item.GetProperty("id").GetString(),
                        Name = item.GetProperty("name").GetString(),
                        Input = inputDict
                    });
                }
            }

            return new AnthropicResponse
            {
                StopReason = stopReason,
                Content = contentBlocks
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Anthropic API with tools");
            throw;
        }
    }
}
