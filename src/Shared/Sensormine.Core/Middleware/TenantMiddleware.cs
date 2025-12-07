using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Sensormine.Core.Middleware;

/// <summary>
/// Middleware to extract and inject tenant context into HTTP requests
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Try to get tenant ID from JWT claims
        var tenantId = context.User.FindFirst("tenant_id")?.Value
                    ?? context.User.FindFirst("http://schemas.sensormine.com/claims/tenantid")?.Value;

        // Fall back to header
        if (string.IsNullOrEmpty(tenantId))
        {
            tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        }

        // Default tenant for development
        if (string.IsNullOrEmpty(tenantId))
        {
            tenantId = "00000000-0000-0000-0000-000000000001";
            _logger.LogWarning("No tenant ID found in request, using default tenant: {TenantId}", tenantId);
        }

        // Store in HTTP context items for later retrieval
        context.Items["TenantId"] = tenantId;

        // Also extract user ID if available
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? context.User.FindFirst("sub")?.Value
                  ?? context.User.FindFirst("user_id")?.Value
                  ?? context.Request.Headers["X-User-Id"].FirstOrDefault();

        if (!string.IsNullOrEmpty(userId))
        {
            context.Items["UserId"] = userId;
        }

        // Extract user role
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value
                    ?? context.User.FindFirst("role")?.Value;

        if (!string.IsNullOrEmpty(userRole))
        {
            context.Items["UserRole"] = userRole;
        }

        // Check super admin status
        var isSuperAdmin = context.User.FindFirst("is_super_admin")?.Value
                        ?? context.User.FindFirst("http://schemas.sensormine.com/claims/issuperadmin")?.Value;

        if (bool.TryParse(isSuperAdmin, out var superAdmin))
        {
            context.Items["IsSuperAdmin"] = superAdmin;
        }

        _logger.LogDebug("Tenant context: TenantId={TenantId}, UserId={UserId}, Role={UserRole}", 
            tenantId, userId, userRole);

        await _next(context);
    }
}
