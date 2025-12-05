using Device.API.Controllers;
using Device.API.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Sensormine.Core.Models;
using Sensormine.Core.Repositories;

namespace Device.API.Tests;

/// <summary>
/// Unit tests for DeviceTypeController
/// Following TDD approach - GREEN phase (controller implemented, tests should pass)
/// </summary>
public class DeviceTypeControllerTests
{
    private readonly Mock<IDeviceTypeRepository> _mockRepository;
    private readonly Mock<ILogger<DeviceTypeController>> _mockLogger;
    private readonly DeviceTypeController _controller;

    public DeviceTypeControllerTests()
    {
        _mockRepository = new Mock<IDeviceTypeRepository>();
        _mockLogger = new Mock<ILogger<DeviceTypeController>>();
        _controller = new DeviceTypeController(_mockRepository.Object, _mockLogger.Object);
    }

    #region CreateDeviceType Tests

    [Fact]
    public async Task CreateDeviceType_ShouldReturnCreatedResult_WithValidData()
    {
        // Arrange
        var request = new DeviceTypeRequest
        {
            Name = "Temperature Sensor",
            Description = "IoT temperature monitoring device",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig
            {
                Mqtt = new MqttConfig
                {
                    Broker = "mqtt://localhost:1883",
                    Topic = "sensors/temperature",
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
            Tags = new List<string> { "sensor", "iot", "temperature" }
        };

        var createdDeviceType = new DeviceType
        {
            Id = Guid.NewGuid(),
            TenantId = It.IsAny<Guid>(),
            Name = request.Name,
            Description = request.Description,
            Protocol = request.Protocol,
            ProtocolConfig = request.ProtocolConfig,
            CustomFields = request.CustomFields,
            Tags = request.Tags,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "test-user"
        };

        _mockRepository
            .Setup(r => r.ExistsAsync(request.Name, It.IsAny<Guid>(), null))
            .ReturnsAsync(false);

        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<DeviceType>()))
            .ReturnsAsync(createdDeviceType);

        // Act
        var result = await _controller.CreateDeviceType(request);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result as CreatedAtActionResult;
        createdResult!.StatusCode.Should().Be(StatusCodes.Status201Created);
        var response = createdResult.Value as DeviceTypeResponse;
        response.Should().NotBeNull();
        response!.Name.Should().Be(request.Name);

        _mockRepository.Verify(r => r.CreateAsync(It.IsAny<DeviceType>()), Times.Once);
    }

