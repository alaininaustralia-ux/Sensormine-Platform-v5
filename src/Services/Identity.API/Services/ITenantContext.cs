namespace Identity.API.Services;

/// <summary>
/// Service for resolving current tenant context
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// Gets the current tenant ID from the request context
    /// </summary>
    string GetTenantId();

    /// <summary>
    /// Gets the current user ID from the request context
    /// </summary>
    string? GetUserId();

    /// <summary>
    /// Gets the current user's role
    /// </summary>
    string? GetUserRole();

    /// <summary>
    /// Checks if the current user is a super admin
    /// </summary>
    bool IsSuperAdmin();
}
