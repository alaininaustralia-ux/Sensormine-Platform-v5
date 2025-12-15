using Minio;
using Minio.DataModel.Args;

namespace Template.API.Services;

public class MinioWidgetStorageService : IWidgetStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly ILogger<MinioWidgetStorageService> _logger;
    private const string BucketName = "widgets";

    public MinioWidgetStorageService(IMinioClient minioClient, ILogger<MinioWidgetStorageService> logger)
    {
        _minioClient = minioClient;
        _logger = logger;
    }

    public async Task<string> UploadWidgetPackageAsync(Guid tenantId, string widgetId, string version, Stream fileStream, string fileName)
    {
        try
        {
            // Ensure bucket exists
            await EnsureBucketExistsAsync();

            // Generate storage path: {tenantId}/{widgetId}/{version}/
            var storagePath = $"{tenantId}/{widgetId}/{version}/{fileName}";

            _logger.LogInformation("Uploading widget package to MinIO: {StoragePath}", storagePath);

            // Upload file
            var putObjectArgs = new PutObjectArgs()
                .WithBucket(BucketName)
                .WithObject(storagePath)
                .WithStreamData(fileStream)
                .WithObjectSize(fileStream.Length)
                .WithContentType("application/zip");

            await _minioClient.PutObjectAsync(putObjectArgs);

            _logger.LogInformation("Successfully uploaded widget package: {StoragePath}", storagePath);
            return storagePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload widget package");
            throw;
        }
    }

    public async Task<Stream> DownloadWidgetPackageAsync(string storagePath)
    {
        try
        {
            _logger.LogInformation("Downloading widget package from MinIO: {StoragePath}", storagePath);

            var memoryStream = new MemoryStream();
            var getObjectArgs = new GetObjectArgs()
                .WithBucket(BucketName)
                .WithObject(storagePath)
                .WithCallbackStream(stream =>
                {
                    stream.CopyTo(memoryStream);
                });

            await _minioClient.GetObjectAsync(getObjectArgs);
            memoryStream.Position = 0;

            _logger.LogInformation("Successfully downloaded widget package: {StoragePath}", storagePath);
            return memoryStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download widget package: {StoragePath}", storagePath);
            throw;
        }
    }

    public async Task DeleteWidgetPackageAsync(string storagePath)
    {
        try
        {
            _logger.LogInformation("Deleting widget package from MinIO: {StoragePath}", storagePath);

            var removeObjectArgs = new RemoveObjectArgs()
                .WithBucket(BucketName)
                .WithObject(storagePath);

            await _minioClient.RemoveObjectAsync(removeObjectArgs);

            _logger.LogInformation("Successfully deleted widget package: {StoragePath}", storagePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete widget package: {StoragePath}", storagePath);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string storagePath)
    {
        try
        {
            var statObjectArgs = new StatObjectArgs()
                .WithBucket(BucketName)
                .WithObject(storagePath);

            await _minioClient.StatObjectAsync(statObjectArgs);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task EnsureBucketExistsAsync()
    {
        try
        {
            var beArgs = new BucketExistsArgs()
                .WithBucket(BucketName);

            bool found = await _minioClient.BucketExistsAsync(beArgs);
            
            if (!found)
            {
                var mbArgs = new MakeBucketArgs()
                    .WithBucket(BucketName);
                
                await _minioClient.MakeBucketAsync(mbArgs);
                _logger.LogInformation("Created MinIO bucket: {BucketName}", BucketName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to ensure MinIO bucket exists: {BucketName}", BucketName);
            throw;
        }
    }
}
