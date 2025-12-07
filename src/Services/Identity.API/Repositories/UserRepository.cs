using Identity.API.Data;
using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;

namespace Identity.API.Repositories;

/// <summary>
/// Repository implementation for user management
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly IdentityDbContext _context;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(IdentityDbContext context, ILogger<UserRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId, cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.TenantId == tenantId, cancellationToken);
    }

    public async Task<User?> GetBySsoIdAsync(string ssoProvider, string ssoUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.SsoProvider == ssoProvider && u.SsoUserId == ssoUserId, cancellationToken);
    }

    public async Task<(List<User> Items, int TotalCount)> GetAllAsync(
        string tenantId, 
        int page, 
        int pageSize, 
        string? role = null, 
        bool? isActive = null, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Users.Where(u => u.TenantId == tenantId);

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var userRole))
        {
            query = query.Where(u => u.Role == userRole);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        user.CreatedAt = DateTimeOffset.UtcNow;
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Created user {UserId} for tenant {TenantId}", user.Id, user.TenantId);
        return user;
    }

    public async Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        user.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated user {UserId} for tenant {TenantId}", user.Id, user.TenantId);
        return user;
    }

    public async Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(id, tenantId, cancellationToken);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Deleted user {UserId} from tenant {TenantId}", id, tenantId);
        }
    }

    public async Task<bool> EmailExistsAsync(string email, string tenantId, Guid? excludeUserId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.Where(u => u.Email == email && u.TenantId == tenantId);
        
        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<int> GetUserCountByTenantAsync(string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Users.CountAsync(u => u.TenantId == tenantId, cancellationToken);
    }
}
