using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.Net.Http.Json;

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

        try
        {
            // Call Identity.API to authenticate user
            var identityApiUrl = _configuration["Services:IdentityApi"] ?? "http://localhost:5003";
            var httpClient = _httpClientFactory.CreateClient();
            
            var authRequest = new
            {
                email = request.Email,
                password = request.Password,
                tenantId = (string?)null // Will use email to find tenant
            };

            var response = await httpClient.PostAsJsonAsync(
                $"{identityApiUrl}/api/user/authenticate",
                authRequest,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Authentication failed for email: {Email}, Status: {Status}", 
                    request.Email, response.StatusCode);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var authResponse = await response.Content.ReadFromJsonAsync<AuthenticateResponse>(cancellationToken: cancellationToken);
            
            if (authResponse == null)
            {
                _logger.LogError("Failed to deserialize authentication response for email: {Email}", request.Email);
                return StatusCode(500, new { message = "Authentication failed" });
            }

            // Generate JWT token with user data from Identity.API
            var token = GenerateJwtToken(
                authResponse.UserId,
                authResponse.Email,
                authResponse.FullName,
                authResponse.TenantId,
                authResponse.Role,
                authResponse.IsSuperAdmin);
            
            var refreshToken = Guid.NewGuid().ToString();

            var loginResponse = new
            {
                token,
                refreshToken,
                user = new
                {
                    id = authResponse.UserId,
                    email = authResponse.Email,
                    name = authResponse.FullName,
                    role = authResponse.Role,
                    tenantId = authResponse.TenantId,
                    isSuperAdmin = authResponse.IsSuperAdmin,
                    mustChangePassword = authResponse.MustChangePassword,
                    permissions = GetPermissionsForRole(authResponse.Role)
                },
                expiresIn = 3600
            };

            _logger.LogInformation("User {UserId} authenticated successfully", authResponse.UserId);
            return Ok(loginResponse);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to Identity.API for email: {Email}", request.Email);
            return StatusCode(503, new { message = "Authentication service unavailable" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during authentication for email: {Email}", request.Email);
            return StatusCode(500, new { message = "Internal server error" });
        }
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

/// <summary>
/// Login request model
/// </summary>
public record LoginRequest(string Email, string Password);

/// <summary>
/// Refresh token request model
/// </summary>
public record RefreshRequest(string RefreshToken);

/// <summary>
/// Authentication response from Identity.API
/// </summary>
public record AuthenticateResponse
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string TenantId { get; init; } = string.Empty;
    public bool IsSuperAdmin { get; init; }
    public bool MustChangePassword { get; init; }
}
