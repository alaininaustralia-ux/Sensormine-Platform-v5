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

    public UserPreferenceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserPreference?> GetByUserIdAsync(string userId, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.TenantId == tenantId, cancellationToken);
    }

    public async Task<UserPreference> CreateAsync(UserPreference preference, CancellationToken cancellationToken = default)
    {
        preference.CreatedAt = DateTimeOffset.UtcNow;
        preference.UpdatedAt = DateTimeOffset.UtcNow;

        _context.UserPreferences.Add(preference);
        await _context.SaveChangesAsync(cancellationToken);

        return preference;
    }

    public async Task<UserPreference> UpdateAsync(UserPreference preference, CancellationToken cancellationToken = default)
    {
        preference.UpdatedAt = DateTimeOffset.UtcNow;

        _context.UserPreferences.Update(preference);
        await _context.SaveChangesAsync(cancellationToken);

        return preference;
    }

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
