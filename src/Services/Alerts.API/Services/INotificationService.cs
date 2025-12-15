using Sensormine.Core.Models;

namespace Alerts.API.Services;

/// <summary>
/// Service for sending alert notifications via various channels
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Send alert notification via all configured channels
    /// </summary>
    Task SendAlertNotificationAsync(AlertInstance instance, AlertRule rule, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send email notification
    /// </summary>
    Task SendEmailAsync(AlertInstance instance, AlertRule rule, List<string> recipients, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send webhook notification
    /// </summary>
    Task SendWebhookAsync(AlertInstance instance, AlertRule rule, List<string> webhookUrls, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send SMS notification
    /// </summary>
    Task SendSmsAsync(AlertInstance instance, AlertRule rule, List<string> phoneNumbers, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send in-app notification via SignalR
    /// </summary>
    Task SendInAppNotificationAsync(AlertInstance instance, AlertRule rule, CancellationToken cancellationToken = default);

    /// <summary>
    /// Send escalation notification
    /// </summary>
    Task SendEscalationNotificationAsync(AlertInstance instance, AlertRule rule, CancellationToken cancellationToken = default);
}
