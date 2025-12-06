using System.Net.Http.Json;

namespace Edge.Gateway.Services;

/// <summary>
/// HTTP client for Device.API
/// </summary>
public interface IDeviceApiClient
{
    Task<bool> AuthenticateDeviceAsync(string deviceId, string? username, string? password, CancellationToken cancellationToken = default);
    Task<DeviceInfo?> GetDeviceInfoAsync(string deviceId, CancellationToken cancellationToken = default);
}

public class DeviceApiClient : IDeviceApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DeviceApiClient> _logger;
    private readonly IConfiguration _configuration;

    public DeviceApiClient(
        HttpClient httpClient,
        ILogger<DeviceApiClient> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;

        var baseUrl = _configuration["DeviceApi:BaseUrl"] ?? "http://localhost:5293";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public async Task<bool> AuthenticateDeviceAsync(
        string deviceId,
        string? username,
        string? password,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // For now, implement simple authentication
            // Real implementation would validate against Device.API
            var device = await GetDeviceInfoAsync(deviceId, cancellationToken);
            
            if (device == null)
            {
                _logger.LogWarning("Device {DeviceId} not found in Device.API", deviceId);
                return false;
            }

            // TODO: Implement proper credential validation
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error authenticating device {DeviceId}", deviceId);
            return false;
        }
    }

    public async Task<DeviceInfo?> GetDeviceInfoAsync(string deviceId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/devices/{deviceId}", cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadFromJsonAsync<DeviceInfo>(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching device info for {DeviceId}", deviceId);
            return null;
        }
    }
}

public class DeviceInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DeviceTypeId { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
