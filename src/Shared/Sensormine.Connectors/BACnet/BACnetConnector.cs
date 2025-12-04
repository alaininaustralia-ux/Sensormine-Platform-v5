namespace Sensormine.Connectors.BACnet;

using Microsoft.Extensions.Logging;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.Models;
using System.Net;
using System.Net.Sockets;

/// <summary>
/// BACnet/IP protocol connector for building automation systems
/// </summary>
/// <remarks>
/// This is a simplified BACnet implementation. For production use, consider using
/// a full BACnet library like BACnet4J or SharpBACnet.
/// </remarks>
public class BACnetConnector : PollingConnectorBase, IBrowsableConnector
{
    private readonly BACnetConnectorConfiguration _config;
    private UdpClient? _udpClient;
    private readonly Dictionary<uint, BACnetDeviceInfo> _discoveredDevices = new();
    private bool _isListening;
    private CancellationTokenSource? _listenerCts;
    private Task? _listenerTask;

    /// <summary>
    /// Creates a new BACnet connector
    /// </summary>
    public BACnetConnector(BACnetConnectorConfiguration configuration, ILogger<BACnetConnector> logger)
        : base(configuration, logger)
    {
        _config = configuration;
    }

    /// <inheritdoc />
    public override ConnectorType Type => ConnectorType.BACnet;

    /// <inheritdoc />
    protected override int PollingIntervalMs => _config.PollingIntervalMs;

    /// <inheritdoc />
    public override async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (IsConnected)
        {
            Logger.LogWarning("BACnet connector {Name} is already connected", Name);
            return;
        }

        try
        {
            Status = ConnectionStatus.Connecting;

            // Create UDP client for BACnet/IP
            _udpClient = new UdpClient(_config.LocalPort);
            _udpClient.EnableBroadcast = true;

            // Start listening for responses
            _listenerCts = new CancellationTokenSource();
            _isListening = true;
            _listenerTask = ListenForResponsesAsync(_listenerCts.Token);

            Status = ConnectionStatus.Connected;
            Logger.LogInformation("BACnet connector {Name} started on port {Port}", Name, _config.LocalPort);

            // Perform device discovery if enabled
            if (_config.EnableDiscovery)
            {
                await DiscoverDevicesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
            Logger.LogError(ex, "Failed to start BACnet connector {Name}", Name);
            throw;
        }
    }

    /// <inheritdoc />
    public override async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _isListening = false;
        _listenerCts?.Cancel();

