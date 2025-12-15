using Microsoft.Extensions.Caching.Distributed;
using Sensormine.MCP.Server.Models;
using System.Text.Json;

namespace Sensormine.MCP.Server.Services.Resources;

/// <summary>
/// Resource provider for asset hierarchy
/// </summary>
public class AssetResourceProvider : IResourceProvider
{
    private readonly IDigitalTwinApiClient _digitalTwinClient;
    private readonly IDistributedCache _cache;
    private readonly ILogger<AssetResourceProvider> _logger;

    public AssetResourceProvider(
        IDigitalTwinApiClient digitalTwinClient,
        IDistributedCache cache,
        ILogger<AssetResourceProvider> logger)
    {
        _digitalTwinClient = digitalTwinClient;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ListResourcesResponse> ListResourcesAsync(string? uriPattern, CancellationToken cancellationToken)
    {
        var (tenantId, showTree) = ParseUriPattern(uriPattern);

        if (string.IsNullOrEmpty(tenantId))
        {
            return new ListResourcesResponse
            {
                Resources = new List<McpResource>
                {
                    new McpResource
                    {
                        Uri = "asset:///roots",
                        Name = "Root Assets",
                        Description = "List all root-level assets (no parent)",
                        MimeType = "application/json"
                    },
                    new McpResource
                    {
                        Uri = "asset:///{tenant-id}/tree",
                        Name = "Full Hierarchy Tree",
                        Description = "Complete asset hierarchy for a tenant",
                        MimeType = "application/json"
                    },
                    new McpResource
                    {
                        Uri = "asset:///{tenant-id}/{asset-id}",
                        Name = "Single Asset",
                        Description = "Get detailed information about a specific asset",
                        MimeType = "application/json"
                    }
                }
            };
        }

        // Fetch assets
        var assets = await _digitalTwinClient.GetAssetsAsync(tenantId, new AssetQueryParams { Take = 100 }, cancellationToken);

        var resources = assets.Assets.Select(a => new McpResource
        {
            Uri = $"asset:///{tenantId}/{a.Id}",
            Name = a.Name,
            Description = $"{a.AssetType} - {a.ChildCount} children, {a.DeviceCount} devices",
            MimeType = "application/json"
        }).ToList();

        return new ListResourcesResponse { Resources = resources };
    }

    public async Task<ReadResourceResponse> ReadResourceAsync(string uri, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Reading asset resource: {Uri}", uri);

        // Check cache
        var cacheKey = $"asset:resource:{uri}";
        var cached = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (cached != null)
        {
            return JsonSerializer.Deserialize<ReadResourceResponse>(cached)!;
        }

        // Parse URI: asset:///{tenant-id}/{asset-id}[/tree]
        var parts = uri.Replace("asset:///", "").Split('/');
        
        if (parts.Length < 2)
            throw new ArgumentException("Invalid asset URI format");

        var tenantId = parts[0];
        var assetId = parts[1];
        var isTree = parts.Length > 2 && parts[2] == "tree";

        object content;

        if (isTree)
        {
            // Fetch full tree
            var tree = await _digitalTwinClient.GetAssetTreeAsync(tenantId, assetId, cancellationToken);
            content = BuildTreeContent(tree);
        }
        else
        {
            // Fetch single asset
            var asset = await _digitalTwinClient.GetAssetAsync(tenantId, assetId, cancellationToken);
            content = new
            {
                id = asset.Asset.Id,
                name = asset.Asset.Name,
                parentId = asset.Asset.ParentId,
                assetType = asset.Asset.AssetType,
                level = asset.Asset.Level,
                childCount = asset.Asset.ChildCount,
                deviceCount = asset.Asset.DeviceCount
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

        // Cache for 5 minutes (hierarchy changes less frequently)
        await _cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(response),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) },
            cancellationToken);

        return response;
    }

    private object BuildTreeContent(AssetTreeResponse tree)
    {
        return new
        {
            id = tree.Asset.Id,
            name = tree.Asset.Name,
            assetType = tree.Asset.AssetType,
            deviceCount = tree.Asset.DeviceCount,
            children = tree.Children.Select(BuildTreeContent).ToList()
        };
    }

    private (string? tenantId, bool showTree) ParseUriPattern(string? uriPattern)
    {
        if (string.IsNullOrEmpty(uriPattern) || uriPattern == "asset:///roots")
            return (null, false);

        var path = uriPattern.Replace("asset:///", "");
        var parts = path.Split('/');
        var tenantId = parts.FirstOrDefault();
        var showTree = parts.Contains("tree");

        return (tenantId, showTree);
    }
}
