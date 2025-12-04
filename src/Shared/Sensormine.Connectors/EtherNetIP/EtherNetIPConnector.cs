namespace Sensormine.Connectors.EtherNetIP;

using Microsoft.Extensions.Logging;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.Models;
using System.Net;
using System.Net.Sockets;

/// <summary>
/// EtherNet/IP (CIP) protocol connector for Allen-Bradley and Rockwell PLCs
/// </summary>
/// <remarks>
/// This is a simplified EtherNet/IP implementation. For production use, consider using
/// a full library like libplctag or pycomm3 (via interop).
/// </remarks>
public class EtherNetIPConnector : PollingConnectorBase, IBrowsableConnector
{
    private readonly EtherNetIPConnectorConfiguration _config;
    private TcpClient? _tcpClient;
    private NetworkStream? _stream;
    private uint _sessionHandle;
    private readonly object _sessionLock = new();

    // CIP/EtherNet/IP constants
    private const ushort EIP_PORT = 44818;
    private const ushort REGISTER_SESSION = 0x0065;
    private const ushort UNREGISTER_SESSION = 0x0066;
    private const ushort SEND_RR_DATA = 0x006F;

    /// <summary>
    /// Creates a new EtherNet/IP connector
    /// </summary>
    public EtherNetIPConnector(EtherNetIPConnectorConfiguration configuration, ILogger<EtherNetIPConnector> logger)
        : base(configuration, logger)
    {
        _config = configuration;
    }

    /// <inheritdoc />
    public override ConnectorType Type => ConnectorType.EtherNetIP;

    /// <inheritdoc />
    protected override int PollingIntervalMs => _config.PollingIntervalMs;

    /// <inheritdoc />
    public override async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (IsConnected)
        {
            Logger.LogWarning("EtherNet/IP connector {Name} is already connected", Name);
            return;
        }

