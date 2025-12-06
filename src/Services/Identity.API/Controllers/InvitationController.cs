using System.Security.Cryptography;
using Identity.API.DTOs;
using Identity.API.Repositories;
using Identity.API.Services;
using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;

namespace Identity.API.Controllers;

/// <summary>
/// Controller for user invitation operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class InvitationController : ControllerBase
{
    private readonly IUserInvitationRepository _invitationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<InvitationController> _logger;

    public InvitationController(
        IUserInvitationRepository invitationRepository,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITenantContext tenantContext,
        ILogger<InvitationController> logger)
    {
        _invitationRepository = invitationRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Get all invitations in the tenant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<InvitationListResponse>> GetInvitations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        
        InvitationStatus? statusFilter = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InvitationStatus>(status, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var (items, totalCount) = await _invitationRepository.GetAllAsync(
            tenantId, page, pageSize, statusFilter, cancellationToken);

        var response = new InvitationListResponse
        {
            Items = items.Select(InvitationResponse.FromEntity).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    /// <summary>
    /// Get a specific invitation by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<InvitationResponse>> GetInvitation(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var invitation = await _invitationRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found" });
        }

        return Ok(InvitationResponse.FromEntity(invitation));
    }

    /// <summary>
    /// Create a new invitation
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<InvitationResponse>> CreateInvitation(
        [FromBody] CreateInvitationRequest request,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var currentUserId = _tenantContext.GetUserId();
        
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        // Check if user already exists
        if (await _userRepository.EmailExistsAsync(request.Email, tenantId, cancellationToken: cancellationToken))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        // Check if there's already a pending invitation
        var existingInvitation = await _invitationRepository.GetByEmailAsync(
            request.Email, tenantId, InvitationStatus.Pending, cancellationToken);

        if (existingInvitation != null)
        {
            return BadRequest(new { message = "Pending invitation already exists for this email" });
        }

        // Parse role
        if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
        {
            return BadRequest(new { message = "Invalid role" });
        }

        // Get inviter info
        var inviter = await _userRepository.GetByIdAsync(Guid.Parse(currentUserId), tenantId, cancellationToken);
        if (inviter == null)
        {
            return BadRequest(new { message = "Inviter not found" });
        }

        // Create invitation
        var invitation = new UserInvitation
        {
            TenantId = tenantId,
            Email = request.Email,
            Role = userRole,
            InvitedBy = inviter.Id,
            InvitedByName = inviter.FullName,
            Token = GenerateSecureToken(),
            Status = InvitationStatus.Pending,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(request.ExpiryDays),
            Message = request.Message
        };

        var createdInvitation = await _invitationRepository.CreateAsync(invitation, cancellationToken);
        _logger.LogInformation("Invitation {InvitationId} created for {Email} by {InviterId}", 
            createdInvitation.Id, request.Email, currentUserId);

        // TODO: Send invitation email here

        return CreatedAtAction(nameof(GetInvitation), new { id = createdInvitation.Id }, 
            InvitationResponse.FromEntity(createdInvitation));
    }

    /// <summary>
    /// Accept an invitation and create user account
    /// </summary>
    [HttpPost("accept")]
    public async Task<ActionResult<UserResponse>> AcceptInvitation(
        [FromBody] AcceptInvitationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Get invitation by token
        var invitation = await _invitationRepository.GetByTokenAsync(request.Token, cancellationToken);

        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found" });
        }

        if (invitation.Status != InvitationStatus.Pending)
        {
            return BadRequest(new { message = $"Invitation is {invitation.Status.ToString().ToLower()}" });
        }

        if (invitation.ExpiresAt < DateTimeOffset.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await _invitationRepository.UpdateAsync(invitation, cancellationToken);
            return BadRequest(new { message = "Invitation has expired" });
        }

        // Check if user already exists
        if (await _userRepository.EmailExistsAsync(invitation.Email, invitation.TenantId, cancellationToken: cancellationToken))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        // Create user
        var user = new User
        {
            TenantId = invitation.TenantId,
            Email = invitation.Email,
            FullName = request.FullName,
            Role = invitation.Role,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            PhoneNumber = request.PhoneNumber,
            PreferredLanguage = request.PreferredLanguage,
            Timezone = request.Timezone,
            IsActive = true,
            MustChangePassword = false
        };

        var createdUser = await _userRepository.CreateAsync(user, cancellationToken);

        // Update invitation status
        invitation.Status = InvitationStatus.Accepted;
        invitation.AcceptedAt = DateTimeOffset.UtcNow;
        invitation.AcceptedUserId = createdUser.Id;
        await _invitationRepository.UpdateAsync(invitation, cancellationToken);

        _logger.LogInformation("Invitation {InvitationId} accepted, user {UserId} created", 
            invitation.Id, createdUser.Id);

        return Ok(UserResponse.FromEntity(createdUser));
    }

    /// <summary>
    /// Cancel an invitation
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelInvitation(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var invitation = await _invitationRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found" });
        }

        if (invitation.Status != InvitationStatus.Pending)
        {
            return BadRequest(new { message = $"Cannot cancel invitation with status {invitation.Status}" });
        }

        invitation.Status = InvitationStatus.Cancelled;
        await _invitationRepository.UpdateAsync(invitation, cancellationToken);

        _logger.LogInformation("Invitation {InvitationId} cancelled by {UserId}", id, _tenantContext.GetUserId());

        return Ok(new { message = "Invitation cancelled successfully" });
    }

    /// <summary>
    /// Resend an invitation (creates a new token with extended expiry)
    /// </summary>
    [HttpPost("{id}/resend")]
    public async Task<ActionResult<InvitationResponse>> ResendInvitation(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var invitation = await _invitationRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found" });
        }

        if (invitation.Status != InvitationStatus.Pending && invitation.Status != InvitationStatus.Expired)
        {
            return BadRequest(new { message = $"Cannot resend invitation with status {invitation.Status}" });
        }

        // Update invitation with new token and expiry
        invitation.Token = GenerateSecureToken();
        invitation.Status = InvitationStatus.Pending;
        invitation.ExpiresAt = DateTimeOffset.UtcNow.AddDays(7);

        var updatedInvitation = await _invitationRepository.UpdateAsync(invitation, cancellationToken);

        _logger.LogInformation("Invitation {InvitationId} resent by {UserId}", id, _tenantContext.GetUserId());

        // TODO: Send invitation email here

        return Ok(InvitationResponse.FromEntity(updatedInvitation));
    }

    /// <summary>
    /// Delete an invitation
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvitation(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var invitation = await _invitationRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found" });
        }

        await _invitationRepository.DeleteAsync(id, tenantId, cancellationToken);
        _logger.LogInformation("Invitation {InvitationId} deleted by {UserId}", id, _tenantContext.GetUserId());

        return NoContent();
    }

    /// <summary>
    /// Generates a secure random token for invitations
    /// </summary>
    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }
}
