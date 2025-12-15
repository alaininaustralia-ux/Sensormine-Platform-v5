using AI.API.Models;

namespace AI.API.Services;

/// <summary>
/// Service for managing AI conversation persistence
/// </summary>
public interface IConversationService
{
    Task<ConversationDetails> CreateConversationAsync(Guid userId, Guid tenantId, string title);
    Task<ConversationDetails> GetConversationAsync(Guid conversationId, Guid userId);
    Task<List<ConversationListItem>> ListConversationsAsync(Guid userId, bool includeArchived = false);
    Task UpdateConversationAsync(Guid conversationId, Guid userId, UpdateConversationRequest request);
    Task DeleteConversationAsync(Guid conversationId, Guid userId);
    Task<AiMessage> AddMessageAsync(Guid conversationId, Guid userId, AddMessageRequest message);
    Task<AiQueryResponse> ProcessQueryWithConversationAsync(Guid userId, Guid tenantId, ConversationQueryRequest request);
}
