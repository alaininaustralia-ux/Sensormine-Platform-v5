namespace Sensormine.Connectors.Abstractions;

using System.Text.Json.Serialization;
using Sensormine.Connectors.Models;

/// <summary>
/// Base configuration for all connector types
/// </summary>
[JsonDerivedType(typeof(OpcUaConnectorConfiguration), typeDiscriminator: "opcua")]
[JsonDerivedType(typeof(ModbusTcpConnectorConfiguration), typeDiscriminator: "modbus_tcp")]
[JsonDerivedType(typeof(ModbusRtuConnectorConfiguration), typeDiscriminator: "modbus_rtu")]
[JsonDerivedType(typeof(BACnetConnectorConfiguration), typeDiscriminator: "bacnet")]
[JsonDerivedType(typeof(EtherNetIPConnectorConfiguration), typeDiscriminator: "ethernet_ip")]
[JsonDerivedType(typeof(ExternalMqttConnectorConfiguration), typeDiscriminator: "mqtt")]
public abstract class ConnectorConfiguration
{
    /// <summary>
    /// Unique identifier for this connector configuration
    /// </summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>
    /// Human-readable name for the connector
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Description of the connector
    /// </summary>
    public string? Description { get; init; }

    /// <summary>
    /// Type of connector
    /// </summary>
    public abstract ConnectorType Type { get; }

    /// <summary>
    /// Tenant ID for multi-tenancy
    /// </summary>
    public string TenantId { get; init; } = string.Empty;

    /// <summary>
    /// Whether the connector is enabled
    /// </summary>
    public bool Enabled { get; init; } = true;

    /// <summary>
    /// Auto-reconnect on connection failure
    /// </summary>
    public bool AutoReconnect { get; init; } = true;

    /// <summary>
    /// Reconnect interval in milliseconds
    /// </summary>
    public int ReconnectIntervalMs { get; init; } = 5000;

    /// <summary>
    /// Connection timeout in milliseconds
    /// </summary>
    public int ConnectionTimeoutMs { get; init; } = 30000;

    /// <summary>
    /// Additional tags for filtering/grouping
    /// </summary>
    public Dictionary<string, string>? Tags { get; init; }
}

/// <summary>
/// OPC UA connector configuration
/// </summary>
public class OpcUaConnectorConfiguration : ConnectorConfiguration
{
    public override ConnectorType Type => ConnectorType.OpcUa;

    /// <summary>
    /// OPC UA server endpoint URL (e.g., "opc.tcp://localhost:4840")
    /// </summary>
    public string EndpointUrl { get; init; } = string.Empty;

    /// <summary>
    /// Security policy URI (e.g., "http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256")
    /// </summary>
    public string? SecurityPolicy { get; init; }

    /// <summary>
    /// Security mode
    /// </summary>
    public OpcUaSecurityMode SecurityMode { get; init; } = OpcUaSecurityMode.None;

    /// <summary>
    /// Username for authentication
    /// </summary>
    public string? Username { get; init; }

    /// <summary>
    /// Password for authentication
    /// </summary>
    public string? Password { get; init; }

    /// <summary>
    /// Application certificate path
    /// </summary>
    public string? CertificatePath { get; init; }

    /// <summary>
    /// Private key path
    /// </summary>
    public string? PrivateKeyPath { get; init; }

    /// <summary>
    /// Session timeout in milliseconds
    /// </summary>
    public int SessionTimeoutMs { get; init; } = 60000;

    /// <summary>
    /// Publishing interval for subscriptions in milliseconds
    /// </summary>
    public int PublishingIntervalMs { get; init; } = 1000;

    /// <summary>
    /// Keep-alive interval in milliseconds
    /// </summary>
    public int KeepAliveIntervalMs { get; init; } = 5000;

    /// <summary>
    /// Nodes to subscribe to
    /// </summary>
    public List<SubscriptionItem> Subscriptions { get; init; } = new();
}

/// <summary>
/// OPC UA security modes
/// </summary>
public enum OpcUaSecurityMode
{
    None,
    Sign,
    SignAndEncrypt
}

/// <summary>
/// Modbus TCP connector configuration
/// </summary>
public class ModbusTcpConnectorConfiguration : ConnectorConfiguration
{
    public override ConnectorType Type => ConnectorType.ModbusTcp;

    /// <summary>
    /// Host address (IP or hostname)
    /// </summary>
    public string Host { get; init; } = "localhost";

