namespace Sensormine.Core.Models;

/// <summary>
/// Status of a schema version
/// </summary>
public enum SchemaStatus
{
    /// <summary>
    /// Schema is in draft mode and can be edited
    /// </summary>
    Draft,

    /// <summary>
    /// Schema is active and being used for validation
    /// </summary>
    Active,

    /// <summary>
    /// Schema is deprecated but still available for legacy data
    /// </summary>
    Deprecated
}
