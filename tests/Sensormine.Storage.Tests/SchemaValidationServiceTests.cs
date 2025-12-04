using FluentAssertions;
using Sensormine.Core.DTOs;
using Sensormine.Core.Models;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.Services;
using Moq;

namespace Sensormine.Storage.Tests;

public class SchemaValidationServiceTests
{
    private readonly Mock<ISchemaRepository> _mockRepository;
    private readonly SchemaValidationService _service;
    private const string TestTenantId = "test-tenant-123";

    public SchemaValidationServiceTests()
    {
        _mockRepository = new Mock<ISchemaRepository>();
        _service = new SchemaValidationService(_mockRepository.Object);
    }

    [Fact]
    public async Task ValidateDataAsync_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""temperature"": { ""type"": ""number"" },
                ""unit"": { ""type"": ""string"" }
            },
            ""required"": [""temperature"", ""unit""]
        }";

        var data = @"{
            ""temperature"": 25.5,
            ""unit"": ""C""
        }";

        // Act
        var result = await _service.ValidateDataAsync(schema, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateDataAsync_WithMissingRequiredField_ReturnsError()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""temperature"": { ""type"": ""number"" },
                ""unit"": { ""type"": ""string"" }
            },
            ""required"": [""temperature"", ""unit""]
        }";

        var data = @"{
            ""temperature"": 25.5
        }";

        // Act
        var result = await _service.ValidateDataAsync(schema, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(1);
        result.Errors[0].Path.Should().Be("#/unit");
        result.Errors[0].Message.Should().Contain("PropertyRequired");
    }

    [Fact]
    public async Task ValidateDataAsync_WithWrongType_ReturnsError()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""temperature"": { ""type"": ""number"" },
                ""unit"": { ""type"": ""string"" }
            }
        }";

        var data = @"{
            ""temperature"": ""hot"",
            ""unit"": ""C""
        }";

        // Act
        var result = await _service.ValidateDataAsync(schema, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCountGreaterThan(0);
        result.Errors.Should().Contain(e => e.Path.Contains("temperature"));
    }

    [Fact]
    public async Task ValidateDataAsync_WithNestedObject_ValidatesCorrectly()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""sensor"": {
                    ""type"": ""object"",
                    ""properties"": {
                        ""id"": { ""type"": ""string"" },
                        ""value"": { ""type"": ""number"" }
                    },
                    ""required"": [""id"", ""value""]
                }
            }
        }";

        var data = @"{
            ""sensor"": {
                ""id"": ""sensor-123"",
                ""value"": 42.7
            }
        }";

        // Act
        var result = await _service.ValidateDataAsync(schema, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateDataAsync_WithArray_ValidatesCorrectly()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""readings"": {
                    ""type"": ""array"",
                    ""items"": {
                        ""type"": ""object"",
                        ""properties"": {
                            ""value"": { ""type"": ""number"" },
                            ""timestamp"": { ""type"": ""string"", ""format"": ""date-time"" }
                        },
                        ""required"": [""value"", ""timestamp""]
                    }
                }
            }
        }";

        var data = @"{
            ""readings"": [
                { ""value"": 10.5, ""timestamp"": ""2025-12-05T10:00:00Z"" },
                { ""value"": 11.2, ""timestamp"": ""2025-12-05T10:05:00Z"" }
            ]
        }";

        // Act
        var result = await _service.ValidateDataAsync(schema, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateDataAsync_WithMinMaxConstraints_ValidatesCorrectly()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""temperature"": {
                    ""type"": ""number"",
                    ""minimum"": -50,
                    ""maximum"": 150
                }
            }
        }";

        var validData = @"{ ""temperature"": 25 }";
        var invalidData = @"{ ""temperature"": 200 }";

        // Act
        var validResult = await _service.ValidateDataAsync(schema, validData);
        var invalidResult = await _service.ValidateDataAsync(schema, invalidData);

        // Assert
        validResult.IsValid.Should().BeTrue();
        invalidResult.IsValid.Should().BeFalse();
        invalidResult.Errors.Should().Contain(e => e.Path.Contains("temperature"));
    }

    [Fact]
    public async Task ValidateDataAsync_WithEnum_ValidatesCorrectly()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""unit"": {
                    ""type"": ""string"",
                    ""enum"": [""C"", ""F"", ""K""]
                }
            }
        }";

        var validData = @"{ ""unit"": ""C"" }";
        var invalidData = @"{ ""unit"": ""X"" }";

        // Act
        var validResult = await _service.ValidateDataAsync(schema, validData);
        var invalidResult = await _service.ValidateDataAsync(schema, invalidData);

        // Assert
        validResult.IsValid.Should().BeTrue();
        invalidResult.IsValid.Should().BeFalse();
        invalidResult.Errors.Should().Contain(e => e.Path.Contains("unit"));
    }

    [Fact]
    public async Task ValidateDataAsync_WithInvalidJsonData_ReturnsError()
    {
        // Arrange
        var schema = @"{""type"": ""object""}";
        var invalidData = "{ invalid json ";

        // Act
        var result = await _service.ValidateDataAsync(schema, invalidData);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCountGreaterThan(0);
    }

    [Fact]
    public async Task ValidateSchemaAsync_WithValidSchema_ReturnsSuccess()
    {
        // Arrange
        var validSchema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""name"": { ""type"": ""string"" },
                ""age"": { ""type"": ""integer"" }
            }
        }";

        // Act
        var result = await _service.ValidateSchemaAsync(validSchema);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateSchemaAsync_WithInvalidSchema_ReturnsError()
    {
        // Arrange
        var invalidSchema = "{ not valid json ";

        // Act
        var result = await _service.ValidateSchemaAsync(invalidSchema);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCountGreaterThan(0);
    }

    [Fact]
    public async Task ValidateDataAgainstSchemaAsync_WithDefaultVersion_UsesDefaultVersion()
    {
        // Arrange
        var schemaId = Guid.NewGuid();
        var schemaVersion = new SchemaVersion
        {
            Id = Guid.NewGuid(),
            SchemaId = schemaId,
            Version = "1.0.0",
            JsonSchema = @"{
                ""type"": ""object"",
                ""properties"": {
                    ""value"": { ""type"": ""number"" }
                }
            }",
            IsDefault = true,
            TenantId = TestTenantId,
            CreatedBy = "test@test.com"
        };

        _mockRepository
            .Setup(r => r.GetDefaultVersionAsync(schemaId, TestTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(schemaVersion);

        var data = @"{ ""value"": 42 }";

        // Act
        var result = await _service.ValidateDataAgainstSchemaAsync(schemaId, TestTenantId, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        _mockRepository.Verify(r => r.GetDefaultVersionAsync(schemaId, TestTenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ValidateDataAgainstSchemaAsync_WithSpecificVersion_UsesSpecifiedVersion()
    {
        // Arrange
        var schemaId = Guid.NewGuid();
        var version = "2.0.0";
        var schemaVersion = new SchemaVersion
        {
            Id = Guid.NewGuid(),
            SchemaId = schemaId,
            Version = version,
            JsonSchema = @"{
                ""type"": ""object"",
                ""properties"": {
                    ""value"": { ""type"": ""string"" }
                }
            }",
            TenantId = TestTenantId,
            CreatedBy = "test@test.com"
        };

        _mockRepository
            .Setup(r => r.GetVersionAsync(schemaId, version, TestTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(schemaVersion);

        var data = @"{ ""value"": ""test"" }";

        // Act
        var result = await _service.ValidateDataAgainstSchemaAsync(schemaId, TestTenantId, data, version);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeTrue();
        _mockRepository.Verify(r => r.GetVersionAsync(schemaId, version, TestTenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ValidateDataAgainstSchemaAsync_WithNonExistentSchema_ReturnsError()
    {
        // Arrange
        var schemaId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.GetDefaultVersionAsync(schemaId, TestTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SchemaVersion?)null);

        var data = @"{ ""value"": 42 }";

        // Act
        var result = await _service.ValidateDataAgainstSchemaAsync(schemaId, TestTenantId, data);

        // Assert
        result.Should().NotBeNull();
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(1);
        result.Errors[0].Message.Should().Contain("Schema not found");
    }

    [Fact]
    public async Task ValidateDataAsync_WithPatternConstraint_ValidatesCorrectly()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""code"": {
                    ""type"": ""string"",
                    ""pattern"": ""^[A-Z]{3}-[0-9]{3}$""
                }
            }
        }";

        var validData = @"{ ""code"": ""ABC-123"" }";
        var invalidData = @"{ ""code"": ""invalid"" }";

        // Act
        var validResult = await _service.ValidateDataAsync(schema, validData);
        var invalidResult = await _service.ValidateDataAsync(schema, invalidData);

        // Assert
        validResult.IsValid.Should().BeTrue();
        invalidResult.IsValid.Should().BeFalse();
        invalidResult.Errors.Should().Contain(e => e.Path.Contains("code"));
    }

    [Fact]
    public async Task ValidateDataAsync_WithAdditionalPropertiesFalse_RejectsExtraProperties()
    {
        // Arrange
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""name"": { ""type"": ""string"" }
            },
            ""additionalProperties"": false
        }";

        var validData = @"{ ""name"": ""test"" }";
        var invalidData = @"{ ""name"": ""test"", ""extra"": ""value"" }";

        // Act
        var validResult = await _service.ValidateDataAsync(schema, validData);
        var invalidResult = await _service.ValidateDataAsync(schema, invalidData);

        // Assert
        validResult.IsValid.Should().BeTrue();
        invalidResult.IsValid.Should().BeFalse();
    }
}