    /// <summary>
    /// TCP port (default: 502)
    /// </summary>
    public int Port { get; init; } = 502;

    /// <summary>
    /// Modbus unit/slave ID
    /// </summary>
    public byte UnitId { get; init; } = 1;

    /// <summary>
    /// Polling interval in milliseconds
    /// </summary>
    public int PollingIntervalMs { get; init; } = 1000;

    /// <summary>
    /// Register mappings to poll
    /// </summary>
    public List<ModbusRegisterMapping> RegisterMappings { get; init; } = new();
}

/// <summary>
/// Modbus RTU connector configuration
/// </summary>
public class ModbusRtuConnectorConfiguration : ConnectorConfiguration
{
    public override ConnectorType Type => ConnectorType.ModbusRtu;

    /// <summary>
    /// Serial port name (e.g., "COM1" or "/dev/ttyUSB0")
    /// </summary>
    public string PortName { get; init; } = string.Empty;

    /// <summary>
    /// Baud rate
    /// </summary>
    public int BaudRate { get; init; } = 9600;

    /// <summary>
    /// Data bits
    /// </summary>
    public int DataBits { get; init; } = 8;

    /// <summary>
    /// Parity
    /// </summary>
    public ModbusParity Parity { get; init; } = ModbusParity.None;

    /// <summary>
    /// Stop bits
    /// </summary>
    public ModbusStopBits StopBits { get; init; } = ModbusStopBits.One;

    /// <summary>
    /// Modbus unit/slave ID
    /// </summary>
    public byte UnitId { get; init; } = 1;

    /// <summary>
    /// Polling interval in milliseconds
    /// </summary>
    public int PollingIntervalMs { get; init; } = 1000;

    /// <summary>
    /// Register mappings to poll
    /// </summary>
    public List<ModbusRegisterMapping> RegisterMappings { get; init; } = new();
}

/// <summary>
/// Modbus register mapping configuration
/// </summary>
public class ModbusRegisterMapping
{
    /// <summary>
    /// Unique identifier for this mapping
    /// </summary>
    public string Id { get; init; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Register type
    /// </summary>
    public ModbusRegisterType RegisterType { get; init; } = ModbusRegisterType.HoldingRegister;

    /// <summary>
    /// Starting address
    /// </summary>
    public ushort Address { get; init; }

    /// <summary>
    /// Number of registers to read
    /// </summary>
    public ushort Count { get; init; } = 1;

    /// <summary>
    /// Data type interpretation
    /// </summary>
    public ModbusDataType DataType { get; init; } = ModbusDataType.Int16;

    /// <summary>
    /// Byte order for multi-register types
    /// </summary>
    public ModbusByteOrder ByteOrder { get; init; } = ModbusByteOrder.BigEndian;

    /// <summary>
    /// Scale factor to apply to raw value
    /// </summary>
    public double ScaleFactor { get; init; } = 1.0;

    /// <summary>
    /// Offset to add after scaling
    /// </summary>
    public double Offset { get; init; } = 0.0;

    /// <summary>
    /// Engineering unit
    /// </summary>
    public string? Unit { get; init; }

    /// <summary>
    /// Schema ID to map data to
    /// </summary>
    public string? SchemaId { get; init; }
}

/// <summary>
/// Modbus register types
/// </summary>
public enum ModbusRegisterType
{
    /// <summary>Coil (read/write boolean)</summary>
    Coil,
    /// <summary>Discrete input (read-only boolean)</summary>
    DiscreteInput,
    /// <summary>Holding register (read/write 16-bit)</summary>
    HoldingRegister,
    /// <summary>Input register (read-only 16-bit)</summary>
    InputRegister
}

/// <summary>
/// Modbus data types for interpretation
/// </summary>
public enum ModbusDataType
{
    Boolean,
    Int16,
    UInt16,
    Int32,
    UInt32,
    Int64,
    UInt64,
    Float32,
    Float64,
    String
}

/// <summary>
/// Modbus byte order
/// </summary>
public enum ModbusByteOrder
{
    BigEndian,
    LittleEndian,
    BigEndianByteSwap,
    LittleEndianByteSwap
}

/// <summary>
/// Modbus parity
/// </summary>
public enum ModbusParity
{
    None,
    Odd,
    Even
}

/// <summary>
/// Modbus stop bits
/// </summary>
public enum ModbusStopBits
{
    One,
    OnePointFive,
    Two
}

/// <summary>
/// BACnet connector configuration
/// </summary>
public class BACnetConnectorConfiguration : ConnectorConfiguration
{
    public override ConnectorType Type => ConnectorType.BACnet;

