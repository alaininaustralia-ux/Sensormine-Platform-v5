namespace Sensormine.Core.Models;

/// <summary>
/// Represents a user invitation for onboarding new users
/// </summary>
public class UserInvitation : BaseEntity
{
    /// <summary>
    /// Override TenantId as string (Identity tables use TEXT not UUID)
    /// </summary>
    public new string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the invited user
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Role that will be assigned when user accepts invitation
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Viewer;

    /// <summary>
    /// User ID of the person who sent the invitation
    /// </summary>
    public Guid InvitedBy { get; set; }

    /// <summary>
    /// Name of the person who sent the invitation (denormalized for display)
    /// </summary>
    public string InvitedByName { get; set; } = string.Empty;

    /// <summary>
    /// Invitation token (secure random string)
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Status of the invitation
    /// </summary>
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    /// <summary>
    /// When the invitation expires
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// When the invitation was accepted
    /// </summary>
    public DateTimeOffset? AcceptedAt { get; set; }

    /// <summary>
    /// User ID created when invitation was accepted
    /// </summary>
    public Guid? AcceptedUserId { get; set; }

    /// <summary>
    /// Optional message from the inviter
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Custom metadata for the invitation
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}

/// <summary>
/// Status of a user invitation
/// </summary>
public enum InvitationStatus
{
    /// <summary>
    /// Invitation sent, waiting for acceptance
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Invitation accepted and user created
    /// </summary>
    Accepted = 1,

    /// <summary>
    /// Invitation expired without acceptance
    /// </summary>
    Expired = 2,

    /// <summary>
    /// Invitation cancelled by administrator
    /// </summary>
    Cancelled = 3,

    /// <summary>
    /// Invitation was rejected by the recipient
    /// </summary>
    Rejected = 4
}
