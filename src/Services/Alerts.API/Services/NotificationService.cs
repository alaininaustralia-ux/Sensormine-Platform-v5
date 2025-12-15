using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Sensormine.Core.Models;

namespace Alerts.API.Services;

/// <summary>
/// Configuration for notification channels
/// </summary>
public class NotificationSettings
{
    public EmailSettings Email { get; set; } = new();
    public WebhookSettings Webhook { get; set; } = new();
    public SmsSettings Sms { get; set; } = new();
    public SignalRSettings SignalR { get; set; } = new();
}

public class EmailSettings
{
    public string SmtpServer { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public string FromAddress { get; set; } = "alerts@sensormine.com";
    public string FromName { get; set; } = "Sensormine Alerts";
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public bool EnableSsl { get; set; } = true;
}

public class WebhookSettings
{
    public int TimeoutSeconds { get; set; } = 30;
    public int MaxRetries { get; set; } = 3;
}

public class SmsSettings
{
    public string Provider { get; set; } = "twilio"; // twilio, aws-sns
    public string AccountSid { get; set; } = "";
    public string AuthToken { get; set; } = "";
    public string FromNumber { get; set; } = "";
}

public class SignalRSettings
{
    public string HubUrl { get; set; } = "/hubs/notifications";
}

/// <summary>
/// Implementation of notification service
/// </summary>
public class NotificationService : INotificationService
{
    private readonly NotificationSettings _settings;
    private readonly ILogger<NotificationService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public NotificationService(
        IOptions<NotificationSettings> settings,
        ILogger<NotificationService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task SendAlertNotificationAsync(
        AlertInstance instance,
        AlertRule rule,
        CancellationToken cancellationToken = default)
    {
        var tasks = new List<Task>();

        // Send to all configured channels
        if (rule.DeliveryChannels.Contains("email", StringComparer.OrdinalIgnoreCase))
        {
            var emailRecipients = rule.Recipients.Where(r => r.Contains("@")).ToList();
            if (emailRecipients.Any())
            {
                tasks.Add(SendEmailAsync(instance, rule, emailRecipients, cancellationToken));
            }
        }

        if (rule.DeliveryChannels.Contains("webhook", StringComparer.OrdinalIgnoreCase))
        {
            var webhookUrls = rule.Recipients.Where(r => r.StartsWith("http", StringComparison.OrdinalIgnoreCase)).ToList();
            if (webhookUrls.Any())
            {
                tasks.Add(SendWebhookAsync(instance, rule, webhookUrls, cancellationToken));
            }
        }

        if (rule.DeliveryChannels.Contains("sms", StringComparer.OrdinalIgnoreCase))
        {
            var phoneNumbers = rule.Recipients.Where(r => r.StartsWith("+") || r.All(char.IsDigit)).ToList();
            if (phoneNumbers.Any())
            {
                tasks.Add(SendSmsAsync(instance, rule, phoneNumbers, cancellationToken));
            }
        }

        if (rule.DeliveryChannels.Contains("inapp", StringComparer.OrdinalIgnoreCase))
        {
            tasks.Add(SendInAppNotificationAsync(instance, rule, cancellationToken));
        }

        await Task.WhenAll(tasks);
    }

    public async Task SendEmailAsync(
        AlertInstance instance,
        AlertRule rule,
        List<string> recipients,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var subject = $"[{instance.Severity}] {rule.Name}";
            var body = BuildEmailBody(instance, rule);

            // TODO: Implement actual SMTP email sending
            // For now, just log
            _logger.LogInformation(
                "Email notification: To={Recipients}, Subject={Subject}",
                string.Join(", ", recipients),
                subject);

            // Simulated email sending
            await Task.Delay(100, cancellationToken);

            /* Actual implementation would use MailKit or similar:
            using var client = new SmtpClient();
            await client.ConnectAsync(_settings.Email.SmtpServer, _settings.Email.SmtpPort, 
                _settings.Email.EnableSsl, cancellationToken);
            await client.AuthenticateAsync(_settings.Email.Username, _settings.Email.Password, cancellationToken);
            
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.Email.FromName, _settings.Email.FromAddress));
            foreach (var recipient in recipients)
            {
                message.To.Add(MailboxAddress.Parse(recipient));
            }
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };
            
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
            */
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email notification for alert {InstanceId}", instance.Id);
        }
    }

