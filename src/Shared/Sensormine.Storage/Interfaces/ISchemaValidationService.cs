using Sensormine.Core.DTOs;

namespace Sensormine.Storage.Interfaces;

/// <summary>
/// Service for validating data against JSON schemas
/// </summary>
public interface ISchemaValidationService
{
    /// <summary>
    /// Validates data against a JSON schema
    /// </summary>
    /// <param name="jsonSchema">JSON Schema definition (JSON Schema draft 7)</param>
    /// <param name="data">Data to validate (as JSON string)</param>
    /// <returns>Validation result with any errors</returns>
    Task<ValidationResult> ValidateDataAsync(string jsonSchema, string data);

    /// <summary>
    /// Validates that a JSON schema is well-formed
    /// </summary>
    /// <param name="jsonSchema">JSON Schema to validate</param>
    /// <returns>Validation result with any errors</returns>
    Task<ValidationResult> ValidateSchemaAsync(string jsonSchema);

    /// <summary>
    /// Validates data against a stored schema by ID
    /// </summary>
    /// <param name="schemaId">Schema ID</param>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="data">Data to validate (as JSON string)</param>
    /// <param name="version">Optional specific version to use. If null, uses default version.</param>
    /// <returns>Validation result with any errors</returns>
    Task<ValidationResult> ValidateDataAgainstSchemaAsync(Guid schemaId, string tenantId, string data, string? version = null);
}
