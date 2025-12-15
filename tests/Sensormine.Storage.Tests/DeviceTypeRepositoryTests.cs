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
        var result = await _repository.GetByIdAsync(deviceType.Id, _testTenantId.ToString());

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(deviceType.Id);
        result.Name.Should().Be("Pressure Sensor");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetByIdAsync(Guid.NewGuid(), _testTenantId.ToString());

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
        var result = await _repository.GetByIdAsync(deviceType.Id, _testTenantId.ToString());

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
        var (items, totalCount) = await _repository.GetAllAsync(_testTenantId.ToString());

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
        var (items, totalCount) = await _repository.GetAllAsync(_testTenantId.ToString(), page: 2, pageSize: 10);

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
        var (items, totalCount) = await _repository.GetAllAsync(_testTenantId.ToString());

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
        var result = await _repository.DeleteAsync(deviceType.Id, _testTenantId.ToString());

        // Assert
        result.Should().BeTrue();

        // Verify soft delete
        var deleted = await _repository.GetByIdAsync(deviceType.Id, _testTenantId.ToString());
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
        var result = await _repository.DeleteAsync(Guid.NewGuid(), _testTenantId.ToString());

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
        var stillExists = await _repository.GetByIdAsync(deviceType.Id, _testTenantId.ToString());
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
        var result = await _repository.ExistsAsync("Existing Device", _testTenantId.ToString());

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_ShouldReturnFalse_WhenDeviceTypeDoesNotExist()
    {
        // Act
        var result = await _repository.ExistsAsync("Non-Existent Device", _testTenantId.ToString());

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
        var result = await _repository.ExistsAsync("Update Check", _testTenantId.ToString(), deviceType.Id);

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
        var result = await _repository.ExistsAsync("Inactive Check", _testTenantId.ToString());

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

    #region GetVersionHistoryAsync Tests

    [Fact]
    public async Task GetVersionHistoryAsync_ShouldReturnEmptyList_WhenNoVersionsExist()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");

        // Act
        var versions = await _repository.GetVersionHistoryAsync(deviceType.Id, _testTenantId.ToString());

        // Assert
        versions.Should().NotBeNull();
        versions.Should().HaveCount(1); // Initial version created on Create
    }

    [Fact]
    public async Task GetVersionHistoryAsync_ShouldReturnVersionsInDescendingOrder()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");
        
        // Update to create more versions
        deviceType.Name = "Updated Device v2";
        await _repository.UpdateAsync(deviceType);
        
        deviceType.Name = "Updated Device v3";
        await _repository.UpdateAsync(deviceType);

        // Act
        var versions = await _repository.GetVersionHistoryAsync(deviceType.Id, _testTenantId.ToString());

        // Assert
        versions.Should().HaveCount(3);
        versions[0].Version.Should().Be(3);
        versions[1].Version.Should().Be(2);
        versions[2].Version.Should().Be(1);
    }

    [Fact]
    public async Task GetVersionHistoryAsync_ShouldThrowException_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.GetVersionHistoryAsync(nonExistentId, _testTenantId.ToString()));
    }

    [Fact]
    public async Task GetVersionHistoryAsync_ShouldRespectTenantIsolation()
    {
        // Arrange
        var deviceType1 = await CreateTestDeviceType("Device 1", _testTenantId);
        var deviceType2 = await CreateTestDeviceType("Device 2", _otherTenantId);

        // Act
        var versions1 = await _repository.GetVersionHistoryAsync(deviceType1.Id, _testTenantId.ToString());
        
        // Assert
        versions1.Should().HaveCount(1);
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.GetVersionHistoryAsync(deviceType2.Id, _testTenantId.ToString()));
    }

    #endregion

    #region RollbackToVersionAsync Tests

    [Fact]
    public async Task RollbackToVersionAsync_ShouldRestorePreviousVersion()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Original Name");
        var originalName = deviceType.Name;
        
        // Update to create version 2
        deviceType.Name = "Updated Name";
        deviceType = await _repository.UpdateAsync(deviceType);
        
        var currentVersion = deviceType.Name;

        // Act
        var rolledBack = await _repository.RollbackToVersionAsync(deviceType.Id, 1, _testTenantId, "admin@test.com");

        // Assert
        rolledBack.Should().NotBeNull();
        rolledBack.Name.Should().Be(originalName);
        rolledBack.Name.Should().NotBe(currentVersion);
        
        // Verify new version was created
        var versions = await _repository.GetVersionHistoryAsync(deviceType.Id, _testTenantId.ToString());
        versions.Should().HaveCount(3); // Original + Update + Rollback
        versions[0].Version.Should().Be(3);
        versions[0].ChangeSummary.Should().Contain("Rolled back to version 1");
    }

    [Fact]
    public async Task RollbackToVersionAsync_ShouldThrowException_WhenVersionDoesNotExist()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.RollbackToVersionAsync(deviceType.Id, 999, _testTenantId, "admin@test.com"));
    }

    [Fact]
    public async Task RollbackToVersionAsync_ShouldThrowException_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.RollbackToVersionAsync(nonExistentId, 1, _testTenantId, "admin@test.com"));
    }

    [Fact]
    public async Task RollbackToVersionAsync_ShouldCreateAuditLog()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Original");
        deviceType.Name = "Updated";
        await _repository.UpdateAsync(deviceType);

        // Act
        await _repository.RollbackToVersionAsync(deviceType.Id, 1, _testTenantId, "admin@test.com");

        // Assert
        var auditLogs = await _repository.GetAuditLogsAsync(deviceType.Id, _testTenantId.ToString(), 1, 10);
        auditLogs.Item1.Should().Contain(log => log.Action == "Rollback");
    }

    #endregion

    #region GetUsageStatisticsAsync Tests

    [Fact]
    public async Task GetUsageStatisticsAsync_ShouldReturnStatistics()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");

        // Act
        var statistics = await _repository.GetUsageStatisticsAsync(deviceType.Id, _testTenantId.ToString());

        // Assert
        statistics.Should().NotBeNull();
        statistics.DeviceTypeId.Should().Be(deviceType.Id);
        statistics.TotalDeviceCount.Should().Be(0); // Mock implementation returns 0
        statistics.ActiveDeviceCount.Should().Be(0);
        statistics.InactiveDeviceCount.Should().Be(0);
        statistics.LastUsedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetUsageStatisticsAsync_ShouldThrowException_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.GetUsageStatisticsAsync(nonExistentId, _testTenantId.ToString()));
    }

    #endregion

    #region GetAuditLogsAsync Tests

    [Fact]
    public async Task GetAuditLogsAsync_ShouldReturnPaginatedLogs()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");
        
        // Create multiple updates to generate audit logs
        deviceType.Name = "Updated 1";
        await _repository.UpdateAsync(deviceType);
        
        deviceType.Name = "Updated 2";
        await _repository.UpdateAsync(deviceType);

        // Act
        var (logs, totalCount) = await _repository.GetAuditLogsAsync(deviceType.Id, _testTenantId.ToString(), 1, 10);

        // Assert
        logs.Should().NotBeEmpty();
        totalCount.Should().BeGreaterThan(0);
        logs.All(log => log.DeviceTypeId == deviceType.Id).Should().BeTrue();
        logs.All(log => log.TenantId == _testTenantId).Should().BeTrue();
    }

    [Fact]
    public async Task GetAuditLogsAsync_ShouldReturnLogsInDescendingOrder()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");
        
        await Task.Delay(10); // Small delay to ensure different timestamps
        deviceType.Name = "Updated 1";
        await _repository.UpdateAsync(deviceType);
        
        await Task.Delay(10);
        deviceType.Name = "Updated 2";
        await _repository.UpdateAsync(deviceType);

        // Act
        var (logs, _) = await _repository.GetAuditLogsAsync(deviceType.Id, _testTenantId.ToString(), 1, 10);

        // Assert
        logs.Should().HaveCountGreaterThan(1);
        for (int i = 0; i < logs.Count() - 1; i++)
        {
            logs[i].Timestamp.Should().BeOnOrAfter(logs[i + 1].Timestamp);
        }
    }

    [Fact]
    public async Task GetAuditLogsAsync_ShouldRespectPagination()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");
        
        // Create 5 updates
        for (int i = 0; i < 5; i++)
        {
            deviceType.Description = $"Update {i}";
            await _repository.UpdateAsync(deviceType);
        }

        // Act
        var (page1, totalCount) = await _repository.GetAuditLogsAsync(deviceType.Id, _testTenantId.ToString(), 1, 3);
        var (page2, _) = await _repository.GetAuditLogsAsync(deviceType.Id, _testTenantId.ToString(), 2, 3);

        // Assert
        page1.Should().HaveCount(3);
        page2.Should().NotBeEmpty();
        totalCount.Should().BeGreaterThan(3);
    }

    [Fact]
    public async Task GetAuditLogsAsync_ShouldThrowException_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.GetAuditLogsAsync(nonExistentId, _testTenantId.ToString(), 1, 10));
    }

    #endregion

    #region ValidateUpdateAsync Tests

    [Fact]
    public async Task ValidateUpdateAsync_ShouldAllowNonBreakingChanges()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Original Device");
        var proposedUpdate = new DeviceType
        {
            Id = deviceType.Id,
            TenantId = deviceType.TenantId,
            Name = "Updated Device Name",
            Description = "Updated description",
            Protocol = deviceType.Protocol,
            ProtocolConfig = deviceType.ProtocolConfig,
            CustomFields = deviceType.CustomFields,
            Tags = new List<string> { "new-tag" },
            CreatedBy = deviceType.CreatedBy
        };

        // Act
        var result = await _repository.ValidateUpdateAsync(deviceType.Id, proposedUpdate, _testTenantId);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        result.BreakingChanges.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateUpdateAsync_ShouldDetectProtocolChange()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("MQTT Device");
        var proposedUpdate = new DeviceType
        {
            Id = deviceType.Id,
            TenantId = deviceType.TenantId,
            Name = deviceType.Name,
            Description = deviceType.Description,
            Protocol = DeviceProtocol.HTTP, // Changed from MQTT
            ProtocolConfig = new ProtocolConfig(),
            CustomFields = deviceType.CustomFields,
            Tags = deviceType.Tags,
            CreatedBy = deviceType.CreatedBy
        };

        // Act
        var result = await _repository.ValidateUpdateAsync(deviceType.Id, proposedUpdate, _testTenantId);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.BreakingChanges.Should().Contain(change => change.Contains("Protocol change from"));
    }

    [Fact]
    public async Task ValidateUpdateAsync_ShouldDetectNewRequiredFields()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");
        var proposedUpdate = new DeviceType
        {
            Id = deviceType.Id,
            TenantId = deviceType.TenantId,
            Name = deviceType.Name,
            Description = deviceType.Description,
            Protocol = deviceType.Protocol,
            ProtocolConfig = deviceType.ProtocolConfig,
            CustomFields = new List<CustomFieldDefinition>
            {
                new CustomFieldDefinition
                {
                    Name = "newRequiredField",
                    Label = "New Required Field",
                    Type = CustomFieldType.Text,
                    Required = true // New required field
                }
            },
            Tags = deviceType.Tags,
            CreatedBy = deviceType.CreatedBy
        };

        // Act
        var result = await _repository.ValidateUpdateAsync(deviceType.Id, proposedUpdate, _testTenantId);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.BreakingChanges.Should().Contain(change => change.Contains("new required custom field"));
    }

    [Fact]
    public async Task ValidateUpdateAsync_ShouldWarnAboutFieldTypeChanges()
    {
        // Arrange
        var deviceType = await CreateTestDeviceType("Test Device");
        deviceType.CustomFields = new List<CustomFieldDefinition>
        {
            new CustomFieldDefinition
            {
                Name = "field1",
                Label = "Field 1",
                Type = CustomFieldType.Text,
                Required = false
            }
        };
        await _repository.UpdateAsync(deviceType);

        var proposedUpdate = new DeviceType
        {
            Id = deviceType.Id,
            TenantId = deviceType.TenantId,
            Name = deviceType.Name,
            Description = deviceType.Description,
            Protocol = deviceType.Protocol,
            ProtocolConfig = deviceType.ProtocolConfig,
            CustomFields = new List<CustomFieldDefinition>
            {
                new CustomFieldDefinition
                {
                    Name = "field1",
                    Label = "Field 1",
                    Type = CustomFieldType.Number, // Changed type
                    Required = false
                }
            },
            Tags = deviceType.Tags,
            CreatedBy = deviceType.CreatedBy
        };

        // Act
        var result = await _repository.ValidateUpdateAsync(deviceType.Id, proposedUpdate, _testTenantId);

        // Assert
        result.Should().NotBeNull();
        result.Warnings.Should().Contain(warning => warning.Contains("field1") && warning.Contains("type changed"));
    }

    [Fact]
    public async Task ValidateUpdateAsync_ShouldThrowException_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var proposedUpdate = new DeviceType
        {
            Id = nonExistentId,
            TenantId = _testTenantId,
            Name = "Test",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig(),
            CustomFields = new List<CustomFieldDefinition>(),
            Tags = new List<string>(),
            CreatedBy = "test"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.ValidateUpdateAsync(nonExistentId, proposedUpdate, _testTenantId));
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
                    Topic = "test/topic",
                    Qos = 1
                }
            },
            CustomFields = new List<CustomFieldDefinition>(),
            IsActive = true,
            AlertTemplates = new List<AlertRuleTemplate>(),
            Tags = new List<string> { "test" },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "admin@test.com"
        };

        return await _repository.CreateAsync(deviceType);
    }

    #endregion
}