    /// <summary>
    /// Local BACnet port (default: 47808)
    /// </summary>
    public int LocalPort { get; init; } = 47808;

    /// <summary>
    /// BACnet device instance number
    /// </summary>
    public uint LocalDeviceInstance { get; init; } = 1234;

    /// <summary>
    /// Target device IP address (for unicast)
    /// </summary>
    public string? TargetAddress { get; init; }

    /// <summary>
    /// Target device instance number
    /// </summary>
    public uint? TargetDeviceInstance { get; init; }

    /// <summary>
    /// Enable auto-discovery of devices
    /// </summary>
    public bool EnableDiscovery { get; init; } = true;

    /// <summary>
    /// Polling interval in milliseconds
    /// </summary>
    public int PollingIntervalMs { get; init; } = 5000;

    /// <summary>
    /// Enable COV (Change of Value) subscriptions
    /// </summary>
    public bool EnableCovSubscriptions { get; init; } = true;

    /// <summary>
    /// BACnet object mappings
    /// </summary>
    public List<BACnetObjectMapping> ObjectMappings { get; init; } = new();
}

/// <summary>
/// BACnet object mapping configuration
/// </summary>
public class BACnetObjectMapping
{
    /// <summary>
    /// Unique identifier for this mapping
    /// </summary>
    public string Id { get; init; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// BACnet object type
    /// </summary>
    public BACnetObjectType ObjectType { get; init; } = BACnetObjectType.AnalogInput;

    /// <summary>
    /// Object instance number
    /// </summary>
    public uint ObjectInstance { get; init; }

    /// <summary>
    /// Property to read (default: Present Value)
    /// </summary>
    public BACnetPropertyId PropertyId { get; init; } = BACnetPropertyId.PresentValue;

    /// <summary>
    /// Enable COV subscription for this object
    /// </summary>
    public bool EnableCov { get; init; } = true;

    /// <summary>
    /// COV increment (minimum change to trigger notification)
    /// </summary>
    public float? CovIncrement { get; init; }

    /// <summary>
    /// Engineering unit
    /// </summary>
    public string? Unit { get; init; }

    /// <summary>
    /// Schema ID to map data to
    /// </summary>
    public string? SchemaId { get; init; }
}

/// <summary>
/// BACnet object types
/// </summary>
public enum BACnetObjectType
{
    AnalogInput,
    AnalogOutput,
    AnalogValue,
    BinaryInput,
    BinaryOutput,
    BinaryValue,
    MultiStateInput,
    MultiStateOutput,
    MultiStateValue,
    Schedule,
    TrendLog
}

/// <summary>
/// BACnet property identifiers
/// </summary>
public enum BACnetPropertyId
{
    PresentValue,
    StatusFlags,
    EventState,
    OutOfService,
    Units,
    Description,
    ObjectName,
    ReliabilityInfo
}

/// <summary>
/// EtherNet/IP connector configuration
/// </summary>
public class EtherNetIPConnectorConfiguration : ConnectorConfiguration
{
    public override ConnectorType Type => ConnectorType.EtherNetIP;

    /// <summary>
    /// PLC IP address
    /// </summary>
    public string Host { get; init; } = string.Empty;

    /// <summary>
    /// EtherNet/IP port (default: 44818)
    /// </summary>
    public int Port { get; init; } = 44818;

    /// <summary>
    /// Slot number (for ControlLogix)
    /// </summary>
    public int Slot { get; init; } = 0;

    /// <summary>
    /// Processor type
    /// </summary>
    public EtherNetIPProcessorType ProcessorType { get; init; } = EtherNetIPProcessorType.ControlLogix;

    /// <summary>
    /// Polling interval in milliseconds
    /// </summary>
    public int PollingIntervalMs { get; init; } = 1000;

    /// <summary>
    /// Request timeout in milliseconds
    /// </summary>
    public int RequestTimeoutMs { get; init; } = 5000;

