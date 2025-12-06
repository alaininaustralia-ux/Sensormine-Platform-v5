namespace Sensormine.Core.Models;

/// <summary>
/// Represents an alert delivery channel configuration
/// </summary>
public class AlertDeliveryChannel : BaseEntity
{
    /// <summary>
    /// Name of the delivery channel
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of this channel
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Type of delivery channel
    /// </summary>
    public DeliveryChannelType Type { get; set; }

    /// <summary>
    /// Whether this channel is enabled
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Channel-specific configuration (SMTP settings, Twilio config, webhook URLs, etc.)
    /// </summary>
    public Dictionary<string, object> Configuration { get; set; } = new();

    /// <summary>
    /// Message template for this channel
    /// </summary>
    public string? MessageTemplate { get; set; }

    /// <summary>
    /// Whether to use the default template or custom template
    /// </summary>
    public bool UseDefaultTemplate { get; set; } = true;

    /// <summary>
    /// Tags for categorization
    /// </summary>
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// Delivery channel types
/// </summary>
public enum DeliveryChannelType
{
    /// <summary>
    /// Email notifications
    /// </summary>
    Email,

    /// <summary>
    /// SMS notifications
    /// </summary>
    SMS,

    /// <summary>
    /// Microsoft Teams webhook
    /// </summary>
    Teams,

    /// <summary>
    /// Custom webhook endpoint
    /// </summary>
    Webhook,

    /// <summary>
    /// Slack webhook
    /// </summary>
    Slack,

    /// <summary>
    /// Discord webhook
    /// </summary>
    Discord
}
