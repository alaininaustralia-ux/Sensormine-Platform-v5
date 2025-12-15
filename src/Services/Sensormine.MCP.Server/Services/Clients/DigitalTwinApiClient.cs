using System.Net.Http.Json;

namespace Sensormine.MCP.Server.Services.Clients;

/// <summary>
/// HTTP client for DigitalTwin.API
/// </summary>
public class DigitalTwinApiClient : IDigitalTwinApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DigitalTwinApiClient> _logger;

    public DigitalTwinApiClient(HttpClient httpClient, ILogger<DigitalTwinApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<AssetListResponse> GetAssetsAsync(
        string tenantId,
        AssetQueryParams? queryParams = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            var queryString = BuildQueryString(queryParams);
            var response = await _httpClient.GetFromJsonAsync<AssetListResponse>(
                $"/api/assets{queryString}",
                cancellationToken);

            return response ?? new AssetListResponse();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching assets for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<AssetResponse> GetAssetAsync(
        string tenantId,
        string assetId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            var response = await _httpClient.GetFromJsonAsync<AssetResponse>(
                $"/api/assets/{assetId}",
                cancellationToken);

            return response ?? throw new Exception("Asset not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching asset {AssetId} for tenant {TenantId}", assetId, tenantId);
            throw;
        }
    }

    public async Task<AssetTreeResponse> GetAssetTreeAsync(
        string tenantId,
        string assetId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            var response = await _httpClient.GetFromJsonAsync<AssetTreeResponse>(
                $"/api/assets/{assetId}/tree",
                cancellationToken);

            return response ?? throw new Exception("Asset tree not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching asset tree {AssetId} for tenant {TenantId}", assetId, tenantId);
            throw;
        }
    }

    private string BuildQueryString(AssetQueryParams? queryParams)
    {
        if (queryParams == null)
            return string.Empty;

        var parts = new List<string>();

        if (!string.IsNullOrEmpty(queryParams.ParentId))
            parts.Add($"parentId={Uri.EscapeDataString(queryParams.ParentId)}");
        
        if (!string.IsNullOrEmpty(queryParams.AssetType))
            parts.Add($"assetType={Uri.EscapeDataString(queryParams.AssetType)}");
        
        if (queryParams.Skip > 0)
            parts.Add($"skip={queryParams.Skip}");
        
        if (queryParams.Take != 100)
            parts.Add($"take={queryParams.Take}");

        return parts.Count > 0 ? "?" + string.Join("&", parts) : string.Empty;
    }
}