    public async Task SendWebhookAsync(
        AlertInstance instance,
        AlertRule rule,
        List<string> webhookUrls,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new
            {
                alertId = instance.Id,
                ruleId = rule.Id,
                ruleName = rule.Name,
                severity = instance.Severity.ToString(),
                status = instance.Status.ToString(),
                message = instance.Message,
                details = instance.Details,
                deviceId = instance.DeviceId,
                triggeredAt = instance.TriggeredAt,
                fieldValues = instance.FieldValues
            };

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(_settings.Webhook.TimeoutSeconds);

            var tasks = webhookUrls.Select(async url =>
            {
                try
                {
                    var response = await client.PostAsJsonAsync(url, payload, cancellationToken);
                    response.EnsureSuccessStatusCode();

                    _logger.LogInformation(
                        "Webhook notification sent successfully: URL={Url}, AlertId={AlertId}",
                        url, instance.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send webhook notification to {Url}", url);
                }
            });

            await Task.WhenAll(tasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send webhook notifications for alert {InstanceId}", instance.Id);
        }
    }

    public async Task SendSmsAsync(
        AlertInstance instance,
        AlertRule rule,
        List<string> phoneNumbers,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var message = $"[{instance.Severity}] {rule.Name}: {instance.Message}";

            // TODO: Implement actual SMS sending via Twilio or AWS SNS
            _logger.LogInformation(
                "SMS notification: To={PhoneNumbers}, Message={Message}",
                string.Join(", ", phoneNumbers),
                message);

            // Simulated SMS sending
            await Task.Delay(100, cancellationToken);

            /* Actual implementation with Twilio:
            var client = new TwilioRestClient(_settings.Sms.AccountSid, _settings.Sms.AuthToken);
            
            foreach (var phoneNumber in phoneNumbers)
            {
                await MessageResource.CreateAsync(
                    to: new PhoneNumber(phoneNumber),
                    from: new PhoneNumber(_settings.Sms.FromNumber),
                    body: message,
                    client: client
                );
            }
            */
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS notification for alert {InstanceId}", instance.Id);
        }
    }

    public async Task SendInAppNotificationAsync(
        AlertInstance instance,
        AlertRule rule,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Implement SignalR notification
            _logger.LogInformation(
                "In-app notification: AlertId={AlertId}, TenantId={TenantId}",
                instance.Id, instance.TenantId);

            // Simulated SignalR sending
            await Task.Delay(50, cancellationToken);

            /* Actual implementation with SignalR:
            await _hubContext.Clients
                .Group($"tenant-{instance.TenantId}")
                .SendAsync("AlertTriggered", new
                {
                    alertId = instance.Id,
                    severity = instance.Severity,
                    message = instance.Message,
                    triggeredAt = instance.TriggeredAt
                }, cancellationToken);
            */
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send in-app notification for alert {InstanceId}", instance.Id);
        }
    }

    public async Task SendEscalationNotificationAsync(
        AlertInstance instance,
        AlertRule rule,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (rule.EscalationRule == null)
                return;

            _logger.LogWarning(
                "Escalating alert: AlertId={AlertId}, Rule={RuleName}",
                instance.Id, rule.Name);

            // Send to escalation channels
            var tasks = new List<Task>();

            if (rule.EscalationRule.EscalationChannels.Contains("email"))
            {
                var emailRecipients = rule.EscalationRule.EscalationRecipients
                    .Where(r => r.Contains("@")).ToList();
                if (emailRecipients.Any())
                {
                    tasks.Add(SendEmailAsync(instance, rule, emailRecipients, cancellationToken));
                }
            }

            if (rule.EscalationRule.EscalationChannels.Contains("sms"))
            {
                var phoneNumbers = rule.EscalationRule.EscalationRecipients
                    .Where(r => r.StartsWith("+") || r.All(char.IsDigit)).ToList();
                if (phoneNumbers.Any())
                {
                    tasks.Add(SendSmsAsync(instance, rule, phoneNumbers, cancellationToken));
                }
            }

            await Task.WhenAll(tasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send escalation notification for alert {InstanceId}", instance.Id);
        }
    }

    private string BuildEmailBody(AlertInstance instance, AlertRule rule)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"<html><body>");
        sb.AppendLine($"<h2 style='color: {GetSeverityColor(instance.Severity)}'>[{instance.Severity}] Alert Triggered</h2>");
        sb.AppendLine($"<p><strong>Rule:</strong> {rule.Name}</p>");
        sb.AppendLine($"<p><strong>Message:</strong> {instance.Message}</p>");
        sb.AppendLine($"<p><strong>Details:</strong> {instance.Details}</p>");
        sb.AppendLine($"<p><strong>Device ID:</strong> {instance.DeviceId}</p>");
        sb.AppendLine($"<p><strong>Triggered At:</strong> {instance.TriggeredAt:yyyy-MM-dd HH:mm:ss} UTC</p>");

        if (instance.FieldValues.Any())
        {
            sb.AppendLine($"<h3>Field Values:</h3>");
            sb.AppendLine($"<ul>");
            foreach (var field in instance.FieldValues)
            {
                sb.AppendLine($"<li><strong>{field.Key}:</strong> {field.Value}</li>");
            }
            sb.AppendLine($"</ul>");
        }

        sb.AppendLine($"</body></html>");
        return sb.ToString();
    }

    private string GetSeverityColor(AlertSeverity severity)
    {
        return severity switch
        {
            AlertSeverity.Critical => "#dc2626",
            AlertSeverity.Warning => "#f59e0b",
            AlertSeverity.Info => "#3b82f6",
            _ => "#6b7280"
        };
    }
}
