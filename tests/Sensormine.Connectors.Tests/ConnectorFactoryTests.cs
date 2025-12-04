namespace Sensormine.Connectors.Tests;

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Sensormine.Connectors.Abstractions;
using Xunit;

/// <summary>
/// Unit tests for connector factory
/// </summary>
public class ConnectorFactoryTests
{
    private readonly Mock<ILoggerFactory> _loggerFactoryMock;
    private readonly ConnectorFactory _factory;

    public ConnectorFactoryTests()
    {
        _loggerFactoryMock = new Mock<ILoggerFactory>();
        _loggerFactoryMock.Setup(x => x.CreateLogger(It.IsAny<string>()))
            .Returns(Mock.Of<ILogger>());
        _factory = new ConnectorFactory(_loggerFactoryMock.Object);
    }

    [Fact]
    public void GetSupportedTypes_ReturnsAllConnectorTypes()
    {
        // Act
        var types = _factory.GetSupportedTypes();

        // Assert
        types.Should().Contain(ConnectorType.OpcUa);
        types.Should().Contain(ConnectorType.ModbusTcp);
        types.Should().Contain(ConnectorType.ModbusRtu);
        types.Should().Contain(ConnectorType.BACnet);
        types.Should().Contain(ConnectorType.EtherNetIP);
        types.Should().Contain(ConnectorType.ExternalMqtt);
    }

    [Theory]
    [InlineData(ConnectorType.OpcUa)]
    [InlineData(ConnectorType.ModbusTcp)]
    [InlineData(ConnectorType.ModbusRtu)]
    [InlineData(ConnectorType.BACnet)]
    [InlineData(ConnectorType.EtherNetIP)]
    [InlineData(ConnectorType.ExternalMqtt)]
    public void IsSupported_ReturnsTrueForSupportedTypes(ConnectorType type)
    {
        // Act
        var isSupported = _factory.IsSupported(type);

        // Assert
        isSupported.Should().BeTrue();
    }

    [Fact]
    public void CreateConnector_OpcUa_CreatesOpcUaConnector()
    {
        // Arrange
        var config = new OpcUaConnectorConfiguration
        {
            Name = "Test OPC UA",
            TenantId = "tenant-1",
            EndpointUrl = "opc.tcp://localhost:4840"
        };

        // Act
        var connector = _factory.CreateConnector(config);

        // Assert
        connector.Should().NotBeNull();
        connector.Type.Should().Be(ConnectorType.OpcUa);
        connector.Name.Should().Be("Test OPC UA");
        connector.TenantId.Should().Be("tenant-1");
        connector.Status.Should().Be(ConnectionStatus.Disconnected);
    }

    [Fact]
    public void CreateConnector_ModbusTcp_CreatesModbusTcpConnector()
    {
        // Arrange
        var config = new ModbusTcpConnectorConfiguration
        {
            Name = "Test Modbus TCP",
            TenantId = "tenant-1",
            Host = "192.168.1.100",
            Port = 502,
            UnitId = 1
        };

        // Act
        var connector = _factory.CreateConnector(config);

        // Assert
        connector.Should().NotBeNull();
        connector.Type.Should().Be(ConnectorType.ModbusTcp);
        connector.Name.Should().Be("Test Modbus TCP");
    }

    [Fact]
    public void CreateConnector_BACnet_CreatesBACnetConnector()
    {
        // Arrange
        var config = new BACnetConnectorConfiguration
        {
            Name = "Test BACnet",
            TenantId = "tenant-1",
            LocalPort = 47808
        };

        // Act
        var connector = _factory.CreateConnector(config);

        // Assert
        connector.Should().NotBeNull();
        connector.Type.Should().Be(ConnectorType.BACnet);
    }

    [Fact]
    public void CreateConnector_EtherNetIP_CreatesEtherNetIPConnector()
    {
        // Arrange
        var config = new EtherNetIPConnectorConfiguration
        {
            Name = "Test EtherNet/IP",
            TenantId = "tenant-1",
            Host = "192.168.1.200",
            Port = 44818
        };

        // Act
        var connector = _factory.CreateConnector(config);

        // Assert
        connector.Should().NotBeNull();
        connector.Type.Should().Be(ConnectorType.EtherNetIP);
    }

    [Fact]
    public void CreateConnector_ExternalMqtt_CreatesExternalMqttConnector()
    {
        // Arrange
        var config = new ExternalMqttConnectorConfiguration
        {
            Name = "Test External MQTT",
            TenantId = "tenant-1",
            Host = "broker.example.com",
            Port = 1883
        };

        // Act
        var connector = _factory.CreateConnector(config);

        // Assert
        connector.Should().NotBeNull();
        connector.Type.Should().Be(ConnectorType.ExternalMqtt);
    }
}
