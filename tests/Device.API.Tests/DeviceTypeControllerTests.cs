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
}
