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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

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
        tenantId ??= "00000000-0000-0000-0000-000000000001";

        var existing = await _repository.GetByUserIdAsync(userId, tenantId);

        if (existing == null)
        {
            // Create new
            var newPreference = new UserPreference
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TenantId = Guid.Parse(tenantId),
                DisplayPreferences = SerializeJsonElement(dto.Display),
                NotificationPreferences = SerializeJsonElement(dto.Notifications),
                DashboardPreferences = SerializeJsonElement(dto.Dashboard),
                DataPreferences = SerializeJsonElement(dto.Data),
                Favorites = SerializeJsonElement(dto.Favorites),
                RecentlyViewed = SerializeJsonElement(dto.RecentlyViewed),
                Bookmarks = SerializeJsonElement(dto.Bookmarks),
                PageHistory = SerializeJsonElement(dto.PageHistory),
                CustomNavigation = SerializeJsonElement(dto.CustomNavigation, isArray: true)
            };

            var created = await _repository.CreateAsync(newPreference);
            return Ok(MapToDto(created));
        }
        else
        {
            // Update existing
            existing.DisplayPreferences = SerializeJsonElement(dto.Display);
            existing.NotificationPreferences = SerializeJsonElement(dto.Notifications);
            existing.DashboardPreferences = SerializeJsonElement(dto.Dashboard);
            existing.DataPreferences = SerializeJsonElement(dto.Data);
            existing.Favorites = SerializeJsonElement(dto.Favorites);
            existing.RecentlyViewed = SerializeJsonElement(dto.RecentlyViewed);
            existing.Bookmarks = SerializeJsonElement(dto.Bookmarks);
            existing.PageHistory = SerializeJsonElement(dto.PageHistory);
            existing.CustomNavigation = SerializeJsonElement(dto.CustomNavigation, isArray: true);

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
            Display = DeserializeJsonOrDefault(preference.DisplayPreferences),
            Notifications = DeserializeJsonOrDefault(preference.NotificationPreferences),
            Dashboard = DeserializeJsonOrDefault(preference.DashboardPreferences),
            Data = DeserializeJsonOrDefault(preference.DataPreferences),
            Favorites = DeserializeJsonOrDefault(preference.Favorites),
            RecentlyViewed = DeserializeJsonOrDefault(preference.RecentlyViewed),
            Bookmarks = DeserializeJsonOrDefault(preference.Bookmarks),
            PageHistory = DeserializeJsonOrDefault(preference.PageHistory),
            CustomNavigation = DeserializeJsonOrDefault(preference.CustomNavigation, isArray: true),
            UpdatedAt = preference.UpdatedAt?.ToString("O")
        };
    }

    private static string SerializeJsonElement(JsonElement element, bool isArray = false)
    {
        if (element.ValueKind == JsonValueKind.Undefined || element.ValueKind == JsonValueKind.Null)
        {
            return isArray ? "[]" : "{}";
        }

        try
        {
            // Use GetRawText() to get the JSON string directly without re-serialization
            return element.GetRawText();
        }
        catch
        {
            // Fallback to serialization if GetRawText fails
            return JsonSerializer.Serialize(element);
        }
    }

    private static JsonElement DeserializeJsonOrDefault(string? json, bool isArray = false)
    {
        var defaultValue = isArray ? "[]" : "{}";
        
        if (string.IsNullOrWhiteSpace(json))
        {
            return JsonSerializer.Deserialize<JsonElement>(defaultValue);
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(json);
        }
        catch
        {
            return JsonSerializer.Deserialize<JsonElement>(defaultValue);
        }
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
    public JsonElement Bookmarks { get; init; }
    public JsonElement PageHistory { get; init; }
    public JsonElement CustomNavigation { get; init; }
    public string? UpdatedAt { get; init; }
}
