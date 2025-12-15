using System.Text.Json;

namespace AI.API.Models;

/// <summary>
/// AI conversation entity
/// </summary>
public class AiConversation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public required string Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsArchived { get; set; }
    
    public List<AiMessage> Messages { get; set; } = new();
}

/// <summary>
/// AI message entity
/// </summary>
public class AiMessage
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public required string Role { get; set; } // "user" or "assistant"
    public required string Content { get; set; }
    public List<string>? ToolsCalled { get; set; }
    public ChartData? ChartData { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Create conversation request
/// </summary>
public class CreateConversationRequest
{
    public required string Title { get; set; }
}

/// <summary>
/// Update conversation request
/// </summary>
public class UpdateConversationRequest
{
    public string? Title { get; set; }
    public bool? IsArchived { get; set; }
}

/// <summary>
/// Add message to conversation request
/// </summary>
public class AddMessageRequest
{
    public required string Role { get; set; }
    public required string Content { get; set; }
    public List<string>? ToolsCalled { get; set; }
    public ChartData? ChartData { get; set; }
}

/// <summary>
/// Conversation list item DTO
/// </summary>
public class ConversationListItem
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MessageCount { get; set; }
    public string? LastMessage { get; set; }
}

/// <summary>
/// Conversation details DTO with messages
/// </summary>
public class ConversationDetails
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<AiMessage> Messages { get; set; } = new();
}

/// <summary>
/// Query conversation with context
/// </summary>
public class ConversationQueryRequest
{
    public Guid? ConversationId { get; set; }
    public required string Query { get; set; }
}
