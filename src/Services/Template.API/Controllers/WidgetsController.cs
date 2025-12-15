using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Template.API.Models;
using Template.API.Services;
using Sensormine.Storage.Data;
using Sensormine.Core.Models;

namespace Template.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WidgetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWidgetStorageService _storageService;
    private readonly IWidgetValidationService _validationService;
    private readonly ILogger<WidgetsController> _logger;

    public WidgetsController(
        ApplicationDbContext context,
        IWidgetStorageService storageService,
        IWidgetValidationService validationService,
        ILogger<WidgetsController> logger)
    {
        _context = context;
        _storageService = storageService;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// Upload a new widget package
    /// </summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(WidgetUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadWidget(IFormFile file)
    {
        try
        {
            // Get tenant ID from header
            var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(tenantIdHeader) || !Guid.TryParse(tenantIdHeader, out var tenantId))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Missing or invalid X-Tenant-Id header",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // TODO: Get user ID from authentication
            var userId = Guid.Parse("00000000-0000-0000-0000-000000000001"); // Placeholder

            if (file == null || file.Length == 0)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "No file uploaded",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Validate file is ZIP
            if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "File must be a ZIP archive",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            _logger.LogInformation("Validating widget package: {FileName}", file.FileName);

            // Validate package
            using var fileStream = file.OpenReadStream();
            var (isValid, errors, manifest) = await _validationService.ValidateWidgetPackageAsync(fileStream);

            if (!isValid || manifest == null)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Widget package validation failed",
                    Detail = string.Join("; ", errors),
                    Status = StatusCodes.Status400BadRequest
                });
            }

            _logger.LogInformation("Widget package validated successfully: {WidgetId} v{Version}", manifest.Id, manifest.Version);

            // Check if widget version already exists
            var existingWidget = await _context.Set<CustomWidget>()
                .FirstOrDefaultAsync(w => w.TenantId == tenantId && w.WidgetId == manifest.Id && w.Version == manifest.Version);

            if (existingWidget != null)
            {
                return Conflict(new ProblemDetails
                {
                    Title = "Widget version already exists",
                    Detail = $"Widget {manifest.Id} version {manifest.Version} already exists",
                    Status = StatusCodes.Status409Conflict
                });
            }

            // Upload to MinIO
            fileStream.Position = 0;
            var storagePath = await _storageService.UploadWidgetPackageAsync(tenantId, manifest.Id, manifest.Version, fileStream, file.FileName);

            // Save to database
            var widget = new CustomWidget
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WidgetId = manifest.Id,
                Name = manifest.Name,
                Description = manifest.Description,
                Version = manifest.Version,
                AuthorName = manifest.Author?.Name,
                AuthorEmail = manifest.Author?.Email,
                AuthorOrganization = manifest.Author?.Organization,
                Category = manifest.Category,
                Tags = manifest.Tags,
                IconUrl = manifest.Icon,
                StoragePath = storagePath,
                Manifest = JsonDocument.Parse(JsonSerializer.Serialize(manifest)),
                Status = "active",
                FileSizeBytes = file.Length,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<CustomWidget>().Add(widget);

            // Add permissions
            if (manifest.Permissions?.Apis != null)
            {
                foreach (var apiPermission in manifest.Permissions.Apis)
                {
                    _context.Set<WidgetPermission>().Add(new WidgetPermission
                    {
                        Id = Guid.NewGuid(),
                        WidgetId = widget.Id,
                        PermissionType = $"api.{apiPermission}",
                        GrantedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Widget uploaded successfully: {WidgetId} v{Version}", widget.WidgetId, widget.Version);

            var response = new WidgetUploadResponse
            {
                Id = widget.Id,
                WidgetId = widget.WidgetId,
                Version = widget.Version,
                Status = widget.Status,
                DownloadUrl = $"/api/widgets/{widget.Id}/download"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload widget");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Failed to upload widget",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// List all widgets
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(WidgetListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListWidgets([FromQuery] string? category = null, [FromQuery] string? tag = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdHeader) || !Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing or invalid X-Tenant-Id header",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var query = _context.Set<CustomWidget>()
            .Where(w => w.TenantId == tenantId && w.Status == "active");

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(w => w.Category == category);
        }

        if (!string.IsNullOrEmpty(tag))
        {
            query = query.Where(w => w.Tags != null && w.Tags.Contains(tag));
        }

        var total = await query.CountAsync();
        var widgets = await query
            .OrderByDescending(w => w.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var response = new WidgetListResponse
        {
            Widgets = widgets.Select(w => MapToResponse(w)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    /// <summary>
    /// Get widget details
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(WidgetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWidget(Guid id)
    {
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdHeader) || !Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing or invalid X-Tenant-Id header",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var widget = await _context.Set<CustomWidget>()
            .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);

        if (widget == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Widget not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(MapToResponse(widget));
    }

    /// <summary>
    /// Download widget bundle
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadWidget(Guid id)
    {
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdHeader) || !Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing or invalid X-Tenant-Id header",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var widget = await _context.Set<CustomWidget>()
            .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);

        if (widget == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Widget not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        try
        {
            var stream = await _storageService.DownloadWidgetPackageAsync(widget.StoragePath);
            
            // Increment download count
            await _context.Database.ExecuteSqlRawAsync(
                "SELECT increment_widget_download_count({0})", widget.Id);

            return File(stream, "application/javascript", $"{widget.WidgetId}-{widget.Version}.js");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download widget: {WidgetId}", widget.Id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Failed to download widget",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Delete widget
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWidget(Guid id)
    {
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdHeader) || !Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing or invalid X-Tenant-Id header",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var widget = await _context.Set<CustomWidget>()
            .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);

        if (widget == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Widget not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        // Delete from storage
        await _storageService.DeleteWidgetPackageAsync(widget.StoragePath);

        // Delete from database (cascade deletes permissions and usage logs)
        _context.Set<CustomWidget>().Remove(widget);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Widget deleted: {WidgetId}", widget.Id);

        return NoContent();
    }

    /// <summary>
    /// Get widget permissions
    /// </summary>
    [HttpGet("{id}/permissions")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWidgetPermissions(Guid id)
    {
        var widget = await _context.Set<CustomWidget>()
            .FirstOrDefaultAsync(w => w.Id == id);

        if (widget == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Widget not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        var permissions = await _context.Set<WidgetPermission>()
            .Where(p => p.WidgetId == id)
            .Select(p => p.PermissionType)
            .ToListAsync();

        return Ok(new { Permissions = permissions });
    }

    private WidgetResponse MapToResponse(CustomWidget widget)
    {
        return new WidgetResponse
        {
            Id = widget.Id,
            WidgetId = widget.WidgetId,
            Name = widget.Name,
            Description = widget.Description,
            Version = widget.Version,
            Author = new WidgetAuthor
            {
                Name = widget.AuthorName,
                Email = widget.AuthorEmail,
                Organization = widget.AuthorOrganization
            },
            Category = widget.Category,
            Tags = widget.Tags,
            IconUrl = widget.IconUrl,
            Manifest = widget.Manifest,
            Status = widget.Status,
            DownloadCount = widget.DownloadCount,
            FileSizeBytes = widget.FileSizeBytes,
            DownloadUrl = $"/api/widgets/{widget.Id}/download",
            CreatedAt = widget.CreatedAt,
            UpdatedAt = widget.UpdatedAt
        };
    }
}
