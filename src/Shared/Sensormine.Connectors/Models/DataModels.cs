namespace Sensormine.Connectors.Models;

using Sensormine.Connectors.Abstractions;

/// <summary>
/// Represents a data point from an industrial connector
/// </summary>
public class DataPoint
{
    /// <summary>
    /// Unique identifier for the data source
    /// </summary>
    public string SourceId { get; init; } = string.Empty;

    /// <summary>
    /// Tag or node identifier in the source system
    /// </summary>
    public string TagId { get; init; } = string.Empty;

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// The data value
    /// </summary>
    public object? Value { get; init; }

    /// <summary>
    /// Data type of the value
    /// </summary>
    public DataPointType DataType { get; init; } = DataPointType.Unknown;

    /// <summary>
    /// Quality of the data point
    /// </summary>
    public DataQuality Quality { get; init; } = DataQuality.Good;

    /// <summary>
    /// Timestamp when the value was sampled at the source
    /// </summary>
    public DateTimeOffset SourceTimestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Timestamp when the value was received by the connector
    /// </summary>
    public DateTimeOffset ReceivedTimestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Engineering unit (e.g., "°C", "bar", "m/s")
    /// </summary>
    public string? Unit { get; init; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public Dictionary<string, string>? Metadata { get; init; }
}

/// <summary>
/// Data type enumeration for data points
/// </summary>
public enum DataPointType
{
    Unknown,
    Boolean,
    Int16,
    UInt16,
    Int32,
    UInt32,
    Int64,
    UInt64,
    Float,
    Double,
    String,
    DateTime,
    ByteArray,
    Array
}

/// <summary>
/// Data quality enumeration
/// </summary>
public enum DataQuality
{
    /// <summary>Good quality data</summary>
    Good,
    /// <summary>Uncertain quality - data may be stale or questionable</summary>
    Uncertain,
    /// <summary>Bad quality - data should not be used</summary>
    Bad,
    /// <summary>Configuration error</summary>
    ConfigurationError
}

/// <summary>
/// Item for browsing address space
/// </summary>
public class BrowseItem
{
    /// <summary>
    /// Node identifier
    /// </summary>
    public string NodeId { get; init; } = string.Empty;

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Description of the item
    /// </summary>
    public string? Description { get; init; }

    /// <summary>
    /// Type of browse item
    /// </summary>
    public BrowseItemType ItemType { get; init; } = BrowseItemType.Object;

    /// <summary>
    /// Data type if this is a variable
    /// </summary>
    public DataPointType? DataType { get; init; }

    /// <summary>
    /// Indicates if this item can be read
    /// </summary>
    public bool IsReadable { get; init; }

    /// <summary>
    /// Indicates if this item can be written
    /// </summary>
    public bool IsWritable { get; init; }

    /// <summary>
    /// Indicates if this item has children
    /// </summary>
    public bool HasChildren { get; init; }
}

/// <summary>
/// Type of browse item
/// </summary>
public enum BrowseItemType
{
    /// <summary>Object container</summary>
    Object,
    /// <summary>Variable with a value</summary>
    Variable,
    /// <summary>Method that can be called</summary>
    Method,
    /// <summary>Folder for organization</summary>
    Folder,
    /// <summary>Device or equipment</summary>
    Device
}

/// <summary>
/// Subscription item configuration
/// </summary>
public class SubscriptionItem
{
    /// <summary>
    /// Unique identifier for this subscription
    /// </summary>
    public string Id { get; init; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Node or tag identifier to subscribe to
    /// </summary>
    public string NodeId { get; init; } = string.Empty;

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Sampling interval in milliseconds
    /// </summary>
    public int SamplingIntervalMs { get; init; } = 1000;

    /// <summary>
    /// Queue size for buffering changes
    /// </summary>
    public int QueueSize { get; init; } = 10;

    /// <summary>
    /// Discard oldest or newest when queue is full
    /// </summary>
    public bool DiscardOldest { get; init; } = true;

    /// <summary>
    /// Schema ID to map data to
    /// </summary>
    public string? SchemaId { get; init; }

    /// <summary>
    /// Additional metadata for processing
    /// </summary>
    public Dictionary<string, string>? Metadata { get; init; }
}
