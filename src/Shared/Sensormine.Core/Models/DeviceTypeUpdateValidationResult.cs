namespace Sensormine.Core.Models;

/// <summary>
/// Result of validating a Device Type update for breaking changes
/// </summary>
public class DeviceTypeUpdateValidationResult
{
    /// <summary>
    /// Whether the update is considered safe (no breaking changes)
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// List of breaking changes detected
    /// </summary>
    public List<string> BreakingChanges { get; set; } = new();

    /// <summary>
    /// List of non-breaking warnings
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Number of devices that will be affected by this update
    /// </summary>
    public int AffectedDeviceCount { get; set; }

    /// <summary>
    /// Recommended actions to take before applying the update
    /// </summary>
    public List<string> RecommendedActions { get; set; } = new();
}
