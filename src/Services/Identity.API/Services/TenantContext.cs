using System.Security.Claims;

namespace Identity.API.Services;

/// <summary>
/// Service for resolving current tenant context from HTTP headers or JWT claims
/// </summary>
public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<TenantContext> _logger;

    public TenantContext(IHttpContextAccessor httpContextAccessor, ILogger<TenantContext> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public string GetTenantId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            _logger.LogWarning("HTTP context is null, using default tenant");
            return "00000000-0000-0000-0000-000000000001"; // Default tenant
        }

        // Try to get from JWT claims first
        var tenantIdClaim = httpContext.User.FindFirst("tenant_id")?.Value
                         ?? httpContext.User.FindFirst("http://schemas.sensormine.com/claims/tenantid")?.Value;

        if (!string.IsNullOrEmpty(tenantIdClaim))
        {
            return tenantIdClaim;
        }

        // Fall back to header
        var headerValue = httpContext.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(headerValue))
        {
            return headerValue;
        }

        _logger.LogWarning("No tenant ID found in claims or headers, using default tenant");
        return "00000000-0000-0000-0000-000000000001"; // Default tenant
    }

    public string? GetUserId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return null;
        }

        // Try standard claim types
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? httpContext.User.FindFirst("sub")?.Value
                  ?? httpContext.User.FindFirst("user_id")?.Value
                  ?? httpContext.User.FindFirst("http://schemas.sensormine.com/claims/userid")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            return userId;
        }

        // Fall back to header
        var headerValue = httpContext.Request.Headers["X-User-Id"].FirstOrDefault();
        return headerValue;
    }

    public string? GetUserRole()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return null;
        }

        return httpContext.User.FindFirst(ClaimTypes.Role)?.Value
            ?? httpContext.User.FindFirst("role")?.Value
            ?? httpContext.User.FindFirst("http://schemas.sensormine.com/claims/role")?.Value;
    }

    public bool IsSuperAdmin()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return false;
        }

        var isSuperAdminClaim = httpContext.User.FindFirst("is_super_admin")?.Value
                             ?? httpContext.User.FindFirst("http://schemas.sensormine.com/claims/issuperadmin")?.Value;

        return bool.TryParse(isSuperAdminClaim, out var isSuperAdmin) && isSuperAdmin;
    }
}
