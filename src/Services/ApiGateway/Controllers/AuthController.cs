using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ApiGateway.Controllers;

/// <summary>
/// Authentication controller for login, logout, and token refresh
/// Integrates with Identity.API for user authentication
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthController(
        IConfiguration configuration, 
        ILogger<AuthController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Login endpoint - authenticates user via Identity.API
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        // For development: Accept demo credentials or authenticate via Identity.API
        // TODO: Implement actual authentication with Identity.API
        // For now, generate token with mock user data
        
        // Mock user data (will be replaced with actual Identity.API call)
        var userId = Guid.NewGuid().ToString();
        var tenantId = "00000000-0000-0000-0000-000000000001";
        var userRole = "Administrator";
        var userName = request.Email.Split('@')[0];

        // Generate JWT token with proper claims
        var token = GenerateJwtToken(userId, request.Email, userName, tenantId, userRole, false);
        var refreshToken = Guid.NewGuid().ToString();

        var response = new
        {
            token,
            refreshToken,
            user = new
            {
                id = userId,
                email = request.Email,
                name = userName,
                role = userRole,
                tenantId,
                isSuperAdmin = false,
                permissions = GetPermissionsForRole(userRole)
            },
            expiresIn = 3600
        };

        return Ok(response);
    }

    /// <summary>
    /// Logout endpoint
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _logger.LogInformation("User logged out");
        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Refresh token endpoint
    /// </summary>
    [HttpPost("refresh")]
    public IActionResult Refresh([FromBody] RefreshRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token is required" });
        }

        // For development: Generate new tokens
        var userId = Guid.NewGuid().ToString();
        var tenantId = "00000000-0000-0000-0000-000000000001";
        var email = "user@example.com";
        var name = "User";
        var role = "Viewer";
        
        var token = GenerateJwtToken(userId, email, name, tenantId, role, false);
        var refreshToken = Guid.NewGuid().ToString();

        var response = new
        {
            token,
            refreshToken,
            user = new
            {
                id = userId,
                email,
                name,
                role,
                tenantId
            },
            expiresIn = 3600
        };

        return Ok(response);
    }

    /// <summary>
    /// Get current user endpoint
    /// </summary>
    [HttpGet("me")]
    public IActionResult Me()
    {
        // For development: Return mock user
        var user = new
        {
            id = Guid.NewGuid().ToString(),
            email = "user@example.com",
            name = "User",
            role = "user",
            tenantId = Guid.NewGuid().ToString()
        };

        return Ok(user);
    }

    private string GenerateJwtToken(string userId, string email, string name, string tenantId, string role, bool isSuperAdmin)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Secret"] ?? "sensormine-dev-secret-key-change-in-production-minimum-32-characters-long"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim("tenant_id", tenantId),
            new Claim("user_id", userId),
            new Claim("role", role),
            new Claim("is_super_admin", isSuperAdmin.ToString().ToLower())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "sensormine",
            audience: _configuration["Jwt:Audience"] ?? "sensormine-app",
            claims: claims,
            expires: DateTime.Now.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string[] GetPermissionsForRole(string role)
    {
        return role switch
        {
            "Administrator" => new[] { "read", "write", "delete", "manage_users", "manage_devices", "manage_dashboards", "manage_alerts" },
            "DashboardEditor" => new[] { "read", "write", "manage_dashboards" },
            "Viewer" => new[] { "read" },
            _ => new[] { "read" }
        };
    }
}

public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
