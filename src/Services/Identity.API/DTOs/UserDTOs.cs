using Sensormine.Core.Models;

namespace Identity.API.DTOs;

/// <summary>
/// DTO for user response
/// </summary>
public record UserResponse
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public bool IsSuperAdmin { get; init; }
    public string? SsoProvider { get; init; }
    public DateTimeOffset? LastLoginAt { get; init; }
    public string? PhoneNumber { get; init; }
    public bool MfaEnabled { get; init; }
    public string? AvatarUrl { get; init; }
    public string? PreferredLanguage { get; init; }
    public string? Timezone { get; init; }
    public string TenantId { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }

    public static UserResponse FromEntity(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role.ToString(),
        IsActive = user.IsActive,
        IsSuperAdmin = user.IsSuperAdmin,
        SsoProvider = user.SsoProvider,
        LastLoginAt = user.LastLoginAt,
        PhoneNumber = user.PhoneNumber,
        MfaEnabled = user.MfaEnabled,
        AvatarUrl = user.AvatarUrl,
        PreferredLanguage = user.PreferredLanguage,
        Timezone = user.Timezone,
        TenantId = user.TenantId,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}

/// <summary>
/// DTO for creating a new user
/// </summary>
public record CreateUserRequest
{
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = "Viewer";
    public string? Password { get; init; }
    public string? PhoneNumber { get; init; }
    public string? PreferredLanguage { get; init; }
    public string? Timezone { get; init; }
    public bool SendInvitation { get; init; } = true;
}

/// <summary>
/// DTO for updating a user
/// </summary>
public record UpdateUserRequest
{
    public string? FullName { get; init; }
    public string? Role { get; init; }
    public bool? IsActive { get; init; }
    public string? PhoneNumber { get; init; }
    public bool? MfaEnabled { get; init; }
    public string? AvatarUrl { get; init; }
    public string? PreferredLanguage { get; init; }
    public string? Timezone { get; init; }
}

/// <summary>
/// DTO for changing user password
/// </summary>
public record ChangePasswordRequest
{
    public string CurrentPassword { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}

/// <summary>
/// DTO for user list response with pagination
/// </summary>
public record UserListResponse
{
    public List<UserResponse> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
