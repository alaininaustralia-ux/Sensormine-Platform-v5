namespace Sensormine.Connectors;

using Microsoft.Extensions.Logging;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.BACnet;
using Sensormine.Connectors.EtherNetIP;
using Sensormine.Connectors.Modbus;
using Sensormine.Connectors.MQTT;
using Sensormine.Connectors.OpcUa;

/// <summary>
/// Factory for creating connector instances based on configuration
/// </summary>
public class ConnectorFactory : IConnectorFactory
{
    private readonly ILoggerFactory _loggerFactory;

    /// <summary>
    /// Creates a new connector factory
    /// </summary>
    public ConnectorFactory(ILoggerFactory loggerFactory)
    {
        _loggerFactory = loggerFactory ?? throw new ArgumentNullException(nameof(loggerFactory));
    }

    /// <inheritdoc />
    public IConnector CreateConnector(ConnectorConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        return configuration.Type switch
        {
            ConnectorType.OpcUa => CreateOpcUaConnector((OpcUaConnectorConfiguration)configuration),
            ConnectorType.ModbusTcp => CreateModbusTcpConnector((ModbusTcpConnectorConfiguration)configuration),
            ConnectorType.ModbusRtu => CreateModbusRtuConnector((ModbusRtuConnectorConfiguration)configuration),
            ConnectorType.BACnet => CreateBACnetConnector((BACnetConnectorConfiguration)configuration),
            ConnectorType.EtherNetIP => CreateEtherNetIPConnector((EtherNetIPConnectorConfiguration)configuration),
            ConnectorType.ExternalMqtt => CreateExternalMqttConnector((ExternalMqttConnectorConfiguration)configuration),
            _ => throw new ArgumentException($"Unsupported connector type: {configuration.Type}")
        };
    }

    /// <inheritdoc />
    public IReadOnlyList<ConnectorType> GetSupportedTypes()
    {
        return new[]
        {
            ConnectorType.OpcUa,
            ConnectorType.ModbusTcp,
            ConnectorType.ModbusRtu,
            ConnectorType.BACnet,
            ConnectorType.EtherNetIP,
            ConnectorType.ExternalMqtt
        };
    }

    /// <inheritdoc />
    public bool IsSupported(ConnectorType type)
    {
        return type is ConnectorType.OpcUa or
                       ConnectorType.ModbusTcp or
                       ConnectorType.ModbusRtu or
                       ConnectorType.BACnet or
                       ConnectorType.EtherNetIP or
                       ConnectorType.ExternalMqtt;
    }

    private OpcUaConnector CreateOpcUaConnector(OpcUaConnectorConfiguration config)
    {
        var logger = _loggerFactory.CreateLogger<OpcUaConnector>();
        return new OpcUaConnector(config, logger);
    }

    private ModbusTcpConnector CreateModbusTcpConnector(ModbusTcpConnectorConfiguration config)
    {
        var logger = _loggerFactory.CreateLogger<ModbusTcpConnector>();
        return new ModbusTcpConnector(config, logger);
    }

    private ModbusRtuConnector CreateModbusRtuConnector(ModbusRtuConnectorConfiguration config)
    {
        var logger = _loggerFactory.CreateLogger<ModbusRtuConnector>();
        return new ModbusRtuConnector(config, logger);
    }

    private BACnetConnector CreateBACnetConnector(BACnetConnectorConfiguration config)
    {
        var logger = _loggerFactory.CreateLogger<BACnetConnector>();
        return new BACnetConnector(config, logger);
    }

    private EtherNetIPConnector CreateEtherNetIPConnector(EtherNetIPConnectorConfiguration config)
    {
        var logger = _loggerFactory.CreateLogger<EtherNetIPConnector>();
        return new EtherNetIPConnector(config, logger);
    }

    private ExternalMqttConnector CreateExternalMqttConnector(ExternalMqttConnectorConfiguration config)
    {
        var logger = _loggerFactory.CreateLogger<ExternalMqttConnector>();
        return new ExternalMqttConnector(config, logger);
    }
}

/// <summary>
/// Manages multiple connector instances
/// </summary>
public class ConnectorManager : IConnectorManager
{
    private readonly IConnectorFactory _factory;
    private readonly ILogger<ConnectorManager> _logger;
    private readonly Dictionary<Guid, IConnector> _connectors = new();
    private readonly object _lock = new();
    private bool _disposed;

    /// <summary>
    /// Creates a new connector manager
    /// </summary>
    public ConnectorManager(IConnectorFactory factory, ILogger<ConnectorManager> logger)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public event EventHandler<DataReceivedEventArgs>? DataReceived;

    /// <inheritdoc />
    public IReadOnlyList<IConnector> GetAllConnectors()
    {
        lock (_lock)
        {
            return _connectors.Values.ToList().AsReadOnly();
        }
    }

