namespace Sensormine.Core.Models;

/// <summary>
/// Global site configuration stored in the database
/// </summary>
public class SiteConfiguration : BaseEntity
{
    /// <summary>
    /// Configuration key (should be 'default' for single config)
    /// </summary>
    public string ConfigKey { get; set; } = "default";

    /// <summary>
    /// Site settings (name, logo, theme) stored as JSON
    /// </summary>
    public string SiteSettings { get; set; } = "{}";

    /// <summary>
    /// Feature flags (enable/disable features) stored as JSON
    /// </summary>
    public string Features { get; set; } = "{}";

    /// <summary>
    /// Resource limits (max dashboards, devices, etc.) stored as JSON
    /// </summary>
    public string Limits { get; set; } = "{}";

    /// <summary>
    /// Default values (refresh interval, timezone, etc.) stored as JSON
    /// </summary>
    public string Defaults { get; set; } = "{}";

    /// <summary>
    /// Integration settings (MQTT, HTTP, etc.) stored as JSON
    /// </summary>
    public string Integrations { get; set; } = "{}";

    /// <summary>
    /// Last updated timestamp
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// User ID who last updated the configuration
    /// </summary>
    public string UpdatedBy { get; set; } = string.Empty;
}
