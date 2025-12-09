using System.Text.Json;

namespace Query.API.Services;

/// <summary>
/// HTTP client implementation for SchemaRegistry.API
/// </summary>
public class SchemaRegistryClient : ISchemaRegistryClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SchemaRegistryClient> _logger;

    public SchemaRegistryClient(HttpClient httpClient, ILogger<SchemaRegistryClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<SchemaDto?> GetSchemaByIdAsync(Guid schemaId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Fetching schema {SchemaId} from SchemaRegistry.API", schemaId);
            
            var response = await _httpClient.GetAsync($"/api/schemas/{schemaId}", cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Schema {SchemaId} not found or error: {StatusCode}", 
                    schemaId, response.StatusCode);
                return null;
            }

            var schema = await response.Content.ReadFromJsonAsync<SchemaDto>(cancellationToken);
            
            _logger.LogDebug("Successfully fetched schema {SchemaId}: {SchemaName}", 
                schemaId, schema?.Name);
            
            return schema;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching schema {SchemaId} from SchemaRegistry.API", schemaId);
            return null;
        }
    }
}
