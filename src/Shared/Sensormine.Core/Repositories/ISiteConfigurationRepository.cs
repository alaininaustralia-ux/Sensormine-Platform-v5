using Sensormine.Core.Models;

namespace Sensormine.Core.Repositories;

/// <summary>
/// Repository interface for site configuration
/// </summary>
public interface ISiteConfigurationRepository
{
    Task<SiteConfiguration?> GetAsync(CancellationToken cancellationToken = default);
    Task<SiteConfiguration> CreateAsync(SiteConfiguration config, CancellationToken cancellationToken = default);
    Task<SiteConfiguration> UpdateAsync(SiteConfiguration config, CancellationToken cancellationToken = default);
}