        if (_listenerTask != null)
        {
            try
            {
                await _listenerTask.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken);
            }
            catch (TimeoutException)
            {
                Logger.LogWarning("BACnet listener task did not stop in time");
            }
            catch (OperationCanceledException)
            {
                // Expected
            }
        }

        _listenerCts?.Dispose();
        _listenerCts = null;
        _listenerTask = null;

        if (_udpClient != null)
        {
            _udpClient.Close();
            _udpClient.Dispose();
            _udpClient = null;
        }

        _discoveredDevices.Clear();

        Status = ConnectionStatus.Disconnected;
        Logger.LogInformation("BACnet connector {Name} disconnected", Name);
    }

    /// <inheritdoc />
    public override async Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConnected || _udpClient == null)
        {
            throw new InvalidOperationException($"BACnet connector {Name} is not connected");
        }

        var dataPoints = new List<DataPoint>();

        foreach (var mapping in _config.ObjectMappings)
        {
            try
            {
                var value = await ReadPropertyAsync(
                    _config.TargetDeviceInstance ?? 0,
                    mapping.ObjectType,
                    mapping.ObjectInstance,
                    mapping.PropertyId,
                    cancellationToken);

                var dataPoint = new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = mapping.Id,
                    Name = mapping.Name,
                    Value = value,
                    DataType = MapBACnetObjectType(mapping.ObjectType),
                    Quality = value != null ? DataQuality.Good : DataQuality.Bad,
                    SourceTimestamp = DateTimeOffset.UtcNow,
                    ReceivedTimestamp = DateTimeOffset.UtcNow,
                    Unit = mapping.Unit,
                    Metadata = new Dictionary<string, string>
                    {
                        ["ObjectType"] = mapping.ObjectType.ToString(),
                        ["ObjectInstance"] = mapping.ObjectInstance.ToString(),
                        ["PropertyId"] = mapping.PropertyId.ToString(),
                        ["SchemaId"] = mapping.SchemaId ?? string.Empty
                    }
                };

                dataPoints.Add(dataPoint);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to read BACnet object {Name} ({Type}:{Instance})",
                    mapping.Name, mapping.ObjectType, mapping.ObjectInstance);

                dataPoints.Add(new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = mapping.Id,
                    Name = mapping.Name,
                    Value = null,
                    Quality = DataQuality.Bad,
                    SourceTimestamp = DateTimeOffset.UtcNow,
                    ReceivedTimestamp = DateTimeOffset.UtcNow
                });
            }
        }

        return dataPoints;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BrowseItem>> BrowseRootAsync(CancellationToken cancellationToken = default)
    {
        var items = new List<BrowseItem>();

        // Return discovered devices as root items
        foreach (var device in _discoveredDevices.Values)
        {
            items.Add(new BrowseItem
            {
                NodeId = $"device:{device.DeviceInstance}",
                Name = device.Name ?? $"Device {device.DeviceInstance}",
                Description = $"BACnet Device at {device.Address}",
                ItemType = BrowseItemType.Device,
                HasChildren = true,
                IsReadable = true
            });
        }

        return items;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BrowseItem>> BrowseAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        var items = new List<BrowseItem>();

        if (nodeId.StartsWith("device:"))
        {
            // Return standard BACnet object types as children
            foreach (var objectType in Enum.GetValues<BACnetObjectType>())
            {
                items.Add(new BrowseItem
                {
                    NodeId = $"{nodeId}/type:{objectType}",
                    Name = objectType.ToString(),
                    ItemType = BrowseItemType.Folder,
                    HasChildren = true
                });
            }
        }

        return items;
    }

    /// <inheritdoc />
    public async Task<DataPoint?> ReadValueAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        // Parse node ID format: "device:123/object:analog-input:0"
        // This is a simplified implementation
        return null;
    }

    /// <summary>
    /// Discover BACnet devices on the network
    /// </summary>
    public async Task<IReadOnlyList<BACnetDeviceInfo>> DiscoverDevicesAsync(CancellationToken cancellationToken = default)
    {
        if (_udpClient == null)
        {
            throw new InvalidOperationException("BACnet connector is not connected");
        }

        Logger.LogInformation("Starting BACnet device discovery...");

        // Send Who-Is broadcast
        var whoIs = BuildWhoIsRequest();
        var broadcastEndpoint = new IPEndPoint(IPAddress.Broadcast, 47808);

        await _udpClient.SendAsync(whoIs, whoIs.Length, broadcastEndpoint);

        // Wait for responses
        await Task.Delay(5000, cancellationToken);

        Logger.LogInformation("Discovered {Count} BACnet devices", _discoveredDevices.Count);
        return _discoveredDevices.Values.ToList();
    }

    /// <summary>
    /// Read a property from a BACnet object
    /// </summary>
    public async Task<object?> ReadPropertyAsync(
        uint deviceInstance,
        BACnetObjectType objectType,
        uint objectInstance,
        BACnetPropertyId propertyId,
        CancellationToken cancellationToken = default)
    {
        if (_udpClient == null)
        {
            throw new InvalidOperationException("BACnet connector is not connected");
        }

        // Build ReadProperty request
        var request = BuildReadPropertyRequest(deviceInstance, objectType, objectInstance, propertyId);

        // Determine target endpoint
        IPEndPoint targetEndpoint;
        if (_config.TargetAddress != null)
        {
            targetEndpoint = new IPEndPoint(IPAddress.Parse(_config.TargetAddress), 47808);
        }
        else if (_discoveredDevices.TryGetValue(deviceInstance, out var deviceInfo))
        {
            targetEndpoint = new IPEndPoint(IPAddress.Parse(deviceInfo.Address), 47808);
        }
        else
        {
            throw new InvalidOperationException($"Device {deviceInstance} not found");
        }

        await _udpClient.SendAsync(request, request.Length, targetEndpoint);

        // In a real implementation, we would wait for and parse the response
        // This is a simplified placeholder
        await Task.Delay(100, cancellationToken);

        // Return simulated value for demonstration
        return objectType switch
        {
            BACnetObjectType.AnalogInput or BACnetObjectType.AnalogOutput or BACnetObjectType.AnalogValue => 25.5,
            BACnetObjectType.BinaryInput or BACnetObjectType.BinaryOutput or BACnetObjectType.BinaryValue => true,
            BACnetObjectType.MultiStateInput or BACnetObjectType.MultiStateOutput or BACnetObjectType.MultiStateValue => 1,
            _ => null
        };
    }

    /// <summary>
    /// Subscribe to COV (Change of Value) notifications
    /// </summary>
    public async Task SubscribeToCovAsync(
        uint deviceInstance,
        BACnetObjectType objectType,
        uint objectInstance,
        float? covIncrement,
        CancellationToken cancellationToken = default)
    {
        if (_udpClient == null)
        {
            throw new InvalidOperationException("BACnet connector is not connected");
        }

        var request = BuildSubscribeCovRequest(deviceInstance, objectType, objectInstance, covIncrement);

        IPEndPoint targetEndpoint;
        if (_config.TargetAddress != null)
        {
            targetEndpoint = new IPEndPoint(IPAddress.Parse(_config.TargetAddress), 47808);
        }
        else if (_discoveredDevices.TryGetValue(deviceInstance, out var deviceInfo))
        {
            targetEndpoint = new IPEndPoint(IPAddress.Parse(deviceInfo.Address), 47808);
        }
        else
        {
            throw new InvalidOperationException($"Device {deviceInstance} not found");
        }

        await _udpClient.SendAsync(request, request.Length, targetEndpoint);

        Logger.LogInformation("Subscribed to COV for {ObjectType}:{ObjectInstance} on device {DeviceInstance}",
            objectType, objectInstance, deviceInstance);
    }

    private async Task ListenForResponsesAsync(CancellationToken cancellationToken)
    {
        while (_isListening && !cancellationToken.IsCancellationRequested)
        {
            try
            {
                var result = await _udpClient!.ReceiveAsync(cancellationToken);
                ProcessBACnetMessage(result.Buffer, result.RemoteEndPoint);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Error receiving BACnet message");
            }
        }
    }

    private void ProcessBACnetMessage(byte[] data, IPEndPoint remoteEndpoint)
    {
        if (data.Length < 4)
        {
            return;
        }

        // Parse BVLC header
        var bvlcType = data[0];
        var bvlcFunction = data[1];
        var bvlcLength = (data[2] << 8) | data[3];

        // Check for I-Am response (device discovery)
        if (bvlcFunction == 0x04) // Original-Unicast-NPDU or similar
        {
            // Parse the NPDU and APDU to extract device information
            // This is a simplified implementation
            var deviceInstance = ExtractDeviceInstanceFromIAm(data);
            if (deviceInstance.HasValue)
            {
                var deviceInfo = new BACnetDeviceInfo
                {
                    DeviceInstance = deviceInstance.Value,
                    Address = remoteEndpoint.Address.ToString(),
                    Port = remoteEndpoint.Port
                };

                _discoveredDevices[deviceInstance.Value] = deviceInfo;
                Logger.LogInformation("Discovered BACnet device {Instance} at {Address}",
                    deviceInstance.Value, remoteEndpoint.Address);
            }
        }
    }

    private uint? ExtractDeviceInstanceFromIAm(byte[] data)
    {
        // Simplified parsing - in a real implementation, this would properly parse
        // the APDU to extract the device instance number
        if (data.Length >= 10)
        {
            // Return a simulated device instance based on data
            return (uint)(data[8] << 8 | data[9]);
        }
        return null;
    }

    private static byte[] BuildWhoIsRequest()
    {
        // Build a BACnet Who-Is broadcast message
        // BVLC header + NPDU + APDU (Who-Is)
        return new byte[]
        {
            0x81, // BVLC Type
            0x0B, // Function: Original-Broadcast-NPDU
            0x00, 0x0C, // Length (12 bytes)
            0x01, // NPDU Version
            0x20, // NPDU Control (expecting reply)
            0xFF, 0xFF, // Destination network broadcast
            0x00, // Hop count
            0x10, // APDU Type: Unconfirmed Service Request
            0x08  // Service: Who-Is
        };
    }

    private static byte[] BuildReadPropertyRequest(
        uint deviceInstance,
        BACnetObjectType objectType,
        uint objectInstance,
        BACnetPropertyId propertyId)
    {
        // Build a BACnet ReadProperty request
        // This is a simplified implementation
        var objectTypeCode = (ushort)objectType;
        var propertyIdCode = (byte)propertyId;

        return new byte[]
        {
            0x81, // BVLC Type
            0x0A, // Function: Original-Unicast-NPDU
            0x00, 0x15, // Length
            0x01, // NPDU Version
            0x04, // NPDU Control
            0x00, // Invoke ID
            0x0C, // Service: ReadProperty
            (byte)(objectTypeCode >> 8), (byte)(objectTypeCode & 0xFF),
            (byte)(objectInstance >> 16), (byte)(objectInstance >> 8), (byte)(objectInstance & 0xFF),
            propertyIdCode
        };
    }

    private static byte[] BuildSubscribeCovRequest(
        uint deviceInstance,
        BACnetObjectType objectType,
        uint objectInstance,
        float? covIncrement)
    {
        // Build a BACnet SubscribeCOV request
        // This is a simplified implementation
        return new byte[]
        {
            0x81, // BVLC Type
            0x0A, // Function: Original-Unicast-NPDU
            0x00, 0x18, // Length
            0x01, // NPDU Version
            0x04, // NPDU Control
            0x00, // Invoke ID
            0x05, // Service: SubscribeCOV
            (byte)((ushort)objectType >> 8), (byte)((ushort)objectType & 0xFF),
            (byte)(objectInstance >> 16), (byte)(objectInstance >> 8), (byte)(objectInstance & 0xFF),
            0x01, // Confirmed Notifications
            0x00, 0x00, 0x00, 0x3C // Lifetime: 60 seconds
        };
    }

    private static DataPointType MapBACnetObjectType(BACnetObjectType objectType)
    {
        return objectType switch
        {
            BACnetObjectType.AnalogInput or BACnetObjectType.AnalogOutput or BACnetObjectType.AnalogValue => DataPointType.Float,
            BACnetObjectType.BinaryInput or BACnetObjectType.BinaryOutput or BACnetObjectType.BinaryValue => DataPointType.Boolean,
            BACnetObjectType.MultiStateInput or BACnetObjectType.MultiStateOutput or BACnetObjectType.MultiStateValue => DataPointType.Int32,
            _ => DataPointType.Unknown
        };
    }
}

/// <summary>
/// Information about a discovered BACnet device
/// </summary>
public class BACnetDeviceInfo
{
    /// <summary>
    /// BACnet device instance number
    /// </summary>
    public uint DeviceInstance { get; init; }

    /// <summary>
    /// Device name (from device object)
    /// </summary>
    public string? Name { get; init; }

    /// <summary>
    /// IP address of the device
    /// </summary>
    public string Address { get; init; } = string.Empty;

    /// <summary>
    /// UDP port
    /// </summary>
    public int Port { get; init; } = 47808;

    /// <summary>
    /// Vendor identifier
    /// </summary>
    public uint? VendorId { get; init; }

    /// <summary>
    /// Model name
    /// </summary>
    public string? ModelName { get; init; }

    /// <summary>
    /// Firmware revision
    /// </summary>
    public string? FirmwareRevision { get; init; }
}
