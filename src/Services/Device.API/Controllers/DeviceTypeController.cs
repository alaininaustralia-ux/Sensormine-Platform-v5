using Device.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;

namespace Device.API.Controllers;

/// <summary>
/// API controller for Device Type management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DeviceTypeController : ControllerBase
{
    private readonly IDeviceTypeRepository _repository;
    private readonly ILogger<DeviceTypeController> _logger;

    // TODO: Get from authentication context
    private Guid TenantId => Guid.Parse("00000000-0000-0000-0000-000000000001");
    private string UserId => "system-user";

    public DeviceTypeController(
        IDeviceTypeRepository repository,
        ILogger<DeviceTypeController> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Create a new Device Type
    /// </summary>
    /// <param name="request">Device Type creation request</param>
    /// <returns>Created Device Type</returns>
    [HttpPost]
    [ProducesResponseType(typeof(DeviceTypeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateDeviceType([FromBody] DeviceTypeRequest request)
    {
        _logger.LogInformation("Creating device type: {Name} for tenant: {TenantId}", request.Name, TenantId);

        // Check if device type with same name already exists
        var exists = await _repository.ExistsAsync(request.Name, TenantId, null);
        if (exists)
        {
            _logger.LogWarning("Device type with name {Name} already exists for tenant {TenantId}", request.Name, TenantId);
            return Conflict(new { message = $"Device type with name '{request.Name}' already exists" });
        }

        // Map request to domain entity
        var deviceType = new DeviceType
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            Name = request.Name,
            Description = request.Description,
            Protocol = request.Protocol,
            ProtocolConfig = request.ProtocolConfig,
            SchemaId = request.SchemaId,
            CustomFields = request.CustomFields ?? new List<CustomFieldDefinition>(),
            AlertTemplates = request.AlertTemplates ?? new List<AlertRuleTemplate>(),
            Tags = request.Tags ?? new List<string>(),
            IsActive = request.IsActive,
            CreatedBy = UserId
        };

        // Create device type
        var created = await _repository.CreateAsync(deviceType);

        _logger.LogInformation("Device type created: {Id} - {Name}", created.Id, created.Name);

        var response = DeviceTypeResponse.FromEntity(created);
        return CreatedAtAction(nameof(GetDeviceTypeById), new { id = created.Id }, response);
    }

    /// <summary>
    /// Get a Device Type by ID
    /// </summary>
    /// <param name="id">Device Type ID</param>
    /// <returns>Device Type details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DeviceTypeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDeviceTypeById(Guid id)
    {
        _logger.LogDebug("Getting device type: {Id} for tenant: {TenantId}", id, TenantId);

        var deviceType = await _repository.GetByIdAsync(id, TenantId);
        if (deviceType == null)
        {
            _logger.LogWarning("Device type not found: {Id}", id);
            return NotFound();
        }

        var response = DeviceTypeResponse.FromEntity(deviceType);
        return Ok(response);
    }

    /// <summary>
    /// Get all Device Types with pagination
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>Paginated list of Device Types</returns>
    [HttpGet]
    [ProducesResponseType(typeof(DeviceTypeListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllDeviceTypes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("Getting device types for tenant: {TenantId}, page: {Page}, pageSize: {PageSize}",
            TenantId, page, pageSize);

        // Validate pagination parameters
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _repository.GetAllAsync(TenantId, page, pageSize);

        var response = new DeviceTypeListResponse
        {
            Items = items.Select(DeviceTypeResponse.FromEntity).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    /// <summary>
    /// Update an existing Device Type
    /// </summary>
    /// <param name="id">Device Type ID</param>
    /// <param name="request">Device Type update request</param>
    /// <returns>Updated Device Type</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(DeviceTypeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateDeviceType(Guid id, [FromBody] DeviceTypeRequest request)
    {
        _logger.LogInformation("Updating device type: {Id} for tenant: {TenantId}", id, TenantId);

        // Check if device type exists
        var existingDeviceType = await _repository.GetByIdAsync(id, TenantId);
        if (existingDeviceType == null)
        {
            _logger.LogWarning("Device type not found: {Id}", id);
            return NotFound();
        }

        // Check if new name conflicts with another device type
        if (existingDeviceType.Name != request.Name)
        {
            var nameExists = await _repository.ExistsAsync(request.Name, TenantId, id);
            if (nameExists)
            {
                _logger.LogWarning("Device type with name {Name} already exists for tenant {TenantId}", request.Name, TenantId);
                return Conflict(new { message = $"Device type with name '{request.Name}' already exists" });
            }
        }

        // Update properties
        existingDeviceType.Name = request.Name;
        existingDeviceType.Description = request.Description;
        existingDeviceType.Protocol = request.Protocol;
        existingDeviceType.ProtocolConfig = request.ProtocolConfig;
        existingDeviceType.SchemaId = request.SchemaId;
        existingDeviceType.CustomFields = request.CustomFields ?? new List<CustomFieldDefinition>();
        existingDeviceType.AlertTemplates = request.AlertTemplates ?? new List<AlertRuleTemplate>();
        existingDeviceType.Tags = request.Tags ?? new List<string>();
        existingDeviceType.IsActive = request.IsActive;

        // Save changes
        var updated = await _repository.UpdateAsync(existingDeviceType);

        _logger.LogInformation("Device type updated: {Id} - {Name}", updated.Id, updated.Name);

        var response = DeviceTypeResponse.FromEntity(updated);
        return Ok(response);
    }

    /// <summary>
    /// Delete a Device Type (soft delete)
    /// </summary>
    /// <param name="id">Device Type ID</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDeviceType(Guid id)
    {
        _logger.LogInformation("Deleting device type: {Id} for tenant: {TenantId}", id, TenantId);

        var deleted = await _repository.DeleteAsync(id, TenantId);
        if (!deleted)
        {
            _logger.LogWarning("Device type not found: {Id}", id);
            return NotFound();
        }

        _logger.LogInformation("Device type deleted: {Id}", id);
        return NoContent();
    }

    /// <summary>
    /// Search Device Types with filters
    /// </summary>
    /// <param name="request">Search criteria</param>
    /// <returns>Paginated list of matching Device Types</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(DeviceTypeListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchDeviceTypes([FromQuery] SearchDeviceTypesRequest request)
    {
        _logger.LogDebug("Searching device types for tenant: {TenantId}, term: {SearchTerm}, protocol: {Protocol}",
            TenantId, request.SearchTerm, request.Protocol);

        // Validate pagination parameters
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(
            TenantId,
            request.SearchTerm,
            request.Tags,
            request.Protocol,
            page,
            pageSize);

        var response = new DeviceTypeListResponse
        {
            Items = items.Select(DeviceTypeResponse.FromEntity).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }
}
