using Sensormine.MCP.Server.Models;
using System.Text.Json;

namespace Sensormine.MCP.Server.Services.Tools;

/// <summary>
/// Tool handler for querying asset hierarchy
/// </summary>
public class QueryAssetHierarchyTool : IToolHandler
{
    private readonly IDigitalTwinApiClient _digitalTwinClient;
    private readonly ILogger<QueryAssetHierarchyTool> _logger;

    public string ToolName => "query_asset_hierarchy";
    public string Description => "Navigate and query asset relationships";

    public object InputSchema => new
    {
        type = "object",
        properties = new
        {
            tenantId = new { type = "string", format = "uuid" },
            rootAssetId = new { type = "string", format = "uuid" },
            includeDevices = new { type = "boolean", @default = true },
            includeMetrics = new { type = "boolean", @default = false },
            maxDepth = new { type = "integer", @default = 10 }
        },
        required = new[] { "tenantId" }
    };

    public QueryAssetHierarchyTool(IDigitalTwinApiClient digitalTwinClient, ILogger<QueryAssetHierarchyTool> logger)
    {
        _digitalTwinClient = digitalTwinClient;
        _logger = logger;
    }

    public async Task<CallToolResponse> ExecuteAsync(object parameters, string tenantId, CancellationToken cancellationToken)
    {
        try
        {
            var request = JsonSerializer.Deserialize<QueryAssetHierarchyRequest>(
                JsonSerializer.Serialize(parameters),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

            _logger.LogInformation("Querying asset hierarchy for tenant {TenantId}", request.TenantId);

            object result;

            if (!string.IsNullOrEmpty(request.RootAssetId))
            {
                // Get specific asset tree
                var tree = await _digitalTwinClient.GetAssetTreeAsync(request.TenantId, request.RootAssetId, cancellationToken);
                result = BuildTreeResult(tree, request.MaxDepth, 0);
            }
            else
            {
                // Get all root assets
                var assets = await _digitalTwinClient.GetAssetsAsync(
                    request.TenantId,
                    new AssetQueryParams { ParentId = null, Take = 100 },
                    cancellationToken);

                result = new
                {
                    rootAssets = assets.Assets.Select(a => new
                    {
                        id = a.Id,
                        name = a.Name,
                        assetType = a.AssetType,
                        childCount = a.ChildCount,
                        deviceCount = request.IncludeDevices ? a.DeviceCount : (int?)null
                    }).ToList(),
                    totalCount = assets.TotalCount
                };
            }

            return new CallToolResponse
            {
                Content = new List<ToolContent>
                {
                    new ToolContent
                    {
                        Type = "text",
                        Text = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
                    }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing query_asset_hierarchy tool");
            return new CallToolResponse
            {
                IsError = true,
                Content = new List<ToolContent>
                {
                    new ToolContent { Type = "text", Text = $"Error: {ex.Message}" }
                }
            };
        }
    }

    private object BuildTreeResult(AssetTreeResponse tree, int maxDepth, int currentDepth)
    {
        var result = new
        {
            id = tree.Asset.Id,
            name = tree.Asset.Name,
            assetType = tree.Asset.AssetType,
            level = tree.Asset.Level,
            deviceCount = tree.Asset.DeviceCount,
            children = currentDepth < maxDepth
                ? tree.Children.Select(c => BuildTreeResult(c, maxDepth, currentDepth + 1)).ToList()
                : new List<object>()
        };

        return result;
    }
}
