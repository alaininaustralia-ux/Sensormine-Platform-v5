namespace AI.API.Models;

public class AiQueryRequest
{
    public required string Query { get; set; }
}

public class AiQueryResponse
{
    public required string Response { get; set; }
    public ChartData? ChartData { get; set; }
    public List<string>? ToolsCalled { get; set; }
    public Guid? ConversationId { get; set; }
}

public class ChartData
{
    public required string Type { get; set; } // "line", "bar", "area"
    public required List<ChartSeries> Series { get; set; }
}

public class ChartSeries
{
    public required string Name { get; set; }
    public required List<ChartDataPoint> Data { get; set; }
}

public class ChartDataPoint
{
    public required string Timestamp { get; set; }
    public double Value { get; set; }
}

public class McpRequest
{
    public required string Jsonrpc { get; set; } = "2.0";
    public required string Method { get; set; }
    public object? Params { get; set; }
    public string Id { get; set; } = "1";
}

public class McpResponse
{
    public required string Jsonrpc { get; set; }
    public object? Result { get; set; }
    public string? Id { get; set; }
}
