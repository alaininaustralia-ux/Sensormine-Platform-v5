using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.DTOs;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Models;

namespace Alerts.API.Controllers;

/// <summary>
/// Controller for alert rule management
/// </summary>
[ApiController]
[Route("api/alert-rules")]
public class AlertRuleController : ControllerBase
{
    private readonly IAlertRuleRepository _repository;
    private readonly ILogger<AlertRuleController> _logger;

    public AlertRuleController(IAlertRuleRepository repository, ILogger<AlertRuleController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get tenant ID from headers (temporary implementation)
    /// </summary>
    private string GetTenantId() => Request.Headers["X-Tenant-Id"].FirstOrDefault() ?? "00000000-0000-0000-0000-000000000001";

    /// <summary>
    /// Get user ID from headers (temporary implementation)
    /// </summary>
    private string GetUserId() => Request.Headers["X-User-Id"].FirstOrDefault() ?? "system";

    /// <summary>
    /// Get all alert rules with pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertRules(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var (rules, totalCount) = await _repository.GetAllAsync(tenantId, page, pageSize, search);

            var dtos = rules.Select(AlertRuleDto.FromEntity).ToList();

            return Ok(new
            {
                data = dtos,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert rules");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get alert rule by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAlertRule(Guid id)
    {
        try
        {
            var rule = await _repository.GetByIdAsync(id);
            if (rule == null)
            {
                return NotFound(new { error = "Alert rule not found" });
            }

            var tenantId = GetTenantId();
            if (rule.TenantId != tenantId)
            {
                return NotFound(new { error = "Alert rule not found" });
            }

            return Ok(AlertRuleDto.FromEntity(rule));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert rule {RuleId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Create a new alert rule
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAlertRule([FromBody] CreateAlertRuleRequest request)
    {
        try
        {
            var tenantId = GetTenantId();

            var rule = new AlertRule
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = request.Name,
                Description = request.Description,
                Severity = request.Severity,
                TargetType = request.TargetType,
                DeviceTypeIds = request.DeviceTypeIds,
                DeviceIds = request.DeviceIds,
                Conditions = request.Conditions.Select(c => new AlertCondition
                {
                    Field = c.Field,
                    Operator = c.Operator,
                    Value = c.Value,
                    SecondValue = c.SecondValue,
                    Unit = c.Unit,
                    Level = c.Level
                }).ToList(),
                ConditionLogic = request.ConditionLogic,
                TimeWindowSeconds = request.TimeWindowSeconds,
                EvaluationFrequencySeconds = request.EvaluationFrequencySeconds,
                DeliveryChannels = request.DeliveryChannels,
                Recipients = request.Recipients,
                IsEnabled = request.IsEnabled,
                EscalationRule = request.EscalationRule != null ? new EscalationRule
                {
                    EscalateAfterMinutes = request.EscalationRule.EscalateAfterMinutes,
                    EscalationChannels = request.EscalationRule.EscalationChannels,
                    EscalationRecipients = request.EscalationRule.EscalationRecipients,
                    EscalationMessage = request.EscalationRule.EscalationMessage
                } : null,
                CooldownMinutes = request.CooldownMinutes,
                Tags = request.Tags
            };

            var created = await _repository.AddAsync(rule);

            return CreatedAtAction(
                nameof(GetAlertRule),
                new { id = created.Id },
                AlertRuleDto.FromEntity(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating alert rule");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Update an alert rule
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAlertRule(Guid id, [FromBody] UpdateAlertRuleRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var rule = await _repository.GetByIdAsync(id);

            if (rule == null || rule.TenantId != tenantId)
            {
                return NotFound(new { error = "Alert rule not found" });
            }

            // Update only provided fields
            if (request.Name != null) rule.Name = request.Name;
            if (request.Description != null) rule.Description = request.Description;
            if (request.Severity.HasValue) rule.Severity = request.Severity.Value;
            if (request.TargetType.HasValue) rule.TargetType = request.TargetType.Value;
            if (request.DeviceTypeIds != null) rule.DeviceTypeIds = request.DeviceTypeIds;
            if (request.DeviceIds != null) rule.DeviceIds = request.DeviceIds;
            if (request.Conditions != null)
            {
                rule.Conditions = request.Conditions.Select(c => new AlertCondition
                {
                    Field = c.Field,
                    Operator = c.Operator,
                    Value = c.Value,
                    SecondValue = c.SecondValue,
                    Unit = c.Unit,
                    Level = c.Level
                }).ToList();
            }
            if (request.ConditionLogic != null) rule.ConditionLogic = request.ConditionLogic;
            if (request.TimeWindowSeconds.HasValue) rule.TimeWindowSeconds = request.TimeWindowSeconds.Value;
            if (request.EvaluationFrequencySeconds.HasValue) rule.EvaluationFrequencySeconds = request.EvaluationFrequencySeconds.Value;
            if (request.DeliveryChannels != null) rule.DeliveryChannels = request.DeliveryChannels;
            if (request.Recipients != null) rule.Recipients = request.Recipients;
            if (request.IsEnabled.HasValue) rule.IsEnabled = request.IsEnabled.Value;
            if (request.EscalationRule != null)
            {
                rule.EscalationRule = new EscalationRule
                {
                    EscalateAfterMinutes = request.EscalationRule.EscalateAfterMinutes,
                    EscalationChannels = request.EscalationRule.EscalationChannels,
                    EscalationRecipients = request.EscalationRule.EscalationRecipients,
                    EscalationMessage = request.EscalationRule.EscalationMessage
                };
            }
            if (request.CooldownMinutes.HasValue) rule.CooldownMinutes = request.CooldownMinutes.Value;
            if (request.Tags != null) rule.Tags = request.Tags;

            await _repository.UpdateAsync(rule);

            return Ok(AlertRuleDto.FromEntity(rule));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating alert rule {RuleId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete an alert rule
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAlertRule(Guid id)
    {
        try
        {
            var tenantId = GetTenantId();
            var rule = await _repository.GetByIdAsync(id);

            if (rule == null || rule.TenantId != tenantId)
            {
                return NotFound(new { error = "Alert rule not found" });
            }

            await _repository.DeleteAsync(id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting alert rule {RuleId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get alert rules by device type
    /// </summary>
    [HttpGet("by-device-type/{deviceTypeId}")]
    [ProducesResponseType(typeof(List<AlertRuleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertRulesByDeviceType(Guid deviceTypeId)
    {
        try
        {
            var tenantId = GetTenantId();
            var rules = await _repository.GetByDeviceTypeIdAsync(tenantId, deviceTypeId);
            var dtos = rules.Select(AlertRuleDto.FromEntity).ToList();

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert rules for device type {DeviceTypeId}", deviceTypeId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get alert rules by device
    /// </summary>
    [HttpGet("by-device/{deviceId}")]
    [ProducesResponseType(typeof(List<AlertRuleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertRulesByDevice(Guid deviceId)
    {
        try
        {
            var tenantId = GetTenantId();
            var rules = await _repository.GetByDeviceIdAsync(tenantId, deviceId);
            var dtos = rules.Select(AlertRuleDto.FromEntity).ToList();

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert rules for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
