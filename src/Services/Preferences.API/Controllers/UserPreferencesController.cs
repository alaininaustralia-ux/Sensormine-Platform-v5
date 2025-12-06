using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using System.Text.Json;

namespace Preferences.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserPreferencesController : ControllerBase
{
    private readonly IUserPreferenceRepository _repository;
    private readonly ILogger<UserPreferencesController> _logger;

    public UserPreferencesController(
        IUserPreferenceRepository repository,
        ILogger<UserPreferencesController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get user preferences for the authenticated user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<UserPreferenceDto>> GetPreferences(
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        // TODO: Get from JWT claims in production
        userId ??= "demo-user";
        tenantId ??= "default";

        var preference = await _repository.GetByUserIdAsync(userId, tenantId);
        
        if (preference == null)
        {
            return NotFound(new { message = "User preferences not found" });
        }

        return Ok(MapToDto(preference));
    }

    /// <summary>
    /// Create or update user preferences
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<UserPreferenceDto>> UpsertPreferences(
        [FromBody] UserPreferenceDto dto,
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        // TODO: Get from JWT claims in production
        userId ??= dto.UserId ?? "demo-user";
        tenantId ??= "default";

        var existing = await _repository.GetByUserIdAsync(userId, tenantId);

        if (existing == null)
        {
            // Create new
            var newPreference = new UserPreference
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TenantId = tenantId,
                DisplayPreferences = JsonSerializer.Serialize(dto.Display),
                NotificationPreferences = JsonSerializer.Serialize(dto.Notifications),
                DashboardPreferences = JsonSerializer.Serialize(dto.Dashboard),
                DataPreferences = JsonSerializer.Serialize(dto.Data),
                Favorites = JsonSerializer.Serialize(dto.Favorites),
                RecentlyViewed = JsonSerializer.Serialize(dto.RecentlyViewed)
            };

            var created = await _repository.CreateAsync(newPreference);
            return Ok(MapToDto(created));
        }
        else
        {
            // Update existing
            existing.DisplayPreferences = JsonSerializer.Serialize(dto.Display);
            existing.NotificationPreferences = JsonSerializer.Serialize(dto.Notifications);
            existing.DashboardPreferences = JsonSerializer.Serialize(dto.Dashboard);
            existing.DataPreferences = JsonSerializer.Serialize(dto.Data);
            existing.Favorites = JsonSerializer.Serialize(dto.Favorites);
            existing.RecentlyViewed = JsonSerializer.Serialize(dto.RecentlyViewed);

            var updated = await _repository.UpdateAsync(existing);
            return Ok(MapToDto(updated));
        }
    }

    /// <summary>
    /// Delete user preferences
    /// </summary>
    [HttpDelete]
    public async Task<ActionResult> DeletePreferences(
        [FromHeader(Name = "X-User-Id")] string? userId,
        [FromHeader(Name = "X-Tenant-Id")] string? tenantId)
    {
        userId ??= "demo-user";
        tenantId ??= "default";

        var deleted = await _repository.DeleteAsync(userId, tenantId);
        
        if (!deleted)
        {
            return NotFound(new { message = "User preferences not found" });
        }

        return NoContent();
    }

    private static UserPreferenceDto MapToDto(UserPreference preference)
    {
        return new UserPreferenceDto
        {
            UserId = preference.UserId,
            Display = JsonSerializer.Deserialize<JsonElement>(preference.DisplayPreferences),
            Notifications = JsonSerializer.Deserialize<JsonElement>(preference.NotificationPreferences),
            Dashboard = JsonSerializer.Deserialize<JsonElement>(preference.DashboardPreferences),
            Data = JsonSerializer.Deserialize<JsonElement>(preference.DataPreferences),
            Favorites = JsonSerializer.Deserialize<JsonElement>(preference.Favorites),
            RecentlyViewed = JsonSerializer.Deserialize<JsonElement>(preference.RecentlyViewed),
            UpdatedAt = preference.UpdatedAt.ToString("O")
        };
    }
}

public record UserPreferenceDto
{
    public string? UserId { get; init; }
    public JsonElement Display { get; init; }
    public JsonElement Notifications { get; init; }
    public JsonElement Dashboard { get; init; }
    public JsonElement Data { get; init; }
    public JsonElement Favorites { get; init; }
    public JsonElement RecentlyViewed { get; init; }
    public string? UpdatedAt { get; init; }
}
