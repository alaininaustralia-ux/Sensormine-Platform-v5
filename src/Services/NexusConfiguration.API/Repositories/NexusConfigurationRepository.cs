using Microsoft.EntityFrameworkCore;
using NexusConfiguration.API.Data;

namespace NexusConfiguration.API.Repositories;

public class NexusConfigurationRepository : INexusConfigurationRepository
{
    private readonly NexusConfigurationDbContext _context;

    public NexusConfigurationRepository(NexusConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<Models.NexusConfiguration?> GetByIdAsync(Guid id, Guid tenantId)
    {
        return await _context.NexusConfigurations
            .Where(c => c.Id == id && c.TenantId == tenantId)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Models.NexusConfiguration>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20)
    {
        return await _context.NexusConfigurations
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<Models.NexusConfiguration>> GetTemplatesAsync(string? category = null, int page = 1, int pageSize = 20)
    {
        var query = _context.NexusConfigurations
            .Where(c => c.IsTemplate);

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(c => c.TemplateCategory == category);
        }

        return await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<Models.NexusConfiguration>> SearchAsync(Guid tenantId, string searchTerm, int page = 1, int pageSize = 20)
    {
        var lowerSearchTerm = searchTerm.ToLower();
        
        return await _context.NexusConfigurations
            .Where(c => c.TenantId == tenantId &&
                       (c.Name.ToLower().Contains(lowerSearchTerm) ||
                        (c.Description != null && c.Description.ToLower().Contains(lowerSearchTerm)) ||
                        c.Tags.Any(t => t.ToLower().Contains(lowerSearchTerm))))
            .OrderByDescending(c => c.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<Models.NexusConfiguration> CreateAsync(Models.NexusConfiguration configuration)
    {
        configuration.CreatedAt = DateTime.UtcNow;
        configuration.UpdatedAt = DateTime.UtcNow;
        
        _context.NexusConfigurations.Add(configuration);
        await _context.SaveChangesAsync();
        
        return configuration;
    }

    public async Task<Models.NexusConfiguration> UpdateAsync(Models.NexusConfiguration configuration)
    {
        configuration.UpdatedAt = DateTime.UtcNow;
        
        _context.NexusConfigurations.Update(configuration);
        await _context.SaveChangesAsync();
        
        return configuration;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        var configuration = await GetByIdAsync(id, tenantId);
        if (configuration == null)
        {
            return false;
        }

        _context.NexusConfigurations.Remove(configuration);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id, Guid tenantId)
    {
        return await _context.NexusConfigurations
            .AnyAsync(c => c.Id == id && c.TenantId == tenantId);
    }

    public async Task<int> GetCountAsync(Guid tenantId)
    {
        return await _context.NexusConfigurations
            .Where(c => c.TenantId == tenantId)
            .CountAsync();
    }
}
