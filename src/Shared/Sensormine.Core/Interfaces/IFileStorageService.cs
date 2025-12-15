namespace Sensormine.Core.Interfaces;

/// <summary>
/// Abstraction for file storage operations.
/// Supports both local disk and cloud storage implementations.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to storage
    /// </summary>
    /// <param name="stream">File content stream</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="contentType">MIME content type</param>
    /// <param name="tenantId">Tenant ID for multi-tenancy isolation</param>
    /// <param name="category">Storage category (e.g., "cad-models", "images")</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>File metadata including storage path/URL</returns>
    Task<StoredFileInfo> UploadFileAsync(
        Stream stream, 
        string fileName, 
        string contentType,
        Guid tenantId,
        string category,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Downloads a file from storage
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    /// <param name="tenantId">Tenant ID for security validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>File stream and metadata</returns>
    Task<(Stream Stream, StoredFileInfo Info)> DownloadFileAsync(
        string fileId,
        Guid tenantId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from storage
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    /// <param name="tenantId">Tenant ID for security validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteFileAsync(
        string fileId,
        Guid tenantId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets file metadata without downloading content
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    /// <param name="tenantId">Tenant ID for security validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task<StoredFileInfo?> GetFileInfoAsync(
        string fileId,
        Guid tenantId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a file exists
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    /// <param name="tenantId">Tenant ID for security validation</param>
    Task<bool> FileExistsAsync(string fileId, Guid tenantId);

    /// <summary>
    /// Gets the public URL for a file (if supported by storage provider)
    /// </summary>
    /// <param name="fileId">Unique file identifier</param>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="expiresInMinutes">URL expiration time (for cloud storage)</param>
    Task<string?> GetFileUrlAsync(string fileId, Guid tenantId, int expiresInMinutes = 60);
}

/// <summary>
/// Metadata about a stored file
/// </summary>
public record StoredFileInfo
{
    public required string FileId { get; init; }
    public required string OriginalFileName { get; init; }
    public required string ContentType { get; init; }
    public required long FileSizeBytes { get; init; }
    public required Guid TenantId { get; init; }
    public required string Category { get; init; }
    public required string StoragePath { get; init; }
    public required DateTime UploadedAt { get; init; }
    public string? PublicUrl { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
}
