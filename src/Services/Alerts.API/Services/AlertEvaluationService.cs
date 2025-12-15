using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;

namespace Alerts.API.Services;

/// <summary>
/// Background service that evaluates alert rules against telemetry data
/// </summary>
public class AlertEvaluationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AlertEvaluationService> _logger;
    private readonly TimeSpan _evaluationInterval = TimeSpan.FromSeconds(30);

    /// <summary>
    /// Constructor for AlertEvaluationService
    /// </summary>
    public AlertEvaluationService(
        IServiceProvider serviceProvider,
        ILogger<AlertEvaluationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// Execute the background service
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Alert Evaluation Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EvaluateAlertsAsync(stoppingToken);
                await Task.Delay(_evaluationInterval, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in alert evaluation cycle");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("Alert Evaluation Service stopped");
    }

    private async Task EvaluateAlertsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var ruleRepository = scope.ServiceProvider.GetRequiredService<IAlertRuleRepository>();
        var instanceRepository = scope.ServiceProvider.GetRequiredService<IAlertInstanceRepository>();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Get all enabled rules
        var allTenants = await context.Devices
            .Select(d => d.TenantId.ToString())
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var tenantId in allTenants)
        {
            try
            {
                var enabledRules = await ruleRepository.GetEnabledRulesAsync(tenantId);
                _logger.LogDebug("Evaluating {Count} rules for tenant {TenantId}", enabledRules.Count, tenantId);

                foreach (var rule in enabledRules)
                {
                    await EvaluateRuleAsync(rule, instanceRepository, context, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating rules for tenant {TenantId}", tenantId);
            }
        }
    }

    private async Task EvaluateRuleAsync(
        AlertRule rule,
        IAlertInstanceRepository instanceRepository,
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get devices that this rule applies to
            var deviceIds = await GetApplicableDevicesAsync(rule, context, cancellationToken);

            foreach (var deviceId in deviceIds)
            {
                // Check if there's an active alert for this device already
                var activeAlerts = await instanceRepository.GetActiveByDeviceIdAsync(
                    rule.TenantId.ToString(), deviceId);

                var hasActiveAlert = activeAlerts.Any(a => a.AlertRuleId == rule.Id);

                // Get latest telemetry for this device from Query.API
                var telemetryData = await GetLatestTelemetryAsync(deviceId, rule.TenantId, cancellationToken);
                
                if (telemetryData == null || telemetryData.Count == 0)
                {
                    // No telemetry data available, skip this device
                    continue;
                }
                
                var conditionResults = new List<bool>();
                foreach (var condition in rule.Conditions)
                {
                    var result = EvaluateCondition(condition, telemetryData);
                    conditionResults.Add(result);
                }

                // Apply condition logic (AND/OR)
                bool shouldTrigger = rule.ConditionLogic.ToUpper() == "AND"
                    ? conditionResults.All(r => r)
                    : conditionResults.Any(r => r);

                if (shouldTrigger && !hasActiveAlert)
                {
                    // Check cooldown
                    var lastAlert = await context.AlertInstances
                        .Where(i => i.AlertRuleId == rule.Id && i.DeviceId == deviceId)
                        .OrderByDescending(i => i.TriggeredAt)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (lastAlert != null)
                    {
                        var timeSinceLastAlert = DateTimeOffset.UtcNow - lastAlert.TriggeredAt;
                        if (timeSinceLastAlert.TotalMinutes < rule.CooldownMinutes)
                        {
                            continue; // Still in cooldown period
                        }
                    }

                    // Trigger alert
                    await TriggerAlertAsync(rule, deviceId, telemetryData, instanceRepository);
                }
                else if (!shouldTrigger && hasActiveAlert)
                {
                    // Auto-resolve alert if conditions no longer met
                    var activeAlert = activeAlerts.First(a => a.AlertRuleId == rule.Id);
                    await instanceRepository.ResolveAsync(
                        activeAlert.Id,
                        rule.TenantId.ToString(),
                        "Automatically resolved - conditions no longer met");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating rule {RuleId}", rule.Id);
        }
    }

    private async Task<List<Guid>> GetApplicableDevicesAsync(
        AlertRule rule,
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        if (rule.TargetType == AlertTargetType.Device)
        {
            return rule.DeviceIds;
        }
        else
        {
            // Get all devices of the specified device types
            var devices = await context.Devices
                .Where(d => d.TenantId == rule.TenantId &&
                           rule.DeviceTypeIds.Contains(d.DeviceTypeId))
                .Select(d => d.Id)
                .ToListAsync(cancellationToken);

            return devices;
        }
    }

    private bool EvaluateCondition(AlertCondition condition, Dictionary<string, object> telemetryData)
    {
        if (!telemetryData.ContainsKey(condition.Field))
        {
            return false;
        }

        var fieldValue = telemetryData[condition.Field];
        if (fieldValue == null)
        {
            return false;
        }

        // Convert values to double for comparison
        if (!TryConvertToDouble(fieldValue, out var actualValue))
        {
            return false;
        }

        if (!TryConvertToDouble(condition.Value, out var thresholdValue))
        {
            return false;
        }

        return condition.Operator switch
        {
            AlertOperator.GreaterThan => actualValue > thresholdValue,
            AlertOperator.LessThan => actualValue < thresholdValue,
            AlertOperator.Equal => Math.Abs(actualValue - thresholdValue) < 0.0001,
            AlertOperator.NotEqual => Math.Abs(actualValue - thresholdValue) >= 0.0001,
            AlertOperator.Between => CheckBetween(actualValue, thresholdValue, condition.SecondValue),
            AlertOperator.Outside => !CheckBetween(actualValue, thresholdValue, condition.SecondValue),
            _ => false
        };
    }

    private bool CheckBetween(double value, double min, object? secondValueObj)
    {
        if (secondValueObj == null || !TryConvertToDouble(secondValueObj, out var max))
        {
            return false;
        }
        return value >= min && value <= max;
    }

    private bool TryConvertToDouble(object value, out double result)
    {
        result = 0;
        try
        {
            result = Convert.ToDouble(value);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task TriggerAlertAsync(
        AlertRule rule,
        Guid deviceId,
        Dictionary<string, object> telemetryData,
        IAlertInstanceRepository instanceRepository)
    {
        try
        {
            var device = await GetDeviceNameAsync(deviceId);
            
            var instance = new AlertInstance
            {
                Id = Guid.NewGuid(),
                TenantId = rule.TenantId,
                AlertRuleId = rule.Id,
                DeviceId = deviceId,
                Severity = rule.Severity,
                Status = AlertStatus.Active,
                Message = $"Alert triggered: {rule.Name}",
                Details = rule.Description ?? string.Empty,
                FieldValues = telemetryData,
                TriggeredAt = DateTimeOffset.UtcNow,
                NotificationCount = 0
            };

            await instanceRepository.AddAsync(instance);

            _logger.LogWarning(
                "Alert triggered: Rule={RuleName}, Device={DeviceId}, Severity={Severity}",
                rule.Name, deviceId, rule.Severity);

            // Send notifications via configured channels
            using var scope = _serviceProvider.CreateScope();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            await notificationService.SendAlertNotificationAsync(instance, rule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering alert for rule {RuleId} and device {DeviceId}",
                rule.Id, deviceId);
        }
    }

    private async Task<string> GetDeviceNameAsync(Guid deviceId)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var device = await context.Devices
            .FirstOrDefaultAsync(d => d.Id == deviceId);

        return device?.Name ?? deviceId.ToString();
    }

    private async Task<Dictionary<string, object>> GetLatestTelemetryAsync(
        Guid deviceId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var client = httpClientFactory.CreateClient("QueryApi");

            // Add tenant header
            client.DefaultRequestHeaders.Remove("X-Tenant-Id");
            client.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());

            // Call Query.API to get latest telemetry from the telemetry table
            var response = await client.GetAsync(
                $"/api/timeseries/telemetry/device/{deviceId}/latest",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch telemetry for device {DeviceId}: {StatusCode}",
                    deviceId, response.StatusCode);
                return new Dictionary<string, object>();
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var telemetry = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
                content,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            return telemetry ?? new Dictionary<string, object>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching telemetry for device {DeviceId}", deviceId);
            return new Dictionary<string, object>();
        }
    }
}
