namespace Sensormine.MCP.Server.Middleware;

/// <summary>
/// Middleware to extract and set tenant context from JWT token
/// </summary>
public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantContextMiddleware> _logger;

    public TenantContextMiddleware(RequestDelegate next, ILogger<TenantContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Extract tenant ID from JWT claims
        var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
        
        // Also check X-Tenant-Id header as fallback
        if (string.IsNullOrEmpty(tenantIdClaim))
        {
            tenantIdClaim = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        }

        if (!string.IsNullOrEmpty(tenantIdClaim))
        {
            context.Items["TenantId"] = tenantIdClaim;
            _logger.LogDebug("Tenant context set: {TenantId}", tenantIdClaim);
        }
        else
        {
            _logger.LogWarning("No tenant ID found in request");
        }

        await _next(context);
    }
}
