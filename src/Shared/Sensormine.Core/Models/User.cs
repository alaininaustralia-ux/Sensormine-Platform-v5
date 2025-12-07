namespace Sensormine.Core.Models;

/// <summary>
/// Represents a user in the system with role-based access control
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// User's email address (used for login)
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Hashed password (Argon2)
    /// </summary>
    public string? PasswordHash { get; set; }

    /// <summary>
    /// User's role determining their permissions
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Viewer;

    /// <summary>
    /// Whether the user account is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether the user is a super administrator (cross-tenant access)
    /// </summary>
    public bool IsSuperAdmin { get; set; } = false;

    /// <summary>
    /// SSO provider identifier (null for local accounts)
    /// </summary>
    public string? SsoProvider { get; set; }

    /// <summary>
    /// External SSO user identifier
    /// </summary>
    public string? SsoUserId { get; set; }

    /// <summary>
    /// Last successful login timestamp
    /// </summary>
    public DateTimeOffset? LastLoginAt { get; set; }

    /// <summary>
    /// Account lockout timestamp (null if not locked)
    /// </summary>
    public DateTimeOffset? LockedOutUntil { get; set; }

    /// <summary>
    /// Failed login attempt count
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// Whether the user must change password on next login
    /// </summary>
    public bool MustChangePassword { get; set; } = false;

    /// <summary>
    /// User preferences and metadata
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();

    /// <summary>
    /// Phone number for MFA
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Whether MFA is enabled
    /// </summary>
    public bool MfaEnabled { get; set; } = false;

    /// <summary>
    /// Avatar/profile picture URL
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// Preferred language/locale
    /// </summary>
    public string? PreferredLanguage { get; set; }

    /// <summary>
    /// Timezone for the user
    /// </summary>
    public string? Timezone { get; set; }
}

/// <summary>
/// User roles with hierarchical permissions
/// </summary>
public enum UserRole
{
    /// <summary>
    /// View-only access to dashboards and data
    /// </summary>
    Viewer = 0,

    /// <summary>
    /// Can edit dashboards and configure visualizations
    /// </summary>
    DashboardEditor = 1,

    /// <summary>
    /// Full administrative access to tenant resources
    /// </summary>
    Administrator = 2
}
