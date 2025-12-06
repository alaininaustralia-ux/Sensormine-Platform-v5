using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.DTOs;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Models;

namespace Alerts.API.Controllers;

/// <summary>
/// Controller for alert instance management
/// </summary>
[ApiController]
[Route("api/alert-instances")]
public class AlertInstanceController : ControllerBase
{
    private readonly IAlertInstanceRepository _repository;
    private readonly ILogger<AlertInstanceController> _logger;

    public AlertInstanceController(IAlertInstanceRepository repository, ILogger<AlertInstanceController> logger)
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
    /// Get all alert instances with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertInstances(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] AlertStatus? status = null,
        [FromQuery] AlertSeverity? severity = null,
        [FromQuery] Guid? deviceId = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var (instances, totalCount) = await _repository.GetAllAsync(
                tenantId, page, pageSize, status, severity, deviceId);

            var dtos = instances.Select(AlertInstanceDto.FromEntity).ToList();

            return Ok(new
            {
                data = dtos,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                },
                filters = new
                {
                    status,
                    severity,
                    deviceId
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert instances");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get alert instance by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AlertInstanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAlertInstance(Guid id)
    {
        try
        {
            var instance = await _repository.GetByIdAsync(id);
            if (instance == null)
            {
                return NotFound(new { error = "Alert instance not found" });
            }

            var tenantId = GetTenantId();
            if (instance.TenantId != tenantId)
            {
                return NotFound(new { error = "Alert instance not found" });
            }

            return Ok(AlertInstanceDto.FromEntity(instance));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert instance {InstanceId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get alert instance statistics
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(AlertInstanceStatistics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var tenantId = GetTenantId();
            var stats = await _repository.GetStatisticsAsync(tenantId);

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert instance statistics");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get active alerts for a device
    /// </summary>
    [HttpGet("active/device/{deviceId}")]
    [ProducesResponseType(typeof(List<AlertInstanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveAlertsByDevice(Guid deviceId)
    {
        try
        {
            var tenantId = GetTenantId();
            var instances = await _repository.GetActiveByDeviceIdAsync(tenantId, deviceId);
            var dtos = instances.Select(AlertInstanceDto.FromEntity).ToList();

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active alerts for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get alert instances by alert rule
    /// </summary>
    [HttpGet("by-rule/{ruleId}")]
    [ProducesResponseType(typeof(List<AlertInstanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertInstancesByRule(Guid ruleId, [FromQuery] int limit = 100)
    {
        try
        {
            var tenantId = GetTenantId();
            var instances = await _repository.GetByAlertRuleIdAsync(tenantId, ruleId, limit);
            var dtos = instances.Select(AlertInstanceDto.FromEntity).ToList();

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alert instances for rule {RuleId}", ruleId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Acknowledge an alert
    /// </summary>
    [HttpPost("{id}/acknowledge")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcknowledgeAlert(Guid id, [FromBody] AcknowledgeAlertRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();

            var success = await _repository.AcknowledgeAsync(id, tenantId, userId, request.Notes);

            if (!success)
            {
                return NotFound(new { error = "Alert instance not found" });
            }

            var instance = await _repository.GetByIdAsync(id);
            return Ok(AlertInstanceDto.FromEntity(instance!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acknowledging alert {InstanceId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Resolve an alert
    /// </summary>
    [HttpPost("{id}/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveAlert(Guid id, [FromBody] ResolveAlertRequest request)
    {
        try
        {
            var tenantId = GetTenantId();

            var success = await _repository.ResolveAsync(id, tenantId, request.ResolutionNotes);

            if (!success)
            {
                return NotFound(new { error = "Alert instance not found" });
            }

            var instance = await _repository.GetByIdAsync(id);
            return Ok(AlertInstanceDto.FromEntity(instance!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving alert {InstanceId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
