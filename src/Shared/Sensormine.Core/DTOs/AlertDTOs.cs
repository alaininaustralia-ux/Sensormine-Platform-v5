using Sensormine.Core.Models;

namespace Sensormine.Core.DTOs;

/// <summary>
/// DTO for creating an alert rule
/// </summary>
public class CreateAlertRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AlertSeverity Severity { get; set; }
    public AlertTargetType TargetType { get; set; }
    public List<Guid> DeviceTypeIds { get; set; } = new();
    public List<Guid> DeviceIds { get; set; } = new();
    public List<AlertConditionDto> Conditions { get; set; } = new();
    public string ConditionLogic { get; set; } = "AND";
    public int TimeWindowSeconds { get; set; } = 60;
    public int EvaluationFrequencySeconds { get; set; } = 30;
    public List<string> DeliveryChannels { get; set; } = new();
    public List<string> Recipients { get; set; } = new();
    public bool IsEnabled { get; set; } = true;
    public EscalationRuleDto? EscalationRule { get; set; }
    public int CooldownMinutes { get; set; } = 5;
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// DTO for updating an alert rule
/// </summary>
public class UpdateAlertRuleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public AlertSeverity? Severity { get; set; }
    public AlertTargetType? TargetType { get; set; }
    public List<Guid>? DeviceTypeIds { get; set; }
    public List<Guid>? DeviceIds { get; set; }
    public List<AlertConditionDto>? Conditions { get; set; }
    public string? ConditionLogic { get; set; }
    public int? TimeWindowSeconds { get; set; }
    public int? EvaluationFrequencySeconds { get; set; }
    public List<string>? DeliveryChannels { get; set; }
    public List<string>? Recipients { get; set; }
    public bool? IsEnabled { get; set; }
    public EscalationRuleDto? EscalationRule { get; set; }
    public int? CooldownMinutes { get; set; }
    public List<string>? Tags { get; set; }
}

/// <summary>
/// DTO for alert rule response
/// </summary>
public class AlertRuleDto
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AlertSeverity Severity { get; set; }
    public AlertTargetType TargetType { get; set; }
    public List<Guid> DeviceTypeIds { get; set; } = new();
    public List<Guid> DeviceIds { get; set; } = new();
    public List<AlertConditionDto> Conditions { get; set; } = new();
    public string ConditionLogic { get; set; } = string.Empty;
    public int TimeWindowSeconds { get; set; }
    public int EvaluationFrequencySeconds { get; set; }
    public List<string> DeliveryChannels { get; set; } = new();
    public List<string> Recipients { get; set; } = new();
    public bool IsEnabled { get; set; }
    public EscalationRuleDto? EscalationRule { get; set; }
    public int CooldownMinutes { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    public static AlertRuleDto FromEntity(AlertRule rule)
    {
        return new AlertRuleDto
        {
            Id = rule.Id,
            TenantId = rule.TenantId,
            Name = rule.Name,
            Description = rule.Description,
            Severity = rule.Severity,
            TargetType = rule.TargetType,
            DeviceTypeIds = rule.DeviceTypeIds,
            DeviceIds = rule.DeviceIds,
            Conditions = rule.Conditions.Select(c => new AlertConditionDto
            {
                Field = c.Field,
                Operator = c.Operator,
                Value = c.Value,
                SecondValue = c.SecondValue,
                Unit = c.Unit,
                Level = c.Level
            }).ToList(),
            ConditionLogic = rule.ConditionLogic,
            TimeWindowSeconds = rule.TimeWindowSeconds,
            EvaluationFrequencySeconds = rule.EvaluationFrequencySeconds,
            DeliveryChannels = rule.DeliveryChannels,
            Recipients = rule.Recipients,
            IsEnabled = rule.IsEnabled,
            EscalationRule = rule.EscalationRule != null ? new EscalationRuleDto
            {
                EscalateAfterMinutes = rule.EscalationRule.EscalateAfterMinutes,
                EscalationChannels = rule.EscalationRule.EscalationChannels,
                EscalationRecipients = rule.EscalationRule.EscalationRecipients,
                EscalationMessage = rule.EscalationRule.EscalationMessage
            } : null,
            CooldownMinutes = rule.CooldownMinutes,
            Tags = rule.Tags,
            CreatedAt = rule.CreatedAt,
            UpdatedAt = rule.UpdatedAt
        };
    }
}

