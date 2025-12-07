namespace NexusConfiguration.API.Repositories;

public interface INexusConfigurationRepository
{
    Task<Models.NexusConfiguration?> GetByIdAsync(Guid id, Guid tenantId);
    Task<List<Models.NexusConfiguration>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20);
    Task<List<Models.NexusConfiguration>> GetTemplatesAsync(string? category = null, int page = 1, int pageSize = 20);
    Task<List<Models.NexusConfiguration>> SearchAsync(Guid tenantId, string searchTerm, int page = 1, int pageSize = 20);
    Task<Models.NexusConfiguration> CreateAsync(Models.NexusConfiguration configuration);
    Task<Models.NexusConfiguration> UpdateAsync(Models.NexusConfiguration configuration);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
    Task<bool> ExistsAsync(Guid id, Guid tenantId);
    Task<int> GetCountAsync(Guid tenantId);
}
