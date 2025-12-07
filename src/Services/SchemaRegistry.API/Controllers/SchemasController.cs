using Microsoft.AspNetCore.Mvc;
using Sensormine.Core.DTOs;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using SchemaRegistry.API.Models;
using SchemaRegistry.API.Services;

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
    private readonly IAiSchemaGeneratorService _aiSchemaGenerator;
    private readonly ILogger<SchemasController> _logger;

    public SchemasController(
        ISchemaRepository schemaRepository,
        ISchemaValidationService validationService,
        IAiSchemaGeneratorService aiSchemaGenerator,
        ILogger<SchemasController> logger)
    {
        _schemaRepository = schemaRepository;
        _validationService = validationService;
        _aiSchemaGenerator = aiSchemaGenerator;
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

            // Update schema metadata
            schema.Description = request.Description ?? schema.Description;
            schema.UpdatedBy = userId;
            schema.UpdatedAt = DateTimeOffset.UtcNow;

            // If JSON schema is provided, create a new version
            if (!string.IsNullOrWhiteSpace(request.JsonSchema))
            {
                // Validate JSON schema format
                var validationResult = await _validationService.ValidateSchemaAsync(request.JsonSchema);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = "Invalid JSON Schema", errors = validationResult.Errors });
                }

                // Determine next version number
                var existingVersions = await _schemaRepository.ListVersionsAsync(id, tenantId);
                var nextVersionNumber = existingVersions.Count + 1;

                // Unset previous default versions
                foreach (var existingVersion in existingVersions.Where(v => v.IsDefault))
                {
                    existingVersion.IsDefault = false;
                    await _schemaRepository.UpdateVersionAsync(existingVersion);
                }

                // Create new version
                var newVersion = new SchemaVersion
                {
                    Id = Guid.NewGuid(),
                    SchemaId = id,
                    Version = $"v{nextVersionNumber}",
                    JsonSchema = request.JsonSchema,
                    Status = SchemaStatus.Active,
                    IsDefault = true, // New version becomes default
                    DeviceTypes = new List<string>(),
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow,
                    CreatedBy = userId
                };

                // Add the new version
                await _schemaRepository.CreateVersionAsync(newVersion);

                _logger.LogInformation("Created new version {Version} for schema {SchemaId}", newVersion.Version, id);
            }

            var updated = await _schemaRepository.UpdateAsync(schema);
            
            _logger.LogInformation("Updated schema {SchemaId} for tenant {TenantId}", id, tenantId);

            // Reload to get the new version
            var schemaWithVersions = await _schemaRepository.GetByIdAsync(id, tenantId);
            return Ok(MapToDto(schemaWithVersions!));
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
        // Find the default/current version
        var currentVersion = schema.Versions?.FirstOrDefault(v => v.IsDefault);
        
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
            CurrentVersion = currentVersion != null ? new SchemaVersionDetailDto
            {
                Id = currentVersion.Id,
                SchemaId = currentVersion.SchemaId,
                Version = currentVersion.Version,
                JsonSchema = currentVersion.JsonSchema,
                Status = currentVersion.Status.ToString(),
                IsDefault = currentVersion.IsDefault,
                DeviceTypes = currentVersion.DeviceTypes,
                CreatedAt = currentVersion.CreatedAt,
                UpdatedAt = currentVersion.UpdatedAt,
                CreatedBy = currentVersion.CreatedBy
            } : null,
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

    /// <summary>
    /// Generate a JSON Schema using AI from sample data
    /// </summary>
    /// <param name="request">Sample data and context information</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated schema with confidence score and suggestions</returns>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(GenerateSchemaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GenerateSchemaResponse>> GenerateSchema(
        [FromBody] GenerateSchemaRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating schema using AI for data type: {DataType}", request.DataType ?? "unknown");

            if (string.IsNullOrWhiteSpace(request.Data))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid Request",
                    Detail = "Data field is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Call AI service
            var (success, schema, error, confidence, suggestions) = await _aiSchemaGenerator.GenerateSchemaAsync(
                request.Data,
                request.FileName,
                request.DataType,
                request.Description,
                cancellationToken);

            if (!success)
            {
                _logger.LogWarning("AI schema generation failed: {Error}", error);
                return Ok(new GenerateSchemaResponse
                {
                    Success = false,
                    Error = error
                });
            }

            _logger.LogInformation("Successfully generated schema with {Confidence} confidence", confidence);

            return Ok(new GenerateSchemaResponse
            {
                Success = true,
                Schema = schema,
                Confidence = confidence,
                Suggestions = suggestions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GenerateSchema endpoint");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while generating the schema",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}
