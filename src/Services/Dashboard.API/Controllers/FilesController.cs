using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Interfaces;

namespace Dashboard.API.Controllers;

/// <summary>
/// File management endpoints for CAD models, images, and other dashboard assets
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<FilesController> _logger;

    /// <summary>
    /// Initializes a new instance of FilesController
    /// </summary>
    public FilesController(
        IFileStorageService fileStorage,
        ILogger<FilesController> logger)
    {
        _fileStorage = fileStorage;
        _logger = logger;
    }

    /// <summary>
    /// Upload a CAD model file (STL, OBJ, etc.)
    /// </summary>
    /// <param name="file">File to upload</param>
    /// <param name="category">Storage category (default: cad-models)</param>
    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)] // 100 MB
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadFile(
        IFormFile file,
        [FromQuery] string category = "cad-models")
    {
        // Validate tenant header
        if (!Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdStr) ||
            !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return BadRequest(new { error = "X-Tenant-Id header is required" });
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        try
        {
            using var stream = file.OpenReadStream();
            
            var fileInfo = await _fileStorage.UploadFileAsync(
                stream,
                file.FileName,
                file.ContentType,
                tenantId,
                category,
                HttpContext.RequestAborted);

            _logger.LogInformation(
                "File uploaded successfully: {FileName} ({Size} bytes) for tenant {TenantId}",
                file.FileName, file.Length, tenantId);

            return Ok(new FileUploadResponse
            {
                FileId = fileInfo.FileId,
                FileName = fileInfo.OriginalFileName,
                FileSize = fileInfo.FileSizeBytes,
                ContentType = fileInfo.ContentType,
                Category = fileInfo.Category,
                UploadedAt = fileInfo.UploadedAt,
                Url = fileInfo.PublicUrl
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "File upload validation failed: {FileName}", file.FileName);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file: {FileName}", file.FileName);
            return StatusCode(500, new { error = "File upload failed" });
        }
    }

    /// <summary>
    /// Download a file by ID
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    [HttpGet("{fileId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadFile(string fileId)
    {
        // Validate tenant header
        if (!Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdStr) ||
            !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return BadRequest(new { error = "X-Tenant-Id header is required" });
        }

        try
        {
            var (stream, info) = await _fileStorage.DownloadFileAsync(
                fileId,
                tenantId,
                HttpContext.RequestAborted);

            return File(stream, info.ContentType, info.OriginalFileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { error = $"File not found: {fileId}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file: {FileId}", fileId);
            return StatusCode(500, new { error = "File download failed" });
        }
    }

    /// <summary>
    /// Get file metadata without downloading
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    [HttpGet("{fileId}/info")]
    [ProducesResponseType(typeof(StoredFileInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFileInfo(string fileId)
    {
        // Validate tenant header
        if (!Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdStr) ||
            !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return BadRequest(new { error = "X-Tenant-Id header is required" });
        }

        var info = await _fileStorage.GetFileInfoAsync(fileId, tenantId);
        if (info == null)
        {
            return NotFound(new { error = $"File not found: {fileId}" });
        }

        return Ok(info);
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    [HttpDelete("{fileId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFile(string fileId)
    {
        // Validate tenant header
        if (!Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdStr) ||
            !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return BadRequest(new { error = "X-Tenant-Id header is required" });
        }

        var exists = await _fileStorage.FileExistsAsync(fileId, tenantId);
        if (!exists)
        {
            return NotFound(new { error = $"File not found: {fileId}" });
        }

        await _fileStorage.DeleteFileAsync(fileId, tenantId);
        
        _logger.LogInformation("File deleted: {FileId} for tenant {TenantId}", fileId, tenantId);
        
        return NoContent();
    }

    /// <summary>
    /// Get public URL for a file (if supported)
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    /// <param name="expiresInMinutes">URL expiration time in minutes</param>
    [HttpGet("{fileId}/url")]
    [ProducesResponseType(typeof(FileUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFileUrl(
        string fileId,
        [FromQuery] int expiresInMinutes = 60)
    {
        // Validate tenant header
        if (!Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdStr) ||
            !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return BadRequest(new { error = "X-Tenant-Id header is required" });
        }

        var exists = await _fileStorage.FileExistsAsync(fileId, tenantId);
        if (!exists)
        {
            return NotFound(new { error = $"File not found: {fileId}" });
        }

        var url = await _fileStorage.GetFileUrlAsync(fileId, tenantId, expiresInMinutes);
        if (url == null)
        {
            return BadRequest(new { error = "Public URLs are not enabled for this storage provider" });
        }

        return Ok(new FileUrlResponse
        {
            FileId = fileId,
            Url = url,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiresInMinutes)
        });
    }
}

/// <summary>
/// Response model for file upload
/// </summary>
public record FileUploadResponse
{
    /// <summary>Unique file identifier</summary>
    public required string FileId { get; init; }
    /// <summary>Original file name</summary>
    public required string FileName { get; init; }
    /// <summary>File size in bytes</summary>
    public required long FileSize { get; init; }
    /// <summary>MIME content type</summary>
    public required string ContentType { get; init; }
    /// <summary>Storage category</summary>
    public required string Category { get; init; }
    /// <summary>Upload timestamp</summary>
    public required DateTime UploadedAt { get; init; }
    /// <summary>Public URL (if available)</summary>
    public string? Url { get; init; }
}

/// <summary>
/// Response model for file URL request
/// </summary>
public record FileUrlResponse
{
    /// <summary>Unique file identifier</summary>
    public required string FileId { get; init; }
    /// <summary>File URL</summary>
    public required string Url { get; init; }
    /// <summary>URL expiration time</summary>
    public required DateTime ExpiresAt { get; init; }
}
