using Sensormine.Core.Models;

namespace Sensormine.Core.Interfaces;

/// <summary>
/// Repository interface for alert instance operations
/// </summary>
public interface IAlertInstanceRepository : IRepository<AlertInstance>
{
    /// <summary>
    /// Get all alert instances for a tenant with pagination and filtering
    /// </summary>
    Task<(List<AlertInstance> Instances, int TotalCount)> GetAllAsync(
        Guid tenantId,
        int page,
        int pageSize,
        AlertStatus? status = null,
        AlertSeverity? severity = null,
        Guid? deviceId = null);

    /// <summary>
    /// Get active (unacknowledged) alerts for a device
    /// </summary>
    Task<List<AlertInstance>> GetActiveByDeviceIdAsync(Guid tenantId, Guid deviceId);

    /// <summary>
    /// Get alert instances by rule ID
    /// </summary>
    Task<List<AlertInstance>> GetByAlertRuleIdAsync(Guid tenantId, Guid alertRuleId, int limit = 100);

    /// <summary>
    /// Get alert instance statistics
    /// </summary>
    Task<AlertInstanceStatistics> GetStatisticsAsync(Guid tenantId);

    /// <summary>
    /// Acknowledge an alert
    /// </summary>
    Task<bool> AcknowledgeAsync(Guid id, Guid tenantId, string acknowledgedBy, string? notes);

    /// <summary>
    /// Resolve an alert
    /// </summary>
    Task<bool> ResolveAsync(Guid id, Guid tenantId, string? resolutionNotes);
}

/// <summary>
/// Statistics for alert instances
/// </summary>
public class AlertInstanceStatistics
{
    public int TotalActive { get; set; }
    public int TotalAcknowledged { get; set; }
    public int TotalResolved { get; set; }
    public int CriticalCount { get; set; }
    public int WarningCount { get; set; }
    public int InfoCount { get; set; }
}
