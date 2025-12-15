using Microsoft.EntityFrameworkCore;
using Sensormine.Storage;
using Sensormine.Storage.Data;
using System.Text.Json;
using Template.API.Models;
using TemplateEntity = Sensormine.Core.Models.Template;

namespace Template.API.Services;

public class TemplateService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TemplateService> _logger;

    public TemplateService(ApplicationDbContext context, ILogger<TemplateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<TemplateMetadata>> ListTemplatesAsync(Guid tenantId)
    {
        var templates = await _context.Templates
            .Where(t => t.TenantId == tenantId || t.IsPublic)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return templates.Select(t => new TemplateMetadata
        {
            Id = t.Id,
            Name = t.Name,
            Version = t.Version,
            SchemaVersion = t.SchemaVersion,
            Description = t.Description ?? string.Empty,
            Author = t.Author ?? string.Empty,
            AuthorEmail = t.AuthorEmail,
            CreatedAt = t.CreatedAt.DateTime,
            UpdatedAt = t.UpdatedAt?.DateTime ?? DateTime.UtcNow,
            Tags = t.Tags?.ToList() ?? new(),
            Category = t.Category ?? "General",
            License = t.License ?? "MIT"
        }).ToList();
    }

    public async Task<Models.Template?> GetTemplateAsync(Guid tenantId, Guid templateId)
    {
        var templateEntity = await _context.Templates
            .FirstOrDefaultAsync(t => t.Id == templateId && (t.TenantId == tenantId || t.IsPublic));

        if (templateEntity == null)
            return null;

        return JsonSerializer.Deserialize<Models.Template>(templateEntity.TemplateJson.RootElement.GetRawText());
    }

    public async Task<Models.Template> SaveTemplateAsync(Guid tenantId, Models.Template template)
    {
        var templateEntity = new TemplateEntity
        {
            Id = template.Metadata.Id == Guid.Empty ? Guid.NewGuid() : template.Metadata.Id,
            TenantId = tenantId,
            Name = template.Metadata.Name,
            Version = template.Metadata.Version,
            SchemaVersion = template.Metadata.SchemaVersion,
            Description = template.Metadata.Description,
            Author = template.Metadata.Author,
            AuthorEmail = template.Metadata.AuthorEmail,
            TemplateJson = JsonDocument.Parse(JsonSerializer.Serialize(template)),
            Tags = template.Metadata.Tags.ToArray(),
            Category = template.Metadata.Category,
            License = template.Metadata.License,
            IsPublic = false,
            IsVerified = false,
            DownloadCount = 0,
            Rating = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = template.Metadata.Author
        };

        _context.Templates.Add(templateEntity);
        await _context.SaveChangesAsync();

        template.Metadata.Id = templateEntity.Id;
        return template;
    }

    public async Task<bool> DeleteTemplateAsync(Guid tenantId, Guid templateId)
    {
        var template = await _context.Templates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.TenantId == tenantId);

        if (template == null)
            return false;

        _context.Templates.Remove(template);
        await _context.SaveChangesAsync();
        return true;
    }
}
