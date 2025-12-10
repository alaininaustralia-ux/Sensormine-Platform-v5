using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Device.API.Services;
using Device.API.DTOs;
using System.Security.Claims;

namespace Device.API.Controllers;

/// <summary>
/// Controller for managing field mappings for device types
/// </summary>
[ApiController]
[Route("api/devicetype/{deviceTypeId}/fields")]
public class FieldMappingController : ControllerBase
{
    private readonly IFieldMappingService _fieldMappingService;
    private readonly IDeviceTypeRepository _deviceTypeRepository;
    private readonly ILogger<FieldMappingController> _logger;

    /// <summary>
    /// Constructor for FieldMappingController
    /// </summary>
    public FieldMappingController(
        IFieldMappingService fieldMappingService,
        IDeviceTypeRepository deviceTypeRepository,
        ILogger<FieldMappingController> logger)
    {
        _fieldMappingService = fieldMappingService;
        _deviceTypeRepository = deviceTypeRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get field mappings for a device type (merged from schema, custom fields, and system fields)
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <returns>List of field mappings with friendly names and metadata</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<FieldMappingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<FieldMappingResponse>>> GetFieldMappings(Guid deviceTypeId)
    {
        var tenantId = User.FindFirst("tenant_id")?.Value;
        if (string.IsNullOrEmpty(tenantId))
        {
            return Unauthorized(new { message = "Tenant ID not found in token" });
        }

        var deviceType = await _deviceTypeRepository.GetByIdAsync(deviceTypeId, tenantId);
        if (deviceType == null)
        {
            return NotFound(new { message = $"Device type {deviceTypeId} not found" });
        }

        var fieldMappings = await _fieldMappingService.GetFieldMappingsForDeviceTypeAsync(deviceTypeId, tenantId);
        return Ok(fieldMappings.Select(FieldMappingResponse.FromEntity).ToList());
    }

    /// <summary>
    /// Update field mappings for a device type (friendly names, visibility, display order, etc.)
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <param name="request">Bulk update request with field mappings</param>
    /// <returns>Updated field mappings</returns>
    [HttpPut]
    [ProducesResponseType(typeof(List<FieldMappingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<FieldMappingResponse>>> UpdateFieldMappings(
        Guid deviceTypeId, 
        [FromBody] BulkUpdateFieldMappingsRequest request)
    {
        var tenantId = User.FindFirst("tenant_id")?.Value;
        if (string.IsNullOrEmpty(tenantId))
        {
            return Unauthorized(new { message = "Tenant ID not found in token" });
        }

        var deviceType = await _deviceTypeRepository.GetByIdAsync(deviceTypeId, tenantId);
        if (deviceType == null)
        {
            return NotFound(new { message = $"Device type {deviceTypeId} not found" });
        }

        // Map request DTOs to FieldMapping entities
        var fieldMappings = request.FieldMappings.Select(dto => new FieldMapping
        {
            FieldName = dto.FieldName,
            FriendlyName = dto.FriendlyName,
            Description = dto.Description,
            Unit = dto.Unit,
            MinValue = dto.MinValue,
            MaxValue = dto.MaxValue,
            IsQueryable = dto.IsQueryable,
            IsVisible = dto.IsVisible,
            DisplayOrder = dto.DisplayOrder,
            Category = dto.Category,
            Tags = dto.Tags,
            DefaultAggregation = dto.DefaultAggregation,
            SupportsAggregations = dto.SupportsAggregations,
            FormatString = dto.FormatString
        }).ToList();

        try
        {
            var updatedMappings = await _fieldMappingService.UpdateFieldMappingsAsync(deviceTypeId, fieldMappings, tenantId);
            return Ok(updatedMappings.Select(FieldMappingResponse.FromEntity).ToList());
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid field mapping update request for device type {DeviceTypeId}", deviceTypeId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating field mappings for device type {DeviceTypeId}", deviceTypeId);
            return StatusCode(500, new { message = "An error occurred updating field mappings" });
        }
    }

    /// <summary>
    /// Synchronize field mappings after schema or device type changes
    /// </summary>
    /// <param name="deviceTypeId">Device type ID</param>
    /// <returns>Synchronized field mappings</returns>
    [HttpPost("sync")]
    [ProducesResponseType(typeof(List<FieldMappingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<FieldMappingResponse>>> SynchronizeFieldMappings(Guid deviceTypeId)
    {
        var tenantId = User.FindFirst("tenant_id")?.Value;
        if (string.IsNullOrEmpty(tenantId))
        {
            return Unauthorized(new { message = "Tenant ID not found in token" });
        }

        var deviceType = await _deviceTypeRepository.GetByIdAsync(deviceTypeId, tenantId);
        if (deviceType == null)
        {
            return NotFound(new { message = $"Device type {deviceTypeId} not found" });
        }

        try
        {
            await _fieldMappingService.SynchronizeFieldMappingsAsync(deviceType, tenantId);
            var fieldMappings = await _fieldMappingService.GetFieldMappingsForDeviceTypeAsync(deviceTypeId, tenantId);
            return Ok(fieldMappings.Select(FieldMappingResponse.FromEntity).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error synchronizing field mappings for device type {DeviceTypeId}", deviceTypeId);
            return StatusCode(500, new { message = "An error occurred synchronizing field mappings" });
        }
    }
}
