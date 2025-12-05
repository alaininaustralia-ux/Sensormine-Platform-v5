using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;
using Sensormine.Storage.Repositories;

namespace Sensormine.Storage.Tests;

public class DeviceTypeRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly DeviceTypeRepository _repository;
    private readonly Guid _testTenantId = Guid.NewGuid();
    private readonly Guid _otherTenantId = Guid.NewGuid();

    public DeviceTypeRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new DeviceTypeRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ShouldCreateDeviceType_WithValidData()
    {
        // Arrange
        var deviceType = new DeviceType
        {
            TenantId = _testTenantId,
            Name = "Temperature Sensor",
            Description = "Industrial temperature monitoring device",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig
            {
                Mqtt = new MqttConfig
                {
                    Broker = "mqtt://localhost:1883",
                    Topic = "sensors/temp",
                    Qos = 1
                }
            },
            CustomFields = new List<CustomFieldDefinition>
            {
                new CustomFieldDefinition
                {
                    Name = "location",
                    Label = "Location",
                    Type = CustomFieldType.Text,
                    Required = true
                }
            },
            Tags = new List<string> { "temperature", "industrial" },
            CreatedBy = "admin@test.com"
        };

        // Act
        var result = await _repository.CreateAsync(deviceType);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("Temperature Sensor");
        result.TenantId.Should().Be(_testTenantId);
        result.Protocol.Should().Be(DeviceProtocol.MQTT);
        result.ProtocolConfig.Should().NotBeNull();
        result.ProtocolConfig.Mqtt.Should().NotBeNull();
        result.ProtocolConfig.Mqtt!.Broker.Should().Be("mqtt://localhost:1883");
        result.CustomFields.Should().HaveCount(1);
        result.Tags.Should().Contain("temperature");
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowException_WhenDeviceTypeIsNull()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.CreateAsync(null!));
    }

    [Fact]
    public async Task CreateAsync_ShouldSetDefaultValues_WhenNotProvided()
    {
        // Arrange
        var deviceType = new DeviceType
        {
            TenantId = _testTenantId,
            Name = "Basic Device",
            Protocol = DeviceProtocol.HTTP,
            ProtocolConfig = new ProtocolConfig
            {
                Http = new HttpConfig
                {
                    Endpoint = "https://api.example.com",
                    Method = "POST"
                }
            }
        };

        // Act
        var result = await _repository.CreateAsync(deviceType);

        // Assert
        result.IsActive.Should().BeTrue();
        result.CustomFields.Should().NotBeNull();
        result.AlertTemplates.Should().NotBeNull();
        result.Tags.Should().NotBeNull();
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ShouldReturnDeviceType_WhenExists()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Pressure Sensor");

        // Act
        var result = await _repository.GetByIdAsync(deviceType.Id, _testTenantId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(deviceType.Id);
        result.Name.Should().Be("Pressure Sensor");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetByIdAsync(Guid.NewGuid(), _testTenantId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenDifferentTenant()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Flow Meter");

        // Act
        var result = await _repository.GetByIdAsync(deviceType.Id, _otherTenantId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenInactive()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Inactive Device");
        deviceType.IsActive = false;
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(deviceType.Id, _testTenantId);

        // Assert
        result.Should().BeNull(); // Query filter excludes inactive
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllDeviceTypes_ForTenant()
    {
        // Arrange
        await CreateTestDeviceType("Device 1");
        await CreateTestDeviceType("Device 2");
        await CreateTestDeviceType("Device 3");
        
        // Create device for different tenant (should not be returned)
        await CreateTestDeviceType("Other Tenant Device", _otherTenantId);

        // Act
        var (items, totalCount) = await _repository.GetAllAsync(_testTenantId);

        // Assert
        items.Should().HaveCount(3);
        totalCount.Should().Be(3);
        items.Should().AllSatisfy(dt => dt.TenantId.Should().Be(_testTenantId));
    }

    [Fact]
    public async Task GetAllAsync_ShouldSupportPagination()
    {
        // Arrange
        for (int i = 1; i <= 25; i++)
        {
            await CreateTestDeviceType($"Device {i}");
        }

        // Act - Get page 2 with 10 items
        var (items, totalCount) = await _repository.GetAllAsync(_testTenantId, page: 2, pageSize: 10);

        // Assert
        items.Should().HaveCount(10);
        totalCount.Should().Be(25);
    }

    [Fact]
    public async Task GetAllAsync_ShouldExcludeInactiveDeviceTypes()
    {
        // Arrange
        await CreateTestDeviceType("Active 1");
        var inactive = await CreateTestDeviceType("Inactive 1");
        await CreateTestDeviceType("Active 2");
        
        inactive.IsActive = false;
        await _context.SaveChangesAsync();

        // Act
        var (items, totalCount) = await _repository.GetAllAsync(_testTenantId);

        // Assert
        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
        items.Should().NotContain(dt => dt.Name == "Inactive 1");
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ShouldUpdateDeviceType_WithValidData()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Original Name");
        var originalCreatedAt = deviceType.CreatedAt;

        deviceType.Name = "Updated Name";
        deviceType.Description = "Updated description";
        deviceType.Tags.Add("updated");

        // Act
        var result = await _repository.UpdateAsync(deviceType);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Updated Name");
        result.Description.Should().Be("Updated description");
        result.Tags.Should().Contain("updated");
        result.UpdatedAt.Should().BeAfter(originalCreatedAt);
        result.CreatedAt.Should().Be(originalCreatedAt); // Should not change
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrowException_WhenDeviceTypeIsNull()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.UpdateAsync(null!));
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateProtocolConfig()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("HTTP Device");
        
        deviceType.Protocol = DeviceProtocol.WebSocket;
        deviceType.ProtocolConfig = new ProtocolConfig
        {
            WebSocket = new WebSocketConfig
            {
                Url = "wss://example.com",
                ReconnectIntervalSeconds = 10
            }
        };

        // Act
        var result = await _repository.UpdateAsync(deviceType);

        // Assert
        result.Protocol.Should().Be(DeviceProtocol.WebSocket);
        result.ProtocolConfig.WebSocket.Should().NotBeNull();
        result.ProtocolConfig.WebSocket!.Url.Should().Be("wss://example.com");
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ShouldSoftDeleteDeviceType()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("To Delete");

        // Act
        var result = await _repository.DeleteAsync(deviceType.Id, _testTenantId);

        // Assert
        result.Should().BeTrue();

        // Verify soft delete
        var deleted = await _repository.GetByIdAsync(deviceType.Id, _testTenantId);
        deleted.Should().BeNull(); // Query filter excludes inactive

        // Verify still in database but inactive
        var dbEntry = await _context.DeviceTypes.IgnoreQueryFilters()
            .FirstOrDefaultAsync(dt => dt.Id == deviceType.Id);
        dbEntry.Should().NotBeNull();
        dbEntry!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Act
        var result = await _repository.DeleteAsync(Guid.NewGuid(), _testTenantId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenDifferentTenant()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Cannot Delete");

        // Act
        var result = await _repository.DeleteAsync(deviceType.Id, _otherTenantId);

        // Assert
        result.Should().BeFalse();
        
        // Verify not deleted
        var stillExists = await _repository.GetByIdAsync(deviceType.Id, _testTenantId);
        stillExists.Should().NotBeNull();
    }

    #endregion

    #region ExistsAsync Tests

    [Fact]
    public async Task ExistsAsync_ShouldReturnTrue_WhenDeviceTypeExists()
    {
        // Arrange
        await CreateTestDeviceType("Existing Device");

        // Act
        var result = await _repository.ExistsAsync("Existing Device", _testTenantId);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_ShouldReturnFalse_WhenDeviceTypeDoesNotExist()
    {
        // Act
        var result = await _repository.ExistsAsync("Non-Existent Device", _testTenantId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsAsync_ShouldReturnFalse_WhenDifferentTenant()
    {
        // Arrange
        await CreateTestDeviceType("Tenant Specific");

        // Act
        var result = await _repository.ExistsAsync("Tenant Specific", _otherTenantId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsAsync_ShouldExcludeSpecifiedId_WhenProvided()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Update Check");

        // Act - Should return false when excluding the existing device's ID
        var result = await _repository.ExistsAsync("Update Check", _testTenantId, deviceType.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsAsync_ShouldIgnoreInactiveDeviceTypes()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Inactive Check");
        deviceType.IsActive = false;
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.ExistsAsync("Inactive Check", _testTenantId);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region SearchAsync Tests

    [Fact]
    public async Task SearchAsync_ShouldFindBySearchTerm()
    {
        // Arrange
        await CreateTestDeviceType("Temperature Sensor");
        await CreateTestDeviceType("Pressure Sensor");
        await CreateTestDeviceType("Flow Meter");

        // Act
        var (items, totalCount) = await _repository.SearchAsync(_testTenantId, searchTerm: "Sensor");

        // Assert
        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
        items.Should().AllSatisfy(dt => dt.Name.Should().Contain("Sensor"));
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByProtocol()
    {
        // Arrange
        var mqtt1 = await CreateTestDeviceType("MQTT Device 1");
        mqtt1.Protocol = DeviceProtocol.MQTT;
        await _context.SaveChangesAsync();

        var http1 = await CreateTestDeviceType("HTTP Device 1");
        http1.Protocol = DeviceProtocol.HTTP;
        await _context.SaveChangesAsync();

        var mqtt2 = await CreateTestDeviceType("MQTT Device 2");
        mqtt2.Protocol = DeviceProtocol.MQTT;
        await _context.SaveChangesAsync();

        // Act
        var (items, totalCount) = await _repository.SearchAsync(
            _testTenantId, 
            protocol: DeviceProtocol.MQTT);

        // Assert
        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
        items.Should().AllSatisfy(dt => dt.Protocol.Should().Be(DeviceProtocol.MQTT));
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByTags()
    {
        // Arrange
        var device1 = await CreateTestDeviceType("Device 1");
        device1.Tags = new List<string> { "industrial", "temperature" };
        await _context.SaveChangesAsync();

        var device2 = await CreateTestDeviceType("Device 2");
        device2.Tags = new List<string> { "industrial", "pressure" };
        await _context.SaveChangesAsync();

        var device3 = await CreateTestDeviceType("Device 3");
        device3.Tags = new List<string> { "consumer" };
        await _context.SaveChangesAsync();

        // Act
        var (items, totalCount) = await _repository.SearchAsync(
            _testTenantId,
            tags: new List<string> { "industrial" });

        // Assert
        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
        items.Should().AllSatisfy(dt => dt.Tags.Should().Contain("industrial"));
    }

    [Fact]
    public async Task SearchAsync_ShouldCombineMultipleFilters()
    {
        // Arrange
        var device1 = await CreateTestDeviceType("Temperature Sensor A");
        device1.Protocol = DeviceProtocol.MQTT;
        device1.Tags = new List<string> { "industrial" };
        await _context.SaveChangesAsync();

        var device2 = await CreateTestDeviceType("Temperature Sensor B");
        device2.Protocol = DeviceProtocol.HTTP;
        device2.Tags = new List<string> { "industrial" };
        await _context.SaveChangesAsync();

        var device3 = await CreateTestDeviceType("Pressure Sensor");
        device3.Protocol = DeviceProtocol.MQTT;
        device3.Tags = new List<string> { "industrial" };
        await _context.SaveChangesAsync();

        // Act
        var (items, totalCount) = await _repository.SearchAsync(
            _testTenantId,
            searchTerm: "Temperature",
            protocol: DeviceProtocol.MQTT,
            tags: new List<string> { "industrial" });

        // Assert
        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
        items.First().Name.Should().Be("Temperature Sensor A");
    }

    [Fact]
    public async Task SearchAsync_ShouldSupportPagination()
    {
        // Arrange
        for (int i = 1; i <= 15; i++)
        {
            await CreateTestDeviceType($"Sensor {i}");
        }

        // Act
        var (items, totalCount) = await _repository.SearchAsync(
            _testTenantId,
            searchTerm: "Sensor",
            page: 2,
            pageSize: 5);

        // Assert
        items.Should().HaveCount(5);
        totalCount.Should().Be(15);
    }

    #endregion

    #region Helper Methods

    private async Task<DeviceType> CreateTestDeviceType(string name, Guid? tenantId = null)
    {
        var deviceType = new DeviceType
        {
            TenantId = tenantId ?? _testTenantId,
            Name = name,
            Description = $"Description for {name}",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig
            {
                Mqtt = new MqttConfig
                {
                    Broker = "mqtt://localhost:1883",
                    Topic = $"devices/{name.ToLower().Replace(" ", "_")}",
                    Qos = 1
                }
            },
            CustomFields = new List<CustomFieldDefinition>(),
            AlertTemplates = new List<AlertRuleTemplate>(),
            Tags = new List<string> { "test" },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return await _repository.CreateAsync(deviceType);
    }

    #endregion
}
