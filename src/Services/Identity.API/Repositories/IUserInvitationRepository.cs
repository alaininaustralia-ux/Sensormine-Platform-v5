using Sensormine.Core.Models;

namespace Identity.API.Repositories;

/// <summary>
/// Repository interface for user invitation management
/// </summary>
public interface IUserInvitationRepository
{
    Task<UserInvitation?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<UserInvitation?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<UserInvitation?> GetByEmailAsync(string email, string tenantId, InvitationStatus? status = null, CancellationToken cancellationToken = default);
    Task<(List<UserInvitation> Items, int TotalCount)> GetAllAsync(string tenantId, int page, int pageSize, InvitationStatus? status = null, CancellationToken cancellationToken = default);
    Task<UserInvitation> CreateAsync(UserInvitation invitation, CancellationToken cancellationToken = default);
    Task<UserInvitation> UpdateAsync(UserInvitation invitation, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task ExpirePendingInvitationsAsync(CancellationToken cancellationToken = default);
}
