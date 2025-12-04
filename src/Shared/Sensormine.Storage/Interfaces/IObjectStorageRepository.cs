namespace Sensormine.Storage.Interfaces;

/// <summary>
/// Object storage repository for files (S3-compatible)
/// </summary>
public interface IObjectStorageRepository
{
    /// <summary>
    /// Upload a file to object storage
    /// </summary>
    Task<string> UploadAsync(string bucketName, string objectKey, Stream content, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Download a file from object storage
    /// </summary>
    Task<Stream> DownloadAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a file from object storage
    /// </summary>
    Task DeleteAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// List objects in a bucket
    /// </summary>
    Task<IEnumerable<ObjectMetadata>> ListAsync(string bucketName, string? prefix = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get presigned URL for direct access
    /// </summary>
    Task<string> GetPresignedUrlAsync(string bucketName, string objectKey, TimeSpan expiration, CancellationToken cancellationToken = default);
}

/// <summary>
/// Object metadata
/// </summary>
public class ObjectMetadata
{
    public string Key { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTimeOffset LastModified { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public Dictionary<string, string>? Metadata { get; set; }
}
