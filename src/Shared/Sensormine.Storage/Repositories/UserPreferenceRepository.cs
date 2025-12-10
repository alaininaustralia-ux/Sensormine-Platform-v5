using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository for user preferences operations
/// </summary>
public class UserPreferenceRepository : IUserPreferenceRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Initializes a new instance of the UserPreferenceRepository
    /// </summary>
    /// <param name="context">Database context</param>
    public UserPreferenceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets user preferences by user ID and tenant ID
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="tenantId">Tenant identifier (UUID string format)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User preferences or null if not found</returns>
    public async Task<UserPreference?> GetByUserIdAsync(string userId, string tenantId, CancellationToken cancellationToken = default)
    {
        // Try to parse tenant ID, fallback to default tenant UUID if invalid
        if (!Guid.TryParse(tenantId, out var tenantGuid))
        {
            tenantGuid = Guid.Parse("00000000-0000-0000-0000-000000000001"); // Default tenant
        }
        
        return await _context.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.TenantId == tenantGuid, cancellationToken);
    }

    /// <summary>
    /// Creates new user preferences
    /// </summary>
    /// <param name="preference">User preference entity to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created user preferences</returns>
    public async Task<UserPreference> CreateAsync(UserPreference preference, CancellationToken cancellationToken = default)
    {
        preference.CreatedAt = DateTimeOffset.UtcNow;
        preference.UpdatedAt = DateTimeOffset.UtcNow;

        _context.UserPreferences.Add(preference);
        await _context.SaveChangesAsync(cancellationToken);

        return preference;
    }

    /// <summary>
    /// Updates existing user preferences
    /// </summary>
    /// <param name="preference">User preference entity to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated user preferences</returns>
    public async Task<UserPreference> UpdateAsync(UserPreference preference, CancellationToken cancellationToken = default)
    {
        preference.UpdatedAt = DateTimeOffset.UtcNow;

        _context.UserPreferences.Update(preference);
        await _context.SaveChangesAsync(cancellationToken);

        return preference;
    }

    /// <summary>
    /// Deletes user preferences by user ID and tenant ID
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="tenantId">Tenant identifier (UUID string format)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted successfully, false if not found</returns>
    public async Task<bool> DeleteAsync(string userId, string tenantId, CancellationToken cancellationToken = default)
    {
        var preference = await GetByUserIdAsync(userId, tenantId, cancellationToken);
        if (preference == null)
            return false;

        _context.UserPreferences.Remove(preference);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