    /// <inheritdoc />
    public IConnector? GetConnector(Guid id)
    {
        lock (_lock)
        {
            return _connectors.GetValueOrDefault(id);
        }
    }

    /// <inheritdoc />
    public IReadOnlyList<IConnector> GetConnectorsByType(ConnectorType type)
    {
        lock (_lock)
        {
            return _connectors.Values.Where(c => c.Type == type).ToList().AsReadOnly();
        }
    }

    /// <inheritdoc />
    public IReadOnlyList<IConnector> GetConnectorsByTenant(string tenantId)
    {
        lock (_lock)
        {
            return _connectors.Values.Where(c => c.TenantId == tenantId).ToList().AsReadOnly();
        }
    }

    /// <inheritdoc />
    public async Task<IConnector> RegisterConnectorAsync(ConnectorConfiguration configuration, CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        ArgumentNullException.ThrowIfNull(configuration);

        var connector = _factory.CreateConnector(configuration);

        // Subscribe to data events
        if (connector is IPollingConnector pollingConnector)
        {
            pollingConnector.DataReceived += OnConnectorDataReceived;
        }
        else if (connector is ISubscriptionConnector subscriptionConnector)
        {
            subscriptionConnector.DataReceived += OnConnectorDataReceived;
        }

        lock (_lock)
        {
            _connectors[connector.Id] = connector;
        }

        _logger.LogInformation("Registered {Type} connector {Name} ({Id})",
            configuration.Type, configuration.Name, connector.Id);

        return connector;
    }

    /// <inheritdoc />
    public async Task UpdateConnectorAsync(Guid id, ConnectorConfiguration configuration, CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        var existingConnector = GetConnector(id);
        if (existingConnector == null)
        {
            throw new InvalidOperationException($"Connector {id} not found");
        }

        // Disconnect and remove existing connector
        await existingConnector.DisconnectAsync(cancellationToken);
        await RemoveConnectorAsync(id, cancellationToken);

        // Create new connector with updated configuration
        // Note: The configuration Id should already match, but this preserves any existing ID semantics
        await RegisterConnectorAsync(configuration, cancellationToken);

        _logger.LogInformation("Updated connector {Name} ({Id})", configuration.Name, id);
    }

    /// <inheritdoc />
    public async Task RemoveConnectorAsync(Guid id, CancellationToken cancellationToken = default)
    {
        IConnector? connector;

        lock (_lock)
        {
            if (!_connectors.TryGetValue(id, out connector))
            {
                return;
            }

            _connectors.Remove(id);
        }

        // Unsubscribe from events
        if (connector is IPollingConnector pollingConnector)
        {
            pollingConnector.DataReceived -= OnConnectorDataReceived;
        }
        else if (connector is ISubscriptionConnector subscriptionConnector)
        {
            subscriptionConnector.DataReceived -= OnConnectorDataReceived;
        }

        // Dispose connector
        await connector.DisposeAsync();

        _logger.LogInformation("Removed connector {Name} ({Id})", connector.Name, id);
    }

    /// <inheritdoc />
    public async Task StartAllAsync(CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        var connectors = GetAllConnectors();

        _logger.LogInformation("Starting {Count} connectors...", connectors.Count);

        var tasks = connectors.Select(async connector =>
        {
            try
            {
                await connector.ConnectAsync(cancellationToken);

                if (connector is IPollingConnector pollingConnector)
                {
                    await pollingConnector.StartPollingAsync(cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start connector {Name} ({Id})", connector.Name, connector.Id);
            }
        });

        await Task.WhenAll(tasks);

        _logger.LogInformation("Started {Count} connectors", connectors.Count);
    }

    /// <inheritdoc />
    public async Task StopAllAsync(CancellationToken cancellationToken = default)
    {
        var connectors = GetAllConnectors();

        _logger.LogInformation("Stopping {Count} connectors...", connectors.Count);

        var tasks = connectors.Select(async connector =>
        {
            try
            {
                if (connector is IPollingConnector pollingConnector)
                {
                    await pollingConnector.StopPollingAsync(cancellationToken);
                }

                await connector.DisconnectAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping connector {Name} ({Id})", connector.Name, connector.Id);
            }
        });

        await Task.WhenAll(tasks);

        _logger.LogInformation("Stopped {Count} connectors", connectors.Count);
    }

    private void OnConnectorDataReceived(object? sender, DataReceivedEventArgs e)
    {
        DataReceived?.Invoke(this, e);
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        await StopAllAsync();

        List<IConnector> connectors;
        lock (_lock)
        {
            connectors = _connectors.Values.ToList();
            _connectors.Clear();
        }

        foreach (var connector in connectors)
        {
            await connector.DisposeAsync();
        }

        GC.SuppressFinalize(this);
    }
}
