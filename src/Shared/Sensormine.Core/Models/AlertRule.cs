namespace Sensormine.Core.Models;

/// <summary>
/// Represents an alert rule that can be applied to devices or device types
/// </summary>
public class AlertRule : BaseEntity
{
    /// <summary>
    /// Name of the alert rule
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of what this alert monitors
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Alert severity level
    /// </summary>
    public AlertSeverity Severity { get; set; }

    /// <summary>
    /// Selection type: DeviceType or Device
    /// </summary>
    public AlertTargetType TargetType { get; set; }

    /// <summary>
    /// Device Type IDs if TargetType is DeviceType (multiple allowed)
    /// </summary>
    public List<Guid> DeviceTypeIds { get; set; } = new();

    /// <summary>
    /// Device IDs if TargetType is Device (multiple allowed)
    /// </summary>
    public List<Guid> DeviceIds { get; set; } = new();

    /// <summary>
    /// Alert conditions and logic
    /// </summary>
    public List<AlertCondition> Conditions { get; set; } = new();

    /// <summary>
    /// How conditions are combined (AND or OR)
    /// </summary>
    public string ConditionLogic { get; set; } = "AND";

    /// <summary>
    /// Time window for evaluation (in seconds)
    /// </summary>
    public int TimeWindowSeconds { get; set; } = 60;

    /// <summary>
    /// Evaluation frequency (in seconds)
    /// </summary>
    public int EvaluationFrequencySeconds { get; set; } = 30;

    /// <summary>
    /// Delivery channels for this alert
    /// </summary>
    public List<string> DeliveryChannels { get; set; } = new(); // email, sms, webhook, teams

    /// <summary>
    /// Alert recipients (email addresses, phone numbers, webhook URLs)
    /// </summary>
    public List<string> Recipients { get; set; } = new();

    /// <summary>
    /// Whether this rule is currently active
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Escalation rules if alert is not acknowledged
    /// </summary>
    public EscalationRule? EscalationRule { get; set; }

    /// <summary>
    /// Cooldown period after alert fires (in minutes)
    /// </summary>
    public int CooldownMinutes { get; set; } = 5;

    /// <summary>
    /// Tags for categorization
    /// </summary>
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// Alert target type
/// </summary>
public enum AlertTargetType
{
    /// <summary>
    /// Alert applies to one or more device types
    /// </summary>
    DeviceType,

    /// <summary>
    /// Alert applies to specific individual devices
    /// </summary>
    Device
}

