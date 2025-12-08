using Identity.API.DTOs;
using Identity.API.Repositories;
using Identity.API.Services;
using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;

namespace Identity.API.Controllers;

/// <summary>
/// Controller for user management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<UserController> _logger;

    public UserController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITenantContext tenantContext,
        ILogger<UserController> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Get all users in the tenant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<UserListResponse>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var (items, totalCount) = await _userRepository.GetAllAsync(
            tenantId, page, pageSize, role, isActive, cancellationToken);

        var response = new UserListResponse
        {
            Items = items.Select(UserResponse.FromEntity).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    /// <summary>
    /// Get a specific user by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var user = await _userRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        return Ok(UserResponse.FromEntity(user));
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();

        // Validate email uniqueness
        if (await _userRepository.EmailExistsAsync(request.Email, tenantId, cancellationToken: cancellationToken))
        {
            return BadRequest(new { message = "Email already exists" });
        }

        // Parse role
        if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
        {
            return BadRequest(new { message = "Invalid role" });
        }

        // Create user
        var user = new User
        {
            TenantId = tenantId,
            Email = request.Email,
            FullName = request.FullName,
            Role = userRole,
            PhoneNumber = request.PhoneNumber,
            PreferredLanguage = request.PreferredLanguage,
            Timezone = request.Timezone,
            IsActive = true,
            MustChangePassword = string.IsNullOrEmpty(request.Password)
        };

        // Hash password if provided
        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(request.Password);
        }

        var createdUser = await _userRepository.CreateAsync(user, cancellationToken);
        _logger.LogInformation("User {UserId} created by {CurrentUserId}", createdUser.Id, _tenantContext.GetUserId());

        return CreatedAtAction(nameof(GetUser), new { id = createdUser.Id }, UserResponse.FromEntity(createdUser));
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<UserResponse>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var user = await _userRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Update fields if provided
        if (request.FullName != null)
        {
            user.FullName = request.FullName;
        }

        if (request.Role != null && Enum.TryParse<UserRole>(request.Role, true, out var userRole))
        {
            user.Role = userRole;
        }

        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }

        if (request.PhoneNumber != null)
        {
            user.PhoneNumber = request.PhoneNumber;
        }

        if (request.MfaEnabled.HasValue)
        {
            user.MfaEnabled = request.MfaEnabled.Value;
        }

        if (request.AvatarUrl != null)
        {
            user.AvatarUrl = request.AvatarUrl;
        }

        if (request.PreferredLanguage != null)
        {
            user.PreferredLanguage = request.PreferredLanguage;
        }

        if (request.Timezone != null)
        {
            user.Timezone = request.Timezone;
        }

        var updatedUser = await _userRepository.UpdateAsync(user, cancellationToken);
        _logger.LogInformation("User {UserId} updated by {CurrentUserId}", id, _tenantContext.GetUserId());

        return Ok(UserResponse.FromEntity(updatedUser));
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var user = await _userRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        await _userRepository.DeleteAsync(id, tenantId, cancellationToken);
        _logger.LogInformation("User {UserId} deleted by {CurrentUserId}", id, _tenantContext.GetUserId());

        return NoContent();
    }

    /// <summary>
    /// Change user password
    /// </summary>
    [HttpPost("{id}/change-password")]
    public async Task<IActionResult> ChangePassword(
        Guid id,
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var user = await _userRepository.GetByIdAsync(id, tenantId, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Verify current password
        if (user.PasswordHash != null && !_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect" });
        }

        // Update password
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.MustChangePassword = false;

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger.LogInformation("Password changed for user {UserId}", id);

        return Ok(new { message = "Password changed successfully" });
    }

    /// <summary>
    /// Get user statistics
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult> GetStatistics(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.GetTenantId();
        var totalCount = await _userRepository.GetUserCountByTenantAsync(tenantId, cancellationToken);

        return Ok(new
        {
            totalUsers = totalCount,
            tenantId
        });
    }

    /// <summary>
    /// Authenticate user with email and password
    /// </summary>
    [HttpPost("authenticate")]
    public async Task<ActionResult<AuthenticateResponse>> Authenticate(
        [FromBody] AuthenticateRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Authentication attempt for email: {Email}", request.Email);

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        // Find user by email (try all tenants for login - tenant will be enforced by actual email uniqueness)
        var user = await _userRepository.GetByEmailAsync(request.Email, request.TenantId ?? "00000000-0000-0000-0000-000000000001", cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Login failed: User not found for email {Email}", request.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed: User account is inactive for email {Email}", request.Email);
            return Unauthorized(new { message = "User account is inactive" });
        }

        // Verify password
        if (user.PasswordHash == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Login failed: Invalid password for email {Email}", request.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Update last login timestamp
        user.LastLoginAt = DateTimeOffset.UtcNow;
        await _userRepository.UpdateAsync(user, cancellationToken);

        _logger.LogInformation("User {UserId} authenticated successfully", user.Id);

        var response = new AuthenticateResponse
        {
            UserId = user.Id.ToString(),
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            TenantId = user.TenantId,
            IsSuperAdmin = user.IsSuperAdmin,
            MustChangePassword = user.MustChangePassword
        };

        return Ok(response);
    }
}
