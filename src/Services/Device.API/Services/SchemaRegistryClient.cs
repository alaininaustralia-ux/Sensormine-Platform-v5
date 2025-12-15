using System.Text.Json;

namespace Device.API.Services;

/// <summary>
/// Client for interacting with SchemaRegistry.API
/// </summary>
public class SchemaRegistryClient : ISchemaRegistryClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SchemaRegistryClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    /// <summary>
    /// Initializes a new instance of the SchemaRegistryClient
    /// </summary>
    public SchemaRegistryClient(HttpClient httpClient, ILogger<SchemaRegistryClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    /// <inheritdoc />
    public async Task<string?> GetSchemaNameAsync(Guid schemaId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/schemas/{schemaId}");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch schema {SchemaId}. Status: {StatusCode}", 
                    schemaId, response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            
            if (doc.RootElement.TryGetProperty("name", out var nameProperty))
            {
                return nameProperty.GetString();
            }

            _logger.LogWarning("Schema {SchemaId} response missing 'name' property", schemaId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching schema name for {SchemaId}", schemaId);
            return null;
        }
    }

    /// <inheritdoc />
    public async Task<Dictionary<Guid, string>> GetSchemaNamesAsync(IEnumerable<Guid> schemaIds)
    {
        var result = new Dictionary<Guid, string>();
        var distinctIds = schemaIds.Distinct().ToList();

        if (!distinctIds.Any())
        {
            return result;
        }

        // Fetch schemas in parallel with a reasonable degree of parallelism
        var tasks = distinctIds.Select(async schemaId =>
        {
            var name = await GetSchemaNameAsync(schemaId);
            return (schemaId, name);
        });

        var results = await Task.WhenAll(tasks);

        foreach (var (schemaId, name) in results)
        {
            if (name != null)
            {
                result[schemaId] = name;
            }
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<SchemaResponse?> GetSchemaAsync(Guid schemaId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/schemas/{schemaId}");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch schema {SchemaId}. Status: {StatusCode}", 
                    schemaId, response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            
            var schema = new SchemaResponse
            {
                Id = schemaId,
                Name = doc.RootElement.GetProperty("name").GetString() ?? "",
                SchemaType = "JsonSchema" // All schemas are JSON Schema format
            };

            // Parse schema definition from currentVersion.jsonSchema
            if (doc.RootElement.TryGetProperty("currentVersion", out var currentVersion) &&
                currentVersion.TryGetProperty("jsonSchema", out var jsonSchemaProperty))
            {
                var jsonSchemaString = jsonSchemaProperty.GetString();
                if (!string.IsNullOrEmpty(jsonSchemaString))
                {
                    schema.SchemaDefinition = JsonDocument.Parse(jsonSchemaString);
                }
            }

            return schema;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching schema {SchemaId}", schemaId);
            return null;
        }
    }
}
