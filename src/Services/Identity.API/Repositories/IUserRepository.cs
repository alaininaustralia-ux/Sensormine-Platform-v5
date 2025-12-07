using Sensormine.Core.Models;

namespace Identity.API.Repositories;

/// <summary>
/// Repository interface for user management
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, string tenantId, CancellationToken cancellationToken = default);
    Task<User?> GetBySsoIdAsync(string ssoProvider, string ssoUserId, CancellationToken cancellationToken = default);
    Task<(List<User> Items, int TotalCount)> GetAllAsync(string tenantId, int page, int pageSize, string? role = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, string tenantId, Guid? excludeUserId = null, CancellationToken cancellationToken = default);
    Task<int> GetUserCountByTenantAsync(string tenantId, CancellationToken cancellationToken = default);
}
