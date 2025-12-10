namespace Device.API.Services;

/// <summary>
/// Client for interacting with SchemaRegistry.API
/// </summary>
public interface ISchemaRegistryClient
{
    /// <summary>
    /// Get schema name by schema ID
    /// </summary>
    /// <param name="schemaId">Schema ID</param>
    /// <returns>Schema name or null if not found</returns>
    Task<string?> GetSchemaNameAsync(Guid schemaId);

    /// <summary>
    /// Get schema names for multiple schema IDs in batch
    /// </summary>
    /// <param name="schemaIds">List of schema IDs</param>
    /// <returns>Dictionary mapping schema ID to schema name</returns>
    Task<Dictionary<Guid, string>> GetSchemaNamesAsync(IEnumerable<Guid> schemaIds);

    /// <summary>
    /// Get full schema details by schema ID
    /// </summary>
    /// <param name="schemaId">Schema ID</param>
    /// <returns>Schema details or null if not found</returns>
    Task<SchemaResponse?> GetSchemaAsync(Guid schemaId);
}

/// <summary>
/// Schema response from SchemaRegistry.API
/// </summary>
public class SchemaResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SchemaType { get; set; } = string.Empty;
    public System.Text.Json.JsonDocument SchemaDefinition { get; set; } = System.Text.Json.JsonDocument.Parse("{}");
}
