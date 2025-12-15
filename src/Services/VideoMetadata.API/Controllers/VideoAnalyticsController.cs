using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using VideoMetadata.API.Data;
using VideoMetadata.API.DTOs;
using VideoMetadata.API.Models;

namespace VideoMetadata.API.Controllers;

[ApiController]
[Route("api/video-analytics")]
public class VideoAnalyticsController : ControllerBase
{
    private readonly VideoMetadataDbContext _context;
    private readonly ILogger<VideoAnalyticsController> _logger;

    public VideoAnalyticsController(VideoMetadataDbContext context, ILogger<VideoAnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<VideoAnalyticsListResponse>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = GetTenantId();
        
        var query = _context.VideoAnalyticsConfigurations
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.CreatedAt);

        var total = await query.CountAsync();
        var configurations = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var response = new VideoAnalyticsListResponse
        {
            Configurations = configurations.Select(MapToResponse).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VideoAnalyticsResponse>> GetById(Guid id)
    {
        var tenantId = GetTenantId();
        var config = await _context.VideoAnalyticsConfigurations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (config == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        return Ok(MapToResponse(config));
    }

    [HttpPost]
    public async Task<ActionResult<VideoAnalyticsResponse>> Create([FromBody] CreateVideoAnalyticsRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var config = new VideoAnalyticsConfiguration
        {
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            SourceType = request.SourceType,
            SourceConfig = JsonSerializer.Serialize(request.SourceConfig),
            ProcessingModel = request.ProcessingModel,
            ModelConfiguration = JsonSerializer.Serialize(request.ModelConfiguration),
            Enabled = request.Enabled,
            Tags = request.Tags,
            CreatedBy = userId
        };

        _context.VideoAnalyticsConfigurations.Add(config);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created video analytics configuration {ConfigId} for tenant {TenantId}", config.Id, tenantId);

        return CreatedAtAction(nameof(GetById), new { id = config.Id }, MapToResponse(config));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<VideoAnalyticsResponse>> Update(Guid id, [FromBody] UpdateVideoAnalyticsRequest request)
    {
        var tenantId = GetTenantId();
        var config = await _context.VideoAnalyticsConfigurations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (config == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        if (request.Name != null) config.Name = request.Name;
        if (request.Description != null) config.Description = request.Description;
        if (request.SourceConfig != null) config.SourceConfig = JsonSerializer.Serialize(request.SourceConfig);
        if (request.ModelConfiguration != null) config.ModelConfiguration = JsonSerializer.Serialize(request.ModelConfiguration);
        if (request.Enabled.HasValue) config.Enabled = request.Enabled.Value;
        if (request.Tags != null) config.Tags = request.Tags;
        
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated video analytics configuration {ConfigId}", id);

        return Ok(MapToResponse(config));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetTenantId();
        var config = await _context.VideoAnalyticsConfigurations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (config == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        _context.VideoAnalyticsConfigurations.Remove(config);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted video analytics configuration {ConfigId}", id);

        return NoContent();
    }

    [HttpPost("{id}/enable")]
    public async Task<ActionResult<VideoAnalyticsResponse>> Enable(Guid id)
    {
        var tenantId = GetTenantId();
        var config = await _context.VideoAnalyticsConfigurations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (config == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        config.Enabled = true;
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(config));
    }

    [HttpPost("{id}/disable")]
    public async Task<ActionResult<VideoAnalyticsResponse>> Disable(Guid id)
    {
        var tenantId = GetTenantId();
        var config = await _context.VideoAnalyticsConfigurations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (config == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        config.Enabled = false;
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(config));
    }

    [HttpPost("test-connection")]
    public async Task<ActionResult<TestConnectionResponse>> TestConnection([FromBody] TestConnectionRequest request)
    {
        // TODO: Implement actual connection testing logic
        // For now, return a mock success response
        await Task.Delay(1000); // Simulate connection test

        return Ok(new TestConnectionResponse
        {
            Success = true,
            Message = "Connection test successful"
        });
    }

    private Guid GetTenantId()
    {
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return tenantId;
        }
        return Guid.Parse("00000000-0000-0000-0000-000000000001"); // Default tenant
    }

    private string? GetUserId()
    {
        return User?.Identity?.Name;
    }

    private static VideoAnalyticsResponse MapToResponse(VideoAnalyticsConfiguration config)
    {
        return new VideoAnalyticsResponse
        {
            Id = config.Id,
            TenantId = config.TenantId,
            Name = config.Name,
            Description = config.Description,
            SourceType = config.SourceType,
            SourceConfig = JsonSerializer.Deserialize<object>(config.SourceConfig) ?? new { },
            ProcessingModel = config.ProcessingModel,
            ModelConfiguration = JsonSerializer.Deserialize<object>(config.ModelConfiguration) ?? new { },
            Enabled = config.Enabled,
            DeviceId = config.DeviceId,
            Tags = config.Tags,
            Metadata = config.Metadata != null ? JsonSerializer.Deserialize<object>(config.Metadata) : null,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt,
            CreatedBy = config.CreatedBy
        };
    }
}
