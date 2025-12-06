using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using System.Text.Json;

namespace Preferences.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SiteConfigurationController : ControllerBase
{
    private readonly ISiteConfigurationRepository _repository;
    private readonly ILogger<SiteConfigurationController> _logger;

    public SiteConfigurationController(
        ISiteConfigurationRepository repository,
        ILogger<SiteConfigurationController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get site configuration
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<SiteConfigurationDto>> GetConfiguration()
    {
        var config = await _repository.GetAsync();
        
        if (config == null)
        {
            return NotFound(new { message = "Site configuration not found" });
        }

        return Ok(MapToDto(config));
    }

    /// <summary>
    /// Create or update site configuration (admin only)
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<SiteConfigurationDto>> UpsertConfiguration(
        [FromBody] SiteConfigurationDto dto,
        [FromHeader(Name = "X-User-Id")] string? userId)
    {
        // TODO: Add admin authorization check
        userId ??= "admin";

        var existing = await _repository.GetAsync();

        if (existing == null)
        {
            // Create new
            var newConfig = new SiteConfiguration
            {
                Id = Guid.NewGuid(),
                TenantId = "default",
                ConfigKey = "default",
                SiteSettings = JsonSerializer.Serialize(dto.Site),
                Features = JsonSerializer.Serialize(dto.Features),
                Limits = JsonSerializer.Serialize(dto.Limits),
                Defaults = JsonSerializer.Serialize(dto.Defaults),
                Integrations = JsonSerializer.Serialize(dto.Integrations),
                UpdatedBy = userId
            };

            var created = await _repository.CreateAsync(newConfig);
            return Ok(MapToDto(created));
        }
        else
        {
            // Update existing
            existing.SiteSettings = JsonSerializer.Serialize(dto.Site);
            existing.Features = JsonSerializer.Serialize(dto.Features);
            existing.Limits = JsonSerializer.Serialize(dto.Limits);
            existing.Defaults = JsonSerializer.Serialize(dto.Defaults);
            existing.Integrations = JsonSerializer.Serialize(dto.Integrations);
            existing.UpdatedBy = userId;

            var updated = await _repository.UpdateAsync(existing);
            return Ok(MapToDto(updated));
        }
    }

    private static SiteConfigurationDto MapToDto(SiteConfiguration config)
    {
        return new SiteConfigurationDto
        {
            Site = JsonSerializer.Deserialize<JsonElement>(config.SiteSettings),
            Features = JsonSerializer.Deserialize<JsonElement>(config.Features),
            Limits = JsonSerializer.Deserialize<JsonElement>(config.Limits),
            Defaults = JsonSerializer.Deserialize<JsonElement>(config.Defaults),
            Integrations = JsonSerializer.Deserialize<JsonElement>(config.Integrations),
            UpdatedAt = config.UpdatedAt.ToString("O"),
            UpdatedBy = config.UpdatedBy
        };
    }
}

public record SiteConfigurationDto
{
    public JsonElement Site { get; init; }
    public JsonElement Features { get; init; }
    public JsonElement Limits { get; init; }
    public JsonElement Defaults { get; init; }
    public JsonElement Integrations { get; init; }
    public string? UpdatedAt { get; init; }
    public string? UpdatedBy { get; init; }
}
