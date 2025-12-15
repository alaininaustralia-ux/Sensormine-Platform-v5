using Microsoft.AspNetCore.Mvc;
using Template.API.Models;
using Template.API.Services;
using TemplateModel = Template.API.Models.Template;

namespace Template.API.Controllers;

[ApiController]
[Route("api/templates")]
public class TemplatesController : ControllerBase
{
    private readonly TemplateService _templateService;
    private readonly ExportService _exportService;
    private readonly ImportService _importService;
    private readonly ValidationService _validationService;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(
        TemplateService templateService,
        ExportService exportService,
        ImportService importService,
        ValidationService validationService,
        ILogger<TemplatesController> logger)
    {
        _templateService = templateService;
        _exportService = exportService;
        _importService = importService;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// Export template from current tenant configuration
    /// </summary>
    [HttpPost("export")]
    public async Task<ActionResult<TemplateModel>> ExportTemplate([FromBody] ExportRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var template = await _exportService.ExportTemplateAsync(tenantId, request);
            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting template");
            return StatusCode(500, new { error = "Failed to export template", details = ex.Message });
        }
    }

    /// <summary>
    /// Import template into current tenant
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<ImportResult>> ImportTemplate([FromBody] ImportRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            
            // Validate template first
            var validationResult = await _validationService.ValidateTemplateAsync(request.Template);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { error = "Template validation failed", validation = validationResult });
            }

            var result = await _importService.ImportTemplateAsync(tenantId, request.Template, request.ImportOptions);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing template");
            return StatusCode(500, new { error = "Failed to import template", details = ex.Message });
        }
    }

    /// <summary>
    /// Get preview of template import (dry run)
    /// </summary>
    [HttpPost("preview")]
    public async Task<ActionResult<ImportPreview>> PreviewImport([FromBody] ImportRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var preview = await _importService.PreviewImportAsync(tenantId, request.Template);
            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing import");
            return StatusCode(500, new { error = "Failed to preview import", details = ex.Message });
        }
    }

    /// <summary>
    /// Validate template structure and references
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ValidationResult>> ValidateTemplate([FromBody] TemplateModel template)
    {
        try
        {
            var result = await _validationService.ValidateTemplateAsync(template);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating template");
            return StatusCode(500, new { error = "Failed to validate template", details = ex.Message });
        }
    }

    /// <summary>
    /// List all available templates for tenant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TemplateMetadata>>> ListTemplates()
    {
        try
        {
            var tenantId = GetTenantId();
            var templates = await _templateService.ListTemplatesAsync(tenantId);
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing templates");
            return StatusCode(500, new { error = "Failed to list templates", details = ex.Message });
        }
    }

    /// <summary>
    /// Get specific template by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TemplateModel>> GetTemplate(Guid id)
    {
        try
        {
            var tenantId = GetTenantId();
            var template = await _templateService.GetTemplateAsync(tenantId, id);
            
            if (template == null)
            {
                return NotFound(new { error = "Template not found" });
            }

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting template");
            return StatusCode(500, new { error = "Failed to get template", details = ex.Message });
        }
    }

    /// <summary>
    /// Save template for later use
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TemplateModel>> SaveTemplate([FromBody] TemplateModel template)
    {
        try
        {
            var tenantId = GetTenantId();
            var savedTemplate = await _templateService.SaveTemplateAsync(tenantId, template);
            return CreatedAtAction(nameof(GetTemplate), new { id = savedTemplate.Metadata.Id }, savedTemplate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving template");
            return StatusCode(500, new { error = "Failed to save template", details = ex.Message });
        }
    }

    /// <summary>
    /// Delete template
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        try
        {
            var tenantId = GetTenantId();
            var deleted = await _templateService.DeleteTemplateAsync(tenantId, id);
            
            if (!deleted)
            {
                return NotFound(new { error = "Template not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template");
            return StatusCode(500, new { error = "Failed to delete template", details = ex.Message });
        }
    }

    private Guid GetTenantId()
    {
        // Extract tenant ID from header
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdHeader) 
            && Guid.TryParse(tenantIdHeader, out var tenantId))
        {
            return tenantId;
        }

        // Default tenant for development
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}

