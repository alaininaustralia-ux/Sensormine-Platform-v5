namespace Sensormine.Connectors.Abstractions;

using Sensormine.Connectors.Models;

/// <summary>
/// Connection status enumeration for all connector types
/// </summary>
public enum ConnectionStatus
{
    /// <summary>Connector has not attempted to connect</summary>
    Disconnected,
    /// <summary>Connector is attempting to connect</summary>
    Connecting,
    /// <summary>Connector is successfully connected</summary>
    Connected,
    /// <summary>Connector is reconnecting after a failure</summary>
    Reconnecting,
    /// <summary>Connector connection has failed</summary>
    Error
}

/// <summary>
/// Represents the type of industrial connector
/// </summary>
public enum ConnectorType
{
    /// <summary>OPC UA protocol connector</summary>
    OpcUa,
    /// <summary>Modbus TCP connector</summary>
    ModbusTcp,
    /// <summary>Modbus RTU connector</summary>
    ModbusRtu,
    /// <summary>BACnet IP connector</summary>
    BACnet,
    /// <summary>EtherNet/IP connector</summary>
    EtherNetIP,
    /// <summary>External MQTT broker connector</summary>
    ExternalMqtt
}

/// <summary>
/// Base interface for all industrial and IoT connectors
/// </summary>
public interface IConnector : IAsyncDisposable
{
    /// <summary>
    /// Unique identifier for this connector instance
    /// </summary>
    Guid Id { get; }

    /// <summary>
    /// Human-readable name for the connector
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Type of industrial protocol
    /// </summary>
    ConnectorType Type { get; }

    /// <summary>
    /// Current connection status
    /// </summary>
    ConnectionStatus Status { get; }

    /// <summary>
    /// Tenant identifier for multi-tenancy
    /// </summary>
    string TenantId { get; }

    /// <summary>
    /// Indicates if the connector is currently connected
    /// </summary>
    bool IsConnected { get; }

    /// <summary>
    /// Last error message if status is Error
    /// </summary>
    string? LastError { get; }

    /// <summary>
    /// Timestamp of last successful data read
    /// </summary>
    DateTimeOffset? LastDataReceivedAt { get; }

    /// <summary>
    /// Connect to the data source
    /// </summary>
    Task ConnectAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Disconnect from the data source
    /// </summary>
    Task DisconnectAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get health status of the connector
    /// </summary>
    Task<ConnectorHealthStatus> GetHealthStatusAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Interface for connectors that support polling data
/// </summary>
public interface IPollingConnector : IConnector
{
    /// <summary>
    /// Poll data from the configured data points
    /// </summary>
    Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Start automatic polling at the configured interval
    /// </summary>
    Task StartPollingAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Stop automatic polling
    /// </summary>
    Task StopPollingAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Indicates if polling is currently active
    /// </summary>
    bool IsPolling { get; }

    /// <summary>
    /// Event raised when new data is received
    /// </summary>
    event EventHandler<DataReceivedEventArgs>? DataReceived;
}

/// <summary>
/// Interface for connectors that support subscriptions
/// </summary>
public interface ISubscriptionConnector : IConnector
{
    /// <summary>
    /// Subscribe to data changes on specified items
    /// </summary>
    Task SubscribeAsync(IEnumerable<SubscriptionItem> items, CancellationToken cancellationToken = default);

    /// <summary>
    /// Unsubscribe from data changes on specified items
    /// </summary>
    Task UnsubscribeAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all active subscriptions
    /// </summary>
    IReadOnlyList<SubscriptionItem> GetSubscriptions();

    /// <summary>
    /// Event raised when subscribed data changes
    /// </summary>
    event EventHandler<DataReceivedEventArgs>? DataReceived;
}

/// <summary>
/// Interface for connectors that support browsing their address space
/// </summary>
public interface IBrowsableConnector : IConnector
{
    /// <summary>
    /// Browse the root level of the address space
    /// </summary>
    Task<IReadOnlyList<BrowseItem>> BrowseRootAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Browse children of a specific node
    /// </summary>
    Task<IReadOnlyList<BrowseItem>> BrowseAsync(string nodeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Read a single value from the address space
    /// </summary>
    Task<DataPoint?> ReadValueAsync(string nodeId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Health status of a connector
/// </summary>
public class ConnectorHealthStatus
{
    /// <summary>
    /// Current connection status
    /// </summary>
    public ConnectionStatus Status { get; init; }

    /// <summary>
    /// Whether the connector is healthy
    /// </summary>
    public bool IsHealthy { get; init; }

    /// <summary>
    /// Human-readable status message
    /// </summary>
    public string Message { get; init; } = string.Empty;

    /// <summary>
    /// Timestamp of the health check
    /// </summary>
    public DateTimeOffset CheckedAt { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Number of successful reads
    /// </summary>
    public long SuccessfulReads { get; init; }

    /// <summary>
    /// Number of failed reads
    /// </summary>
    public long FailedReads { get; init; }

    /// <summary>
    /// Average latency in milliseconds
    /// </summary>
    public double AverageLatencyMs { get; init; }

    /// <summary>
    /// Last error if any
    /// </summary>
    public string? LastError { get; init; }

    /// <summary>
    /// Timestamp of last error
    /// </summary>
    public DateTimeOffset? LastErrorAt { get; init; }
}

/// <summary>
/// Event arguments for data received events
/// </summary>
public class DataReceivedEventArgs : EventArgs
{
    /// <summary>
    /// Connector ID that received the data
    /// </summary>
    public Guid ConnectorId { get; init; }

    /// <summary>
    /// Data points received
    /// </summary>
    public IReadOnlyList<DataPoint> DataPoints { get; init; } = Array.Empty<DataPoint>();

    /// <summary>
    /// Timestamp when data was received
    /// </summary>
    public DateTimeOffset ReceivedAt { get; init; } = DateTimeOffset.UtcNow;
}
