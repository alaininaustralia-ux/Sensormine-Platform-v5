using Sensormine.MCP.Server.Models;
using System.Text.Json;

namespace Sensormine.MCP.Server.Services.Tools;

/// <summary>
/// Tool handler for querying devices
/// </summary>
public class QueryDevicesTool : IToolHandler
{
    private readonly IDeviceApiClient _deviceClient;
    private readonly ILogger<QueryDevicesTool> _logger;

    public string ToolName => "query_devices";
    public string Description => "Search and filter devices based on criteria";

    public object InputSchema => new
    {
        type = "object",
        properties = new
        {
            tenantId = new { type = "string", format = "uuid" },
            filters = new
            {
                type = "object",
                properties = new
                {
                    deviceType = new { type = "string" },
                    status = new { type = "string", @enum = new[] { "online", "offline", "error" } },
                    customFields = new { type = "object" }
                }
            },
            limit = new { type = "integer", @default = 100 },
            sortBy = new { type = "string", @default = "name" }
        },
        required = new[] { "tenantId" }
    };

    public QueryDevicesTool(IDeviceApiClient deviceClient, ILogger<QueryDevicesTool> logger)
    {
        _deviceClient = deviceClient;
        _logger = logger;
    }

    public async Task<CallToolResponse> ExecuteAsync(object parameters, string tenantId, CancellationToken cancellationToken)
    {
        try
        {
            var request = JsonSerializer.Deserialize<QueryDevicesRequest>(
                JsonSerializer.Serialize(parameters),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

            _logger.LogInformation("Querying devices for tenant {TenantId}", request.TenantId);

            var queryParams = new DeviceQueryParams
            {
                DeviceTypeId = request.Filters?.DeviceType,
                Status = request.Filters?.Status,
                Take = request.Limit
            };

            var devices = await _deviceClient.GetDevicesAsync(request.TenantId, queryParams, cancellationToken);

            var result = new
            {
                totalCount = devices.TotalCount,
                devices = devices.Devices.Select(d => new
                {
                    id = d.Id,
                    name = d.Name,
                    deviceType = d.DeviceType,
                    status = d.Status,
                    location = d.Location,
                    lastSeen = d.LastSeenAt,
                    customFields = d.CustomFieldValues
                }).ToList()
            };

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
            _logger.LogError(ex, "Error executing query_devices tool");
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
}
