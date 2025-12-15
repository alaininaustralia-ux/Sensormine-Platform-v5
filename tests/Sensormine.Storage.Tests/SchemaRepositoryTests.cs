using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;
using Sensormine.Storage.Data;
using Sensormine.Storage.Repositories;

namespace Sensormine.Storage.Tests;

public class SchemaRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly SchemaRepository _repository;
    private readonly Guid TestTenantId = Guid.NewGuid();
    private readonly Guid OtherTenantId = Guid.NewGuid();

    public SchemaRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new SchemaRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateSchema_WithValidData()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "TemperatureSensor",
            Description = "Temperature sensor schema",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };

        // Act
        var result = await _repository.CreateAsync(schema);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("TemperatureSensor");
        result.TenantId.Should().Be(TestTenantId);
        result.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowException_WhenSchemaIsNull()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.CreateAsync(null!));
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnSchema_WhenExists()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "PressureSensor",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateAsync(schema);

        // Act
        var result = await _repository.GetByIdAsync(schema.Id, TestTenantId.ToString());

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(schema.Id);
        result.Name.Should().Be("PressureSensor");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetByIdAsync(Guid.NewGuid(), TestTenantId.ToString());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenDifferentTenant()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "TestSchema",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateAsync(schema);

        // Act
        var result = await _repository.GetByIdAsync(schema.Id, OtherTenantId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByNameAsync_ShouldReturnSchema_WhenExists()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "VibrationSensor",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateAsync(schema);

        // Act
        var result = await _repository.GetByNameAsync("VibrationSensor", TestTenantId.ToString());

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("VibrationSensor");
        result.TenantId.Should().Be(TestTenantId);
    }

    [Fact]
    public async Task GetByNameAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetByNameAsync("NonExistentSchema", TestTenantId.ToString());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task ListAsync_ShouldReturnPaginatedSchemas()
    {
        // Arrange
        for (int i = 1; i <= 25; i++)
        {
            await _repository.CreateAsync(new Schema
            {
                Name = $"Schema{i}",
                TenantId = TestTenantId,
                CreatedBy = "user@test.com"
            });
        }

        // Act
        var schemas = await _repository.ListAsync(TestTenantId, skip: 0, take: 10);
        var totalCount = await _repository.CountAsync(TestTenantId);

        // Assert
        schemas.Should().HaveCount(10);
        totalCount.Should().Be(25);
    }

    [Fact]
    public async Task ListAsync_ShouldReturnOnlyTenantSchemas()
    {
        // Arrange
        await _repository.CreateAsync(new Schema { Name = "TenantA1", TenantId = TestTenantId, CreatedBy = "user@test.com" });
        await _repository.CreateAsync(new Schema { Name = "TenantA2", TenantId = TestTenantId, CreatedBy = "user@test.com" });
        await _repository.CreateAsync(new Schema { Name = "TenantB1", TenantId = OtherTenantId, CreatedBy = "user@test.com" });

        // Act
        var schemas = await _repository.ListAsync(TestTenantId);
        var totalCount = await _repository.CountAsync(TestTenantId);

        // Assert
        schemas.Should().HaveCount(2);
        totalCount.Should().Be(2);
        schemas.Should().OnlyContain(s => s.TenantId == TestTenantId);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateSchema()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "OriginalName",
            Description = "Original description",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateAsync(schema);

        // Act
        schema.Description = "Updated description";
        schema.UpdatedBy = "admin@test.com";
        var result = await _repository.UpdateAsync(schema);

        // Assert
        result.Description.Should().Be("Updated description");
        result.UpdatedBy.Should().Be("admin@test.com");
        result.UpdatedAt.Should().NotBeNull();
        result.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task DeleteAsync_ShouldSoftDeleteSchema()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "ToBeDeleted",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateAsync(schema);

        // Act
        await _repository.DeleteAsync(schema.Id, TestTenantId.ToString());

        // Assert
        var deletedSchema = await _context.Schemas
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == schema.Id);
        
        deletedSchema.Should().NotBeNull();
        deletedSchema!.IsDeleted.Should().BeTrue();
        deletedSchema.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAsync_ShouldThrowException_WhenSchemaNotExists()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _repository.DeleteAsync(Guid.NewGuid(), TestTenantId.ToString()));
    }

    [Fact]
    public async Task CreateVersionAsync_ShouldCreateSchemaVersion()
    {
        // Arrange
        var schema = new Schema
        {
            Name = "TestSchema",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateAsync(schema);

        var version = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "1.0.0",
            JsonSchema = "{\"type\": \"object\"}",
            Status = SchemaStatus.Draft,
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };

        // Act
        var result = await _repository.CreateVersionAsync(version);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.SchemaId.Should().Be(schema.Id);
        result.Version.Should().Be("1.0.0");
        result.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetVersionAsync_ShouldReturnVersion_WhenExists()
    {
        // Arrange
        var schema = new Schema { Name = "TestSchema", TenantId = TestTenantId, CreatedBy = "user@test.com" };
        await _repository.CreateAsync(schema);

        var version = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "1.0.0",
            JsonSchema = "{\"type\": \"object\"}",
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateVersionAsync(version);

        // Act
        var result = await _repository.GetVersionAsync(schema.Id, "1.0.0", TestTenantId);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be("1.0.0");
        result.SchemaId.Should().Be(schema.Id);
    }

    [Fact]
    public async Task GetDefaultVersionAsync_ShouldReturnDefaultVersion()
    {
        // Arrange
        var schema = new Schema { Name = "TestSchema", TenantId = TestTenantId, CreatedBy = "user@test.com" };
        await _repository.CreateAsync(schema);

        var version1 = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "1.0.0",
            JsonSchema = "{}",
            IsDefault = false,
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateVersionAsync(version1);

        var version2 = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "2.0.0",
            JsonSchema = "{}",
            IsDefault = true,
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateVersionAsync(version2);

        // Act
        var result = await _repository.GetDefaultVersionAsync(schema.Id, TestTenantId.ToString());

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be("2.0.0");
        result.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task SetDefaultVersionAsync_ShouldSetNewDefaultAndClearOld()
    {
        // Arrange
        var schema = new Schema { Name = "TestSchema", TenantId = TestTenantId, CreatedBy = "user@test.com" };
        await _repository.CreateAsync(schema);

        var version1 = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "1.0.0",
            JsonSchema = "{}",
            IsDefault = true,
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateVersionAsync(version1);

        var version2 = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "2.0.0",
            JsonSchema = "{}",
            IsDefault = false,
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateVersionAsync(version2);

        // Act
        await _repository.SetDefaultVersionAsync(schema.Id, version2.Id, TestTenantId);

        // Assert
        var updatedVersion1 = await _repository.GetVersionAsync(schema.Id, "1.0.0", TestTenantId);
        updatedVersion1!.IsDefault.Should().BeFalse();

        var updatedVersion2 = await _repository.GetVersionAsync(schema.Id, "2.0.0", TestTenantId);
        updatedVersion2!.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task SetDefaultVersionAsync_ShouldThrowException_WhenVersionNotExists()
    {
        // Arrange
        var schema = new Schema { Name = "TestSchema", TenantId = TestTenantId, CreatedBy = "user@test.com" };
        await _repository.CreateAsync(schema);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _repository.SetDefaultVersionAsync(schema.Id, Guid.NewGuid(), TestTenantId));
    }

    [Fact]
    public async Task ListVersionsAsync_ShouldReturnAllVersionsForSchema()
    {
        // Arrange
        var schema = new Schema { Name = "TestSchema", TenantId = TestTenantId, CreatedBy = "user@test.com" };
        await _repository.CreateAsync(schema);

        for (int i = 1; i <= 3; i++)
        {
            await _repository.CreateVersionAsync(new SchemaVersion
            {
                SchemaId = schema.Id,
                Version = $"{i}.0.0",
                JsonSchema = "{}",
                TenantId = TestTenantId,
                CreatedBy = "user@test.com"
            });
        }

        // Act
        var versions = await _repository.ListVersionsAsync(schema.Id, TestTenantId.ToString());

        // Assert
        versions.Should().HaveCount(3);
        versions.Should().OnlyContain(v => v.SchemaId == schema.Id);
        versions.Should().BeInDescendingOrder(v => v.CreatedAt);
    }

    [Fact]
    public async Task CountAsync_ShouldReturnTotalCount()
    {
        // Arrange
        for (int i = 1; i <= 15; i++)
        {
            await _repository.CreateAsync(new Schema
            {
                Name = $"Schema{i}",
                TenantId = TestTenantId,
                CreatedBy = "user@test.com"
            });
        }

        // Act
        var count = await _repository.CountAsync(TestTenantId);

        // Assert
        count.Should().Be(15);
    }

    [Fact]
    public async Task CountAsync_ShouldReturnOnlyTenantCount()
    {
        // Arrange
        await _repository.CreateAsync(new Schema { Name = "TenantA1", TenantId = TestTenantId, CreatedBy = "user@test.com" });
        await _repository.CreateAsync(new Schema { Name = "TenantA2", TenantId = TestTenantId, CreatedBy = "user@test.com" });
        await _repository.CreateAsync(new Schema { Name = "TenantB1", TenantId = OtherTenantId, CreatedBy = "user@test.com" });

        // Act
        var count = await _repository.CountAsync(TestTenantId);

        // Assert
        count.Should().Be(2);
    }

    [Fact]
    public async Task UpdateVersionAsync_ShouldUpdateVersion()
    {
        // Arrange
        var schema = new Schema { Name = "TestSchema", TenantId = TestTenantId, CreatedBy = "user@test.com" };
        await _repository.CreateAsync(schema);

        var version = new SchemaVersion
        {
            SchemaId = schema.Id,
            Version = "1.0.0",
            JsonSchema = "{\"type\": \"object\"}",
            Status = SchemaStatus.Draft,
            TenantId = TestTenantId,
            CreatedBy = "user@test.com"
        };
        await _repository.CreateVersionAsync(version);

        // Act
        version.Status = SchemaStatus.Active;
        version.JsonSchema = "{\"type\": \"object\", \"properties\": {}}";
        var result = await _repository.UpdateVersionAsync(version);

        // Assert
        result.Status.Should().Be(SchemaStatus.Active);
        result.JsonSchema.Should().Contain("properties");
    }
}
