using System.Text.Json.Serialization;

namespace SchemaRegistry.API.Models;

/// <summary>
/// Request model for AI-powered schema generation
/// </summary>
public class GenerateSchemaRequest
{
    /// <summary>
    /// Sample data to analyze (JSON, CSV, XML, or plain text)
    /// </summary>
    public required string Data { get; set; }

    /// <summary>
    /// Optional: File name for context
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// Optional: Data type (json, csv, xml, text)
    /// </summary>
    public string? DataType { get; set; }

    /// <summary>
    /// Optional: Description for additional context
    /// </summary>
    public string? Description { get; set; }
}

/// <summary>
/// Response model for AI-powered schema generation
/// </summary>
public class GenerateSchemaResponse
{
    /// <summary>
    /// Whether the generation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Generated JSON Schema
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Schema { get; set; }

    /// <summary>
    /// Error message if generation failed
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Error { get; set; }

    /// <summary>
    /// Confidence level (high, medium, low)
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Confidence { get; set; }

    /// <summary>
    /// AI suggestions for improving the schema
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<string>? Suggestions { get; set; }
}
