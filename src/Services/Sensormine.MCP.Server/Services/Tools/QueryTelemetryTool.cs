using Sensormine.MCP.Server.Models;
using System.Text.Json;

namespace Sensormine.MCP.Server.Services.Tools;

/// <summary>
/// Tool handler for querying telemetry data
/// </summary>
public class QueryTelemetryTool : IToolHandler
{
    private readonly IQueryApiClient _queryClient;
    private readonly ILogger<QueryTelemetryTool> _logger;

    public string ToolName => "query_telemetry";
    public string Description => "Query time-series telemetry data with aggregations";

    public object InputSchema => new
    {
        type = "object",
        properties = new
        {
            deviceIds = new { type = "array", items = new { type = "string" } },
            fields = new { type = "array", items = new { type = "string" } },
            startTime = new { type = "string", format = "date-time" },
            endTime = new { type = "string", format = "date-time" },
            aggregation = new { type = "string", @enum = new[] { "raw", "avg", "min", "max", "sum", "count" } },
            interval = new { type = "string", pattern = "^\\d+[smhd]$" }
        },
        required = new[] { "deviceIds", "startTime", "endTime" }
    };

    public QueryTelemetryTool(IQueryApiClient queryClient, ILogger<QueryTelemetryTool> logger)
    {
        _queryClient = queryClient;
        _logger = logger;
    }

    public async Task<CallToolResponse> ExecuteAsync(object parameters, string tenantId, CancellationToken cancellationToken)
    {
        try
        {
            var request = JsonSerializer.Deserialize<QueryTelemetryRequest>(
                JsonSerializer.Serialize(parameters),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

            _logger.LogInformation("Querying telemetry for {DeviceCount} devices", request.DeviceIds.Count);

            var telemetryRequest = new TelemetryQueryRequest
            {
                DeviceIds = request.DeviceIds,
                Fields = request.Fields,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Aggregation = request.Aggregation,
                Interval = request.Interval
            };

            var telemetry = await _queryClient.QueryTelemetryAsync(tenantId, telemetryRequest, cancellationToken);

            var result = new
            {
                dataPoints = telemetry.Data.Select(dp => new
                {
                    timestamp = dp.Timestamp,
                    deviceId = dp.DeviceId,
                    values = dp.Values
                }).ToList(),
                summary = new
                {
                    totalPoints = telemetry.Data.Count,
                    timeRange = new { start = request.StartTime, end = request.EndTime },
                    devices = request.DeviceIds.Count
                }
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
            _logger.LogError(ex, "Error executing query_telemetry tool");
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
