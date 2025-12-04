namespace Sensormine.Schemas.Interfaces;

/// <summary>
/// Schema validator interface
/// </summary>
public interface ISchemaValidator
{
    /// <summary>
    /// Validate data against a schema
    /// </summary>
    /// <param name="schemaId">Schema identifier</param>
    /// <param name="data">Data to validate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result</returns>
    Task<ValidationResult> ValidateAsync(string schemaId, object data, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate data against a schema definition
    /// </summary>
    Task<ValidationResult> ValidateAsync(string schemaDefinition, string schemaType, object data, CancellationToken cancellationToken = default);
}

/// <summary>
/// Validation result
/// </summary>
public class ValidationResult
{
    /// <summary>
    /// Whether validation passed
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Validation errors
    /// </summary>
    public List<ValidationError> Errors { get; set; } = new();
}

/// <summary>
/// Validation error details
/// </summary>
public class ValidationError
{
    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Field path where error occurred
    /// </summary>
    public string? Path { get; set; }

    /// <summary>
    /// Error code
    /// </summary>
    public string? Code { get; set; }
}