/// <summary>
/// DTO for alert condition
/// </summary>
public class AlertConditionDto
{
    public string Field { get; set; } = string.Empty;
    public AlertOperator Operator { get; set; }
    public object Value { get; set; } = null!;
    public object? SecondValue { get; set; }
    public string? Unit { get; set; }
    public AlertSeverity Level { get; set; } = AlertSeverity.Warning;
}

/// <summary>
/// DTO for escalation rule
/// </summary>
public class EscalationRuleDto
{
    public int EscalateAfterMinutes { get; set; }
    public List<string> EscalationChannels { get; set; } = new();
    public List<string> EscalationRecipients { get; set; } = new();
    public string? EscalationMessage { get; set; }
}

/// <summary>
/// DTO for alert instance response
/// </summary>
public class AlertInstanceDto
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public Guid AlertRuleId { get; set; }
    public string AlertRuleName { get; set; } = string.Empty;
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public AlertSeverity Severity { get; set; }
    public AlertStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public Dictionary<string, object> FieldValues { get; set; } = new();
    public DateTimeOffset TriggeredAt { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }
    public string? AcknowledgedBy { get; set; }
    public string? AcknowledgmentNotes { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public bool IsEscalated { get; set; }
    public DateTimeOffset? EscalatedAt { get; set; }
    public int NotificationCount { get; set; }
    public DateTimeOffset? LastNotificationAt { get; set; }

    public static AlertInstanceDto FromEntity(AlertInstance instance)
    {
        return new AlertInstanceDto
        {
            Id = instance.Id,
            TenantId = instance.TenantId,
            AlertRuleId = instance.AlertRuleId,
            AlertRuleName = instance.AlertRule?.Name ?? string.Empty,
            DeviceId = instance.DeviceId,
            DeviceName = instance.Device?.Name ?? string.Empty,
            Severity = instance.Severity,
            Status = instance.Status,
            Message = instance.Message,
            Details = instance.Details,
            FieldValues = instance.FieldValues,
            TriggeredAt = instance.TriggeredAt,
            AcknowledgedAt = instance.AcknowledgedAt,
            AcknowledgedBy = instance.AcknowledgedBy,
            AcknowledgmentNotes = instance.AcknowledgmentNotes,
            ResolvedAt = instance.ResolvedAt,
            ResolutionNotes = instance.ResolutionNotes,
            IsEscalated = instance.IsEscalated,
            EscalatedAt = instance.EscalatedAt,
            NotificationCount = instance.NotificationCount,
            LastNotificationAt = instance.LastNotificationAt
        };
    }
}

/// <summary>
/// DTO for acknowledging an alert
/// </summary>
public class AcknowledgeAlertRequest
{
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for resolving an alert
/// </summary>
public class ResolveAlertRequest
{
    public string? ResolutionNotes { get; set; }
}

/// <summary>
/// DTO for creating an alert delivery channel
/// </summary>
public class CreateAlertDeliveryChannelRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DeliveryChannelType Type { get; set; }
    public bool IsEnabled { get; set; } = true;
    public Dictionary<string, object> Configuration { get; set; } = new();
    public string? MessageTemplate { get; set; }
    public bool UseDefaultTemplate { get; set; } = true;
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// DTO for alert delivery channel response
/// </summary>
public class AlertDeliveryChannelDto
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DeliveryChannelType Type { get; set; }
    public bool IsEnabled { get; set; }
    public Dictionary<string, object> Configuration { get; set; } = new();
    public string? MessageTemplate { get; set; }
    public bool UseDefaultTemplate { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    public static AlertDeliveryChannelDto FromEntity(AlertDeliveryChannel channel)
    {
        return new AlertDeliveryChannelDto
        {
            Id = channel.Id,
            TenantId = channel.TenantId,
            Name = channel.Name,
            Description = channel.Description,
            Type = channel.Type,
            IsEnabled = channel.IsEnabled,
            Configuration = channel.Configuration,
            MessageTemplate = channel.MessageTemplate,
            UseDefaultTemplate = channel.UseDefaultTemplate,
            Tags = channel.Tags,
            CreatedAt = channel.CreatedAt,
            UpdatedAt = channel.UpdatedAt
        };
    }
}