    /// <summary>
    /// Tag mappings to poll
    /// </summary>
    public List<EtherNetIPTagMapping> TagMappings { get; init; } = new();
}

/// <summary>
/// EtherNet/IP processor types
/// </summary>
public enum EtherNetIPProcessorType
{
    ControlLogix,
    CompactLogix,
    Micro800,
    SLC500,
    PLC5,
    MicroLogix
}

/// <summary>
/// EtherNet/IP tag mapping configuration
/// </summary>
public class EtherNetIPTagMapping
{
    /// <summary>
    /// Unique identifier for this mapping
    /// </summary>
    public string Id { get; init; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// PLC tag name
    /// </summary>
    public string TagName { get; init; } = string.Empty;

    /// <summary>
    /// Data type
    /// </summary>
    public EtherNetIPDataType DataType { get; init; } = EtherNetIPDataType.DINT;

    /// <summary>
    /// Array element count (1 for scalar)
    /// </summary>
    public int ArrayLength { get; init; } = 1;

    /// <summary>
    /// Scale factor to apply to raw value
    /// </summary>
    public double ScaleFactor { get; init; } = 1.0;

    /// <summary>
    /// Engineering unit
    /// </summary>
    public string? Unit { get; init; }

    /// <summary>
    /// Schema ID to map data to
    /// </summary>
    public string? SchemaId { get; init; }
}

/// <summary>
/// EtherNet/IP data types
/// </summary>
public enum EtherNetIPDataType
{
    BOOL,
    SINT,
    INT,
    DINT,
    LINT,
    USINT,
    UINT,
    UDINT,
    ULINT,
    REAL,
    LREAL,
    STRING
}

/// <summary>
/// External MQTT broker connector configuration
/// </summary>
public class ExternalMqttConnectorConfiguration : ConnectorConfiguration
{
    public override ConnectorType Type => ConnectorType.ExternalMqtt;

    /// <summary>
    /// MQTT broker host
    /// </summary>
    public string Host { get; init; } = string.Empty;

    /// <summary>
    /// MQTT broker port (default: 1883 or 8883 for TLS)
    /// </summary>
    public int Port { get; init; } = 1883;

    /// <summary>
    /// Client ID for MQTT connection
    /// </summary>
    public string? ClientId { get; init; }

    /// <summary>
    /// Username for authentication
    /// </summary>
    public string? Username { get; init; }

    /// <summary>
    /// Password for authentication
    /// </summary>
    public string? Password { get; init; }

    /// <summary>
    /// Enable TLS/SSL
    /// </summary>
    public bool UseTls { get; init; } = false;

    /// <summary>
    /// Skip TLS certificate validation (for self-signed certs)
    /// </summary>
    public bool SkipCertificateValidation { get; init; } = false;

    /// <summary>
    /// CA certificate path
    /// </summary>
    public string? CaCertificatePath { get; init; }

    /// <summary>
    /// Client certificate path
    /// </summary>
    public string? ClientCertificatePath { get; init; }

    /// <summary>
    /// Client private key path
    /// </summary>
    public string? ClientPrivateKeyPath { get; init; }

    /// <summary>
    /// Keep-alive interval in seconds
    /// </summary>
    public int KeepAliveSeconds { get; init; } = 60;

    /// <summary>
    /// Clean session flag
    /// </summary>
    public bool CleanSession { get; init; } = true;

    /// <summary>
    /// Topic subscriptions
    /// </summary>
    public List<MqttTopicSubscription> TopicSubscriptions { get; init; } = new();
}

/// <summary>
/// MQTT topic subscription configuration
/// </summary>
public class MqttTopicSubscription
{
    /// <summary>
    /// Unique identifier for this subscription
    /// </summary>
    public string Id { get; init; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// MQTT topic filter (supports wildcards + and #)
    /// </summary>
    public string TopicFilter { get; init; } = string.Empty;

    /// <summary>
    /// QoS level (0, 1, or 2)
    /// </summary>
    public int QosLevel { get; init; } = 1;

    /// <summary>
    /// Payload format
    /// </summary>
    public MqttPayloadFormat PayloadFormat { get; init; } = MqttPayloadFormat.Json;

    /// <summary>
    /// JSON path or expression to extract device ID from payload
    /// </summary>
    public string? DeviceIdPath { get; init; }

    /// <summary>
    /// JSON path or expression to extract timestamp from payload
    /// </summary>
    public string? TimestampPath { get; init; }

    /// <summary>
    /// Schema ID to validate and map data
    /// </summary>
    public string? SchemaId { get; init; }
}

/// <summary>
/// MQTT payload formats
/// </summary>
public enum MqttPayloadFormat
{
    Json,
    Binary,
    String,
    Avro,
    Protobuf
}