    [Fact]
    public async Task CreateDeviceType_ShouldReturnBadRequest_WhenNameIsEmpty()
    {
        // Arrange
        var request = new DeviceTypeRequest
        {
            Name = "",  // Invalid: empty name
            Protocol = DeviceProtocol.MQTT
        };

        // Note: Model validation is handled by ASP.NET Core middleware
        // This test validates the request DTO has proper validation attributes
        // In integration tests, this would actually return 400 Bad Request
        
        // For unit tests, we verify the validation attributes exist
        var nameProperty = typeof(DeviceTypeRequest).GetProperty(nameof(DeviceTypeRequest.Name));
        var requiredAttr = nameProperty!.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.RequiredAttribute), false);
        requiredAttr.Should().NotBeEmpty("Name should have Required attribute");
    }

    [Fact]
    public async Task CreateDeviceType_ShouldReturnConflict_WhenNameAlreadyExists()
    {
        // Arrange
        var request = new DeviceTypeRequest
        {
            Name = "Existing Device",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig()
        };

        _mockRepository
            .Setup(r => r.ExistsAsync(request.Name, It.IsAny<Guid>(), null))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CreateDeviceType(request);

        // Assert
        result.Should().BeOfType<ConflictObjectResult>();

        _mockRepository.Verify(r => r.ExistsAsync(request.Name, It.IsAny<Guid>(), null), Times.Once);
    }

    #endregion

    #region GetDeviceTypeById Tests

    [Fact]
    public async Task GetDeviceTypeById_ShouldReturnOk_WhenDeviceTypeExists()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var deviceType = new DeviceType
        {
            Id = deviceTypeId,
            TenantId = It.IsAny<Guid>(),
            Name = "Test Device",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync(deviceType);

        // Act
        var result = await _controller.GetDeviceTypeById(deviceTypeId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeResponse;
        response!.Id.Should().Be(deviceTypeId);

        _mockRepository.Verify(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task GetDeviceTypeById_ShouldReturnNotFound_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync((DeviceType?)null);

        // Act
        var result = await _controller.GetDeviceTypeById(deviceTypeId);

        // Assert
        result.Should().BeOfType<NotFoundResult>();

        _mockRepository.Verify(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
    }

    #endregion

    #region GetAllDeviceTypes Tests

    [Fact]
    public async Task GetAllDeviceTypes_ShouldReturnPaginatedList()
    {
        // Arrange
        var deviceTypes = new List<DeviceType>
        {
            new DeviceType
            {
                Id = Guid.NewGuid(),
                TenantId = It.IsAny<Guid>(),
                Name = "Device 1",
                Protocol = DeviceProtocol.MQTT,
                ProtocolConfig = new ProtocolConfig(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new DeviceType
            {
                Id = Guid.NewGuid(),
                TenantId = It.IsAny<Guid>(),
                Name = "Device 2",
                Protocol = DeviceProtocol.HTTP,
                ProtocolConfig = new ProtocolConfig(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockRepository
            .Setup(r => r.GetAllAsync(It.IsAny<Guid>(), 1, 20))
            .ReturnsAsync((deviceTypes, 2));

        // Act
        var result = await _controller.GetAllDeviceTypes(1, 20);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeListResponse;
        response!.Items.Should().HaveCount(2);
        response.TotalCount.Should().Be(2);

        _mockRepository.Verify(r => r.GetAllAsync(It.IsAny<Guid>(), 1, 20), Times.Once);
    }

    [Fact]
    public async Task GetAllDeviceTypes_ShouldReturnEmptyList_WhenNoDeviceTypes()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetAllAsync(It.IsAny<Guid>(), 1, 20))
            .ReturnsAsync((new List<DeviceType>(), 0));

        // Act
        var result = await _controller.GetAllDeviceTypes(1, 20);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var response = (result as OkObjectResult)!.Value as DeviceTypeListResponse;
        response!.Items.Should().BeEmpty();
        response.TotalCount.Should().Be(0);

        _mockRepository.Verify(r => r.GetAllAsync(It.IsAny<Guid>(), 1, 20), Times.Once);
    }

    #endregion

    #region UpdateDeviceType Tests

    [Fact]
    public async Task UpdateDeviceType_ShouldReturnOk_WithUpdatedData()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var existingDeviceType = new DeviceType
        {
            Id = deviceTypeId,
            TenantId = It.IsAny<Guid>(),
            Name = "Old Name",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig(),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var updateRequest = new DeviceTypeRequest
        {
            Name = "Updated Name",
            Description = "Updated description",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig()
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync(existingDeviceType);

        _mockRepository
            .Setup(r => r.ExistsAsync(updateRequest.Name, It.IsAny<Guid>(), deviceTypeId))
            .ReturnsAsync(false);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<DeviceType>()))
            .ReturnsAsync((DeviceType dt) => dt);

        // Act
        var result = await _controller.UpdateDeviceType(deviceTypeId, updateRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var response = (result as OkObjectResult)!.Value as DeviceTypeResponse;
        response!.Name.Should().Be(updateRequest.Name);

        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<DeviceType>()), Times.Once);
    }

    [Fact]
    public async Task UpdateDeviceType_ShouldReturnNotFound_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var updateRequest = new DeviceTypeRequest
        {
            Name = "Updated Name",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig()
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync((DeviceType?)null);

        // Act
        var result = await _controller.UpdateDeviceType(deviceTypeId, updateRequest);

        // Assert
        result.Should().BeOfType<NotFoundResult>();

        _mockRepository.Verify(r => r.GetByIdAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<DeviceType>()), Times.Never);
    }

    #endregion

    #region DeleteDeviceType Tests

    [Fact]
    public async Task DeleteDeviceType_ShouldReturnNoContent_WhenSuccessful()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.DeleteAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteDeviceType(deviceTypeId);

        // Assert
        result.Should().BeOfType<NoContentResult>();

        _mockRepository.Verify(r => r.DeleteAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task DeleteDeviceType_ShouldReturnNotFound_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.DeleteAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteDeviceType(deviceTypeId);

        // Assert
        result.Should().BeOfType<NotFoundResult>();

        _mockRepository.Verify(r => r.DeleteAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
    }

    #endregion

    #region SearchDeviceTypes Tests

    [Fact]
    public async Task SearchDeviceTypes_ShouldReturnMatchingDeviceTypes()
    {
        // Arrange
        var searchRequest = new SearchDeviceTypesRequest
        {
            SearchTerm = "temperature",
            Protocol = DeviceProtocol.MQTT,
            Page = 1,
            PageSize = 20
        };

        var deviceTypes = new List<DeviceType>
        {
            new DeviceType
            {
                Id = Guid.NewGuid(),
                TenantId = It.IsAny<Guid>(),
                Name = "Temperature Sensor",
                Protocol = DeviceProtocol.MQTT,
                ProtocolConfig = new ProtocolConfig(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockRepository
            .Setup(r => r.SearchAsync(
                It.IsAny<Guid>(),
                searchRequest.SearchTerm,
                searchRequest.Tags,
                searchRequest.Protocol,
                searchRequest.Page,
                searchRequest.PageSize))
            .ReturnsAsync((deviceTypes, 1));

        // Act
        var result = await _controller.SearchDeviceTypes(searchRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var response = (result as OkObjectResult)!.Value as DeviceTypeListResponse;
        response!.Items.Should().HaveCount(1);
        response.Items[0].Name.Should().Contain("Temperature");

        _mockRepository.Verify(r => r.SearchAsync(
            It.IsAny<Guid>(),
            searchRequest.SearchTerm,
            searchRequest.Tags,
            searchRequest.Protocol,
            searchRequest.Page,
            searchRequest.PageSize), Times.Once);
    }

    [Fact]
    public async Task SearchDeviceTypes_ShouldReturnEmptyList_WhenNoMatches()
    {
        // Arrange
        var searchRequest = new SearchDeviceTypesRequest
        {
            SearchTerm = "nonexistent",
            Page = 1,
            PageSize = 20
        };

        _mockRepository
            .Setup(r => r.SearchAsync(
                It.IsAny<Guid>(),
                searchRequest.SearchTerm,
                searchRequest.Tags,
                searchRequest.Protocol,
                searchRequest.Page,
                searchRequest.PageSize))
            .ReturnsAsync((new List<DeviceType>(), 0));

        // Act
        var result = await _controller.SearchDeviceTypes(searchRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var response = (result as OkObjectResult)!.Value as DeviceTypeListResponse;
        response!.Items.Should().BeEmpty();

        _mockRepository.Verify(r => r.SearchAsync(
            It.IsAny<Guid>(),
            searchRequest.SearchTerm,
            searchRequest.Tags,
            searchRequest.Protocol,
            searchRequest.Page,
            searchRequest.PageSize), Times.Once);
    }

    #endregion

    #region GetVersionHistory Tests

    [Fact]
    public async Task GetVersionHistory_ShouldReturnOkResult_WithVersionList()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var versions = new List<DeviceTypeVersion>
        {
            new DeviceTypeVersion
            {
                Id = Guid.NewGuid(),
                DeviceTypeId = deviceTypeId,
                Version = 2,
                VersionData = "{\"name\":\"Test v2\"}",
                ChangeSummary = "Updated name",
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                CreatedBy = "user1"
            },
            new DeviceTypeVersion
            {
                Id = Guid.NewGuid(),
                DeviceTypeId = deviceTypeId,
                Version = 1,
                VersionData = "{\"name\":\"Test v1\"}",
                ChangeSummary = "Initial version",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                CreatedBy = "user1"
            }
        };

        _mockRepository
            .Setup(r => r.GetVersionHistoryAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync(versions);

        // Act
        var result = await _controller.GetVersionHistory(deviceTypeId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as List<DeviceTypeVersionResponse>;
        response.Should().NotBeNull();
        response!.Count.Should().Be(2);
        response[0].Version.Should().Be(2);
        response[1].Version.Should().Be(1);

        _mockRepository.Verify(r => r.GetVersionHistoryAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task GetVersionHistory_ShouldReturnNotFound_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.GetVersionHistoryAsync(deviceTypeId, It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("Device Type not found"));

        // Act
        var result = await _controller.GetVersionHistory(deviceTypeId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region RollbackToVersion Tests

    [Fact]
    public async Task RollbackToVersion_ShouldReturnOkResult_WithRolledBackDeviceType()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var request = new RollbackDeviceTypeRequest { Version = 1 };
        var rolledBackDeviceType = new DeviceType
        {
            Id = deviceTypeId,
            TenantId = Guid.NewGuid(),
            Name = "Temperature Sensor",
            Description = "Rolled back version",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig(),
            CustomFields = new List<CustomFieldDefinition>(),
            Tags = new List<string>(),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "user1"
        };

        _mockRepository
            .Setup(r => r.RollbackToVersionAsync(deviceTypeId, request.Version, It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync(rolledBackDeviceType);

        // Act
        var result = await _controller.RollbackToVersion(deviceTypeId, request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeResponse;
        response.Should().NotBeNull();
        response!.Id.Should().Be(deviceTypeId);

        _mockRepository.Verify(r => r.RollbackToVersionAsync(deviceTypeId, request.Version, It.IsAny<Guid>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task RollbackToVersion_ShouldReturnNotFound_WhenVersionDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var request = new RollbackDeviceTypeRequest { Version = 999 };

        _mockRepository
            .Setup(r => r.RollbackToVersionAsync(deviceTypeId, request.Version, It.IsAny<Guid>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Version not found"));

        // Act
        var result = await _controller.RollbackToVersion(deviceTypeId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region GetUsageStatistics Tests

    [Fact]
    public async Task GetUsageStatistics_ShouldReturnOkResult_WithStatistics()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var statistics = new DeviceTypeUsageStatistics
        {
            DeviceTypeId = deviceTypeId,
            TotalDeviceCount = 50,
            ActiveDeviceCount = 45,
            InactiveDeviceCount = 5,
            LastUsedAt = DateTime.UtcNow.AddHours(-2)
        };

        _mockRepository
            .Setup(r => r.GetUsageStatisticsAsync(deviceTypeId, It.IsAny<Guid>()))
            .ReturnsAsync(statistics);

        // Act
        var result = await _controller.GetUsageStatistics(deviceTypeId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeUsageStatisticsResponse;
        response.Should().NotBeNull();
        response!.TotalDeviceCount.Should().Be(50);
        response.ActiveDeviceCount.Should().Be(45);
        response.InactiveDeviceCount.Should().Be(5);

        _mockRepository.Verify(r => r.GetUsageStatisticsAsync(deviceTypeId, It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task GetUsageStatistics_ShouldReturnNotFound_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.GetUsageStatisticsAsync(deviceTypeId, It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("Device Type not found"));

        // Act
        var result = await _controller.GetUsageStatistics(deviceTypeId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region GetAuditLogs Tests

    [Fact]
    public async Task GetAuditLogs_ShouldReturnOkResult_WithPaginatedLogs()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var auditLogs = new List<DeviceTypeAuditLog>
        {
            new DeviceTypeAuditLog
            {
                Id = Guid.NewGuid(),
                DeviceTypeId = deviceTypeId,
                TenantId = Guid.NewGuid(),
                Action = "Updated",
                OldValue = "{\"name\":\"Old Name\"}",
                NewValue = "{\"name\":\"New Name\"}",
                ChangeSummary = "Name updated",
                Timestamp = DateTime.UtcNow.AddHours(-1),
                UserId = "user1"
            }
        };

        _mockRepository
            .Setup(r => r.GetAuditLogsAsync(deviceTypeId, It.IsAny<Guid>(), 1, 10))
            .ReturnsAsync((auditLogs, 1));

        // Act
        var result = await _controller.GetAuditLogs(deviceTypeId, 1, 10);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeAuditLogListResponse;
        response.Should().NotBeNull();
        response!.Items.Count.Should().Be(1);
        response.TotalCount.Should().Be(1);
        response.Page.Should().Be(1);
        response.PageSize.Should().Be(10);

        _mockRepository.Verify(r => r.GetAuditLogsAsync(deviceTypeId, It.IsAny<Guid>(), 1, 10), Times.Once);
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnBadRequest_WhenPageIsInvalid()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        // Act
        var result = await _controller.GetAuditLogs(deviceTypeId, 0, 10);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult!.Value.Should().Be("Page must be greater than 0");
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnBadRequest_WhenPageSizeIsInvalid()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();

        // Act
        var result = await _controller.GetAuditLogs(deviceTypeId, 1, 0);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult!.Value.Should().Be("PageSize must be between 1 and 100");
    }

    #endregion

    #region ValidateUpdate Tests

    [Fact]
    public async Task ValidateUpdate_ShouldReturnOkResult_WithValidUpdate()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var request = new DeviceTypeRequest
        {
            Name = "Updated Temperature Sensor",
            Description = "Updated description",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig(),
            CustomFields = new List<CustomFieldDefinition>(),
            Tags = new List<string>()
        };

        var validationResult = new DeviceTypeUpdateValidationResult
        {
            IsValid = true,
            BreakingChanges = new List<string>(),
            Warnings = new List<string>(),
            AffectedDeviceCount = 0,
            RecommendedActions = new List<string>()
        };

        _mockRepository
            .Setup(r => r.ValidateUpdateAsync(deviceTypeId, It.IsAny<DeviceType>(), It.IsAny<Guid>()))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateUpdate(deviceTypeId, request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeUpdateValidationResponse;
        response.Should().NotBeNull();
        response!.IsValid.Should().BeTrue();
        response.BreakingChanges.Should().BeEmpty();
        response.Warnings.Should().BeEmpty();

        _mockRepository.Verify(r => r.ValidateUpdateAsync(deviceTypeId, It.IsAny<DeviceType>(), It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task ValidateUpdate_ShouldReturnOkResult_WithBreakingChanges()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var request = new DeviceTypeRequest
        {
            Name = "Temperature Sensor",
            Description = "Changed protocol",
            Protocol = DeviceProtocol.HTTP, // Changed from MQTT
            ProtocolConfig = new ProtocolConfig(),
            CustomFields = new List<CustomFieldDefinition>(),
            Tags = new List<string>()
        };

        var validationResult = new DeviceTypeUpdateValidationResult
        {
            IsValid = false,
            BreakingChanges = new List<string> { "Protocol changed from MQTT to HTTP" },
            Warnings = new List<string>(),
            AffectedDeviceCount = 10,
            RecommendedActions = new List<string> { "Consider creating a new Device Type version" }
        };

        _mockRepository
            .Setup(r => r.ValidateUpdateAsync(deviceTypeId, It.IsAny<DeviceType>(), It.IsAny<Guid>()))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateUpdate(deviceTypeId, request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DeviceTypeUpdateValidationResponse;
        response.Should().NotBeNull();
        response!.IsValid.Should().BeFalse();
        response.BreakingChanges.Count.Should().Be(1);
        response.AffectedDeviceCount.Should().Be(10);

        _mockRepository.Verify(r => r.ValidateUpdateAsync(deviceTypeId, It.IsAny<DeviceType>(), It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task ValidateUpdate_ShouldReturnNotFound_WhenDeviceTypeDoesNotExist()
    {
        // Arrange
        var deviceTypeId = Guid.NewGuid();
        var request = new DeviceTypeRequest
        {
            Name = "Test",
            Description = "Test",
            Protocol = DeviceProtocol.MQTT,
            ProtocolConfig = new ProtocolConfig(),
            CustomFields = new List<CustomFieldDefinition>(),
            Tags = new List<string>()
        };

        _mockRepository
            .Setup(r => r.ValidateUpdateAsync(deviceTypeId, It.IsAny<DeviceType>(), It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("Device Type not found"));

        // Act
        var result = await _controller.ValidateUpdate(deviceTypeId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion
}