        try
        {
            Status = ConnectionStatus.Connecting;

            // Create TCP connection
            _tcpClient = new TcpClient();
            await _tcpClient.ConnectAsync(_config.Host, _config.Port, cancellationToken);
            _stream = _tcpClient.GetStream();

            // Register EtherNet/IP session
            await RegisterSessionAsync(cancellationToken);

            Status = ConnectionStatus.Connected;
            Logger.LogInformation("EtherNet/IP connector {Name} connected to {Host}:{Port} with session {Session:X8}",
                Name, _config.Host, _config.Port, _sessionHandle);
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
            Logger.LogError(ex, "Failed to connect EtherNet/IP connector {Name} to {Host}:{Port}",
                Name, _config.Host, _config.Port);
            throw;
        }
    }

    /// <inheritdoc />
    public override async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_sessionHandle != 0 && _stream != null)
            {
                await UnregisterSessionAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Error unregistering EtherNet/IP session");
        }

        _stream?.Close();
        _stream?.Dispose();
        _stream = null;

        _tcpClient?.Close();
        _tcpClient?.Dispose();
        _tcpClient = null;

        _sessionHandle = 0;

        Status = ConnectionStatus.Disconnected;
        Logger.LogInformation("EtherNet/IP connector {Name} disconnected", Name);
    }

    /// <inheritdoc />
    public override async Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConnected || _stream == null)
        {
            throw new InvalidOperationException($"EtherNet/IP connector {Name} is not connected");
        }

        var dataPoints = new List<DataPoint>();

        foreach (var mapping in _config.TagMappings)
        {
            try
            {
                var value = await ReadTagAsync(mapping.TagName, mapping.DataType, cancellationToken);

                var dataPoint = new DataPoint
                {
                    SourceId = Id.ToString(),
                    TagId = mapping.Id,
                    Name = mapping.Name,
                    Value = ApplyScaling(value, mapping.ScaleFactor),
                    DataType = MapEtherNetIPDataType(mapping.DataType),
                    Quality = value != null ? DataQuality.Good : DataQuality.Bad,
                    SourceTimestamp = DateTimeOffset.UtcNow,
                    ReceivedTimestamp = DateTimeOffset.UtcNow,
                    Unit = mapping.Unit,
                    Metadata = new Dictionary<string, string>
                    {
                        ["TagName"] = mapping.TagName,
                        ["DataType"] = mapping.DataType.ToString(),
                        ["SchemaId"] = mapping.SchemaId ?? string.Empty
                    }
                };

                dataPoints.Add(dataPoint);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to read EtherNet/IP tag {Name} ({TagName})",
                    mapping.Name, mapping.TagName);

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
        // Return processor type as root
        return new List<BrowseItem>
        {
            new BrowseItem
            {
                NodeId = "controller",
                Name = _config.ProcessorType.ToString(),
                Description = $"Controller at {_config.Host}",
                ItemType = BrowseItemType.Device,
                HasChildren = true,
                IsReadable = false
            }
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<BrowseItem>> BrowseAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        // In a full implementation, this would query the PLC's tag database
        // For now, return the configured tag mappings
        var items = new List<BrowseItem>();

        if (nodeId == "controller")
        {
            foreach (var mapping in _config.TagMappings)
            {
                items.Add(new BrowseItem
                {
                    NodeId = mapping.TagName,
                    Name = mapping.Name,
                    ItemType = BrowseItemType.Variable,
                    DataType = MapEtherNetIPDataType(mapping.DataType),
                    HasChildren = false,
                    IsReadable = true,
                    IsWritable = true
                });
            }
        }

        return items;
    }

    /// <inheritdoc />
    public async Task<DataPoint?> ReadValueAsync(string nodeId, CancellationToken cancellationToken = default)
    {
        var mapping = _config.TagMappings.FirstOrDefault(m => m.TagName == nodeId);
        if (mapping == null)
        {
            return null;
        }

        var value = await ReadTagAsync(nodeId, mapping.DataType, cancellationToken);
        if (value == null)
        {
            return null;
        }

        return new DataPoint
        {
            SourceId = Id.ToString(),
            TagId = nodeId,
            Name = mapping.Name,
            Value = value,
            DataType = MapEtherNetIPDataType(mapping.DataType),
            Quality = DataQuality.Good,
            SourceTimestamp = DateTimeOffset.UtcNow,
            ReceivedTimestamp = DateTimeOffset.UtcNow
        };
    }

    /// <summary>
    /// Read a tag value from the PLC
    /// </summary>
    public async Task<object?> ReadTagAsync(string tagName, EtherNetIPDataType dataType, CancellationToken cancellationToken = default)
    {
        EnsureConnected();

        // Build CIP Read Tag Service request
        var request = BuildReadTagRequest(tagName, dataType);
        var response = await SendReceiveAsync(request, cancellationToken);

        return ParseReadResponse(response, dataType);
    }

    /// <summary>
    /// Write a tag value to the PLC
    /// </summary>
    public async Task WriteTagAsync(string tagName, object value, EtherNetIPDataType dataType, CancellationToken cancellationToken = default)
    {
        EnsureConnected();

        var request = BuildWriteTagRequest(tagName, value, dataType);
        var response = await SendReceiveAsync(request, cancellationToken);

        // Check response for success
        if (response.Length >= 4 && response[0] != 0)
        {
            throw new InvalidOperationException($"Write tag failed with status: 0x{response[0]:X2}");
        }

        Logger.LogDebug("Wrote value {Value} to tag {TagName}", value, tagName);
    }

    private async Task RegisterSessionAsync(CancellationToken cancellationToken)
    {
        // Build EtherNet/IP RegisterSession command
        var request = new byte[28];

        // Encapsulation Header
        BitConverter.TryWriteBytes(request.AsSpan(0, 2), REGISTER_SESSION); // Command
        BitConverter.TryWriteBytes(request.AsSpan(2, 2), (ushort)4); // Length
        BitConverter.TryWriteBytes(request.AsSpan(4, 4), (uint)0); // Session Handle (0 for registration)
        BitConverter.TryWriteBytes(request.AsSpan(8, 4), (uint)0); // Status
        // Sender Context (8 bytes) - zeroed
        // Options (4 bytes) - zeroed

        // Command Specific Data
        BitConverter.TryWriteBytes(request.AsSpan(24, 2), (ushort)1); // Protocol Version
        BitConverter.TryWriteBytes(request.AsSpan(26, 2), (ushort)0); // Options Flags

        await _stream!.WriteAsync(request, cancellationToken);

        // Read response
        var response = new byte[28];
        var bytesRead = await _stream.ReadAsync(response, cancellationToken);

        if (bytesRead < 28)
        {
            throw new InvalidOperationException("Invalid RegisterSession response");
        }

        // Extract session handle
        lock (_sessionLock)
        {
            _sessionHandle = BitConverter.ToUInt32(response, 4);
        }

        if (_sessionHandle == 0)
        {
            var status = BitConverter.ToUInt32(response, 8);
            throw new InvalidOperationException($"RegisterSession failed with status: 0x{status:X8}");
        }
    }

    private async Task UnregisterSessionAsync(CancellationToken cancellationToken)
    {
        var request = new byte[24];

        // Encapsulation Header
        BitConverter.TryWriteBytes(request.AsSpan(0, 2), UNREGISTER_SESSION); // Command
        BitConverter.TryWriteBytes(request.AsSpan(2, 2), (ushort)0); // Length
        BitConverter.TryWriteBytes(request.AsSpan(4, 4), _sessionHandle); // Session Handle
        // Status, Sender Context, Options - zeroed

        await _stream!.WriteAsync(request, cancellationToken);

        lock (_sessionLock)
        {
            _sessionHandle = 0;
        }
    }

    private async Task<byte[]> SendReceiveAsync(byte[] request, CancellationToken cancellationToken)
    {
        // Build SendRRData encapsulation
        var encapsulated = BuildSendRRDataPacket(request);

        await _stream!.WriteAsync(encapsulated, cancellationToken);

        // Read response
        var headerBuffer = new byte[24];
        var headerBytesRead = await _stream.ReadAsync(headerBuffer, cancellationToken);

        if (headerBytesRead < 24)
        {
            throw new InvalidOperationException("Invalid response header");
        }

        var dataLength = BitConverter.ToUInt16(headerBuffer, 2);
        if (dataLength == 0)
        {
            return Array.Empty<byte>();
        }

        var dataBuffer = new byte[dataLength];
        var dataBytesRead = await _stream.ReadAsync(dataBuffer, cancellationToken);

        return dataBuffer;
    }

    private byte[] BuildSendRRDataPacket(byte[] cipData)
    {
        // Build complete SendRRData encapsulation packet
        var headerLength = 24;
        var itemHeaderLength = 16; // CPF header (2 items, null address, data item header)
        var totalLength = headerLength + itemHeaderLength + cipData.Length;

        var packet = new byte[totalLength];

        // Encapsulation Header
        BitConverter.TryWriteBytes(packet.AsSpan(0, 2), SEND_RR_DATA); // Command
        BitConverter.TryWriteBytes(packet.AsSpan(2, 2), (ushort)(itemHeaderLength + cipData.Length)); // Length
        BitConverter.TryWriteBytes(packet.AsSpan(4, 4), _sessionHandle); // Session Handle
        // Status, Sender Context, Options - zeroed

        // Interface Handle and Timeout
        var offset = headerLength;
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 4), (uint)0); // Interface Handle
        offset += 4;
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 2), (ushort)10); // Timeout
        offset += 2;

        // CPF - Item count
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 2), (ushort)2); // Item Count
        offset += 2;

        // CPF - Null Address Item
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 2), (ushort)0); // Item Type ID (Null)
        offset += 2;
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 2), (ushort)0); // Item Length
        offset += 2;

        // CPF - Data Item
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 2), (ushort)0x00B2); // Item Type ID (Unconnected Data)
        offset += 2;
        BitConverter.TryWriteBytes(packet.AsSpan(offset, 2), (ushort)cipData.Length); // Item Length
        offset += 2;

        // Copy CIP data
        Array.Copy(cipData, 0, packet, offset, cipData.Length);

        return packet;
    }

    private byte[] BuildReadTagRequest(string tagName, EtherNetIPDataType dataType)
    {
        // Build CIP Read Tag Service request
        var tagNameBytes = System.Text.Encoding.ASCII.GetBytes(tagName);
        var pathLength = 2 + (tagNameBytes.Length + 1) / 2 * 2; // Padded to word boundary

        var request = new List<byte>
        {
            0x4C, // Service: Read Tag
            (byte)(pathLength / 2), // Path size in words
            0x91, // Symbolic Segment
            (byte)tagNameBytes.Length // Tag name length
        };

        request.AddRange(tagNameBytes);

        // Pad to word boundary
        if (tagNameBytes.Length % 2 == 1)
        {
            request.Add(0x00);
        }

        // Number of elements to read
        request.Add(0x01);
        request.Add(0x00);

        return request.ToArray();
    }

    private byte[] BuildWriteTagRequest(string tagName, object value, EtherNetIPDataType dataType)
    {
        var tagNameBytes = System.Text.Encoding.ASCII.GetBytes(tagName);
        var pathLength = 2 + (tagNameBytes.Length + 1) / 2 * 2;

        var request = new List<byte>
        {
            0x4D, // Service: Write Tag
            (byte)(pathLength / 2),
            0x91,
            (byte)tagNameBytes.Length
        };

        request.AddRange(tagNameBytes);

        if (tagNameBytes.Length % 2 == 1)
        {
            request.Add(0x00);
        }

        // Data type code
        request.Add((byte)GetCipDataTypeCode(dataType));
        request.Add(0x00);

        // Element count
        request.Add(0x01);
        request.Add(0x00);

        // Value bytes
        request.AddRange(ConvertValueToBytes(value, dataType));

        return request.ToArray();
    }

    private object? ParseReadResponse(byte[] response, EtherNetIPDataType dataType)
    {
        if (response.Length < 4)
        {
            return null;
        }

        // Check for error
        if (response[0] != 0xCC) // Reply service code for Read Tag
        {
            return null;
        }

        // Skip status bytes and data type code
        var dataOffset = 6;

        if (response.Length <= dataOffset)
        {
            return null;
        }

        return dataType switch
        {
            EtherNetIPDataType.BOOL => response[dataOffset] != 0,
            EtherNetIPDataType.SINT => (sbyte)response[dataOffset],
            EtherNetIPDataType.INT => BitConverter.ToInt16(response, dataOffset),
            EtherNetIPDataType.DINT => BitConverter.ToInt32(response, dataOffset),
            EtherNetIPDataType.LINT => BitConverter.ToInt64(response, dataOffset),
            EtherNetIPDataType.USINT => response[dataOffset],
            EtherNetIPDataType.UINT => BitConverter.ToUInt16(response, dataOffset),
            EtherNetIPDataType.UDINT => BitConverter.ToUInt32(response, dataOffset),
            EtherNetIPDataType.ULINT => BitConverter.ToUInt64(response, dataOffset),
            EtherNetIPDataType.REAL => BitConverter.ToSingle(response, dataOffset),
            EtherNetIPDataType.LREAL => BitConverter.ToDouble(response, dataOffset),
            EtherNetIPDataType.STRING => ParseString(response, dataOffset),
            _ => null
        };
    }

    private static string ParseString(byte[] response, int offset)
    {
        if (response.Length <= offset + 4)
        {
            return string.Empty;
        }

        var length = BitConverter.ToInt32(response, offset);
        if (length <= 0 || response.Length < offset + 4 + length)
        {
            return string.Empty;
        }

        return System.Text.Encoding.ASCII.GetString(response, offset + 4, length);
    }

    private static byte GetCipDataTypeCode(EtherNetIPDataType dataType)
    {
        return dataType switch
        {
            EtherNetIPDataType.BOOL => 0xC1,
            EtherNetIPDataType.SINT => 0xC2,
            EtherNetIPDataType.INT => 0xC3,
            EtherNetIPDataType.DINT => 0xC4,
            EtherNetIPDataType.LINT => 0xC5,
            EtherNetIPDataType.USINT => 0xC6,
            EtherNetIPDataType.UINT => 0xC7,
            EtherNetIPDataType.UDINT => 0xC8,
            EtherNetIPDataType.ULINT => 0xC9,
            EtherNetIPDataType.REAL => 0xCA,
            EtherNetIPDataType.LREAL => 0xCB,
            EtherNetIPDataType.STRING => 0xDA,
            _ => 0xC4
        };
    }

    private static byte[] ConvertValueToBytes(object value, EtherNetIPDataType dataType)
    {
        return dataType switch
        {
            EtherNetIPDataType.BOOL => new[] { (byte)(Convert.ToBoolean(value) ? 1 : 0) },
            EtherNetIPDataType.SINT => new[] { (byte)Convert.ToSByte(value) },
            EtherNetIPDataType.INT => BitConverter.GetBytes(Convert.ToInt16(value)),
            EtherNetIPDataType.DINT => BitConverter.GetBytes(Convert.ToInt32(value)),
            EtherNetIPDataType.LINT => BitConverter.GetBytes(Convert.ToInt64(value)),
            EtherNetIPDataType.USINT => new[] { Convert.ToByte(value) },
            EtherNetIPDataType.UINT => BitConverter.GetBytes(Convert.ToUInt16(value)),
            EtherNetIPDataType.UDINT => BitConverter.GetBytes(Convert.ToUInt32(value)),
            EtherNetIPDataType.ULINT => BitConverter.GetBytes(Convert.ToUInt64(value)),
            EtherNetIPDataType.REAL => BitConverter.GetBytes(Convert.ToSingle(value)),
            EtherNetIPDataType.LREAL => BitConverter.GetBytes(Convert.ToDouble(value)),
            _ => Array.Empty<byte>()
        };
    }

    private static object? ApplyScaling(object? value, double scaleFactor)
    {
        if (value == null || Math.Abs(scaleFactor - 1.0) < 0.0001)
        {
            return value;
        }

        return value switch
        {
            double d => d * scaleFactor,
            float f => f * scaleFactor,
            int i => i * scaleFactor,
            short s => s * scaleFactor,
            long l => l * scaleFactor,
            _ => value
        };
    }

    private static DataPointType MapEtherNetIPDataType(EtherNetIPDataType dataType)
    {
        return dataType switch
        {
            EtherNetIPDataType.BOOL => DataPointType.Boolean,
            EtherNetIPDataType.SINT => DataPointType.Int16,
            EtherNetIPDataType.INT => DataPointType.Int16,
            EtherNetIPDataType.DINT => DataPointType.Int32,
            EtherNetIPDataType.LINT => DataPointType.Int64,
            EtherNetIPDataType.USINT => DataPointType.UInt16,
            EtherNetIPDataType.UINT => DataPointType.UInt16,
            EtherNetIPDataType.UDINT => DataPointType.UInt32,
            EtherNetIPDataType.ULINT => DataPointType.UInt64,
            EtherNetIPDataType.REAL => DataPointType.Float,
            EtherNetIPDataType.LREAL => DataPointType.Double,
            EtherNetIPDataType.STRING => DataPointType.String,
            _ => DataPointType.Unknown
        };
    }

    private void EnsureConnected()
    {
        if (!IsConnected || _stream == null || _sessionHandle == 0)
        {
            throw new InvalidOperationException($"EtherNet/IP connector {Name} is not connected");
        }
    }
}
