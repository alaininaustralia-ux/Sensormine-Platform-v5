namespace Sensormine.Connectors.Abstractions;

/// <summary>
/// Factory interface for creating connectors
/// </summary>
public interface IConnectorFactory
{
    /// <summary>
    /// Create a connector from configuration
    /// </summary>
    IConnector CreateConnector(ConnectorConfiguration configuration);

    /// <summary>
    /// Get all supported connector types
    /// </summary>
    IReadOnlyList<ConnectorType> GetSupportedTypes();

    /// <summary>
    /// Check if a connector type is supported
    /// </summary>
    bool IsSupported(ConnectorType type);
}

/// <summary>
/// Manager interface for handling multiple connectors
/// </summary>
public interface IConnectorManager : IAsyncDisposable
{
    /// <summary>
    /// Get all registered connectors
    /// </summary>
    IReadOnlyList<IConnector> GetAllConnectors();

    /// <summary>
    /// Get connector by ID
    /// </summary>
    IConnector? GetConnector(Guid id);

    /// <summary>
    /// Get connectors by type
    /// </summary>
    IReadOnlyList<IConnector> GetConnectorsByType(ConnectorType type);

    /// <summary>
    /// Get connectors by tenant
    /// </summary>
    IReadOnlyList<IConnector> GetConnectorsByTenant(string tenantId);

    /// <summary>
    /// Register a new connector
    /// </summary>
    Task<IConnector> RegisterConnectorAsync(ConnectorConfiguration configuration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update connector configuration
    /// </summary>
    Task UpdateConnectorAsync(Guid id, ConnectorConfiguration configuration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a connector
    /// </summary>
    Task RemoveConnectorAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Start all connectors
    /// </summary>
    Task StartAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Stop all connectors
    /// </summary>
    Task StopAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Event raised when data is received from any connector
    /// </summary>
    event EventHandler<DataReceivedEventArgs>? DataReceived;
}
