using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository implementation for Dashboard entity
/// </summary>
public class DashboardRepository : IDashboardRepository
{
    private readonly ApplicationDbContext _context;

    public DashboardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Dashboard?> GetByIdAsync(Guid id, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Dashboards
            .Where(d => d.Id == id && d.TenantId == tenantGuid && !d.IsDeleted)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Dashboard>> GetByUserIdAsync(string userId, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Dashboards
            .Where(d => d.UserId == userId && d.TenantId == tenantGuid && !d.IsDeleted)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Dashboard>> GetByTenantAsync(string tenantId, int skip = 0, int take = 50)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Dashboards
            .Where(d => d.TenantId == tenantGuid && !d.IsDeleted)
            .OrderByDescending(d => d.UpdatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<Dashboard> CreateAsync(Dashboard dashboard)
    {
        dashboard.CreatedAt = DateTimeOffset.UtcNow;
        dashboard.UpdatedAt = DateTimeOffset.UtcNow;
        
        _context.Dashboards.Add(dashboard);
        await _context.SaveChangesAsync();
        
        return dashboard;
    }

    public async Task<Dashboard> UpdateAsync(Dashboard dashboard)
    {
        dashboard.UpdatedAt = DateTimeOffset.UtcNow;
        
        _context.Dashboards.Update(dashboard);
        await _context.SaveChangesAsync();
        
        return dashboard;
    }

    public async Task<bool> DeleteAsync(Guid id, string tenantId)
    {
        var dashboard = await GetByIdAsync(id, tenantId);
        if (dashboard == null)
            return false;

        dashboard.IsDeleted = true;
        dashboard.UpdatedAt = DateTimeOffset.UtcNow;
        
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<IEnumerable<Dashboard>> SearchAsync(string tenantId, string? searchTerm = null, string[]? tags = null)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.Dashboards
            .Where(d => d.TenantId == tenantGuid && !d.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearch = searchTerm.ToLower();
            query = query.Where(d => 
                d.Name.ToLower().Contains(lowerSearch) || 
                (d.Description != null && d.Description.ToLower().Contains(lowerSearch)));
        }

        if (tags != null && tags.Length > 0)
        {
            // Note: This is a simple contains check. For production, consider using PostgreSQL's JSONB operators
            foreach (var tag in tags)
            {
                query = query.Where(d => d.Tags != null && d.Tags.Contains(tag));
            }
        }

        return await query
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Dashboard?> GetWithSubPagesAsync(Guid id, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Dashboards
            .Where(d => d.Id == id && d.TenantId == tenantGuid && !d.IsDeleted)
            .Include(d => d.SubPages.Where(sp => !sp.IsDeleted))
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Dashboard>> GetSubPagesAsync(Guid parentDashboardId, string tenantId)
    {
        var tenantGuid = Guid.Parse(tenantId);
        return await _context.Dashboards
            .Where(d => d.ParentDashboardId == parentDashboardId && d.TenantId == tenantGuid && !d.IsDeleted)
            .OrderBy(d => d.DisplayOrder)
            .ThenBy(d => d.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Dashboard>> GetRootDashboardsAsync(string tenantId, string? userId = null)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var query = _context.Dashboards
            .Where(d => d.ParentDashboardId == null && d.TenantId == tenantGuid && !d.IsDeleted);

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(d => d.UserId == userId);
        }

        return await query
            .OrderBy(d => d.DisplayOrder)
            .ThenByDescending(d => d.UpdatedAt)
            .ToListAsync();
    }

    public async Task<bool> ReorderSubPagesAsync(Guid parentDashboardId, string tenantId, Dictionary<Guid, int> displayOrders)
    {
        var tenantGuid = Guid.Parse(tenantId);
        var subPages = await _context.Dashboards
            .Where(d => d.ParentDashboardId == parentDashboardId && d.TenantId == tenantGuid && !d.IsDeleted)
            .ToListAsync();

        if (!subPages.Any())
            return false;

        foreach (var subPage in subPages)
        {
            if (displayOrders.TryGetValue(subPage.Id, out var newOrder))
            {
                subPage.DisplayOrder = newOrder;
                subPage.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
