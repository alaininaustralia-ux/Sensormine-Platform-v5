using Sensormine.Core.Models;

namespace Sensormine.Storage.Interfaces;

/// <summary>
/// Repository interface for DataPointMapping operations
/// </summary>
public interface IDataPointMappingRepository
{
    Task<DataPointMapping?> GetByIdAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<List<DataPointMapping>> GetBySchemaIdAsync(Guid schemaId, string tenantId, CancellationToken cancellationToken = default);
    Task<List<DataPointMapping>> GetByAssetIdAsync(Guid assetId, string tenantId, CancellationToken cancellationToken = default);
    Task<DataPointMapping> CreateAsync(DataPointMapping mapping, CancellationToken cancellationToken = default);
    Task<DataPointMapping> UpdateAsync(DataPointMapping mapping, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string tenantId, CancellationToken cancellationToken = default);
    Task<List<DataPointMapping>> GetByDeviceIdAsync(string deviceId, string tenantId, CancellationToken cancellationToken = default);
    Task<bool> ValidateMappingAsync(DataPointMapping mapping, CancellationToken cancellationToken = default);
}
