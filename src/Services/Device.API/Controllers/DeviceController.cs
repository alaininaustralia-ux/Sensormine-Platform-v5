using Device.API.DTOs;
using Device.API.Services;
using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Repositories;
using System.ComponentModel.DataAnnotations;

namespace Device.API.Controllers;

/// <summary>
/// Controller for managing individual device instances
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DeviceController : ControllerBase
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IDeviceTypeRepository _deviceTypeRepository;
    private readonly ISchemaRegistryClient _schemaRegistryClient;
    private readonly ILogger<DeviceController> _logger;

    /// <summary>
    /// Initializes a new instance of the DeviceController
    /// </summary>
    public DeviceController(
        IDeviceRepository deviceRepository,
        IDeviceTypeRepository deviceTypeRepository,
        ISchemaRegistryClient schemaRegistryClient,
        ILogger<DeviceController> logger)
    {
        _deviceRepository = deviceRepository ?? throw new ArgumentNullException(nameof(deviceRepository));
        _deviceTypeRepository = deviceTypeRepository ?? throw new ArgumentNullException(nameof(deviceTypeRepository));
        _schemaRegistryClient = schemaRegistryClient ?? throw new ArgumentNullException(nameof(schemaRegistryClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Register a new device
    /// </summary>
    /// <param name="request">Device registration details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created device</returns>
    [HttpPost]
    [ProducesResponseType(typeof(DeviceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceResponse>> RegisterDevice(
        [FromBody] CreateDeviceRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Registering device {DeviceId} with type {DeviceTypeId}",
                request.DeviceId, request.DeviceTypeId);

            // Validate device doesn't already exist
            var tenantId = GetTenantId();
            if (await _deviceRepository.ExistsAsync(request.DeviceId, tenantId))
            {
                _logger.LogWarning("Device {DeviceId} already exists", request.DeviceId);
                return Conflict(new ProblemDetails
                {
                    Title = "Device already exists",
                    Detail = $"A device with ID '{request.DeviceId}' is already registered",
                    Status = StatusCodes.Status409Conflict
                });
            }

            // Validate Device Type exists
            var deviceType = await _deviceTypeRepository.GetByIdAsync(request.DeviceTypeId, tenantId);
            if (deviceType == null)
            {
                _logger.LogWarning("Device Type {DeviceTypeId} not found", request.DeviceTypeId);
                return NotFound(new ProblemDetails
                {
                    Title = "Device Type not found",
                    Detail = $"Device Type with ID '{request.DeviceTypeId}' was not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            // Validate custom fields against Device Type definitions
            var validationErrors = ValidateCustomFields(request.CustomFieldValues, deviceType.CustomFields);
            if (validationErrors.Any())
            {
                _logger.LogWarning("Custom field validation failed for device {DeviceId}: {Errors}",
                    request.DeviceId, string.Join(", ", validationErrors.Select(e => e.Value)));

                var problemDetails = new ValidationProblemDetails(validationErrors)
                {
                    Title = "Custom field validation failed",
                    Status = StatusCodes.Status400BadRequest
                };
                return BadRequest(problemDetails);
            }

            // Create device entity
            var device = new Sensormine.Core.Models.Device
            {
                TenantId = Guid.Parse(tenantId),
                DeviceId = request.DeviceId,
                Name = request.Name,
                DeviceTypeId = request.DeviceTypeId,
                SerialNumber = request.SerialNumber,
                CustomFieldValues = request.CustomFieldValues,
                Location = request.Location != null ? new Sensormine.Core.Models.Location
                {
                    Latitude = request.Location.Latitude,
                    Longitude = request.Location.Longitude,
                    Altitude = request.Location.Altitude
                } : null,
                Metadata = request.Metadata,
                Status = request.Status
            };

            // Save to database
            var createdDevice = await _deviceRepository.CreateAsync(device);

            _logger.LogInformation("Successfully registered device {DeviceId} ({Id})",
                createdDevice.DeviceId, createdDevice.Id);

            // Map to response
            var response = MapToResponse(createdDevice);

            return CreatedAtAction(
                nameof(GetDevice),
                new { id = createdDevice.Id },
                response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering device {DeviceId}", request.DeviceId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while registering the device",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get device by ID
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Device details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DeviceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceResponse>> GetDevice(
        [FromRoute] Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = GetTenantId();
            var device = await _deviceRepository.GetByIdAsync(id, tenantId);

            if (device == null)
            {
                _logger.LogWarning("Device {Id} not found", id);
                return NotFound(new ProblemDetails
                {
                    Title = "Device not found",
                    Detail = $"Device with ID '{id}' was not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            // Fetch schema name if device has a schema
            Dictionary<Guid, string>? schemaNames = null;
            if (device.DeviceType?.SchemaId != null)
            {
                var schemaName = await _schemaRegistryClient.GetSchemaNameAsync(device.DeviceType.SchemaId.Value);
                if (schemaName != null)
                {
                    schemaNames = new Dictionary<Guid, string> { { device.DeviceType.SchemaId.Value, schemaName } };
                }
            }

            return Ok(MapToResponse(device, schemaNames));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving device {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while retrieving the device",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get device by device ID (hardware identifier)
    /// </summary>
    /// <param name="deviceId">Hardware device identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Device details</returns>
    [HttpGet("by-device-id/{deviceId}")]
    [ProducesResponseType(typeof(DeviceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceResponse>> GetDeviceByDeviceId(
        [FromRoute] string deviceId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = GetTenantId();
            var device = await _deviceRepository.GetByDeviceIdAsync(deviceId, tenantId);

            if (device == null)
            {
                _logger.LogWarning("Device with DeviceId {DeviceId} not found", deviceId);
                return NotFound(new ProblemDetails
                {
                    Title = "Device not found",
                    Detail = $"Device with device ID '{deviceId}' was not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            // Fetch schema name if device has a schema
            Dictionary<Guid, string>? schemaNames = null;
            if (device.DeviceType?.SchemaId != null)
            {
                var schemaName = await _schemaRegistryClient.GetSchemaNameAsync(device.DeviceType.SchemaId.Value);
                if (schemaName != null)
                {
                    schemaNames = new Dictionary<Guid, string> { { device.DeviceType.SchemaId.Value, schemaName } };
                }
            }

            return Ok(MapToResponse(device, schemaNames));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving device by DeviceId {DeviceId}", deviceId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while retrieving the device",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get device schema information
    /// </summary>
    /// <param name="deviceId">Hardware device identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Schema information</returns>
    [HttpGet("by-device-id/{deviceId}/schema")]
    [ProducesResponseType(typeof(DeviceSchemaInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceSchemaInfo>> GetDeviceSchema(
        [FromRoute] string deviceId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = GetTenantId();
            var schemaInfo = await _deviceRepository.GetSchemaInfoAsync(deviceId, tenantId);

            if (schemaInfo == null)
            {
                _logger.LogWarning("Device {DeviceId} not found or has no schema", deviceId);
                return NotFound(new ProblemDetails
                {
                    Title = "Device or schema not found",
                    Detail = $"Device '{deviceId}' was not found or has no schema assigned",
                    Status = StatusCodes.Status404NotFound
                });
            }

            return Ok(new DeviceSchemaInfo
            {
                DeviceId = deviceId,
                SchemaId = schemaInfo.Value.SchemaId,
                SchemaName = schemaInfo.Value.SchemaName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving schema for device {DeviceId}", deviceId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while retrieving device schema",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Search devices
    /// </summary>
    /// <param name="parameters">Query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of devices</returns>
    [HttpGet]
    [ProducesResponseType(typeof(DeviceListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceListResponse>> SearchDevices(
        [FromQuery] DeviceQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = GetTenantId();

            var devices = await _deviceRepository.SearchAsync(
                tenantId,
                parameters.DeviceTypeId,
                parameters.Status,
                parameters.SearchTerm,
                parameters.Page,
                parameters.PageSize);

            var totalCount = await _deviceRepository.GetCountAsync(
                tenantId,
                parameters.DeviceTypeId,
                parameters.Status,
                parameters.SearchTerm);

            // Fetch schema names in batch for all devices that have schemas
            var schemaIds = devices
                .Where(d => d.DeviceType?.SchemaId != null)
                .Select(d => d.DeviceType!.SchemaId!.Value)
                .Distinct()
                .ToList();

            var schemaNames = schemaIds.Any() 
                ? await _schemaRegistryClient.GetSchemaNamesAsync(schemaIds)
                : new Dictionary<Guid, string>();

            return Ok(new DeviceListResponse
            {
                Devices = devices.Select(d => MapToResponse(d, schemaNames)).ToList(),
                TotalCount = totalCount,
                Page = parameters.Page,
                PageSize = parameters.PageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching devices");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while searching devices",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Update device
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="request">Update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated device</returns>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DeviceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceResponse>> UpdateDevice(
        [FromRoute] Guid id,
        [FromBody] UpdateDeviceRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = GetTenantId();
            var device = await _deviceRepository.GetByIdAsync(id, tenantId);

            if (device == null)
            {
                _logger.LogWarning("Device {Id} not found for update", id);
                return NotFound(new ProblemDetails
                {
                    Title = "Device not found",
                    Detail = $"Device with ID '{id}' was not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            // Update fields
            if (request.Name != null) device.Name = request.Name;
            if (request.CustomFieldValues != null) device.CustomFieldValues = request.CustomFieldValues;
            if (request.Location != null)
            {
                device.Location = new Sensormine.Core.Models.Location
                {
                    Latitude = request.Location.Latitude,
                    Longitude = request.Location.Longitude,
                    Altitude = request.Location.Altitude
                };
            }
            if (request.Metadata != null) device.Metadata = request.Metadata;
            if (request.Status != null) device.Status = request.Status;

            var updatedDevice = await _deviceRepository.UpdateAsync(device);

            _logger.LogInformation("Successfully updated device {DeviceId} ({Id})",
                updatedDevice.DeviceId, updatedDevice.Id);

            return Ok(MapToResponse(updatedDevice));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating device {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while updating the device",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Delete device
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content</returns>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteDevice(
        [FromRoute] Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = GetTenantId();
            var device = await _deviceRepository.GetByIdAsync(id, tenantId);

            if (device == null)
            {
                _logger.LogWarning("Device {Id} not found for deletion", id);
                return NotFound(new ProblemDetails
                {
                    Title = "Device not found",
                    Detail = $"Device with ID '{id}' was not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            await _deviceRepository.DeleteAsync(id, tenantId);

            _logger.LogInformation("Successfully deleted device {DeviceId} ({Id})",
                device.DeviceId, device.Id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting device {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred while deleting the device",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Bulk register devices
    /// </summary>
    /// <param name="request">Bulk registration request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Bulk registration result</returns>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(BulkDeviceRegistrationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BulkDeviceRegistrationResult>> BulkRegisterDevices(
        [FromBody] BulkDeviceRegistrationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Bulk registering {Count} devices with type {DeviceTypeId}",
                request.Devices.Count, request.DeviceTypeId);

            var tenantId = GetTenantId();
            var result = new BulkDeviceRegistrationResult();

            // Validate Device Type exists
            var deviceType = await _deviceTypeRepository.GetByIdAsync(request.DeviceTypeId, tenantId);
            if (deviceType == null)
            {
                _logger.LogWarning("Device Type {DeviceTypeId} not found", request.DeviceTypeId);
                return NotFound(new ProblemDetails
                {
                    Title = "Device Type not found",
                    Detail = $"Device Type with ID '{request.DeviceTypeId}' was not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            // Process each device
            foreach (var deviceRequest in request.Devices)
            {
                try
                {
                    // Ensure DeviceTypeId matches
                    deviceRequest.DeviceTypeId = request.DeviceTypeId;

                    // Check if device already exists
                    if (await _deviceRepository.ExistsAsync(deviceRequest.DeviceId, tenantId))
                    {
                        result.FailureCount++;
                        result.Errors.Add(new DeviceRegistrationError
                        {
                            DeviceId = deviceRequest.DeviceId,
                            ErrorMessage = "Device already exists"
                        });
                        continue;
                    }

                    // Validate custom fields
                    var validationErrors = ValidateCustomFields(deviceRequest.CustomFieldValues, deviceType.CustomFields);
                    if (validationErrors.Any())
                    {
                        result.FailureCount++;
                        result.Errors.Add(new DeviceRegistrationError
                        {
                            DeviceId = deviceRequest.DeviceId,
                            ErrorMessage = "Custom field validation failed",
                            ValidationErrors = validationErrors.ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value.ToList()
                            )
                        });
                        continue;
                    }

                    // Create device
                    var device = new Sensormine.Core.Models.Device
                    {
                        TenantId = Guid.Parse(tenantId),
                        DeviceId = deviceRequest.DeviceId,
                        Name = deviceRequest.Name,
                        DeviceTypeId = deviceRequest.DeviceTypeId,
                        SerialNumber = deviceRequest.SerialNumber,
                        CustomFieldValues = deviceRequest.CustomFieldValues,
                        Location = deviceRequest.Location != null ? new Sensormine.Core.Models.Location
                        {
                            Latitude = deviceRequest.Location.Latitude,
                            Longitude = deviceRequest.Location.Longitude,
                            Altitude = deviceRequest.Location.Altitude
                        } : null,
                        Metadata = deviceRequest.Metadata ?? new Dictionary<string, string>(),
                        Status = deviceRequest.Status ?? "Active"
                    };

                    var createdDevice = await _deviceRepository.CreateAsync(device);
                    result.SuccessCount++;
                    result.SuccessfulDevices.Add(MapToResponse(createdDevice));

                    _logger.LogInformation("Successfully registered device {DeviceId} in bulk", deviceRequest.DeviceId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error registering device {DeviceId} in bulk", deviceRequest.DeviceId);
                    result.FailureCount++;
                    result.Errors.Add(new DeviceRegistrationError
                    {
                        DeviceId = deviceRequest.DeviceId,
                        ErrorMessage = ex.Message
                    });
                }
            }

            _logger.LogInformation("Bulk registration completed: {SuccessCount} successful, {FailureCount} failed",
                result.SuccessCount, result.FailureCount);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk device registration");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An error occurred during bulk device registration",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    #region Private Helper Methods

    private string GetTenantId()
    {
        // TODO: Extract from JWT claims when authentication is implemented
        // Using a fixed tenant ID for the default tenant until auth is implemented
        return "00000000-0000-0000-0000-000000000001";
    }

    private DeviceResponse MapToResponse(
        Sensormine.Core.Models.Device device, 
        Dictionary<Guid, string>? schemaNames = null)
    {
        var schemaId = device.DeviceType?.SchemaId;
        string? schemaName = null;
        
        if (schemaId.HasValue && schemaNames != null && schemaNames.TryGetValue(schemaId.Value, out var name))
        {
            schemaName = name;
        }

        return new DeviceResponse
        {
            Id = device.Id,
            TenantId = device.TenantId.ToString(),
            DeviceId = device.DeviceId,
            Name = device.Name,
            DeviceTypeId = device.DeviceTypeId,
            DeviceTypeName = device.DeviceType?.Name,
            SerialNumber = device.SerialNumber,
            CustomFieldValues = device.CustomFieldValues,
            Location = device.Location != null ? new LocationDto
            {
                Latitude = device.Location.Latitude,
                Longitude = device.Location.Longitude,
                Altitude = device.Location.Altitude
            } : null,
            Metadata = device.Metadata ?? new Dictionary<string, string>(),
            Status = device.Status,
            LastSeenAt = device.LastSeenAt,
            CreatedAt = device.CreatedAt,
            UpdatedAt = device.UpdatedAt ?? device.CreatedAt,
            SchemaId = schemaId,
            SchemaName = schemaName
        };
    }

    private Dictionary<string, string[]> ValidateCustomFields(
        Dictionary<string, object> fieldValues,
        List<CustomFieldDefinition> fieldDefinitions)
    {
        var errors = new Dictionary<string, string[]>();

        // Check required fields
        foreach (var definition in fieldDefinitions.Where(f => f.Required))
        {
            if (!fieldValues.ContainsKey(definition.Name) ||
                fieldValues[definition.Name] == null)
            {
                errors[definition.Name] = new[] { $"The field '{definition.Name}' is required" };
            }
        }

        // Validate field types and constraints
        foreach (var kvp in fieldValues)
        {
            var definition = fieldDefinitions.FirstOrDefault(f => f.Name == kvp.Key);
            if (definition == null) continue;

            var fieldErrors = new List<string>();

            // Type validation
            switch (definition.Type)
            {
                case CustomFieldType.Number:
                    if (!IsNumeric(kvp.Value))
                    {
                        fieldErrors.Add($"The field '{kvp.Key}' must be a number");
                    }
                    else if (definition.ValidationRules != null)
                    {
                        var numValue = Convert.ToDouble(kvp.Value);
                        if (definition.ValidationRules.Min.HasValue &&
                            numValue < definition.ValidationRules.Min.Value)
                        {
                            fieldErrors.Add($"The field '{kvp.Key}' must be at least {definition.ValidationRules.Min.Value}");
                        }
                        if (definition.ValidationRules.Max.HasValue &&
                            numValue > definition.ValidationRules.Max.Value)
                        {
                            fieldErrors.Add($"The field '{kvp.Key}' must be at most {definition.ValidationRules.Max.Value}");
                        }
                    }
                    break;

                case CustomFieldType.Text:
                case CustomFieldType.TextArea:
                    var strValue = kvp.Value?.ToString();
                    if (definition.ValidationRules != null && strValue != null)
                    {
                        if (definition.ValidationRules.MinLength.HasValue &&
                            strValue.Length < definition.ValidationRules.MinLength.Value)
                        {
                            fieldErrors.Add($"The field '{kvp.Key}' must be at least {definition.ValidationRules.MinLength.Value} characters");
                        }
                        if (definition.ValidationRules.MaxLength.HasValue &&
                            strValue.Length > definition.ValidationRules.MaxLength.Value)
                        {
                            fieldErrors.Add($"The field '{kvp.Key}' must be at most {definition.ValidationRules.MaxLength.Value} characters");
                        }
                    }
                    break;

                case CustomFieldType.Email:
                    if (!IsValidEmail(kvp.Value?.ToString()))
                    {
                        fieldErrors.Add($"The field '{kvp.Key}' must be a valid email address");
                    }
                    break;
            }

            if (fieldErrors.Any())
            {
                errors[kvp.Key] = fieldErrors.ToArray();
            }
        }

        return errors;
    }

    private bool IsNumeric(object value)
    {
        return value is int || value is long || value is float || value is double || value is decimal ||
               (value is string str && double.TryParse(str, out _));
    }

    private bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    #endregion
}

/// <summary>
/// Device schema information
/// </summary>
public class DeviceSchemaInfo
{
    public string DeviceId { get; set; } = string.Empty;
    public Guid? SchemaId { get; set; }
    public string? SchemaName { get; set; }
}
