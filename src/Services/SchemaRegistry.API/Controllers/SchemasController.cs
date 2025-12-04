using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.DTOs;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;

namespace SchemaRegistry.API.Controllers;

/// <summary>
/// API controller for managing schemas
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SchemasController : ControllerBase
{
    private readonly ISchemaRepository _schemaRepository;
    private readonly ISchemaValidationService _validationService;
    private readonly ILogger<SchemasController> _logger;

    public SchemasController(
        ISchemaRepository schemaRepository,
        ISchemaValidationService validationService,
        ILogger<SchemasController> logger)
    {
        _schemaRepository = schemaRepository;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all schemas for the tenant with pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SchemaListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SchemaListResponse>> GetSchemas(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schemas = await _schemaRepository.ListAsync(tenantId, skip, take);
            var totalCount = await _schemaRepository.CountAsync(tenantId);

            return Ok(new SchemaListResponse
            {
                Schemas = schemas.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Skip = skip,
                Take = take
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving schemas for tenant {TenantId}", tenantId);
            return StatusCode(500, "An error occurred while retrieving schemas");
        }
    }

    /// <summary>
    /// Get a specific schema by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SchemaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SchemaDto>> GetSchema(Guid id)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schema = await _schemaRepository.GetByIdAsync(id, tenantId);
            if (schema == null)
            {
                return NotFound($"Schema with ID {id} not found");
            }

            return Ok(MapToDto(schema));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving schema {SchemaId} for tenant {TenantId}", id, tenantId);
            return StatusCode(500, "An error occurred while retrieving the schema");
        }
    }

    /// <summary>
    /// Get a schema by name
    /// </summary>
    [HttpGet("by-name/{name}")]
    [ProducesResponseType(typeof(SchemaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SchemaDto>> GetSchemaByName(string name)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            var schema = await _schemaRepository.GetByNameAsync(name, tenantId);
            if (schema == null)
            {
                return NotFound($"Schema with name '{name}' not found");
            }

            return Ok(MapToDto(schema));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving schema by name {SchemaName} for tenant {TenantId}", name, tenantId);
            return StatusCode(500, "An error occurred while retrieving the schema");
        }
    }

    /// <summary>
    /// Create a new schema
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SchemaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationResult), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SchemaDto>> CreateSchema([FromBody] CreateSchemaRequest request)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";
        var userId = "system"; // TODO: Extract from authentication context

        try
        {
            // Validate the JSON schema
            var schemaValidation = await _validationService.ValidateSchemaAsync(request.InitialVersion.JsonSchema);
            if (!schemaValidation.IsValid)
            {
                return BadRequest(schemaValidation);
            }

            // Create the schema
            var schema = new Schema
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                TenantId = tenantId,
                CreatedBy = userId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var createdSchema = await _schemaRepository.CreateAsync(schema);

            // Create the initial version
            var version = new SchemaVersion
            {
                Id = Guid.NewGuid(),
                SchemaId = createdSchema.Id,
                Version = request.InitialVersion.Version,
                JsonSchema = request.InitialVersion.JsonSchema,
                Status = SchemaStatus.Draft,
                IsDefault = true, // First version is always default
                DeviceTypes = request.InitialVersion.DeviceTypes ?? new List<string>(),
                TenantId = tenantId,
                CreatedBy = userId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _schemaRepository.CreateVersionAsync(version);

            // Reload to get versions
            var result = await _schemaRepository.GetByIdAsync(createdSchema.Id, tenantId);
            
            _logger.LogInformation("Created schema {SchemaId} with name {SchemaName} for tenant {TenantId}", 
                createdSchema.Id, createdSchema.Name, tenantId);

            return CreatedAtAction(
                nameof(GetSchema),
                new { id = createdSchema.Id },
                MapToDto(result!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating schema for tenant {TenantId}", tenantId);
            return StatusCode(500, "An error occurred while creating the schema");
        }
    }

    /// <summary>
    /// Update an existing schema
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(SchemaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SchemaDto>> UpdateSchema(Guid id, [FromBody] UpdateSchemaRequest request)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";
        var userId = "system"; // TODO: Extract from authentication context

        try
        {
            var schema = await _schemaRepository.GetByIdAsync(id, tenantId);
            if (schema == null)
            {
                return NotFound($"Schema with ID {id} not found");
            }

            // Update fields
            schema.Description = request.Description ?? schema.Description;
            schema.UpdatedBy = userId;
            schema.UpdatedAt = DateTimeOffset.UtcNow;

            var updated = await _schemaRepository.UpdateAsync(schema);
            
            _logger.LogInformation("Updated schema {SchemaId} for tenant {TenantId}", id, tenantId);

            return Ok(MapToDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating schema {SchemaId} for tenant {TenantId}", id, tenantId);
            return StatusCode(500, "An error occurred while updating the schema");
        }
    }

    /// <summary>
    /// Soft delete a schema
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSchema(Guid id)
    {
        // TODO: Extract tenant ID from authentication context
        var tenantId = "default-tenant";

        try
        {
            await _schemaRepository.DeleteAsync(id, tenantId);
            
            _logger.LogInformation("Deleted schema {SchemaId} for tenant {TenantId}", id, tenantId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting schema {SchemaId} for tenant {TenantId}", id, tenantId);
            return StatusCode(500, "An error occurred while deleting the schema");
        }
    }

    private static SchemaDto MapToDto(Schema schema)
    {
        return new SchemaDto
        {
            Id = schema.Id,
            Name = schema.Name,
            Description = schema.Description,
            TenantId = schema.TenantId,
            CreatedAt = schema.CreatedAt,
            UpdatedAt = schema.UpdatedAt,
            CreatedBy = schema.CreatedBy,
            UpdatedBy = schema.UpdatedBy,
            Versions = schema.Versions?.Select(v => new SchemaVersionDto
            {
                Id = v.Id,
                SchemaId = v.SchemaId,
                Version = v.Version,
                Status = v.Status.ToString(),
                IsDefault = v.IsDefault,
                DeviceTypes = v.DeviceTypes,
                CreatedAt = v.CreatedAt,
                CreatedBy = v.CreatedBy
            }).ToList() ?? new List<SchemaVersionDto>()
        };
    }
}
