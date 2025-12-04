# Sensormine.Connectors

Industrial and IoT Protocol Connectors Library for the Sensormine Platform.

## Overview

This library provides connectors for integrating with various industrial protocols and IoT systems. Each connector implements common abstractions that enable consistent data collection, health monitoring, and management across different protocols.

## Supported Protocols

| Protocol | Connector | Description | Story |
|----------|-----------|-------------|-------|
| **OPC UA** | `OpcUaConnector` | Integration with SCADA and PLC systems | Story 7.1 |
| **Modbus TCP** | `ModbusTcpConnector` | PLCs and industrial sensors via TCP/IP | Story 7.2 |
| **Modbus RTU** | `ModbusRtuConnector` | PLCs and sensors via serial communication | Story 7.2 |
| **BACnet/IP** | `BACnetConnector` | Building automation systems (HVAC, etc.) | Story 7.3 |
| **EtherNet/IP** | `EtherNetIPConnector` | Allen-Bradley/Rockwell PLCs | Story 7.4 |
| **External MQTT** | `ExternalMqttConnector` | Third-party IoT MQTT brokers | Story 7.5 |

## Installation

The connectors library is part of the Sensormine Platform shared libraries. Reference it in your project:

```xml
<ProjectReference Include="..\Shared\Sensormine.Connectors\Sensormine.Connectors.csproj" />
```

## Quick Start

### 1. Register Services

```csharp
// In Program.cs or Startup.cs
services.AddSensormineConnectors();

// Or with hosted service for automatic lifecycle management
services.AddSensormineConnectorsWithHosting();
```

### 2. Create a Connector

```csharp
// Using the factory
var factory = serviceProvider.GetRequiredService<IConnectorFactory>();

var config = new ModbusTcpConnectorConfiguration
{
    Name = "PLC1",
    TenantId = "tenant-001",
    Host = "192.168.1.100",
    Port = 502,
    UnitId = 1,
    PollingIntervalMs = 1000,
    RegisterMappings = new List<ModbusRegisterMapping>
    {
        new ModbusRegisterMapping
        {
            Name = "Temperature",
            Address = 0,
            RegisterType = ModbusRegisterType.HoldingRegister,
            DataType = ModbusDataType.Int16,
            ScaleFactor = 0.1,
            Unit = "°C"
        }
    }
};

var connector = factory.CreateConnector(config);
```

### 3. Connect and Poll Data

```csharp
// Connect
await connector.ConnectAsync();

// For polling connectors
if (connector is IPollingConnector pollingConnector)
{
    pollingConnector.DataReceived += (sender, args) =>
    {
        foreach (var dataPoint in args.DataPoints)
        {
            Console.WriteLine($"{dataPoint.Name}: {dataPoint.Value} {dataPoint.Unit}");
        }
    };

    await pollingConnector.StartPollingAsync();
}
```

### 4. Use the Connector Manager

```csharp
var manager = serviceProvider.GetRequiredService<IConnectorManager>();

// Register multiple connectors
await manager.RegisterConnectorAsync(modbusConfig);
await manager.RegisterConnectorAsync(opcuaConfig);

// Subscribe to all data
manager.DataReceived += (sender, args) =>
{
    // Process data from any connector
};

// Start all connectors
await manager.StartAllAsync();
```

## Connector Configurations

### OPC UA Configuration

```csharp
var config = new OpcUaConnectorConfiguration
{
    Name = "SCADA Server",
    EndpointUrl = "opc.tcp://server:4840",
    SecurityMode = OpcUaSecurityMode.SignAndEncrypt,
    Username = "user",
    Password = "password",
    Subscriptions = new List<SubscriptionItem>
    {
        new SubscriptionItem
        {
            NodeId = "ns=2;s=Tag1",
            Name = "Temperature",
            SamplingIntervalMs = 500
        }
    }
};
```

### BACnet Configuration

```csharp
var config = new BACnetConnectorConfiguration
{
    Name = "HVAC Controller",
    LocalPort = 47808,
    TargetAddress = "192.168.1.50",
    TargetDeviceInstance = 123,
    EnableCovSubscriptions = true,
    ObjectMappings = new List<BACnetObjectMapping>
    {
        new BACnetObjectMapping
        {
            Name = "Zone Temp",
            ObjectType = BACnetObjectType.AnalogInput,
            ObjectInstance = 1,
            PropertyId = BACnetPropertyId.PresentValue,
            EnableCov = true
        }
    }
};
```

### EtherNet/IP Configuration

