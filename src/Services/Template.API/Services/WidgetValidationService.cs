using System.IO.Compression;
using System.Text.Json;
using Template.API.Models;

namespace Template.API.Services;

public class WidgetValidationService : IWidgetValidationService
{
    private readonly ILogger<WidgetValidationService> _logger;
    private const long MaxPackageSizeBytes = 5 * 1024 * 1024; // 5MB
    private static readonly string[] AllowedPermissions = { "api.query", "api.devices" };
    private static readonly string[] RequiredFiles = { "manifest.json", "index.js" };

    public WidgetValidationService(ILogger<WidgetValidationService> logger)
    {
        _logger = logger;
    }

    public async Task<(bool IsValid, List<string> Errors, WidgetManifest? Manifest)> ValidateWidgetPackageAsync(Stream packageStream)
    {
        var errors = new List<string>();
        WidgetManifest? manifest = null;

        try
        {
            // Check file size
            if (packageStream.Length > MaxPackageSizeBytes)
            {
                errors.Add($"Package size ({packageStream.Length} bytes) exceeds maximum allowed size ({MaxPackageSizeBytes} bytes)");
                return (false, errors, null);
            }

            // Validate ZIP structure
            using var archive = new ZipArchive(packageStream, ZipArchiveMode.Read, leaveOpen: true);
            
            // Check for required files
            foreach (var requiredFile in RequiredFiles)
            {
                if (archive.Entries.All(e => e.FullName != requiredFile))
                {
                    errors.Add($"Missing required file: {requiredFile}");
                }
            }

            if (errors.Any())
            {
                return (false, errors, null);
            }

            // Extract and validate manifest
            var manifestEntry = archive.GetEntry("manifest.json");
            if (manifestEntry == null)
            {
                errors.Add("manifest.json not found in package");
                return (false, errors, null);
            }

            using var manifestStream = manifestEntry.Open();
            using var reader = new StreamReader(manifestStream);
            var manifestJson = await reader.ReadToEndAsync();

            try
            {
                manifest = JsonSerializer.Deserialize<WidgetManifest>(manifestJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (manifest == null)
                {
                    errors.Add("Failed to parse manifest.json");
                    return (false, errors, null);
                }

                // Validate manifest fields
                ValidateManifest(manifest, errors);

                // Validate permissions
                ValidatePermissions(manifest, errors);

                // Check for malicious patterns in entry point
                await ValidateEntryPointAsync(archive, manifest.EntryPoint, errors);
            }
            catch (JsonException ex)
            {
                errors.Add($"Invalid JSON in manifest.json: {ex.Message}");
                return (false, errors, null);
            }

            return (!errors.Any(), errors, manifest);
        }
        catch (InvalidDataException)
        {
            errors.Add("Invalid ZIP file format");
            return (false, errors, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during widget package validation");
            errors.Add($"Validation error: {ex.Message}");
            return (false, errors, null);
        }
    }

    public (bool IsValid, List<string> Errors) ValidateManifest(WidgetManifest manifest)
    {
        var errors = new List<string>();
        ValidateManifest(manifest, errors);
        return (!errors.Any(), errors);
    }

    private void ValidateManifest(WidgetManifest manifest, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(manifest.Id))
            errors.Add("Manifest 'id' is required");
        
        if (string.IsNullOrWhiteSpace(manifest.Name))
            errors.Add("Manifest 'name' is required");
        
        if (string.IsNullOrWhiteSpace(manifest.Version))
            errors.Add("Manifest 'version' is required");
        
        if (string.IsNullOrWhiteSpace(manifest.EntryPoint))
            errors.Add("Manifest 'entryPoint' is required");

        // Validate widget ID format (reverse domain notation)
        if (!string.IsNullOrWhiteSpace(manifest.Id) && !IsValidWidgetId(manifest.Id))
        {
            errors.Add("Widget ID must be in reverse domain format (e.g., com.example.widget-name)");
        }

        // Validate version format (semantic versioning)
        if (!string.IsNullOrWhiteSpace(manifest.Version) && !IsValidVersion(manifest.Version))
        {
            errors.Add("Version must follow semantic versioning (e.g., 1.0.0)");
        }
    }

    private void ValidatePermissions(WidgetManifest manifest, List<string> errors)
    {
        if (manifest.Permissions?.Apis != null)
        {
            foreach (var apiPermission in manifest.Permissions.Apis)
            {
                if (!AllowedPermissions.Contains(apiPermission))
                {
                    errors.Add($"Permission '{apiPermission}' is not allowed. Allowed permissions: {string.Join(", ", AllowedPermissions)}");
                }
            }
        }
    }

    private async Task ValidateEntryPointAsync(ZipArchive archive, string entryPoint, List<string> errors)
    {
        var entryPointFile = archive.GetEntry(entryPoint);
        if (entryPointFile == null)
        {
            errors.Add($"Entry point file '{entryPoint}' not found in package");
            return;
        }

        // Basic security check - look for suspicious patterns
        using var stream = entryPointFile.Open();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync();

        // Check file size
        if (content.Length > 1024 * 1024) // 1MB for entry point
        {
            errors.Add($"Entry point file '{entryPoint}' is too large");
        }

        // Very basic security checks (could be enhanced)
        var suspiciousPatterns = new[] { "eval(", "Function(", "document.write", "<script", "dangerouslySetInnerHTML" };
        foreach (var pattern in suspiciousPatterns)
        {
            if (content.Contains(pattern, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Suspicious pattern '{Pattern}' found in entry point", pattern);
                // Note: Don't block, just warn for now (auto-publish mode)
            }
        }
    }

    private bool IsValidWidgetId(string widgetId)
    {
        // Simple validation: must contain at least one dot and only alphanumeric, dots, and hyphens
        return widgetId.Contains('.') && widgetId.All(c => char.IsLetterOrDigit(c) || c == '.' || c == '-');
    }

    private bool IsValidVersion(string version)
    {
        // Basic semantic versioning check: X.Y.Z
        var parts = version.Split('.');
        return parts.Length == 3 && parts.All(p => int.TryParse(p, out _));
    }
}
