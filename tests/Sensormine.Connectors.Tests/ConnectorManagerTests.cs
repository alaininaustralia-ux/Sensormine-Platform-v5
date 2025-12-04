namespace Sensormine.Connectors.Tests;

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Sensormine.Connectors.Abstractions;
using Xunit;

/// <summary>
/// Unit tests for connector manager
/// </summary>
public class ConnectorManagerTests
{
    private readonly Mock<IConnectorFactory> _factoryMock;
    private readonly Mock<ILogger<ConnectorManager>> _loggerMock;
    private readonly ConnectorManager _manager;

    public ConnectorManagerTests()
    {
        _factoryMock = new Mock<IConnectorFactory>();
        _loggerMock = new Mock<ILogger<ConnectorManager>>();
        _manager = new ConnectorManager(_factoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task RegisterConnectorAsync_AddsConnectorToManager()
    {
        // Arrange
        var config = new ModbusTcpConnectorConfiguration
        {
            Name = "Test Connector",
            TenantId = "tenant-1"
        };

        var connectorMock = new Mock<IConnector>();
        connectorMock.Setup(c => c.Id).Returns(config.Id);
        connectorMock.Setup(c => c.Name).Returns(config.Name);
        connectorMock.Setup(c => c.TenantId).Returns(config.TenantId);
        connectorMock.Setup(c => c.Type).Returns(ConnectorType.ModbusTcp);

        _factoryMock.Setup(f => f.CreateConnector(config)).Returns(connectorMock.Object);

        // Act
        var connector = await _manager.RegisterConnectorAsync(config);

        // Assert
        connector.Should().NotBeNull();
        _manager.GetAllConnectors().Should().HaveCount(1);
        _manager.GetConnector(config.Id).Should().Be(connector);
    }

    [Fact]
    public async Task GetConnectorsByType_ReturnsMatchingConnectors()
    {
        // Arrange
        var modbusConfig = new ModbusTcpConnectorConfiguration { Name = "Modbus", TenantId = "tenant-1" };
        var opcuaConfig = new OpcUaConnectorConfiguration { Name = "OPC UA", TenantId = "tenant-1", EndpointUrl = "opc.tcp://test" };

        var modbusMock = CreateConnectorMock(modbusConfig.Id, "Modbus", "tenant-1", ConnectorType.ModbusTcp);
        var opcuaMock = CreateConnectorMock(opcuaConfig.Id, "OPC UA", "tenant-1", ConnectorType.OpcUa);

        _factoryMock.Setup(f => f.CreateConnector(modbusConfig)).Returns(modbusMock.Object);
        _factoryMock.Setup(f => f.CreateConnector(opcuaConfig)).Returns(opcuaMock.Object);

        await _manager.RegisterConnectorAsync(modbusConfig);
        await _manager.RegisterConnectorAsync(opcuaConfig);

        // Act
        var modbusConnectors = _manager.GetConnectorsByType(ConnectorType.ModbusTcp);
        var opcuaConnectors = _manager.GetConnectorsByType(ConnectorType.OpcUa);

        // Assert
        modbusConnectors.Should().HaveCount(1);
        opcuaConnectors.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetConnectorsByTenant_ReturnsMatchingConnectors()
    {
        // Arrange
        var config1 = new ModbusTcpConnectorConfiguration { Name = "Connector 1", TenantId = "tenant-1" };
        var config2 = new ModbusTcpConnectorConfiguration { Name = "Connector 2", TenantId = "tenant-2" };

        var connector1Mock = CreateConnectorMock(config1.Id, "Connector 1", "tenant-1", ConnectorType.ModbusTcp);
        var connector2Mock = CreateConnectorMock(config2.Id, "Connector 2", "tenant-2", ConnectorType.ModbusTcp);

        _factoryMock.Setup(f => f.CreateConnector(config1)).Returns(connector1Mock.Object);
        _factoryMock.Setup(f => f.CreateConnector(config2)).Returns(connector2Mock.Object);

        await _manager.RegisterConnectorAsync(config1);
        await _manager.RegisterConnectorAsync(config2);

        // Act
        var tenant1Connectors = _manager.GetConnectorsByTenant("tenant-1");
        var tenant2Connectors = _manager.GetConnectorsByTenant("tenant-2");

        // Assert
        tenant1Connectors.Should().HaveCount(1);
        tenant2Connectors.Should().HaveCount(1);
    }

    [Fact]
    public async Task RemoveConnectorAsync_RemovesConnectorFromManager()
    {
        // Arrange
        var config = new ModbusTcpConnectorConfiguration { Name = "Test", TenantId = "tenant-1" };
        var connectorMock = CreateConnectorMock(config.Id, "Test", "tenant-1", ConnectorType.ModbusTcp);
        _factoryMock.Setup(f => f.CreateConnector(config)).Returns(connectorMock.Object);

        await _manager.RegisterConnectorAsync(config);
        _manager.GetAllConnectors().Should().HaveCount(1);

        // Act
        await _manager.RemoveConnectorAsync(config.Id);

        // Assert
        _manager.GetAllConnectors().Should().BeEmpty();
        _manager.GetConnector(config.Id).Should().BeNull();
    }

    [Fact]
    public void GetConnector_NonExistentId_ReturnsNull()
    {
        // Act
        var connector = _manager.GetConnector(Guid.NewGuid());

        // Assert
        connector.Should().BeNull();
    }

    private static Mock<IConnector> CreateConnectorMock(Guid id, string name, string tenantId, ConnectorType type)
    {
        var mock = new Mock<IConnector>();
        mock.Setup(c => c.Id).Returns(id);
        mock.Setup(c => c.Name).Returns(name);
        mock.Setup(c => c.TenantId).Returns(tenantId);
        mock.Setup(c => c.Type).Returns(type);
        mock.Setup(c => c.DisposeAsync()).Returns(ValueTask.CompletedTask);
        mock.Setup(c => c.DisconnectAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return mock;
    }
}
