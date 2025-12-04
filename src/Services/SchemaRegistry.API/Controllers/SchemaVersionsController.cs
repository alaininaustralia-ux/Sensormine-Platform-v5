using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.DTOs;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;

namespace SchemaRegistry.API.Controllers;

/// <summary>
/// API controller for managing schema versions
/// </summary>
[ApiController]
[Route("api/schemas/{schemaId:guid}/versions")]
public class SchemaVersionsController : ControllerBase
{
    private readonly ISchemaRepository _schemaRepository;
    private readonly ISchemaValidationService _validationService;
    private readonly ILogger<SchemaVersionsController> _logger;

    public SchemaVersionsController(
        ISchemaRepository schemaRepository,
        ISchemaValidationService validationService,
        ILogger<SchemaVersionsController> logger)
    {
        _schemaRepository = schemaRepository;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all versions for a schema
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SchemaVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SchemaVersionDto>>> GetVersions(Guid schemaId)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schema = await _schemaRepository.GetByIdAsync(schemaId, tenantId);
            if (schema == null)
            {
                return NotFound($"Schema with ID {schemaId} not found");
            }

            var versions = await _schemaRepository.ListVersionsAsync(schemaId, tenantId);
            
            return Ok(versions.Select(MapToDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving versions for schema {SchemaId}", schemaId);
            return StatusCode(500, "An error occurred while retrieving schema versions");
        }
    }

    /// <summary>
    /// Get a specific version
    /// </summary>
    [HttpGet("{version}")]
    [ProducesResponseType(typeof(SchemaVersionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SchemaVersionDetailDto>> GetVersion(Guid schemaId, string version)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schemaVersion = await _schemaRepository.GetVersionAsync(schemaId, version, tenantId);
            if (schemaVersion == null)
            {
                return NotFound($"Version {version} not found for schema {schemaId}");
            }

            return Ok(MapToDetailDto(schemaVersion));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving version {Version} for schema {SchemaId}", version, schemaId);
            return StatusCode(500, "An error occurred while retrieving the schema version");
        }
    }

    /// <summary>
    /// Create a new version of a schema
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SchemaVersionDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationResult), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SchemaVersionDetailDto>> CreateVersion(
        Guid schemaId,
        [FromBody] CreateSchemaVersionRequest request)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";
        var userId = "system"; // TODO: Extract from authentication context

        try
        {
            // Verify schema exists
            var schema = await _schemaRepository.GetByIdAsync(schemaId, tenantId);
            if (schema == null)
            {
                return NotFound($"Schema with ID {schemaId} not found");
            }

            // Validate the JSON schema
            var schemaValidation = await _validationService.ValidateSchemaAsync(request.JsonSchema);
            if (!schemaValidation.IsValid)
            {
                return BadRequest(schemaValidation);
            }

            // Create the version
            var version = new SchemaVersion
            {
                Id = Guid.NewGuid(),
                SchemaId = schemaId,
                Version = request.Version,
                JsonSchema = request.JsonSchema,
                Status = SchemaStatus.Draft,
                IsDefault = false, // New versions are not default by default
                DeviceTypes = request.DeviceTypes ?? new List<string>(),
                TenantId = tenantId,
                CreatedBy = userId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var created = await _schemaRepository.CreateVersionAsync(version);
            
            _logger.LogInformation("Created version {Version} for schema {SchemaId}", request.Version, schemaId);

            return CreatedAtAction(
                nameof(GetVersion),
                new { schemaId, version = created.Version },
                MapToDetailDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating version for schema {SchemaId}", schemaId);
            return StatusCode(500, "An error occurred while creating the schema version");
        }
    }

    /// <summary>
    /// Update a schema version
    /// </summary>
    [HttpPut("{version}")]
    [ProducesResponseType(typeof(SchemaVersionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SchemaVersionDetailDto>> UpdateVersion(
        Guid schemaId,
        string version,
        [FromBody] UpdateSchemaVersionRequest request)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schemaVersion = await _schemaRepository.GetVersionAsync(schemaId, version, tenantId);
            if (schemaVersion == null)
            {
                return NotFound($"Version {version} not found for schema {schemaId}");
            }

            // Update status if provided
            if (request.Status.HasValue)
            {
                schemaVersion.Status = request.Status.Value;
            }

            // Update device types if provided
            if (request.DeviceTypes != null)
            {
                schemaVersion.DeviceTypes = request.DeviceTypes;
            }

            schemaVersion.UpdatedAt = DateTimeOffset.UtcNow;

            var updated = await _schemaRepository.UpdateVersionAsync(schemaVersion);
            
            _logger.LogInformation("Updated version {Version} for schema {SchemaId}", version, schemaId);

            return Ok(MapToDetailDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating version {Version} for schema {SchemaId}", version, schemaId);
            return StatusCode(500, "An error occurred while updating the schema version");
        }
    }

    /// <summary>
    /// Set a version as the default
    /// </summary>
    [HttpPut("{version}/default")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultVersion(Guid schemaId, string version)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schemaVersion = await _schemaRepository.GetVersionAsync(schemaId, version, tenantId);
            if (schemaVersion == null)
            {
                return NotFound($"Version {version} not found for schema {schemaId}");
            }

            await _schemaRepository.SetDefaultVersionAsync(schemaId, schemaVersion.Id, tenantId);
            
            _logger.LogInformation("Set version {Version} as default for schema {SchemaId}", version, schemaId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default version {Version} for schema {SchemaId}", version, schemaId);
            return StatusCode(500, "An error occurred while setting the default version");
        }
    }

    /// <summary>
    /// Validate data against a schema version
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(ValidationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ValidationResult>> ValidateData(
        Guid schemaId,
        [FromBody] ValidateDataRequest request)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var result = await _validationService.ValidateDataAgainstSchemaAsync(
                schemaId,
                tenantId,
                request.Data,
                request.Version);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating data against schema {SchemaId}", schemaId);
            return StatusCode(500, "An error occurred while validating the data");
        }
    }

    private static SchemaVersionDto MapToDto(SchemaVersion version)
    {
        return new SchemaVersionDto
        {
            Id = version.Id,
            SchemaId = version.SchemaId,
            Version = version.Version,
            Status = version.Status.ToString(),
            IsDefault = version.IsDefault,
            DeviceTypes = version.DeviceTypes,
            CreatedAt = version.CreatedAt,
            CreatedBy = version.CreatedBy
        };
    }

    private static SchemaVersionDetailDto MapToDetailDto(SchemaVersion version)
    {
        return new SchemaVersionDetailDto
        {
            Id = version.Id,
            SchemaId = version.SchemaId,
            Version = version.Version,
            JsonSchema = version.JsonSchema,
            Status = version.Status.ToString(),
            IsDefault = version.IsDefault,
            DeviceTypes = version.DeviceTypes,
            CreatedAt = version.CreatedAt,
            UpdatedAt = version.UpdatedAt,
            CreatedBy = version.CreatedBy
        };
    }
}
