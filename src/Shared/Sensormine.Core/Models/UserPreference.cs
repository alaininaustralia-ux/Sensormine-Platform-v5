namespace Sensormine.Core.Models;

/// <summary>
/// User preferences stored in the database
/// </summary>
public class UserPreference : BaseEntity
{
    /// <summary>
    /// User ID (from authentication system)
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Display preferences (theme, language, timezone, etc.) stored as JSON
    /// </summary>
    public string DisplayPreferences { get; set; } = "{}";

    /// <summary>
    /// Notification preferences (desktop, email, sound, etc.) stored as JSON
    /// </summary>
    public string NotificationPreferences { get; set; } = "{}";

    /// <summary>
    /// Dashboard preferences (auto-refresh, default dashboard, etc.) stored as JSON
    /// </summary>
    public string DashboardPreferences { get; set; } = "{}";

    /// <summary>
    /// Data preferences (page size, units, decimal places, etc.) stored as JSON
    /// </summary>
    public string DataPreferences { get; set; } = "{}";

    /// <summary>
    /// Favorite items (dashboards, devices, device types) stored as JSON
    /// </summary>
    public string Favorites { get; set; } = "{}";

    /// <summary>
    /// Recently viewed items stored as JSON
    /// </summary>
    public string RecentlyViewed { get; set; } = "{}";

    /// <summary>
    /// User bookmarks (favorite pages) stored as JSON array
    /// </summary>
    public string Bookmarks { get; set; } = "[]";

    /// <summary>
    /// Page visit history stored as JSON array
    /// </summary>
    public string PageHistory { get; set; } = "[]";
}
