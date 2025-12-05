namespace Sensormine.Core.Models;

/// <summary>
/// Container for protocol-specific configuration settings
/// </summary>
public class ProtocolConfig
{
    public MqttConfig? Mqtt { get; set; }
    public HttpConfig? Http { get; set; }
    public WebSocketConfig? WebSocket { get; set; }
    public OpcUaConfig? OpcUa { get; set; }
    public ModbusConfig? Modbus { get; set; }
    public BACnetConfig? BACnet { get; set; }
    public EtherNetIPConfig? EtherNetIP { get; set; }
}

/// <summary>
/// MQTT protocol configuration
/// </summary>
public class MqttConfig
{
    public string Broker { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public int Qos { get; set; } = 1;
    public int KeepAlive { get; set; } = 60;
    public bool CleanSession { get; set; } = true;
    public MqttAuth? Auth { get; set; }
}

public class MqttAuth
{
    public string? Username { get; set; }
    public string? Password { get; set; }
}

/// <summary>
/// HTTP/REST protocol configuration
/// </summary>
public class HttpConfig
{
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = "POST";
    public Dictionary<string, string> Headers { get; set; } = new();
    public HttpAuth? Auth { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
}

public class HttpAuth
{
    public string Type { get; set; } = "bearer"; // bearer, basic, apikey
    public string? Token { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? ApiKey { get; set; }
    public string? ApiKeyHeader { get; set; }
}

/// <summary>
/// WebSocket protocol configuration
/// </summary>
public class WebSocketConfig
{
    public string Url { get; set; } = string.Empty;
    public int ReconnectIntervalSeconds { get; set; } = 5;
    public int MaxReconnectAttempts { get; set; } = 10;
    public Dictionary<string, string> Headers { get; set; } = new();
}

/// <summary>
/// OPC UA protocol configuration
/// </summary>
public class OpcUaConfig
{
    public string EndpointUrl { get; set; } = string.Empty;
    public string SecurityPolicy { get; set; } = "None";
    public string MessageSecurityMode { get; set; } = "None";
    public List<string> NodeIds { get; set; } = new();
    public int SamplingIntervalMs { get; set; } = 1000;
    public OpcUaAuth? Auth { get; set; }
}

public class OpcUaAuth
{
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? CertificatePath { get; set; }
    public string? PrivateKeyPath { get; set; }
}

/// <summary>
/// Modbus TCP/RTU protocol configuration
/// </summary>
public class ModbusConfig
{
    public string Type { get; set; } = "TCP"; // TCP or RTU
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 502;
    public byte SlaveId { get; set; } = 1;
    public int TimeoutMs { get; set; } = 1000;
    public List<ModbusRegister> Registers { get; set; } = new();
}

public class ModbusRegister
{
    public string Name { get; set; } = string.Empty;
    public string RegisterType { get; set; } = "HoldingRegister"; // HoldingRegister, InputRegister, Coil, DiscreteInput
    public ushort Address { get; set; }
    public ushort Length { get; set; } = 1;
    public string DataType { get; set; } = "Int16"; // Int16, Int32, Float, etc.
}

/// <summary>
/// BACnet protocol configuration
/// </summary>
public class BACnetConfig
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 47808;
    public int DeviceId { get; set; }
    public List<BACnetObject> Objects { get; set; } = new();
}

public class BACnetObject
{
    public string Name { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty; // AnalogInput, AnalogValue, BinaryInput, etc.
    public int ObjectInstance { get; set; }
}

/// <summary>
/// EtherNet/IP protocol configuration
/// </summary>
public class EtherNetIPConfig
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 44818;
    public string Slot { get; set; } = "0";
    public List<string> Tags { get; set; } = new();
    public int ScanRateMs { get; set; } = 1000;
}
