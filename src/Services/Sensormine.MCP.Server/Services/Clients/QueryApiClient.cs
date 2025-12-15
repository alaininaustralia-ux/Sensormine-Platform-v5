using System.Net.Http.Json;

namespace Sensormine.MCP.Server.Services.Clients;

/// <summary>
/// HTTP client for Query.API
/// </summary>
public class QueryApiClient : IQueryApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<QueryApiClient> _logger;

    public QueryApiClient(HttpClient httpClient, ILogger<QueryApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<TelemetryResponse> QueryTelemetryAsync(
        string tenantId,
        TelemetryQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            // Query each device separately and combine results
            // (Query.API expects single DeviceId per request)
            var allDataPoints = new List<TelemetryDataPoint>();

            foreach (var deviceIdStr in request.DeviceIds)
            {
                if (!Guid.TryParse(deviceIdStr, out var deviceId))
                {
                    _logger.LogWarning("Invalid device ID format: {DeviceId}", deviceIdStr);
                    continue;
                }

                // Build query request compatible with Query.API
                var queryRequest = new
                {
                    startTime = request.StartTime,
                    endTime = request.EndTime,
                    deviceId = deviceId,
                    limit = 1000,
                    sortDirection = "desc"
                };

                try
                {
                    var response = await _httpClient.PostAsJsonAsync(
                        "/api/timeseries/telemetry/query",
                        queryRequest,
                        cancellationToken);

                    response.EnsureSuccessStatusCode();

                    var result = await response.Content.ReadFromJsonAsync<QueryApiResponse>(cancellationToken);
                    
                    if (result?.Data != null)
                    {
                        // Convert Query.API response to our format
                        allDataPoints.AddRange(result.Data.Select(dp => new TelemetryDataPoint
                        {
                            Timestamp = dp.Timestamp,
                            DeviceId = deviceIdStr,
                            Values = dp.Data ?? new Dictionary<string, object>()
                        }));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error querying device {DeviceId}", deviceIdStr);
                    // Continue with other devices
                }
            }

            return new TelemetryResponse
            {
                Data = allDataPoints.OrderByDescending(dp => dp.Timestamp).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying telemetry for tenant {TenantId}", tenantId);
            throw;
        }
    }

    // Helper class for Query.API response
    private class QueryApiResponse
    {
        public List<QueryApiDataPoint> Data { get; set; } = new();
        public int TotalCount { get; set; }
    }

    private class QueryApiDataPoint
    {
        public DateTimeOffset Timestamp { get; set; }
        public Guid DeviceId { get; set; }
        public Dictionary<string, object>? Data { get; set; }
    }

    public async Task<LatestTelemetryResponse> GetLatestTelemetryAsync(
        string tenantId,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
            _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);

            var response = await _httpClient.GetFromJsonAsync<LatestTelemetryResponse>(
                $"/api/deviceswithtelem/{deviceId}/latest",
                cancellationToken);

            return response ?? new LatestTelemetryResponse();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching latest telemetry for device {DeviceId}", deviceId);
            throw;
        }
    }
}