```csharp
var config = new EtherNetIPConnectorConfiguration
{
    Name = "Allen-Bradley PLC",
    Host = "192.168.1.10",
    Port = 44818,
    Slot = 0,
    ProcessorType = EtherNetIPProcessorType.ControlLogix,
    TagMappings = new List<EtherNetIPTagMapping>
    {
        new EtherNetIPTagMapping
        {
            Name = "Motor Speed",
            TagName = "Motor1_Speed",
            DataType = EtherNetIPDataType.REAL,
            Unit = "RPM"
        }
    }
};
```

### External MQTT Configuration

```csharp
var config = new ExternalMqttConnectorConfiguration
{
    Name = "AWS IoT Core",
    Host = "xxxxx.iot.us-east-1.amazonaws.com",
    Port = 8883,
    UseTls = true,
    ClientCertificatePath = "/certs/device.crt",
    ClientPrivateKeyPath = "/certs/device.key",
    TopicSubscriptions = new List<MqttTopicSubscription>
    {
        new MqttTopicSubscription
        {
            TopicFilter = "sensors/+/telemetry",
            PayloadFormat = MqttPayloadFormat.Json,
            DeviceIdPath = "deviceId",
            TimestampPath = "timestamp"
        }
    }
};
```

## Abstractions

### IConnector

Base interface for all connectors:

```csharp
public interface IConnector : IAsyncDisposable
{
    Guid Id { get; }
    string Name { get; }
    ConnectorType Type { get; }
    ConnectionStatus Status { get; }
    string TenantId { get; }
    bool IsConnected { get; }
    
    Task ConnectAsync(CancellationToken cancellationToken = default);
    Task DisconnectAsync(CancellationToken cancellationToken = default);
    Task<ConnectorHealthStatus> GetHealthStatusAsync(CancellationToken cancellationToken = default);
}
```

### IPollingConnector

For connectors that poll data at regular intervals:

```csharp
public interface IPollingConnector : IConnector
{
    Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default);
    Task StartPollingAsync(CancellationToken cancellationToken = default);
    Task StopPollingAsync(CancellationToken cancellationToken = default);
    bool IsPolling { get; }
    event EventHandler<DataReceivedEventArgs>? DataReceived;
}
```

### ISubscriptionConnector

For connectors that support subscriptions/notifications:

```csharp
public interface ISubscriptionConnector : IConnector
{
    Task SubscribeAsync(IEnumerable<SubscriptionItem> items, CancellationToken cancellationToken = default);
    Task UnsubscribeAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default);
    IReadOnlyList<SubscriptionItem> GetSubscriptions();
    event EventHandler<DataReceivedEventArgs>? DataReceived;
}
```

### IBrowsableConnector

For connectors that support browsing their address space:

```csharp
public interface IBrowsableConnector : IConnector
{
    Task<IReadOnlyList<BrowseItem>> BrowseRootAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BrowseItem>> BrowseAsync(string nodeId, CancellationToken cancellationToken = default);
    Task<DataPoint?> ReadValueAsync(string nodeId, CancellationToken cancellationToken = default);
}
```

## Data Models

### DataPoint

```csharp
public class DataPoint
{
    public string SourceId { get; init; }      // Connector ID
    public string TagId { get; init; }          // Tag/node identifier
    public string Name { get; init; }           // Human-readable name
    public object? Value { get; init; }         // The value
    public DataPointType DataType { get; init; } // Type (Int16, Float, etc.)
    public DataQuality Quality { get; init; }   // Good, Bad, Uncertain
    public DateTimeOffset SourceTimestamp { get; init; }
    public string? Unit { get; init; }          // Engineering unit
}
```

### ConnectorHealthStatus

```csharp
public class ConnectorHealthStatus
{
    public ConnectionStatus Status { get; init; }
    public bool IsHealthy { get; init; }
    public string Message { get; init; }
    public long SuccessfulReads { get; init; }
    public long FailedReads { get; init; }
    public double AverageLatencyMs { get; init; }
    public string? LastError { get; init; }
}
```

## Dependencies

- **OPCFoundation.NetStandard.Opc.Ua** - OPC UA client implementation
- **FluentModbus** - Modbus TCP/RTU client
- **MQTTnet** - MQTT client with managed connection support

## Testing

Run the unit tests:

```bash
dotnet test tests/Sensormine.Connectors.Tests/
```

## User Stories Implemented

| Story | Title | Status |
|-------|-------|--------|
| 7.1 | OPC UA Client Configuration | ✅ Complete |
| 7.2 | Modbus Connector | ✅ Complete |
| 7.3 | BACnet Integration | ✅ Complete |
| 7.4 | EtherNet/IP Connector | ✅ Complete |
| 7.5 | External MQTT Broker Integration | ✅ Complete |

## License

Part of the Sensormine Platform v5.
