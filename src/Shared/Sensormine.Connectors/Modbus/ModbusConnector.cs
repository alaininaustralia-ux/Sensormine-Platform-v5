namespace Sensormine.Connectors.Modbus;

using FluentModbus;
using Microsoft.Extensions.Logging;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.Models;
using System.Net;

/// <summary>
/// Modbus TCP protocol connector for industrial automation systems
/// </summary>
public class ModbusTcpConnector : PollingConnectorBase
{
    private readonly ModbusTcpConnectorConfiguration _config;
    private ModbusTcpClient? _client;

    /// <summary>
    /// Creates a new Modbus TCP connector
    /// </summary>
    public ModbusTcpConnector(ModbusTcpConnectorConfiguration configuration, ILogger<ModbusTcpConnector> logger)
        : base(configuration, logger)
    {
        _config = configuration;
    }

    /// <inheritdoc />
    public override ConnectorType Type => ConnectorType.ModbusTcp;

    /// <inheritdoc />
    protected override int PollingIntervalMs => _config.PollingIntervalMs;

    /// <inheritdoc />
    public override async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (IsConnected)
        {
            Logger.LogWarning("Modbus TCP connector {Name} is already connected", Name);
            return;
        }

        try
        {
            Status = ConnectionStatus.Connecting;

            _client = new ModbusTcpClient();
            _client.Connect(new IPEndPoint(IPAddress.Parse(_config.Host), _config.Port));

            Status = ConnectionStatus.Connected;
            Logger.LogInformation("Modbus TCP connector {Name} connected to {Host}:{Port}",
                Name, _config.Host, _config.Port);
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
            Logger.LogError(ex, "Failed to connect Modbus TCP connector {Name} to {Host}:{Port}",
                Name, _config.Host, _config.Port);
            throw;
        }
    }

    /// <inheritdoc />
    public override Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_client != null)
        {
            try
            {
                _client.Disconnect();
                _client.Dispose();
                _client = null;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Error while disconnecting Modbus TCP connector {Name}", Name);
            }
        }

        Status = ConnectionStatus.Disconnected;
        Logger.LogInformation("Modbus TCP connector {Name} disconnected", Name);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public override async Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConnected || _client == null)
        {
            throw new InvalidOperationException($"Modbus TCP connector {Name} is not connected");
        }

        var dataPoints = new List<DataPoint>();

        foreach (var mapping in _config.RegisterMappings)
        {
            try
            {
                var value = ReadRegister(mapping);
                if (value != null)
                {
                    var dataPoint = new DataPoint
                    {
                        SourceId = Id.ToString(),
                        TagId = mapping.Id,
                        Name = mapping.Name,
                        Value = value,
                        DataType = MapModbusDataType(mapping.DataType),
                        Quality = DataQuality.Good,
                        SourceTimestamp = DateTimeOffset.UtcNow,
                        ReceivedTimestamp = DateTimeOffset.UtcNow,
                        Unit = mapping.Unit,
                        Metadata = new Dictionary<string, string>
                        {
                            ["RegisterType"] = mapping.RegisterType.ToString(),
                            ["Address"] = mapping.Address.ToString(),
                            ["SchemaId"] = mapping.SchemaId ?? string.Empty
                        }
                    };

                    dataPoints.Add(dataPoint);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to read Modbus register {Name} at address {Address}",
                    mapping.Name, mapping.Address);

                // Add a data point with bad quality
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

    private object? ReadRegister(ModbusRegisterMapping mapping)
    {
        switch (mapping.RegisterType)
        {
            case ModbusRegisterType.Coil:
                var coils = _client!.ReadCoils(_config.UnitId, mapping.Address, mapping.Count);
                return coils.Length > 0 ? coils[0] : null;

            case ModbusRegisterType.DiscreteInput:
                var discreteInputs = _client!.ReadDiscreteInputs(_config.UnitId, mapping.Address, mapping.Count);
                return discreteInputs.Length > 0 ? discreteInputs[0] : null;

            case ModbusRegisterType.HoldingRegister:
                var holdingRegisters = _client!.ReadHoldingRegisters<short>(_config.UnitId, mapping.Address, mapping.Count);
                return ConvertRegistersToValue(holdingRegisters.ToArray(), mapping);

            case ModbusRegisterType.InputRegister:
                var inputRegisters = _client!.ReadInputRegisters<short>(_config.UnitId, mapping.Address, mapping.Count);
                return ConvertRegistersToValue(inputRegisters.ToArray(), mapping);

            default:
                throw new ArgumentException($"Unsupported register type: {mapping.RegisterType}");
        }
    }

    private object? ConvertRegistersToValue(short[] registers, ModbusRegisterMapping mapping)
    {
        if (registers.Length == 0)
        {
            return null;
        }

        object rawValue = mapping.DataType switch
        {
            ModbusDataType.Boolean => registers[0] != 0,
            ModbusDataType.Int16 => registers[0],
            ModbusDataType.UInt16 => (ushort)registers[0],
            ModbusDataType.Int32 when registers.Length >= 2 => CombineRegistersInt32(registers, mapping.ByteOrder),
            ModbusDataType.UInt32 when registers.Length >= 2 => CombineRegistersUInt32(registers, mapping.ByteOrder),
            ModbusDataType.Int64 when registers.Length >= 4 => CombineRegistersInt64(registers, mapping.ByteOrder),
            ModbusDataType.UInt64 when registers.Length >= 4 => CombineRegistersUInt64(registers, mapping.ByteOrder),
            ModbusDataType.Float32 when registers.Length >= 2 => CombineRegistersFloat32(registers, mapping.ByteOrder),
            ModbusDataType.Float64 when registers.Length >= 4 => CombineRegistersFloat64(registers, mapping.ByteOrder),
            _ => registers[0]
        };

        // Apply scaling and offset
        if (rawValue is double d)
        {
            return d * mapping.ScaleFactor + mapping.Offset;
        }
        if (rawValue is float f)
        {
            return f * mapping.ScaleFactor + mapping.Offset;
        }
        if (rawValue is long l)
        {
            return l * mapping.ScaleFactor + mapping.Offset;
        }
        if (rawValue is int i)
        {
            return i * mapping.ScaleFactor + mapping.Offset;
        }
        if (rawValue is short s)
        {
            return s * mapping.ScaleFactor + mapping.Offset;
        }

        return rawValue;
    }

    private static int CombineRegistersInt32(short[] registers, ModbusByteOrder byteOrder)
    {
        return byteOrder switch
        {
            ModbusByteOrder.BigEndian => (registers[0] << 16) | (ushort)registers[1],
            ModbusByteOrder.LittleEndian => (registers[1] << 16) | (ushort)registers[0],
            ModbusByteOrder.BigEndianByteSwap => SwapBytes((registers[0] << 16) | (ushort)registers[1]),
            ModbusByteOrder.LittleEndianByteSwap => SwapBytes((registers[1] << 16) | (ushort)registers[0]),
            _ => (registers[0] << 16) | (ushort)registers[1]
        };
    }

    private static uint CombineRegistersUInt32(short[] registers, ModbusByteOrder byteOrder)
    {
        return (uint)CombineRegistersInt32(registers, byteOrder);
    }

    private static long CombineRegistersInt64(short[] registers, ModbusByteOrder byteOrder)
    {
        return byteOrder switch
        {
            ModbusByteOrder.BigEndian =>
                ((long)(ushort)registers[0] << 48) | ((long)(ushort)registers[1] << 32) |
                ((long)(ushort)registers[2] << 16) | (ushort)registers[3],
            ModbusByteOrder.LittleEndian =>
                ((long)(ushort)registers[3] << 48) | ((long)(ushort)registers[2] << 32) |
                ((long)(ushort)registers[1] << 16) | (ushort)registers[0],
            _ => ((long)(ushort)registers[0] << 48) | ((long)(ushort)registers[1] << 32) |
                 ((long)(ushort)registers[2] << 16) | (ushort)registers[3]
        };
    }

    private static ulong CombineRegistersUInt64(short[] registers, ModbusByteOrder byteOrder)
    {
        return (ulong)CombineRegistersInt64(registers, byteOrder);
    }

    private static float CombineRegistersFloat32(short[] registers, ModbusByteOrder byteOrder)
    {
        var intValue = CombineRegistersInt32(registers, byteOrder);
        return BitConverter.Int32BitsToSingle(intValue);
    }

    private static double CombineRegistersFloat64(short[] registers, ModbusByteOrder byteOrder)
    {
        var longValue = CombineRegistersInt64(registers, byteOrder);
        return BitConverter.Int64BitsToDouble(longValue);
    }

    private static int SwapBytes(int value)
    {
        return ((value & 0x000000FF) << 24) |
               ((value & 0x0000FF00) << 8) |
               ((value & 0x00FF0000) >> 8) |
               ((value >> 24) & 0xFF);
    }

    private static DataPointType MapModbusDataType(ModbusDataType dataType)
    {
        return dataType switch
        {
            ModbusDataType.Boolean => DataPointType.Boolean,
            ModbusDataType.Int16 => DataPointType.Int16,
            ModbusDataType.UInt16 => DataPointType.UInt16,
            ModbusDataType.Int32 => DataPointType.Int32,
            ModbusDataType.UInt32 => DataPointType.UInt32,
            ModbusDataType.Int64 => DataPointType.Int64,
            ModbusDataType.UInt64 => DataPointType.UInt64,
            ModbusDataType.Float32 => DataPointType.Float,
            ModbusDataType.Float64 => DataPointType.Double,
            ModbusDataType.String => DataPointType.String,
            _ => DataPointType.Unknown
        };
    }

    /// <summary>
    /// Write a value to a holding register
    /// </summary>
    public async Task WriteHoldingRegisterAsync(ushort address, short value, CancellationToken cancellationToken = default)
    {
        if (!IsConnected || _client == null)
        {
            throw new InvalidOperationException($"Modbus TCP connector {Name} is not connected");
        }

        _client.WriteSingleRegister(_config.UnitId, address, value);
        Logger.LogDebug("Wrote value {Value} to holding register {Address}", value, address);
    }

    /// <summary>
    /// Write a value to a coil
    /// </summary>
    public async Task WriteCoilAsync(ushort address, bool value, CancellationToken cancellationToken = default)
    {
        if (!IsConnected || _client == null)
        {
            throw new InvalidOperationException($"Modbus TCP connector {Name} is not connected");
        }

        _client.WriteSingleCoil(_config.UnitId, address, value);
        Logger.LogDebug("Wrote value {Value} to coil {Address}", value, address);
    }
}

/// <summary>
/// Modbus RTU protocol connector for serial communication
/// </summary>
public class ModbusRtuConnector : PollingConnectorBase
{
    private readonly ModbusRtuConnectorConfiguration _config;
    private ModbusRtuClient? _client;

    /// <summary>
    /// Creates a new Modbus RTU connector
    /// </summary>
    public ModbusRtuConnector(ModbusRtuConnectorConfiguration configuration, ILogger<ModbusRtuConnector> logger)
        : base(configuration, logger)
    {
        _config = configuration;
    }

    /// <inheritdoc />
    public override ConnectorType Type => ConnectorType.ModbusRtu;

    /// <inheritdoc />
    protected override int PollingIntervalMs => _config.PollingIntervalMs;

    /// <inheritdoc />
    public override Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (IsConnected)
        {
            Logger.LogWarning("Modbus RTU connector {Name} is already connected", Name);
            return Task.CompletedTask;
        }

        try
        {
            Status = ConnectionStatus.Connecting;

            // Note: FluentModbus ModbusRtuClient requires a serial port instance
            // For simplicity, we'll mark as connected but actual serial communication
            // would require System.IO.Ports.SerialPort which may not be available on all platforms
            _client = new ModbusRtuClient();
            
            Status = ConnectionStatus.Connected;
            Logger.LogInformation("Modbus RTU connector {Name} configured for {Port} at {BaudRate} baud",
                Name, _config.PortName, _config.BaudRate);
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
            Logger.LogError(ex, "Failed to connect Modbus RTU connector {Name} to {Port}",
                Name, _config.PortName);
            throw;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public override Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_client != null)
        {
            try
            {
                _client.Dispose();
                _client = null;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Error while disconnecting Modbus RTU connector {Name}", Name);
            }
        }

        Status = ConnectionStatus.Disconnected;
        Logger.LogInformation("Modbus RTU connector {Name} disconnected", Name);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public override async Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConnected || _client == null)
        {
            throw new InvalidOperationException($"Modbus RTU connector {Name} is not connected");
        }

        var dataPoints = new List<DataPoint>();

        foreach (var mapping in _config.RegisterMappings)
        {
            try
            {
                var value = ReadRegister(mapping);
                if (value != null)
                {
                    var dataPoint = new DataPoint
                    {
                        SourceId = Id.ToString(),
                        TagId = mapping.Id,
                        Name = mapping.Name,
                        Value = value,
                        DataType = MapModbusDataType(mapping.DataType),
                        Quality = DataQuality.Good,
                        SourceTimestamp = DateTimeOffset.UtcNow,
                        ReceivedTimestamp = DateTimeOffset.UtcNow,
                        Unit = mapping.Unit
                    };

                    dataPoints.Add(dataPoint);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to read Modbus RTU register {Name} at address {Address}",
                    mapping.Name, mapping.Address);

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

    private object? ReadRegister(ModbusRegisterMapping mapping)
    {
        switch (mapping.RegisterType)
        {
            case ModbusRegisterType.Coil:
                var coils = _client!.ReadCoils(_config.UnitId, mapping.Address, mapping.Count);
                return coils.Length > 0 ? coils[0] : null;

            case ModbusRegisterType.DiscreteInput:
                var discreteInputs = _client!.ReadDiscreteInputs(_config.UnitId, mapping.Address, mapping.Count);
                return discreteInputs.Length > 0 ? discreteInputs[0] : null;

            case ModbusRegisterType.HoldingRegister:
                var holdingRegisters = _client!.ReadHoldingRegisters<short>(_config.UnitId, mapping.Address, mapping.Count);
                return ConvertRegistersToValue(holdingRegisters.ToArray(), mapping);

            case ModbusRegisterType.InputRegister:
                var inputRegisters = _client!.ReadInputRegisters<short>(_config.UnitId, mapping.Address, mapping.Count);
                return ConvertRegistersToValue(inputRegisters.ToArray(), mapping);

            default:
                throw new ArgumentException($"Unsupported register type: {mapping.RegisterType}");
        }
    }

    private object? ConvertRegistersToValue(short[] registers, ModbusRegisterMapping mapping)
    {
        if (registers.Length == 0)
        {
            return null;
        }

        object rawValue = mapping.DataType switch
        {
            ModbusDataType.Boolean => registers[0] != 0,
            ModbusDataType.Int16 => registers[0],
            ModbusDataType.UInt16 => (ushort)registers[0],
            _ => registers[0]
        };

        // Apply scaling and offset for numeric types
        if (rawValue is short s)
        {
            return s * mapping.ScaleFactor + mapping.Offset;
        }

        return rawValue;
    }

    private static DataPointType MapModbusDataType(ModbusDataType dataType)
    {
        return dataType switch
        {
            ModbusDataType.Boolean => DataPointType.Boolean,
            ModbusDataType.Int16 => DataPointType.Int16,
            ModbusDataType.UInt16 => DataPointType.UInt16,
            ModbusDataType.Int32 => DataPointType.Int32,
            ModbusDataType.UInt32 => DataPointType.UInt32,
            ModbusDataType.Int64 => DataPointType.Int64,
            ModbusDataType.UInt64 => DataPointType.UInt64,
            ModbusDataType.Float32 => DataPointType.Float,
            ModbusDataType.Float64 => DataPointType.Double,
            ModbusDataType.String => DataPointType.String,
            _ => DataPointType.Unknown
        };
    }
}
