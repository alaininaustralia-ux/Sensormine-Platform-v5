using Sensormine.Core.Models;

namespace Sensormine.Storage.Repositories;

/// <summary>
/// Repository interface for Device operations
/// </summary>
public interface IDeviceRepository
{
    Task<Device?> GetByIdAsync(Guid id, string tenantId);
    Task<Device?> GetByDeviceIdAsync(string deviceId, string tenantId);
    Task<List<Device>> GetAllAsync(string tenantId, int page = 1, int pageSize = 20);
    Task<List<Device>> SearchAsync(string tenantId, Guid? deviceTypeId = null, string? status = null, string? searchTerm = null, int page = 1, int pageSize = 20);
    Task<int> GetCountAsync(string tenantId, Guid? deviceTypeId = null, string? status = null, string? searchTerm = null);
    Task<Device> CreateAsync(Device device);
    Task<Device> UpdateAsync(Device device);
    Task DeleteAsync(Guid id, string tenantId);
    Task<bool> ExistsAsync(string deviceId, string tenantId);
    Task<(Guid? SchemaId, string? SchemaName)?> GetSchemaInfoAsync(string deviceId, string tenantId);
}
