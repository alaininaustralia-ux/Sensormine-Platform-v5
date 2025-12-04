using Sensormine.Core.Models;

namespace Sensormine.Core.DTOs;

/// <summary>
/// Request to create a new schema
/// </summary>
public class CreateSchemaRequest
{
    /// <summary>
    /// Schema name (unique per tenant)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Schema description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Initial schema version
    /// </summary>
    public CreateSchemaVersionRequest InitialVersion { get; set; } = new();
}

/// <summary>
/// Request to update schema metadata
/// </summary>
public class UpdateSchemaRequest
{
    /// <summary>
    /// Schema name
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Schema description
    /// </summary>
    public string? Description { get; set; }
}

/// <summary>
/// Request to create a new schema version
/// </summary>
public class CreateSchemaVersionRequest
{
    /// <summary>
    /// Version number (semantic versioning)
    /// </summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// JSON Schema definition
    /// </summary>
    public string JsonSchema { get; set; } = string.Empty;

    /// <summary>
    /// Device types that use this version
    /// </summary>
    public List<string> DeviceTypes { get; set; } = new();

    /// <summary>
    /// Set as default version
    /// </summary>
    public bool SetAsDefault { get; set; }
}

/// <summary>
/// Request to update a schema version
/// </summary>
public class UpdateSchemaVersionRequest
{
    /// <summary>
    /// Update the status of the version
    /// </summary>
    public SchemaStatus? Status { get; set; }

    /// <summary>
    /// Update the device types
    /// </summary>
    public List<string>? DeviceTypes { get; set; }
}

/// <summary>
/// Request to validate data against a schema
/// </summary>
public class ValidateDataRequest
{
    /// <summary>
    /// JSON data to validate
    /// </summary>
    public string Data { get; set; } = string.Empty;

    /// <summary>
    /// Specific version to validate against (optional, uses default if not specified)
    /// </summary>
    public string? Version { get; set; }
}

/// <summary>
/// Schema DTO
/// </summary>
public class SchemaDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public List<SchemaVersionDto> Versions { get; set; } = new();
}

/// <summary>
/// Schema list response with pagination
/// </summary>
public class SchemaListResponse
{
    public List<SchemaDto> Schemas { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
}

/// <summary>
/// Schema version DTO (summary without JsonSchema)
/// </summary>
public class SchemaVersionDto
{
    public Guid Id { get; set; }
    public Guid SchemaId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public List<string> DeviceTypes { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

/// <summary>
/// Schema version detail DTO (includes JsonSchema)
/// </summary>
public class SchemaVersionDetailDto
{
    public Guid Id { get; set; }
    public Guid SchemaId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string JsonSchema { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public List<string> DeviceTypes { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

/// <summary>
/// Validation result
/// </summary>
public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<ValidationError> Errors { get; set; } = new();
}

/// <summary>
/// Validation error
/// </summary>
public class ValidationError
{
    public string Path { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ErrorType { get; set; } = string.Empty;
}
