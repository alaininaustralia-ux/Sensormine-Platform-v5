namespace Sensormine.Core.Interfaces;

/// <summary>
/// Multi-tenant context provider
/// </summary>
public interface ITenantProvider
{
    /// <summary>
    /// Get the current tenant identifier
    /// </summary>
    string GetTenantId();

    /// <summary>
    /// Set the current tenant identifier
    /// </summary>
    void SetTenantId(string tenantId);
}
