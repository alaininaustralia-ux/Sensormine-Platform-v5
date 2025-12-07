using Microsoft.AspNetCore.Mvc;
using NexusConfiguration.API.DTOs;
using NexusConfiguration.API.Repositories;
using NexusConfiguration.API.Services;

namespace NexusConfiguration.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NexusConfigurationController : ControllerBase
{
    private readonly INexusConfigurationRepository _repository;
    private readonly IDocumentParsingService _documentParsingService;
    private readonly ICustomLogicService _customLogicService;
    private readonly IDeploymentService _deploymentService;
    private readonly ILogger<NexusConfigurationController> _logger;

    public NexusConfigurationController(
        INexusConfigurationRepository repository,
        IDocumentParsingService documentParsingService,
        ICustomLogicService customLogicService,
        IDeploymentService deploymentService,
        ILogger<NexusConfigurationController> logger)
    {
        _repository = repository;
        _documentParsingService = documentParsingService;
        _customLogicService = customLogicService;
        _deploymentService = deploymentService;
        _logger = logger;
    }

    /// <summary>
    /// Get all Nexus configurations for the tenant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<NexusConfigurationDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var tenantId = GetTenantId();
        var configurations = await _repository.GetAllAsync(tenantId, page, pageSize);
        
        return Ok(configurations.Select(MapToDto).ToList());
    }

    /// <summary>
    /// Get configuration by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NexusConfigurationDto>> GetById(Guid id)
    {
        var tenantId = GetTenantId();
        var configuration = await _repository.GetByIdAsync(id, tenantId);
        
        if (configuration == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        return Ok(MapToDto(configuration));
    }

    /// <summary>
    /// Get configuration templates
    /// </summary>
    [HttpGet("templates")]
    public async Task<ActionResult<List<NexusConfigurationDto>>> GetTemplates(
        [FromQuery] string? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var configurations = await _repository.GetTemplatesAsync(category, page, pageSize);
        
        return Ok(configurations.Select(MapToDto).ToList());
    }

    /// <summary>
    /// Search configurations
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<NexusConfigurationDto>>> Search(
        [FromQuery] string searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return BadRequest(new { message = "Search term is required" });
        }

        var tenantId = GetTenantId();
        var configurations = await _repository.SearchAsync(tenantId, searchTerm, page, pageSize);
        
        return Ok(configurations.Select(MapToDto).ToList());
    }

    /// <summary>
    /// Create a new Nexus configuration
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<NexusConfigurationDto>> Create([FromBody] CreateNexusConfigurationRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var configuration = new Models.NexusConfiguration
        {
            Name = request.Name,
            Description = request.Description,
            TenantId = tenantId,
            ProbeConfigurations = request.ProbeConfigurations ?? new List<Models.ProbeConfig>(),
            SchemaFieldMappings = request.SchemaFieldMappings ?? new Dictionary<string, string>(),
            CommunicationSettings = request.CommunicationSettings ?? new Models.CommunicationSettings(),
            CustomLogic = request.CustomLogic,
            CustomLogicLanguage = request.CustomLogicLanguage,
            AlertRuleTemplates = request.AlertRuleTemplates ?? new List<Models.AlertRuleTemplate>(),
            Tags = request.Tags ?? new List<string>(),
            IsTemplate = request.IsTemplate,
            TemplateCategory = request.TemplateCategory,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var created = await _repository.CreateAsync(configuration);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
    }

    /// <summary>
    /// Update an existing configuration
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<NexusConfigurationDto>> Update(Guid id, [FromBody] UpdateNexusConfigurationRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var configuration = await _repository.GetByIdAsync(id, tenantId);
        if (configuration == null)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        // Update fields if provided
        if (request.Name != null) configuration.Name = request.Name;
        if (request.Description != null) configuration.Description = request.Description;
        if (request.ProbeConfigurations != null) configuration.ProbeConfigurations = request.ProbeConfigurations;
        if (request.SchemaFieldMappings != null) configuration.SchemaFieldMappings = request.SchemaFieldMappings;
        if (request.CommunicationSettings != null) configuration.CommunicationSettings = request.CommunicationSettings;
        if (request.CustomLogic != null) configuration.CustomLogic = request.CustomLogic;
        if (request.CustomLogicLanguage != null) configuration.CustomLogicLanguage = request.CustomLogicLanguage;
        if (request.AlertRuleTemplates != null) configuration.AlertRuleTemplates = request.AlertRuleTemplates;
        if (request.Tags != null) configuration.Tags = request.Tags;
        if (request.Status != null) configuration.Status = request.Status;

        configuration.UpdatedBy = userId;

        var updated = await _repository.UpdateAsync(configuration);

        return Ok(MapToDto(updated));
    }

    /// <summary>
    /// Delete a configuration
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetTenantId();
        var deleted = await _repository.DeleteAsync(id, tenantId);

        if (!deleted)
        {
            return NotFound(new { message = "Configuration not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Parse a datasheet or technical document and generate configuration
    /// </summary>
    [HttpPost("parse-document")]
    public async Task<ActionResult<ParseDocumentResponse>> ParseDocument([FromBody] ParseDocumentRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var response = await _documentParsingService.ParseDocumentAsync(request, tenantId, userId);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Generate custom logic code using AI
    /// </summary>
    [HttpPost("generate-logic")]
    public async Task<ActionResult<GenerateCustomLogicResponse>> GenerateLogic([FromBody] GenerateCustomLogicRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var response = await _customLogicService.GenerateLogicAsync(request, tenantId, userId);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Validate custom logic code
    /// </summary>
    [HttpPost("validate-logic")]
    public async Task<ActionResult<ValidateCustomLogicResponse>> ValidateLogic([FromBody] ValidateCustomLogicRequest request)
    {
        var response = await _customLogicService.ValidateLogicAsync(request);

        return Ok(response);
    }

    /// <summary>
    /// Deploy configuration (create Device Type and Schema)
    /// </summary>
    [HttpPost("deploy")]
    public async Task<ActionResult<DeployConfigurationResponse>> Deploy([FromBody] DeployConfigurationRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var response = await _deploymentService.DeployConfigurationAsync(request, tenantId, userId);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    private Guid GetTenantId()
    {
        // TODO: Get from authentication context
        // For now, use a default tenant ID
        var tenantIdHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return tenantId;
        }
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    private string? GetUserId()
    {
        // TODO: Get from authentication context
        return Request.Headers["X-User-Id"].FirstOrDefault();
    }

    private NexusConfigurationDto MapToDto(Models.NexusConfiguration config)
    {
        return new NexusConfigurationDto
        {
            Id = config.Id,
            Name = config.Name,
            Description = config.Description,
            TenantId = config.TenantId,
            DeviceTypeId = config.DeviceTypeId,
            SchemaId = config.SchemaId,
            SourceDocument = config.SourceDocument,
            ProbeConfigurations = config.ProbeConfigurations,
            SchemaFieldMappings = config.SchemaFieldMappings,
            CommunicationSettings = config.CommunicationSettings,
            CustomLogic = config.CustomLogic,
            CustomLogicLanguage = config.CustomLogicLanguage,
            AlertRuleTemplates = config.AlertRuleTemplates,
            Tags = config.Tags,
            Status = config.Status,
            IsTemplate = config.IsTemplate,
            TemplateCategory = config.TemplateCategory,
            AiInsights = config.AiInsights,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt,
            CreatedBy = config.CreatedBy,
            UpdatedBy = config.UpdatedBy
        };
    }
}
