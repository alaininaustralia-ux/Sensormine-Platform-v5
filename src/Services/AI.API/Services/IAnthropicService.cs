namespace AI.API.Services;

public interface IAnthropicService
{
    Task<string> GenerateResponseAsync(string systemPrompt, string userMessage);
    Task<AnthropicResponse> GenerateWithToolsAsync(string systemPrompt, List<AnthropicMessage> messages, List<AnthropicTool> tools);
}

public class AnthropicMessage
{
    public required string Role { get; set; } // "user" or "assistant"
    public required List<ContentBlock> Content { get; set; }
}

public class ContentBlock
{
    public required string Type { get; set; } // "text" or "tool_use" or "tool_result"
    public string? Text { get; set; }
    public string? Id { get; set; }
    public string? Name { get; set; }
    public object? Input { get; set; }
    public string? ToolUseId { get; set; }
    public object? Content { get; set; }
}

public class AnthropicTool
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required object InputSchema { get; set; }
}

public class AnthropicResponse
{
    public required string StopReason { get; set; } // "end_turn", "tool_use", "max_tokens"
    public required List<ContentBlock> Content { get; set; }
}
