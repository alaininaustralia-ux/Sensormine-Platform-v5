using NJsonSchema;
using Sensormine.Core.DTOs;
using Sensormine.Storage.Interfaces;
using System.Text.Json;

namespace Sensormine.Storage.Services;

/// <summary>
/// Service for validating data against JSON schemas using NJsonSchema
/// </summary>
public class SchemaValidationService : ISchemaValidationService
{
    private readonly ISchemaRepository _schemaRepository;

    public SchemaValidationService(ISchemaRepository schemaRepository)
    {
        _schemaRepository = schemaRepository ?? throw new ArgumentNullException(nameof(schemaRepository));
    }

    public async Task<ValidationResult> ValidateDataAsync(string jsonSchema, string data)
    {
        try
        {
            // Parse the JSON Schema
            var schema = await JsonSchema.FromJsonAsync(jsonSchema);

            // Parse the data as JSON
            JsonDocument dataDocument;
            try
            {
                dataDocument = JsonDocument.Parse(data);
            }
            catch (JsonException ex)
            {
                return new ValidationResult
                {
                    IsValid = false,
                    Errors = new List<ValidationError>
                    {
                        new ValidationError
                        {
                            Path = "#",
                            Message = $"Invalid JSON data: {ex.Message}",
                            ErrorType = "JsonParseError"
                        }
                    }
                };
            }

            // Validate the data against the schema
            var validationErrors = schema.Validate(data);

            if (validationErrors.Count == 0)
            {
                return new ValidationResult
                {
                    IsValid = true,
                    Errors = new List<ValidationError>()
                };
            }

            // Convert NJsonSchema validation errors to our DTOs
            var errors = validationErrors.Select(error => new ValidationError
            {
                Path = error.Path ?? "#",
                Message = error.ToString(),
                ErrorType = error.Kind.ToString()
            }).ToList();

            return new ValidationResult
            {
                IsValid = false,
                Errors = errors
            };
        }
        catch (Exception ex)
        {
            return new ValidationResult
            {
                IsValid = false,
                Errors = new List<ValidationError>
                {
                    new ValidationError
                    {
                        Path = "#",
                        Message = $"Schema validation error: {ex.Message}",
                        ErrorType = "ValidationError"
                    }
                }
            };
        }
    }

    public async Task<ValidationResult> ValidateSchemaAsync(string jsonSchema)
    {
        try
        {
            // Try to parse the JSON Schema
            var schema = await JsonSchema.FromJsonAsync(jsonSchema);

            // If parsing succeeds, the schema is valid
            return new ValidationResult
            {
                IsValid = true,
                Errors = new List<ValidationError>()
            };
        }
        catch (Exception ex)
        {
            return new ValidationResult
            {
                IsValid = false,
                Errors = new List<ValidationError>
                {
                    new ValidationError
                    {
                        Path = "#",
                        Message = $"Invalid JSON Schema: {ex.Message}",
                        ErrorType = "SchemaParseError"
                    }
                }
            };
        }
    }

    public async Task<ValidationResult> ValidateDataAgainstSchemaAsync(
        Guid schemaId,
        string tenantId,
        string data,
        string? version = null)
    {
        try
        {
            // Retrieve the schema version
            Core.Models.SchemaVersion? schemaVersion;

            if (string.IsNullOrEmpty(version))
            {
                // Use default version
                schemaVersion = await _schemaRepository.GetDefaultVersionAsync(schemaId, tenantId);
            }
            else
            {
                // Use specified version
                schemaVersion = await _schemaRepository.GetVersionAsync(schemaId, version, tenantId);
            }

            if (schemaVersion == null)
            {
                return new ValidationResult
                {
                    IsValid = false,
                    Errors = new List<ValidationError>
                    {
                        new ValidationError
                        {
                            Path = "#",
                            Message = $"Schema not found: {schemaId}" + 
                                     (string.IsNullOrEmpty(version) ? " (default version)" : $" (version {version})"),
                            ErrorType = "SchemaNotFound"
                        }
                    }
                };
            }

            // Validate data against the schema
            return await ValidateDataAsync(schemaVersion.JsonSchema, data);
        }
        catch (Exception ex)
        {
            return new ValidationResult
            {
                IsValid = false,
                Errors = new List<ValidationError>
                {
                    new ValidationError
                    {
                        Path = "#",
                        Message = $"Validation error: {ex.Message}",
                        ErrorType = "ValidationError"
                    }
                }
            };
        }
    }
}
