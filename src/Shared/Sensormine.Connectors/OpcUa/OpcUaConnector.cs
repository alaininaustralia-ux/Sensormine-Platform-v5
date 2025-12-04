namespace Sensormine.Connectors.OpcUa;

using Microsoft.Extensions.Logging;
using Opc.Ua;
using Opc.Ua.Client;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.Models;

/// <summary>
/// OPC UA protocol connector for integrating with SCADA and PLC systems
/// </summary>
public class OpcUaConnector : SubscriptionConnectorBase, IBrowsableConnector
{
    private readonly OpcUaConnectorConfiguration _config;
    private ApplicationConfiguration? _appConfig;
    private Session? _session;
    private Subscription? _subscription;

    /// <summary>
    /// Creates a new OPC UA connector
    /// </summary>
    public OpcUaConnector(OpcUaConnectorConfiguration configuration, ILogger<OpcUaConnector> logger)
        : base(configuration, logger)
    {
        _config = configuration;
    }

    /// <inheritdoc />
    public override ConnectorType Type => ConnectorType.OpcUa;

    /// <inheritdoc />
    public override async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (IsConnected)
        {
            Logger.LogWarning("OPC UA connector {Name} is already connected", Name);
            return;
        }

        try
        {
            Status = ConnectionStatus.Connecting;

            // Create application configuration
            _appConfig = await CreateApplicationConfigurationAsync();

            // Create endpoint description
            var endpoint = CoreClientUtils.SelectEndpoint(_config.EndpointUrl, useSecurity: _config.SecurityMode != OpcUaSecurityMode.None);

            // Create session
            var identity = CreateUserIdentity();
            _session = await Session.Create(
                _appConfig,
                new ConfiguredEndpoint(null, endpoint),
                updateBeforeConnect: true,
                sessionName: $"Sensormine_{_config.Name}_{_config.Id}",
                sessionTimeout: (uint)_config.SessionTimeoutMs,
                identity,
                preferredLocales: null,
                cancellationToken);

            _session.KeepAlive += OnSessionKeepAlive;

            // Create subscription if there are items to subscribe to
            if (_config.Subscriptions.Count > 0)
            {
                await SetupSubscriptionAsync(cancellationToken);
            }

            Status = ConnectionStatus.Connected;
            Logger.LogInformation("OPC UA connector {Name} connected to {Endpoint}", Name, _config.EndpointUrl);
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
            Logger.LogError(ex, "Failed to connect OPC UA connector {Name} to {Endpoint}", Name, _config.EndpointUrl);
            throw;
        }
    }

    /// <inheritdoc />
    public override async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_session != null)
        {
            try
            {
                if (_subscription != null)
                {
                    await _session.RemoveSubscriptionAsync(_subscription);
                    _subscription = null;
                }

                _session.KeepAlive -= OnSessionKeepAlive;
                await _session.CloseAsync(cancellationToken);
                _session.Dispose();
                _session = null;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Error while disconnecting OPC UA connector {Name}", Name);
            }
        }

        Status = ConnectionStatus.Disconnected;
        Logger.LogInformation("OPC UA connector {Name} disconnected", Name);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BrowseItem>> BrowseRootAsync(CancellationToken cancellationToken = default)
    {
        EnsureConnected();
        return await BrowseAsync(ObjectIds.ObjectsFolder.ToString(), cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BrowseItem>> BrowseAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        EnsureConnected();

        var result = new List<BrowseItem>();

        try
        {
            var nodeToBrowse = new BrowseDescription
            {
                NodeId = NodeId.Parse(nodeId),
                BrowseDirection = BrowseDirection.Forward,
                ReferenceTypeId = ReferenceTypeIds.HierarchicalReferences,
                IncludeSubtypes = true,
                NodeClassMask = (uint)(NodeClass.Object | NodeClass.Variable | NodeClass.Method),
                ResultMask = (uint)BrowseResultMask.All
            };

            _session!.Browse(
                null,
                null,
                0,
                new BrowseDescriptionCollection { nodeToBrowse },
                out var results,
                out var diagnosticInfos);

            if (results != null && results.Count > 0)
            {
                foreach (var reference in results[0].References)
                {
                    var browseItem = new BrowseItem
                    {
                        NodeId = reference.NodeId.ToString(),
                        Name = reference.DisplayName.Text,
                        Description = reference.BrowseName.Name,
                        ItemType = MapNodeClass(reference.NodeClass),
                        HasChildren = !reference.NodeId.IsAbsolute,
                        IsReadable = reference.NodeClass == NodeClass.Variable,
                        IsWritable = reference.NodeClass == NodeClass.Variable
                    };

                    result.Add(browseItem);
                }
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to browse OPC UA node {NodeId}", nodeId);
            throw;
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<DataPoint?> ReadValueAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        EnsureConnected();

        try
        {
            var node = new ReadValueId
            {
                NodeId = NodeId.Parse(nodeId),
                AttributeId = Attributes.Value
            };

            _session!.Read(
                null,
                0,
                TimestampsToReturn.Both,
                new ReadValueIdCollection { node },
                out var results,
                out var diagnosticInfos);

            if (results != null && results.Count > 0)
            {
                var dataValue = results[0];
                return new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = nodeId,
                    Name = nodeId,
                    Value = dataValue.Value,
                    DataType = MapOpcUaType(dataValue.WrappedValue.TypeInfo?.BuiltInType),
                    Quality = MapOpcUaQuality(dataValue.StatusCode),
                    SourceTimestamp = dataValue.SourceTimestamp,
                    ReceivedTimestamp = DateTimeOffset.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to read OPC UA node {NodeId}", nodeId);
        }

        return null;
    }

    /// <inheritdoc />
    public override async Task SubscribeAsync(IEnumerable<SubscriptionItem> items, CancellationToken cancellationToken = default)
    {
        EnsureConnected();

        if (_subscription == null)
        {
            await SetupSubscriptionAsync(cancellationToken);
        }

        foreach (var item in items)
        {
            var monitoredItem = new MonitoredItem(_subscription!.DefaultItem)
            {
                StartNodeId = NodeId.Parse(item.NodeId),
                DisplayName = item.Name,
                SamplingInterval = item.SamplingIntervalMs,
                QueueSize = (uint)item.QueueSize,
                DiscardOldest = item.DiscardOldest
            };

            monitoredItem.Notification += OnMonitoredItemNotification;
            _subscription.AddItem(monitoredItem);

            lock (ActiveSubscriptions)
            {
                ActiveSubscriptions.Add(item);
            }
        }

        await _subscription!.ApplyChangesAsync(cancellationToken);
        Logger.LogInformation("OPC UA connector {Name} subscribed to {Count} items", Name, items.Count());
    }

    /// <inheritdoc />
    public override async Task UnsubscribeAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default)
    {
        if (_subscription == null)
        {
            return;
        }

        var itemIdSet = itemIds.ToHashSet();
        var itemsToRemove = _subscription.MonitoredItems
            .Where(mi => itemIdSet.Contains(mi.StartNodeId.ToString()))
            .ToList();

        foreach (var item in itemsToRemove)
        {
            item.Notification -= OnMonitoredItemNotification;
            _subscription.RemoveItem(item);
        }

        lock (ActiveSubscriptions)
        {
            ActiveSubscriptions.RemoveAll(s => itemIdSet.Contains(s.NodeId));
        }

        await _subscription.ApplyChangesAsync(cancellationToken);
        Logger.LogInformation("OPC UA connector {Name} unsubscribed from {Count} items", Name, itemIdSet.Count);
    }

    private async Task<ApplicationConfiguration> CreateApplicationConfigurationAsync()
    {
        var config = new ApplicationConfiguration
        {
            ApplicationName = "Sensormine OPC UA Client",
            ApplicationUri = Utils.Format(@"urn:{0}:SensormineOpcUaClient", System.Net.Dns.GetHostName()),
            ApplicationType = ApplicationType.Client,
            SecurityConfiguration = new SecurityConfiguration
            {
                ApplicationCertificate = new CertificateIdentifier
                {
                    StoreType = @"Directory",
                    StorePath = @"./OPC/pki/own",
                    SubjectName = "CN=Sensormine OPC UA Client, O=Sensormine, DC=localhost"
                },
                TrustedIssuerCertificates = new CertificateTrustList
                {
                    StoreType = @"Directory",
                    StorePath = @"./OPC/pki/issuer"
                },
                TrustedPeerCertificates = new CertificateTrustList
                {
                    StoreType = @"Directory",
                    StorePath = @"./OPC/pki/trusted"
                },
                RejectedCertificateStore = new CertificateTrustList
                {
                    StoreType = @"Directory",
                    StorePath = @"./OPC/pki/rejected"
                },
                AutoAcceptUntrustedCertificates = true,
                AddAppCertToTrustedStore = true
            },
            TransportConfigurations = new TransportConfigurationCollection(),
            TransportQuotas = new TransportQuotas { OperationTimeout = _config.ConnectionTimeoutMs },
            ClientConfiguration = new ClientConfiguration { DefaultSessionTimeout = _config.SessionTimeoutMs }
        };

        await config.Validate(ApplicationType.Client);

        // Check application certificate
        var haveAppCertificate = await config.SecurityConfiguration.ApplicationCertificate.Find(true) != null;
        if (!haveAppCertificate)
        {
            Logger.LogInformation("Creating new application certificate for OPC UA client");
            // Certificate will be created automatically
        }

        return config;
    }

    private IUserIdentity CreateUserIdentity()
    {
        if (!string.IsNullOrEmpty(_config.Username))
        {
            return new UserIdentity(_config.Username, _config.Password ?? string.Empty);
        }

        return new UserIdentity();
    }

    private async Task SetupSubscriptionAsync(CancellationToken cancellationToken)
    {
        _subscription = new Subscription(_session!.DefaultSubscription)
        {
            DisplayName = $"Sensormine_{_config.Name}",
            PublishingInterval = _config.PublishingIntervalMs,
            KeepAliveCount = 10,
            LifetimeCount = 100,
            MaxNotificationsPerPublish = 1000,
            PublishingEnabled = true
        };

        _session.AddSubscription(_subscription);
        _subscription.Create();

        // Add configured subscriptions
        if (_config.Subscriptions.Count > 0)
        {
            await SubscribeAsync(_config.Subscriptions, cancellationToken);
        }
    }

    private void OnSessionKeepAlive(ISession session, KeepAliveEventArgs e)
    {
        if (e.Status != null && ServiceResult.IsNotGood(e.Status))
        {
            Logger.LogWarning("OPC UA connector {Name} keep-alive failed: {Status}", Name, e.Status);

            if (Configuration.AutoReconnect)
            {
                Status = ConnectionStatus.Reconnecting;
                // Note: The OPC UA SDK handles reconnection automatically
            }
        }
        else
        {
            if (Status != ConnectionStatus.Connected)
            {
                Status = ConnectionStatus.Connected;
                Logger.LogInformation("OPC UA connector {Name} reconnected", Name);
            }
        }
    }

    private void OnMonitoredItemNotification(MonitoredItem item, MonitoredItemNotificationEventArgs e)
    {
        try
        {
            var dataPoints = new List<DataPoint>();

            foreach (var value in item.DequeueValues())
            {
                var dataPoint = new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = item.StartNodeId.ToString(),
                    Name = item.DisplayName,
                    Value = value.Value,
                    DataType = MapOpcUaType(value.WrappedValue.TypeInfo?.BuiltInType),
                    Quality = MapOpcUaQuality(value.StatusCode),
                    SourceTimestamp = value.SourceTimestamp,
                    ReceivedTimestamp = DateTimeOffset.UtcNow
                };

                dataPoints.Add(dataPoint);
            }

            if (dataPoints.Count > 0)
            {
                RecordSuccess(0);
                OnDataReceived(dataPoints);
            }
        }
        catch (Exception ex)
        {
            RecordFailure(ex.Message);
            Logger.LogError(ex, "Error processing OPC UA notification for {Item}", item.DisplayName);
        }
    }

    private void EnsureConnected()
    {
        if (!IsConnected || _session == null)
        {
            throw new InvalidOperationException($"OPC UA connector {Name} is not connected");
        }
    }

    private static BrowseItemType MapNodeClass(NodeClass nodeClass)
    {
        return nodeClass switch
        {
            NodeClass.Object => BrowseItemType.Object,
            NodeClass.Variable => BrowseItemType.Variable,
            NodeClass.Method => BrowseItemType.Method,
            _ => BrowseItemType.Object
        };
    }

    private static DataPointType MapOpcUaType(BuiltInType? builtInType)
    {
        return builtInType switch
        {
            BuiltInType.Boolean => DataPointType.Boolean,
            BuiltInType.SByte => DataPointType.Int16,
            BuiltInType.Byte => DataPointType.UInt16,
            BuiltInType.Int16 => DataPointType.Int16,
            BuiltInType.UInt16 => DataPointType.UInt16,
            BuiltInType.Int32 => DataPointType.Int32,
            BuiltInType.UInt32 => DataPointType.UInt32,
            BuiltInType.Int64 => DataPointType.Int64,
            BuiltInType.UInt64 => DataPointType.UInt64,
            BuiltInType.Float => DataPointType.Float,
            BuiltInType.Double => DataPointType.Double,
            BuiltInType.String => DataPointType.String,
            BuiltInType.DateTime => DataPointType.DateTime,
            BuiltInType.ByteString => DataPointType.ByteArray,
            _ => DataPointType.Unknown
        };
    }

    private static DataQuality MapOpcUaQuality(StatusCode statusCode)
    {
        if (StatusCode.IsGood(statusCode))
        {
            return DataQuality.Good;
        }
        if (StatusCode.IsUncertain(statusCode))
        {
            return DataQuality.Uncertain;
        }
        return DataQuality.Bad;
    }

    /// <inheritdoc />
    public override async ValueTask DisposeAsync()
    {
        await DisconnectAsync();
        GC.SuppressFinalize(this);
    }
}
