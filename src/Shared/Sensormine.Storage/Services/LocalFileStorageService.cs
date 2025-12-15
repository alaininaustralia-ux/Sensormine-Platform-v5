using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sensormine.Core.Interfaces;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Sensormine.Storage.Services;

/// <summary>
/// Local disk-based file storage implementation
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly LocalFileStorageOptions _options;
    private readonly ILogger<LocalFileStorageService> _logger;
    private const string MetadataExtension = ".meta.json";

    public LocalFileStorageService(
        IOptions<LocalFileStorageOptions> options,
        ILogger<LocalFileStorageService> logger)
    {
        _options = options.Value;
        _logger = logger;

        // Ensure base directory exists
        if (!Directory.Exists(_options.BasePath))
        {
            Directory.CreateDirectory(_options.BasePath);
            _logger.LogInformation("Created file storage directory: {BasePath}", _options.BasePath);
        }
    }

    public async Task<StoredFileInfo> UploadFileAsync(
        Stream stream,
        string fileName,
        string contentType,
        Guid tenantId,
        string category,
        CancellationToken cancellationToken = default)
    {
        // Validate file extension
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!_options.AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException(
                $"File extension '{extension}' is not allowed. Allowed: {string.Join(", ", _options.AllowedExtensions)}");
        }

        // Validate file size
        if (stream.Length > _options.MaxFileSizeBytes)
        {
            throw new InvalidOperationException(
                $"File size {stream.Length} bytes exceeds maximum allowed size of {_options.MaxFileSizeBytes} bytes");
        }

        // Generate unique file ID
        var fileId = GenerateFileId(fileName, tenantId);
        
        // Build storage path: basePath/tenantId/category/fileId.ext
        var tenantPath = Path.Combine(_options.BasePath, tenantId.ToString());
        var categoryPath = Path.Combine(tenantPath, SanitizeCategory(category));
        var filePath = Path.Combine(categoryPath, $"{fileId}{extension}");
        var metadataPath = Path.Combine(categoryPath, $"{fileId}{MetadataExtension}");

        // Create directory structure
        Directory.CreateDirectory(categoryPath);

        try
        {
            // Write file to disk
            using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await stream.CopyToAsync(fileStream, cancellationToken);
            }

            // Create metadata
            var fileInfo = new StoredFileInfo
            {
                FileId = fileId,
                OriginalFileName = fileName,
                ContentType = contentType,
                FileSizeBytes = stream.Length,
                TenantId = tenantId,
                Category = category,
                StoragePath = filePath,
                UploadedAt = DateTime.UtcNow,
                PublicUrl = _options.EnablePublicUrls ? GetPublicUrl(fileId, tenantId, category) : null
            };

            // Save metadata
            await SaveMetadataAsync(metadataPath, fileInfo, cancellationToken);

            _logger.LogInformation(
                "File uploaded: {FileId}, Size: {Size} bytes, Tenant: {TenantId}, Category: {Category}",
                fileId, stream.Length, tenantId, category);

            return fileInfo;
        }
        catch (Exception ex)
        {
            // Cleanup on failure
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            if (File.Exists(metadataPath))
            {
                File.Delete(metadataPath);
            }

            _logger.LogError(ex, "Failed to upload file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<(Stream Stream, StoredFileInfo Info)> DownloadFileAsync(
        string fileId,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        var metadata = await GetFileInfoAsync(fileId, tenantId, cancellationToken);
        if (metadata == null)
        {
            throw new FileNotFoundException($"File not found: {fileId}");
        }

        if (!File.Exists(metadata.StoragePath))
        {
            throw new FileNotFoundException($"File exists in metadata but not on disk: {metadata.StoragePath}");
        }

        var stream = new FileStream(
            metadata.StoragePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 4096,
            useAsync: true);

        _logger.LogInformation("File downloaded: {FileId}, Tenant: {TenantId}", fileId, tenantId);

        return (stream, metadata);
    }

    public Task DeleteFileAsync(
        string fileId,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        // Find all files matching the fileId pattern
        var tenantPath = Path.Combine(_options.BasePath, tenantId.ToString());
        if (!Directory.Exists(tenantPath))
        {
            return Task.CompletedTask;
        }

        var filesDeleted = 0;
        foreach (var categoryDir in Directory.GetDirectories(tenantPath))
        {
            var pattern = $"{fileId}.*";
            var files = Directory.GetFiles(categoryDir, pattern);
            
            foreach (var file in files)
            {
                File.Delete(file);
                filesDeleted++;
            }
        }

        if (filesDeleted > 0)
        {
            _logger.LogInformation("Deleted {Count} file(s) for FileId: {FileId}, Tenant: {TenantId}",
                filesDeleted, fileId, tenantId);
        }

        return Task.CompletedTask;
    }

    public async Task<StoredFileInfo?> GetFileInfoAsync(
        string fileId,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        // Search for metadata file
        var tenantPath = Path.Combine(_options.BasePath, tenantId.ToString());
        if (!Directory.Exists(tenantPath))
        {
            return null;
        }

        foreach (var categoryDir in Directory.GetDirectories(tenantPath))
        {
            var metadataPath = Path.Combine(categoryDir, $"{fileId}{MetadataExtension}");
            if (File.Exists(metadataPath))
            {
                return await LoadMetadataAsync(metadataPath, cancellationToken);
            }
        }

        return null;
    }

    public Task<bool> FileExistsAsync(string fileId, Guid tenantId)
    {
        var tenantPath = Path.Combine(_options.BasePath, tenantId.ToString());
        if (!Directory.Exists(tenantPath))
        {
            return Task.FromResult(false);
        }

        foreach (var categoryDir in Directory.GetDirectories(tenantPath))
        {
            var pattern = $"{fileId}.*";
            var files = Directory.GetFiles(categoryDir, pattern)
                .Where(f => !f.EndsWith(MetadataExtension))
                .ToArray();
            
            if (files.Length > 0)
            {
                return Task.FromResult(true);
            }
        }

        return Task.FromResult(false);
    }

    public Task<string?> GetFileUrlAsync(string fileId, Guid tenantId, int expiresInMinutes = 60)
    {
        if (!_options.EnablePublicUrls)
        {
            return Task.FromResult<string?>(null);
        }

        // For local storage, we return a relative URL that the API will serve
        // In a real implementation, you might add token-based authentication
        var url = $"{_options.PublicUrlBase}/api/files/{tenantId}/{fileId}";
        return Task.FromResult<string?>(url);
    }

    private string GenerateFileId(string fileName, Guid tenantId)
    {
        // Generate unique ID using hash of filename + tenant + timestamp
        var input = $"{fileName}_{tenantId}_{DateTime.UtcNow.Ticks}";
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hashBytes)[..16].ToLowerInvariant();
    }

    private string SanitizeCategory(string category)
    {
        // Remove invalid path characters
        var invalid = Path.GetInvalidFileNameChars();
        return string.Join("_", category.Split(invalid, StringSplitOptions.RemoveEmptyEntries));
    }

    private string? GetPublicUrl(string fileId, Guid tenantId, string category)
    {
        if (!_options.EnablePublicUrls || string.IsNullOrEmpty(_options.PublicUrlBase))
        {
            return null;
        }

        return $"{_options.PublicUrlBase}/api/files/{fileId}";
    }

    private async Task SaveMetadataAsync(
        string path,
        StoredFileInfo info,
        CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(info, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        await File.WriteAllTextAsync(path, json, cancellationToken);
    }

    private async Task<StoredFileInfo?> LoadMetadataAsync(
        string path,
        CancellationToken cancellationToken)
    {
        if (!File.Exists(path))
        {
            return null;
        }

        var json = await File.ReadAllTextAsync(path, cancellationToken);
        return JsonSerializer.Deserialize<StoredFileInfo>(json);
    }
}

/// <summary>
/// Configuration options for local file storage
/// </summary>
public class LocalFileStorageOptions
{
    public const string SectionName = "FileStorage:Local";

    /// <summary>
    /// Base directory for file storage
    /// </summary>
    public string BasePath { get; set; } = "./data/files";

    /// <summary>
    /// Maximum file size in bytes (default: 100 MB)
    /// </summary>
    public long MaxFileSizeBytes { get; set; } = 100 * 1024 * 1024;

    /// <summary>
    /// Allowed file extensions
    /// </summary>
    public HashSet<string> AllowedExtensions { get; set; } = new()
    {
        ".stl", ".obj", ".step", ".stp", ".iges", ".igs",
        ".gltf", ".glb", ".fbx", ".dae", ".3ds"
    };

    /// <summary>
    /// Enable public URL generation
    /// </summary>
    public bool EnablePublicUrls { get; set; } = true;

    /// <summary>
    /// Base URL for public file access
    /// </summary>
    public string PublicUrlBase { get; set; } = "http://localhost:5000";
}
