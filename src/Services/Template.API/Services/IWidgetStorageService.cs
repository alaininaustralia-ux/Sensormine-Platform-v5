namespace Template.API.Services;

/// <summary>
/// Interface for widget package storage operations
/// </summary>
public interface IWidgetStorageService
{
    /// <summary>
    /// Upload a widget package to storage
    /// </summary>
    Task<string> UploadWidgetPackageAsync(Guid tenantId, string widgetId, string version, Stream packageStream, string fileName);

    /// <summary>
    /// Download a widget package from storage
    /// </summary>
    Task<Stream> DownloadWidgetPackageAsync(string storagePath);

    /// <summary>
    /// Delete a widget package from storage
    /// </summary>
    Task DeleteWidgetPackageAsync(string storagePath);

    /// <summary>
    /// Check if a widget package exists
    /// </summary>
    Task<bool> ExistsAsync(string storagePath);
}
