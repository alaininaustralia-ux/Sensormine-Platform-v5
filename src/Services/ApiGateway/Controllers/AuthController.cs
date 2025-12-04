using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ApiGateway.Controllers;

/// <summary>
/// Authentication controller for login, logout, and token refresh
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Login endpoint
    /// </summary>
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // For development: Accept demo credentials or any email/password combo
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        // Generate JWT token
        var token = GenerateJwtToken(request.Email);
        var refreshToken = Guid.NewGuid().ToString();

        var response = new
        {
            token,
            refreshToken,
            user = new
            {
                id = Guid.NewGuid().ToString(),
                email = request.Email,
                name = request.Email.Split('@')[0],
                role = "user",
                tenantId = Guid.NewGuid().ToString(),
                permissions = new[] { "read", "write" }
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
        var token = GenerateJwtToken("user@example.com");
        var refreshToken = Guid.NewGuid().ToString();

        var response = new
        {
            token,
            refreshToken,
            user = new
            {
                id = Guid.NewGuid().ToString(),
                email = "user@example.com",
                name = "User",
                role = "user",
                tenantId = Guid.NewGuid().ToString()
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

    private string GenerateJwtToken(string email)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Secret"] ?? "sensormine-dev-secret-key-change-in-production-minimum-32-characters-long"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "user")
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
}

public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
