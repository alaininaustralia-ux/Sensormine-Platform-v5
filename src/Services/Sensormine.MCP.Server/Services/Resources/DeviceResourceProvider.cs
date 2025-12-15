using Microsoft.Extensions.Caching.Distributed;
using Sensormine.MCP.Server.Models;
using System.Text.Json;

namespace Sensormine.MCP.Server.Services.Resources;

/// <summary>
/// Resource provider for device catalog
/// </summary>
public class DeviceResourceProvider : IResourceProvider
{
    private readonly IDeviceApiClient _deviceClient;
    private readonly IQueryApiClient _queryClient;
    private readonly IDistributedCache _cache;
    private readonly ILogger<DeviceResourceProvider> _logger;

    public DeviceResourceProvider(
        IDeviceApiClient deviceClient,
        IQueryApiClient queryClient,
        IDistributedCache cache,
        ILogger<DeviceResourceProvider> logger)
    {
        _deviceClient = deviceClient;
        _queryClient = queryClient;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ListResourcesResponse> ListResourcesAsync(string? uriPattern, CancellationToken cancellationToken)
    {
        // Parse URI pattern to extract tenant ID and filters
        var (tenantId, filters) = ParseUriPattern(uriPattern);

        if (string.IsNullOrEmpty(tenantId))
        {
            // Return available device resources (generic list)
            return new ListResourcesResponse
            {
                Resources = new List<McpResource>
                {
                    new McpResource
                    {
                        Uri = "device:///list",
                        Name = "Device List",
                        Description = "List all devices with pagination",
                        MimeType = "application/json"
                    },
                    new McpResource
                    {
                        Uri = "device:///{tenant-id}/{device-id}",
                        Name = "Single Device",
                        Description = "Get detailed information about a specific device",
                        MimeType = "application/json"
                    },
                    new McpResource
                    {
                        Uri = "device:///{tenant-id}/{device-id}/telemetry/latest",
                        Name = "Latest Telemetry",
                        Description = "Get latest telemetry snapshot for a device",
                        MimeType = "application/json"
                    }
                }
            };
        }

        // Fetch actual devices
        var devices = await _deviceClient.GetDevicesAsync(tenantId, new DeviceQueryParams { Take = 100 }, cancellationToken);

        var resources = devices.Devices.Select(d => new McpResource
        {
            Uri = $"device:///{tenantId}/{d.Id}",
            Name = d.Name,
            Description = $"{d.DeviceType} - {d.Status ?? "unknown"}",
            MimeType = "application/json"
        }).ToList();

        return new ListResourcesResponse { Resources = resources };
    }

    public async Task<ReadResourceResponse> ReadResourceAsync(string uri, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Reading device resource: {Uri}", uri);

        // Check cache
        var cacheKey = $"device:resource:{uri}";
        var cached = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for {Uri}", uri);
            return JsonSerializer.Deserialize<ReadResourceResponse>(cached)!;
        }

        // Parse URI: device:///{tenant-id}/{device-id}[/telemetry/latest]
        var parts = uri.Replace("device:///", "").Split('/');
        
        if (parts.Length < 2)
            throw new ArgumentException("Invalid device URI format");

        var tenantId = parts[0];
        var deviceId = parts[1];
        var isLatestTelemetry = parts.Length > 2 && parts[2] == "telemetry" && parts[3] == "latest";

        // Fetch device data
        var device = await _deviceClient.GetDeviceAsync(tenantId, deviceId, cancellationToken);

        object content;

        if (isLatestTelemetry)
        {
            // Fetch latest telemetry
            var telemetry = await _queryClient.GetLatestTelemetryAsync(tenantId, deviceId, cancellationToken);
            content = new
            {
                deviceId,
                deviceName = device.Device.Name,
                timestamp = telemetry.Timestamp,
                telemetry = telemetry.Values
            };
        }
        else
        {
            // Return device metadata
            content = new
            {
                id = device.Device.Id,
                name = device.Device.Name,
                deviceType = device.Device.DeviceType,
                status = device.Device.Status,
                location = device.Device.Location,
                lastSeen = device.Device.LastSeenAt,
                customFields = device.Device.CustomFieldValues
            };
        }

        var response = new ReadResourceResponse
        {
            Contents = new List<ResourceContent>
            {
                new ResourceContent
                {
                    Uri = uri,
                    MimeType = "application/json",
                    Text = JsonSerializer.Serialize(content, new JsonSerializerOptions { WriteIndented = true })
                }
            }
        };

        // Cache for 5 minutes
        await _cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(response),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) },
            cancellationToken);

        return response;
    }

    private (string? tenantId, Dictionary<string, string>? filters) ParseUriPattern(string? uriPattern)
    {
        if (string.IsNullOrEmpty(uriPattern) || uriPattern == "device:///list")
            return (null, null);

        // Simple parsing - could be enhanced
        var parts = uriPattern.Replace("device:///", "").Split('?');
        var path = parts[0];
        var tenantId = path.Split('/').FirstOrDefault();

        Dictionary<string, string>? filters = null;
        if (parts.Length > 1)
        {
            filters = parts[1].Split('&')
                .Select(p => p.Split('='))
                .Where(p => p.Length == 2)
                .ToDictionary(p => p[0], p => p[1]);
        }

        return (tenantId, filters);
    }
}
