using System.Net.Http.Json;

namespace Sensormine.MCP.Server.Services.Clients;

/// <summary>
/// HTTP client for Device.API
/// </summary>
public class DeviceApiClient : IDeviceApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DeviceApiClient> _logger;

    public DeviceApiClient(HttpClient httpClient, ILogger<DeviceApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<DeviceListResponse> GetDevicesAsync(
        string tenantId,
        DeviceQueryParams? queryParams = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            var queryString = BuildQueryString(queryParams);
            var response = await _httpClient.GetFromJsonAsync<DeviceListResponse>(
                $"/api/device{queryString}",
                cancellationToken);

            return response ?? new DeviceListResponse();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching devices for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<DeviceResponse> GetDeviceAsync(
        string tenantId,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            var response = await _httpClient.GetFromJsonAsync<DeviceResponse>(
                $"/api/device/{deviceId}",
                cancellationToken);

            return response ?? throw new Exception("Device not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching device {DeviceId} for tenant {TenantId}", deviceId, tenantId);
            throw;
        }
    }

    private string BuildQueryString(DeviceQueryParams? queryParams)
    {
        if (queryParams == null)
            return string.Empty;

        var parts = new List<string>();

        if (!string.IsNullOrEmpty(queryParams.DeviceTypeId))
            parts.Add($"deviceTypeId={Uri.EscapeDataString(queryParams.DeviceTypeId)}");
        
        if (!string.IsNullOrEmpty(queryParams.Status))
            parts.Add($"status={Uri.EscapeDataString(queryParams.Status)}");
        
        if (queryParams.Skip > 0)
            parts.Add($"skip={queryParams.Skip}");
        
        if (queryParams.Take != 100)
            parts.Add($"take={queryParams.Take}");

        return parts.Count > 0 ? "?" + string.Join("&", parts) : string.Empty;
    }
}
