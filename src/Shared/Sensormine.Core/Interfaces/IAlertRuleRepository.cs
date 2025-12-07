using Sensormine.Core.Models;

namespace Sensormine.Core.Interfaces;

/// <summary>
/// Repository interface for alert rule operations
/// </summary>
public interface IAlertRuleRepository : IRepository<AlertRule>
{
    /// <summary>
    /// Get all alert rules for a tenant with pagination
    /// </summary>
    Task<(List<AlertRule> Rules, int TotalCount)> GetAllAsync(string tenantId, int page, int pageSize, string? searchTerm = null);

    /// <summary>
    /// Get alert rules by device type ID
    /// </summary>
    Task<List<AlertRule>> GetByDeviceTypeIdAsync(string tenantId, Guid deviceTypeId);

    /// <summary>
    /// Get alert rules by device ID
    /// </summary>
    Task<List<AlertRule>> GetByDeviceIdAsync(string tenantId, Guid deviceId);

    /// <summary>
    /// Search alert rules by name, description, or tags
    /// </summary>
    Task<List<AlertRule>> SearchAsync(string tenantId, string searchTerm);

    /// <summary>
    /// Get enabled alert rules for evaluation
    /// </summary>
    Task<List<AlertRule>> GetEnabledRulesAsync(string tenantId);

    /// <summary>
    /// Check if an alert rule exists
    /// </summary>
    Task<bool> ExistsAsync(Guid id, string tenantId);
}
