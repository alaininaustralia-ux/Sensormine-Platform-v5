using AI.API.Models;
using Npgsql;
using System.Text.Json;

namespace AI.API.Services;

/// <summary>
/// Service for managing AI conversation persistence
/// </summary>
public class ConversationService : IConversationService
{
    private readonly string _connectionString;
    private readonly IAiAgentService _aiAgentService;
    private readonly ILogger<ConversationService> _logger;

    public ConversationService(
        IConfiguration configuration,
        IAiAgentService aiAgentService,
        ILogger<ConversationService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("DefaultConnection not configured");
        _aiAgentService = aiAgentService;
        _logger = logger;
    }

    public async Task<ConversationDetails> CreateConversationAsync(Guid userId, Guid tenantId, string title)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        var conversationId = Guid.NewGuid();
        
        await using var cmd = new NpgsqlCommand(
            @"INSERT INTO ai_conversations (id, user_id, tenant_id, title, created_at, updated_at)
              VALUES (@id, @userId, @tenantId, @title, @now, @now)
              RETURNING id, title, created_at, updated_at",
            conn);
        
        var now = DateTime.UtcNow;
        cmd.Parameters.AddWithValue("id", conversationId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("tenantId", tenantId);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("now", now);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return new ConversationDetails
        {
            Id = reader.GetGuid(0),
            Title = reader.GetString(1),
            CreatedAt = reader.GetDateTime(2),
            UpdatedAt = reader.GetDateTime(3),
            Messages = new List<AiMessage>()
        };
    }

    public async Task<ConversationDetails> GetConversationAsync(Guid conversationId, Guid userId)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // Get conversation
        await using var convCmd = new NpgsqlCommand(
            @"SELECT id, title, created_at, updated_at 
              FROM ai_conversations 
              WHERE id = @id AND user_id = @userId AND is_archived = false",
            conn);
        
        convCmd.Parameters.AddWithValue("id", conversationId);
        convCmd.Parameters.AddWithValue("userId", userId);

        ConversationDetails? conversation = null;
        
        await using (var reader = await convCmd.ExecuteReaderAsync())
        {
            if (!await reader.ReadAsync())
                throw new InvalidOperationException("Conversation not found");

            conversation = new ConversationDetails
            {
                Id = reader.GetGuid(0),
                Title = reader.GetString(1),
                CreatedAt = reader.GetDateTime(2),
                UpdatedAt = reader.GetDateTime(3)
            };
        }

        // Get messages
        await using var msgCmd = new NpgsqlCommand(
            @"SELECT id, role, content, tools_called, chart_data, created_at
              FROM ai_messages 
              WHERE conversation_id = @conversationId 
              ORDER BY created_at ASC",
            conn);
        
        msgCmd.Parameters.AddWithValue("conversationId", conversationId);

