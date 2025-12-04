namespace Sensormine.Connectors.Tests;

using FluentAssertions;
using Sensormine.Connectors.Abstractions;
using Sensormine.Connectors.Models;
using Xunit;

/// <summary>
/// Unit tests for connector configuration models
/// </summary>
public class ConfigurationTests
{
    [Fact]
    public void OpcUaConnectorConfiguration_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var config = new OpcUaConnectorConfiguration();

        // Assert
        config.Type.Should().Be(ConnectorType.OpcUa);
        config.SecurityMode.Should().Be(OpcUaSecurityMode.None);
        config.SessionTimeoutMs.Should().Be(60000);
        config.PublishingIntervalMs.Should().Be(1000);
        config.KeepAliveIntervalMs.Should().Be(5000);
        config.Enabled.Should().BeTrue();
        config.AutoReconnect.Should().BeTrue();
    }

    [Fact]
    public void ModbusTcpConnectorConfiguration_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var config = new ModbusTcpConnectorConfiguration();

        // Assert
        config.Type.Should().Be(ConnectorType.ModbusTcp);
        config.Host.Should().Be("localhost");
        config.Port.Should().Be(502);
        config.UnitId.Should().Be(1);
        config.PollingIntervalMs.Should().Be(1000);
    }

    [Fact]
    public void ModbusRtuConnectorConfiguration_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var config = new ModbusRtuConnectorConfiguration();

        // Assert
        config.Type.Should().Be(ConnectorType.ModbusRtu);
        config.BaudRate.Should().Be(9600);
        config.DataBits.Should().Be(8);
        config.Parity.Should().Be(ModbusParity.None);
        config.StopBits.Should().Be(ModbusStopBits.One);
    }

    [Fact]
    public void BACnetConnectorConfiguration_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var config = new BACnetConnectorConfiguration();

        // Assert
        config.Type.Should().Be(ConnectorType.BACnet);
        config.LocalPort.Should().Be(47808);
        config.LocalDeviceInstance.Should().Be(1234);
        config.EnableDiscovery.Should().BeTrue();
        config.EnableCovSubscriptions.Should().BeTrue();
        config.PollingIntervalMs.Should().Be(5000);
    }

    [Fact]
    public void EtherNetIPConnectorConfiguration_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var config = new EtherNetIPConnectorConfiguration();

        // Assert
        config.Type.Should().Be(ConnectorType.EtherNetIP);
        config.Port.Should().Be(44818);
        config.Slot.Should().Be(0);
        config.ProcessorType.Should().Be(EtherNetIPProcessorType.ControlLogix);
        config.PollingIntervalMs.Should().Be(1000);
        config.RequestTimeoutMs.Should().Be(5000);
    }

    [Fact]
    public void ExternalMqttConnectorConfiguration_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var config = new ExternalMqttConnectorConfiguration();

        // Assert
        config.Type.Should().Be(ConnectorType.ExternalMqtt);
        config.Port.Should().Be(1883);
        config.UseTls.Should().BeFalse();
        config.SkipCertificateValidation.Should().BeFalse();
        config.KeepAliveSeconds.Should().Be(60);
        config.CleanSession.Should().BeTrue();
    }

    [Fact]
    public void ModbusRegisterMapping_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var mapping = new ModbusRegisterMapping();

        // Assert
        mapping.RegisterType.Should().Be(ModbusRegisterType.HoldingRegister);
        mapping.Count.Should().Be(1);
        mapping.DataType.Should().Be(ModbusDataType.Int16);
        mapping.ByteOrder.Should().Be(ModbusByteOrder.BigEndian);
        mapping.ScaleFactor.Should().Be(1.0);
        mapping.Offset.Should().Be(0.0);
    }

    [Fact]
    public void BACnetObjectMapping_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var mapping = new BACnetObjectMapping();

        // Assert
        mapping.ObjectType.Should().Be(BACnetObjectType.AnalogInput);
        mapping.PropertyId.Should().Be(BACnetPropertyId.PresentValue);
        mapping.EnableCov.Should().BeTrue();
    }

    [Fact]
    public void MqttTopicSubscription_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var subscription = new MqttTopicSubscription();

        // Assert
        subscription.QosLevel.Should().Be(1);
        subscription.PayloadFormat.Should().Be(MqttPayloadFormat.Json);
    }
}

/// <summary>
/// Unit tests for data models
/// </summary>
public class DataModelTests
{
    [Fact]
    public void DataPoint_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var dataPoint = new DataPoint();

        // Assert
        dataPoint.DataType.Should().Be(DataPointType.Unknown);
        dataPoint.Quality.Should().Be(DataQuality.Good);
        dataPoint.ReceivedTimestamp.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void BrowseItem_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var browseItem = new BrowseItem();

        // Assert
        browseItem.ItemType.Should().Be(BrowseItemType.Object);
        browseItem.IsReadable.Should().BeFalse();
        browseItem.IsWritable.Should().BeFalse();
        browseItem.HasChildren.Should().BeFalse();
    }

    [Fact]
    public void SubscriptionItem_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var subscription = new SubscriptionItem();

        // Assert
        subscription.SamplingIntervalMs.Should().Be(1000);
        subscription.QueueSize.Should().Be(10);
        subscription.DiscardOldest.Should().BeTrue();
        subscription.Id.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void ConnectorHealthStatus_CanBeCreated()
    {
        // Arrange & Act
        var status = new ConnectorHealthStatus
        {
            Status = ConnectionStatus.Connected,
            IsHealthy = true,
            Message = "Connected and healthy",
            SuccessfulReads = 100,
            FailedReads = 2,
            AverageLatencyMs = 50.5
        };

        // Assert
        status.Status.Should().Be(ConnectionStatus.Connected);
        status.IsHealthy.Should().BeTrue();
        status.Message.Should().Be("Connected and healthy");
        status.SuccessfulReads.Should().Be(100);
        status.FailedReads.Should().Be(2);
        status.AverageLatencyMs.Should().Be(50.5);
    }
}
