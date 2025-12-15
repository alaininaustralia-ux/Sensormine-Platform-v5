using AI.API.Models;
using AI.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AI.API.Controllers;

/// <summary>
/// Manages AI conversation persistence
/// </summary>
[ApiController]
[Route("api/conversations")]
public class ConversationsController : ControllerBase
{
    private readonly IConversationService _conversationService;
    private readonly ILogger<ConversationsController> _logger;

    public ConversationsController(IConversationService conversationService, ILogger<ConversationsController> logger)
    {
        _conversationService = conversationService;
        _logger = logger;
    }

    /// <summary>
    /// List all conversations for the current user
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListConversations([FromQuery] bool includeArchived = false)
    {
        var userId = GetUserId();
        var conversations = await _conversationService.ListConversationsAsync(userId, includeArchived);
        return Ok(conversations);
    }

    /// <summary>
    /// Get a specific conversation with all messages
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetConversation(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var conversation = await _conversationService.GetConversationAsync(id, userId);
            return Ok(conversation);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new conversation
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request)
    {
        var userId = GetUserId();
        var tenantId = GetTenantId();
        
        var conversation = await _conversationService.CreateConversationAsync(userId, tenantId, request.Title);
        return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
    }

    /// <summary>
    /// Update conversation (rename or archive)
    /// </summary>
    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateConversation(Guid id, [FromBody] UpdateConversationRequest request)
    {
        var userId = GetUserId();
        await _conversationService.UpdateConversationAsync(id, userId, request);
        return NoContent();
    }

    /// <summary>
    /// Delete a conversation permanently
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteConversation(Guid id)
    {
        var userId = GetUserId();
        await _conversationService.DeleteConversationAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// Add a message to an existing conversation
    /// </summary>
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> AddMessage(Guid id, [FromBody] AddMessageRequest request)
    {
        try
        {
            var userId = GetUserId();
            var message = await _conversationService.AddMessageAsync(id, userId, request);
            return Ok(message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Process a query within a conversation context
    /// </summary>
    [HttpPost("query")]
    public async Task<IActionResult> QueryWithConversation([FromBody] ConversationQueryRequest request)
    {
        var userId = GetUserId();
        var tenantId = GetTenantId();
        
        try
        {
            var response = await _conversationService.ProcessQueryWithConversationAsync(userId, tenantId, request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing query with conversation");
            return StatusCode(500, new { error = $"Failed to process query: {ex.Message}" });
        }
    }

    private Guid GetUserId()
    {
        // TODO: Extract from JWT claims when auth is fully implemented
        // For now, use header or default test user
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        return !string.IsNullOrEmpty(userIdHeader) && Guid.TryParse(userIdHeader, out var userId)
            ? userId
            : Guid.Parse("7fb8760b-623d-40d9-8da0-90017ee53695"); // Default test user
    }

    private Guid GetTenantId()
    {
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdHeader))
            throw new InvalidOperationException("X-Tenant-Id header is required");
        
        return Guid.Parse(tenantIdHeader);
    }
}
