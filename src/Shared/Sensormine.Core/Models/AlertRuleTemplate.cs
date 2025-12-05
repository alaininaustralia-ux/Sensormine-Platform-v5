namespace Sensormine.Core.Models;

/// <summary>
/// Represents an alert rule template for a device type
/// </summary>
public class AlertRuleTemplate
{
    /// <summary>
    /// Unique identifier for the template
    /// </summary>
    public Guid Id { get; set; }

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
    public List<string> DeliveryChannels { get; set; } = new(); // email, sms, webhook, etc.

    /// <summary>
    /// Whether this template is enabled by default for new devices
    /// </summary>
    public bool EnabledByDefault { get; set; } = true;

    /// <summary>
    /// Escalation rules if alert is not acknowledged
    /// </summary>
    public EscalationRule? EscalationRule { get; set; }
}

/// <summary>
/// Alert severity levels
/// </summary>
public enum AlertSeverity
{
    Info,
    Warning,
    Critical
}

/// <summary>
/// Represents a single alert condition
/// </summary>
public class AlertCondition
{
    /// <summary>
    /// Field name from schema or custom fields
    /// </summary>
    public string Field { get; set; } = string.Empty;

    /// <summary>
    /// Comparison operator
    /// </summary>
    public string Operator { get; set; } = string.Empty; // >, <, =, !=, between, contains, etc.

    /// <summary>
    /// Threshold value(s)
    /// </summary>
    public object Value { get; set; } = null!;

    /// <summary>
    /// Optional second value for 'between' operator
    /// </summary>
    public object? SecondValue { get; set; }

    /// <summary>
    /// Unit of measurement (for display purposes)
    /// </summary>
    public string? Unit { get; set; }
}

/// <summary>
/// Escalation rule for unacknowledged alerts
/// </summary>
public class EscalationRule
{
    /// <summary>
    /// Minutes to wait before escalating
    /// </summary>
    public int EscalateAfterMinutes { get; set; }

    /// <summary>
    /// Additional delivery channels for escalation
    /// </summary>
    public List<string> EscalationChannels { get; set; } = new();

    /// <summary>
    /// Message to include in escalation notification
    /// </summary>
    public string? EscalationMessage { get; set; }
}
