using Sensormine.Core.Models;

namespace Identity.API.DTOs;

/// <summary>
/// DTO for user invitation response
/// </summary>
public record InvitationResponse
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public Guid InvitedBy { get; init; }
    public string InvitedByName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; init; }
    public DateTimeOffset? AcceptedAt { get; init; }
    public string? Message { get; init; }
    public string TenantId { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }

    public static InvitationResponse FromEntity(UserInvitation invitation) => new()
    {
        Id = invitation.Id,
        Email = invitation.Email,
        Role = invitation.Role.ToString(),
        InvitedBy = invitation.InvitedBy,
        InvitedByName = invitation.InvitedByName,
        Status = invitation.Status.ToString(),
        ExpiresAt = invitation.ExpiresAt,
        AcceptedAt = invitation.AcceptedAt,
        Message = invitation.Message,
        TenantId = invitation.TenantId,
        CreatedAt = invitation.CreatedAt
    };
}

/// <summary>
/// DTO for creating a new invitation
/// </summary>
public record CreateInvitationRequest
{
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = "Viewer";
    public string? Message { get; init; }
    public int ExpiryDays { get; init; } = 7;
}

/// <summary>
/// DTO for accepting an invitation
/// </summary>
public record AcceptInvitationRequest
{
    public string Token { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public string? PreferredLanguage { get; init; }
    public string? Timezone { get; init; }
}

/// <summary>
/// DTO for invitation list response with pagination
/// </summary>
public record InvitationListResponse
{
    public List<InvitationResponse> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

/// <summary>
/// DTO for resending an invitation
/// </summary>
public record ResendInvitationRequest
{
    public Guid InvitationId { get; init; }
}
