using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository for alert rule operations
/// </summary>
public class AlertRuleRepository : IAlertRuleRepository
{
    private readonly ApplicationDbContext _context;

    public AlertRuleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AlertRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AlertRules
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<AlertRule>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AlertRules
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<AlertRule> AddAsync(AlertRule entity, CancellationToken cancellationToken = default)
    {
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.AlertRules.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task UpdateAsync(AlertRule entity, CancellationToken cancellationToken = default)
    {
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        _context.AlertRules.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.AlertRules.FindAsync(new object[] { id }, cancellationToken);
        if (entity != null)
        {
            _context.AlertRules.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<(List<AlertRule> Rules, int TotalCount)> GetAllAsync(string tenantId, int page, int pageSize, string? searchTerm = null)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.AlertRules
            .Where(r => r.TenantId == tenantGuid)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearch = searchTerm.ToLower();
            query = query.Where(r =>
                r.Name.ToLower().Contains(lowerSearch) ||
                (r.Description != null && r.Description.ToLower().Contains(lowerSearch)) ||
                r.Tags.Any(t => t.ToLower().Contains(lowerSearch)));
        }

        var totalCount = await query.CountAsync();

        var rules = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (rules, totalCount);
    }

    public async Task<List<AlertRule>> GetByDeviceTypeIdAsync(string tenantId, Guid deviceTypeId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.AlertRules
            .Where(r => r.TenantId == tenantGuid &&
                       r.TargetType == AlertTargetType.DeviceType &&
                       r.DeviceTypeIds.Contains(deviceTypeId) &&
                       r.IsEnabled)
            .ToListAsync();
    }

    public async Task<List<AlertRule>> GetByDeviceIdAsync(string tenantId, Guid deviceId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.AlertRules
            .Where(r => r.TenantId == tenantGuid &&
                       r.TargetType == AlertTargetType.Device &&
                       r.DeviceIds.Contains(deviceId) &&
                       r.IsEnabled)
            .ToListAsync();
    }

    public async Task<List<AlertRule>> SearchAsync(string tenantId, string searchTerm)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var lowerSearch = searchTerm.ToLower();
        return await _context.AlertRules
            .Where(r => r.TenantId == tenantGuid &&
                       (r.Name.ToLower().Contains(lowerSearch) ||
                        (r.Description != null && r.Description.ToLower().Contains(lowerSearch)) ||
                        r.Tags.Any(t => t.ToLower().Contains(lowerSearch))))
            .OrderBy(r => r.Name)
            .ToListAsync();
    }

    public async Task<List<AlertRule>> GetEnabledRulesAsync(string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.AlertRules
            .Where(r => r.TenantId == tenantGuid && r.IsEnabled)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(Guid id, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.AlertRules
            .AnyAsync(r => r.Id == id && r.TenantId == tenantGuid);
    }
}
