using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository implementation for Device operations
/// </summary>
public class DeviceRepository : IDeviceRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DeviceRepository> _logger;

    public DeviceRepository(ApplicationDbContext context, ILogger<DeviceRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Device?> GetByIdAsync(Guid id, string tenantId)
    {
        return await _context.Devices
            .Include(d => d.DeviceType)
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);
    }

    public async Task<Device?> GetByDeviceIdAsync(string deviceId, string tenantId)
    {
        return await _context.Devices
            .Include(d => d.DeviceType)
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId && d.TenantId == tenantId);
    }

    public async Task<List<Device>> GetAllAsync(string tenantId, int page = 1, int pageSize = 20)
    {
        return await _context.Devices
            .Include(d => d.DeviceType)
            .Where(d => d.TenantId == tenantId)
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<Device>> SearchAsync(
        string tenantId,
        Guid? deviceTypeId = null,
        string? status = null,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.Devices
            .Include(d => d.DeviceType)
            .Where(d => d.TenantId == tenantId);

        if (deviceTypeId.HasValue)
        {
            query = query.Where(d => d.DeviceTypeId == deviceTypeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(d => d.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(d =>
                d.Name.Contains(searchTerm) ||
                d.DeviceId.Contains(searchTerm) ||
                (d.SerialNumber != null && d.SerialNumber.Contains(searchTerm)));
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(
        string tenantId,
        Guid? deviceTypeId = null,
        string? status = null,
        string? searchTerm = null)
    {
        var query = _context.Devices
            .Where(d => d.TenantId == tenantId);

        if (deviceTypeId.HasValue)
        {
            query = query.Where(d => d.DeviceTypeId == deviceTypeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(d => d.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(d =>
                d.Name.Contains(searchTerm) ||
                d.DeviceId.Contains(searchTerm) ||
                (d.SerialNumber != null && d.SerialNumber.Contains(searchTerm)));
        }

        return await query.CountAsync();
    }

    public async Task<Device> CreateAsync(Device device)
    {
        device.Id = Guid.NewGuid();
        device.CreatedAt = DateTimeOffset.UtcNow;
        device.UpdatedAt = DateTimeOffset.UtcNow;

        _context.Devices.Add(device);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created device {DeviceId} ({Id}) for tenant {TenantId}",
            device.DeviceId, device.Id, device.TenantId);

        // Reload with DeviceType included
        return (await GetByIdAsync(device.Id, device.TenantId))!;
    }

    public async Task<Device> UpdateAsync(Device device)
    {
        device.UpdatedAt = DateTimeOffset.UtcNow;

        _context.Devices.Update(device);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated device {DeviceId} ({Id})",
            device.DeviceId, device.Id);

        // Reload with DeviceType included
        return (await GetByIdAsync(device.Id, device.TenantId))!;
    }

    public async Task DeleteAsync(Guid id, string tenantId)
    {
        var device = await GetByIdAsync(id, tenantId);
        if (device == null)
        {
            throw new KeyNotFoundException($"Device {id} not found for tenant {tenantId}");
        }

        _context.Devices.Remove(device);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted device {DeviceId} ({Id})",
            device.DeviceId, device.Id);
    }

    public async Task<bool> ExistsAsync(string deviceId, string tenantId)
    {
        return await _context.Devices
            .AnyAsync(d => d.DeviceId == deviceId && d.TenantId == tenantId);
    }

    public async Task<(Guid? SchemaId, string? SchemaName)?> GetSchemaInfoAsync(string deviceId, string tenantId)
    {
        var device = await _context.Devices
            .Include(d => d.DeviceType)
            .ThenInclude(dt => dt!.Schema)
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId && d.TenantId == tenantId);

        if (device?.DeviceType?.Schema == null)
        {
            return null;
        }

        return (device.DeviceType.SchemaId, device.DeviceType.Schema.Name);
    }
}
