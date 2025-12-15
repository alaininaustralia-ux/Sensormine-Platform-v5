using Template.API.Models;

namespace Template.API.Services;

/// <summary>
/// Interface for widget package validation
/// </summary>
public interface IWidgetValidationService
{
    /// <summary>
    /// Validate a widget package
    /// </summary>
    /// <returns>Tuple of (isValid, errors, manifest)</returns>
    Task<(bool IsValid, List<string> Errors, WidgetManifest? Manifest)> ValidateWidgetPackageAsync(Stream packageStream);

    /// <summary>
    /// Validate widget manifest
    /// </summary>
    (bool IsValid, List<string> Errors) ValidateManifest(WidgetManifest manifest);
}
