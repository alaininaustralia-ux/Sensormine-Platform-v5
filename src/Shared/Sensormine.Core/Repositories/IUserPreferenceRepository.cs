using Sensormine.Core.Models;

namespace Sensormine.Core.Repositories;

/// <summary>
/// Repository interface for user preferences
/// </summary>
public interface IUserPreferenceRepository
{
    Task<UserPreference?> GetByUserIdAsync(string userId, string tenantId, CancellationToken cancellationToken = default);
    Task<UserPreference> CreateAsync(UserPreference preference, CancellationToken cancellationToken = default);
    Task<UserPreference> UpdateAsync(UserPreference preference, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string userId, string tenantId, CancellationToken cancellationToken = default);
}
