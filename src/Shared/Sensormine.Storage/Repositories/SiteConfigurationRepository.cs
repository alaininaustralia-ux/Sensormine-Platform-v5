using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository for site configuration operations
/// </summary>
public class SiteConfigurationRepository : ISiteConfigurationRepository
{
    private readonly ApplicationDbContext _context;

    public SiteConfigurationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SiteConfiguration?> GetAsync(CancellationToken cancellationToken = default)
    {
        // Get the default site configuration
        return await _context.SiteConfigurations
            .FirstOrDefaultAsync(c => c.ConfigKey == "default", cancellationToken);
    }

    public async Task<SiteConfiguration> CreateAsync(SiteConfiguration config, CancellationToken cancellationToken = default)
    {
        config.CreatedAt = DateTimeOffset.UtcNow;
        config.UpdatedAt = DateTimeOffset.UtcNow;

        _context.SiteConfigurations.Add(config);
        await _context.SaveChangesAsync(cancellationToken);

        return config;
    }

    public async Task<SiteConfiguration> UpdateAsync(SiteConfiguration config, CancellationToken cancellationToken = default)
    {
        config.UpdatedAt = DateTimeOffset.UtcNow;

        _context.SiteConfigurations.Update(config);
        await _context.SaveChangesAsync(cancellationToken);

        return config;
    }
}
