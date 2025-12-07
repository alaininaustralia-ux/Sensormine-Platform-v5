using Identity.API.Data;
using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;

namespace Identity.API.Repositories;

/// <summary>
/// Repository implementation for user invitation management
/// </summary>
public class UserInvitationRepository : IUserInvitationRepository
{
    private readonly IdentityDbContext _context;
    private readonly ILogger<UserInvitationRepository> _logger;

    public UserInvitationRepository(IdentityDbContext context, ILogger<UserInvitationRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UserInvitation?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.UserInvitations
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId, cancellationToken);
    }

    public async Task<UserInvitation?> GetByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _context.UserInvitations
            .FirstOrDefaultAsync(i => i.Token == token, cancellationToken);
    }

    public async Task<UserInvitation?> GetByEmailAsync(string email, string tenantId, InvitationStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.UserInvitations
            .Where(i => i.Email == email && i.TenantId == tenantId);

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        return await query.OrderByDescending(i => i.CreatedAt).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(List<UserInvitation> Items, int TotalCount)> GetAllAsync(
        string tenantId, 
        int page, 
        int pageSize, 
        InvitationStatus? status = null, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserInvitations.Where(i => i.TenantId == tenantId);

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<UserInvitation> CreateAsync(UserInvitation invitation, CancellationToken cancellationToken = default)
    {
        invitation.CreatedAt = DateTimeOffset.UtcNow;
        _context.UserInvitations.Add(invitation);
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Created invitation {InvitationId} for {Email}", invitation.Id, invitation.Email);
        return invitation;
    }

    public async Task<UserInvitation> UpdateAsync(UserInvitation invitation, CancellationToken cancellationToken = default)
    {
        invitation.UpdatedAt = DateTimeOffset.UtcNow;
        _context.UserInvitations.Update(invitation);
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated invitation {InvitationId} for {Email}", invitation.Id, invitation.Email);
        return invitation;
    }

    public async Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default)
    {
        var invitation = await GetByIdAsync(id, tenantId, cancellationToken);
        if (invitation != null)
        {
            _context.UserInvitations.Remove(invitation);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Deleted invitation {InvitationId}", id);
        }
    }

    public async Task ExpirePendingInvitationsAsync(CancellationToken cancellationToken = default)
    {
        var expiredInvitations = await _context.UserInvitations
            .Where(i => i.Status == InvitationStatus.Pending && i.ExpiresAt < DateTimeOffset.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var invitation in expiredInvitations)
        {
            invitation.Status = InvitationStatus.Expired;
            invitation.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (expiredInvitations.Any())
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Expired {Count} pending invitations", expiredInvitations.Count);
        }
    }
}
