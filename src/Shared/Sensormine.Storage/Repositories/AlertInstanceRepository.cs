using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Interfaces;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository for alert instance operations
/// </summary>
public class AlertInstanceRepository : Repository<AlertInstance>, IAlertInstanceRepository
{
    public AlertInstanceRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(List<AlertInstance> Instances, int TotalCount)> GetAllAsync(
        Guid tenantId,
        int page,
        int pageSize,
        AlertStatus? status = null,
        AlertSeverity? severity = null,
        Guid? deviceId = null)
    {
        var query = _context.AlertInstances
            .Include(i => i.AlertRule)
            .Include(i => i.Device)
            .Where(i => i.TenantId == tenantId)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        if (severity.HasValue)
        {
            query = query.Where(i => i.Severity == severity.Value);
        }

        if (deviceId.HasValue)
        {
            query = query.Where(i => i.DeviceId == deviceId.Value);
        }

        var totalCount = await query.CountAsync();

        var instances = await query
            .OrderByDescending(i => i.TriggeredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (instances, totalCount);
    }

    public async Task<List<AlertInstance>> GetActiveByDeviceIdAsync(Guid tenantId, Guid deviceId)
    {
        return await _context.AlertInstances
            .Include(i => i.AlertRule)
            .Where(i => i.TenantId == tenantId &&
                       i.DeviceId == deviceId &&
                       i.Status == AlertStatus.Active)
            .OrderByDescending(i => i.TriggeredAt)
            .ToListAsync();
    }

    public async Task<List<AlertInstance>> GetByAlertRuleIdAsync(Guid tenantId, Guid alertRuleId, int limit = 100)
    {
        return await _context.AlertInstances
            .Include(i => i.Device)
            .Where(i => i.TenantId == tenantId && i.AlertRuleId == alertRuleId)
            .OrderByDescending(i => i.TriggeredAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<AlertInstanceStatistics> GetStatisticsAsync(Guid tenantId)
    {
        var stats = await _context.AlertInstances
            .Where(i => i.TenantId == tenantId)
            .GroupBy(i => 1)
            .Select(g => new AlertInstanceStatistics
            {
                TotalActive = g.Count(i => i.Status == AlertStatus.Active),
                TotalAcknowledged = g.Count(i => i.Status == AlertStatus.Acknowledged),
                TotalResolved = g.Count(i => i.Status == AlertStatus.Resolved),
                CriticalCount = g.Count(i => i.Severity == AlertSeverity.Critical),
                WarningCount = g.Count(i => i.Severity == AlertSeverity.Warning),
                InfoCount = g.Count(i => i.Severity == AlertSeverity.Info)
            })
            .FirstOrDefaultAsync();

        return stats ?? new AlertInstanceStatistics();
    }

    public async Task<bool> AcknowledgeAsync(Guid id, Guid tenantId, string acknowledgedBy, string? notes)
    {
        var instance = await _context.AlertInstances
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (instance == null)
        {
            return false;
        }

        instance.Status = AlertStatus.Acknowledged;
        instance.AcknowledgedAt = DateTimeOffset.UtcNow;
        instance.AcknowledgedBy = acknowledgedBy;
        instance.AcknowledgmentNotes = notes;
        instance.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResolveAsync(Guid id, Guid tenantId, string? resolutionNotes)
    {
        var instance = await _context.AlertInstances
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (instance == null)
        {
            return false;
        }

        instance.Status = AlertStatus.Resolved;
        instance.ResolvedAt = DateTimeOffset.UtcNow;
        instance.ResolutionNotes = resolutionNotes;
        instance.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}
