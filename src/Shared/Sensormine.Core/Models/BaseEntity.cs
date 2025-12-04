namespace Sensormine.Core.Models;

/// <summary>
/// Base entity for all domain models with common properties
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Unique identifier for the entity
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Timestamp when the entity was created
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Timestamp when the entity was last updated
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// Tenant identifier for multi-tenancy support
    /// </summary>
    public string TenantId { get; set; } = string.Empty;
}
