namespace Sensormine.Messaging.Models;

/// <summary>
/// Base message envelope
/// </summary>
public class MessageEnvelope<T> where T : class
{
    /// <summary>
    /// Unique message identifier
    /// </summary>
    public string MessageId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Tenant identifier for multi-tenancy
    /// </summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// Correlation identifier for request tracing
    /// </summary>
    public string? CorrelationId { get; set; }

    /// <summary>
    /// Message timestamp
    /// </summary>
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Message type
    /// </summary>
    public string MessageType { get; set; } = typeof(T).Name;

    /// <summary>
    /// Message payload
    /// </summary>
    public T Payload { get; set; } = default!;

    /// <summary>
    /// Additional metadata
    /// </summary>
    public Dictionary<string, string>? Metadata { get; set; }
}