        await using (var reader = await msgCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var message = new AiMessage
                {
                    Id = reader.GetGuid(0),
                    ConversationId = conversationId,
                    Role = reader.GetString(1),
                    Content = reader.GetString(2),
                    CreatedAt = reader.GetDateTime(5)
                };

                if (!reader.IsDBNull(3))
                {
                    var toolsJson = reader.GetString(3);
                    message.ToolsCalled = JsonSerializer.Deserialize<List<string>>(toolsJson);
                }

                if (!reader.IsDBNull(4))
                {
                    var chartJson = reader.GetString(4);
                    message.ChartData = JsonSerializer.Deserialize<ChartData>(chartJson);
                }

                conversation.Messages.Add(message);
            }
        }

        return conversation;
    }

    public async Task<List<ConversationListItem>> ListConversationsAsync(Guid userId, bool includeArchived = false)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        var sql = @"
            SELECT 
                c.id, 
                c.title, 
                c.created_at, 
                c.updated_at,
                COUNT(m.id) as message_count,
                (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM ai_conversations c
            LEFT JOIN ai_messages m ON m.conversation_id = c.id
            WHERE c.user_id = @userId";

        if (!includeArchived)
            sql += " AND c.is_archived = false";

        sql += " GROUP BY c.id, c.title, c.created_at, c.updated_at ORDER BY c.updated_at DESC";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);

        var conversations = new List<ConversationListItem>();
        
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            conversations.Add(new ConversationListItem
            {
                Id = reader.GetGuid(0),
                Title = reader.GetString(1),
                CreatedAt = reader.GetDateTime(2),
                UpdatedAt = reader.GetDateTime(3),
                MessageCount = Convert.ToInt32(reader.GetInt64(4)),
                LastMessage = reader.IsDBNull(5) ? null : reader.GetString(5)
            });
        }

        return conversations;
    }

    public async Task UpdateConversationAsync(Guid conversationId, Guid userId, UpdateConversationRequest request)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        var updates = new List<string>();
        var cmd = new NpgsqlCommand();
        cmd.Connection = conn;

        if (request.Title != null)
        {
            updates.Add("title = @title");
            cmd.Parameters.AddWithValue("title", request.Title);
        }

        if (request.IsArchived.HasValue)
        {
            updates.Add("is_archived = @isArchived");
            cmd.Parameters.AddWithValue("isArchived", request.IsArchived.Value);
        }

        if (updates.Any())
        {
            updates.Add("updated_at = @now");
            cmd.Parameters.AddWithValue("now", DateTime.UtcNow);
            cmd.Parameters.AddWithValue("id", conversationId);
            cmd.Parameters.AddWithValue("userId", userId);

            cmd.CommandText = $@"
                UPDATE ai_conversations 
                SET {string.Join(", ", updates)}
                WHERE id = @id AND user_id = @userId";

            await cmd.ExecuteNonQueryAsync();
        }
    }

    public async Task DeleteConversationAsync(Guid conversationId, Guid userId)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"DELETE FROM ai_conversations WHERE id = @id AND user_id = @userId",
            conn);
        
        cmd.Parameters.AddWithValue("id", conversationId);
        cmd.Parameters.AddWithValue("userId", userId);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<AiMessage> AddMessageAsync(Guid conversationId, Guid userId, AddMessageRequest message)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // Verify conversation belongs to user
        await using var verifyCmd = new NpgsqlCommand(
            "SELECT 1 FROM ai_conversations WHERE id = @id AND user_id = @userId",
            conn);
        verifyCmd.Parameters.AddWithValue("id", conversationId);
        verifyCmd.Parameters.AddWithValue("userId", userId);
        
        if (await verifyCmd.ExecuteScalarAsync() == null)
            throw new InvalidOperationException("Conversation not found");

        // Insert message
        var messageId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        await using var cmd = new NpgsqlCommand(
            @"INSERT INTO ai_messages (id, conversation_id, role, content, tools_called, chart_data, created_at)
              VALUES (@id, @conversationId, @role, @content, @toolsCalled, @chartData, @createdAt)
              RETURNING id, conversation_id, role, content, tools_called, chart_data, created_at",
            conn);

        cmd.Parameters.AddWithValue("id", messageId);
        cmd.Parameters.AddWithValue("conversationId", conversationId);
        cmd.Parameters.AddWithValue("role", message.Role);
        cmd.Parameters.AddWithValue("content", message.Content);
        cmd.Parameters.AddWithValue("toolsCalled", message.ToolsCalled != null 
            ? JsonSerializer.Serialize(message.ToolsCalled) 
            : DBNull.Value);
        cmd.Parameters.AddWithValue("chartData", message.ChartData != null 
            ? JsonSerializer.Serialize(message.ChartData) 
            : DBNull.Value);
        cmd.Parameters.AddWithValue("createdAt", now);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        // Update conversation updated_at
        await using var updateCmd = new NpgsqlCommand(
            "UPDATE ai_conversations SET updated_at = @now WHERE id = @id",
            conn);
        updateCmd.Parameters.AddWithValue("now", now);
        updateCmd.Parameters.AddWithValue("id", conversationId);
        await updateCmd.ExecuteNonQueryAsync();

        return new AiMessage
        {
            Id = messageId,
            ConversationId = conversationId,
            Role = message.Role,
            Content = message.Content,
            ToolsCalled = message.ToolsCalled,
            ChartData = message.ChartData,
            CreatedAt = now
        };
    }

    public async Task<AiQueryResponse> ProcessQueryWithConversationAsync(Guid userId, Guid tenantId, ConversationQueryRequest request)
    {
        // Create new conversation if not provided
        Guid conversationId;
        if (!request.ConversationId.HasValue)
        {
            var title = request.Query.Length > 50 
                ? request.Query.Substring(0, 50) + "..." 
                : request.Query;
            var conversation = await CreateConversationAsync(userId, tenantId, title);
            conversationId = conversation.Id;
        }
        else
        {
            conversationId = request.ConversationId.Value;
        }

        // Save user message
        await AddMessageAsync(conversationId, userId, new AddMessageRequest
        {
            Role = "user",
            Content = request.Query
        });

        // Process query
        var response = await _aiAgentService.ProcessQueryAsync(request.Query, tenantId.ToString());

        // Save assistant response
        await AddMessageAsync(conversationId, userId, new AddMessageRequest
        {
            Role = "assistant",
            Content = response.Response,
            ToolsCalled = response.ToolsCalled,
            ChartData = response.ChartData
        });

        // Add conversation ID to response
        return new AiQueryResponse
        {
            Response = response.Response,
            ChartData = response.ChartData,
            ToolsCalled = response.ToolsCalled,
            ConversationId = conversationId
        };
    }
}
