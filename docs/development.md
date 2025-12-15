# Development Guide

**Last Updated**: December 10, 2025  
**Platform Version**: v5.0  
**Status**: Production-ready development environment

> **See also**: 
> - [`technology-stack.md`](technology-stack.md) for complete technology choices and architecture decisions
> - [`local-infrastructure.md`](local-infrastructure.md) for detailed container configuration and troubleshooting
> - [`PLATFORM-STATUS.md`](PLATFORM-STATUS.md) for current implementation status and completed features

## Prerequisites

### Required Tools
- [.NET 8+ SDK](https://dotnet.microsoft.com/download) - Latest LTS version
- [Node.js 20+ LTS](https://nodejs.org/) - For frontend development
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - For running dependencies
- [Visual Studio 2022](https://visualstudio.microsoft.com/) or [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)

### Recommended Extensions (VS Code)
- C# Dev Kit
- Docker
- Kubernetes
- REST Client
- GitLens

## Project Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Orion
```

### 2. Start Local Infrastructure
```bash
# Start all infrastructure services (Kafka, MQTT, PostgreSQL, Redis, etc.)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f kafka
```

> **📚 Detailed Infrastructure Guide**: See [`local-infrastructure.md`](local-infrastructure.md) for:
> - Complete service descriptions and ports
> - Connection strings and credentials
> - Troubleshooting and best practices
> - Resource requirements and optimization

### 3. Restore & Build
```bash
# Restore NuGet packages
dotnet restore

# Build entire solution
dotnet build

# Or build specific service
dotnet build src/Services/Device.API/Device.API.csproj
```

### 4. Run Services

#### Option 1: Run Individual Service
```bash
cd src/Services/Device.API
dotnet run
```

#### Option 2: Run Multiple Services (separate terminals)
```bash
# Terminal 1 - Device API
dotnet run --project src/Services/Device.API

# Terminal 2 - Ingestion Service
dotnet run --project src/Services/Ingestion.Service

# Terminal 3 - Edge Gateway
dotnet run --project src/Services/Edge.Gateway
```

#### Option 3: Use Visual Studio
- Open `Sensormine.sln`
- Right-click solution → Configure Startup Projects
- Select "Multiple startup projects"
- Set desired services to "Start"

## Development Workflow

### Code Structure

#### Service Structure
```
Service.Name/
├── Controllers/          # API endpoints
├── Services/            # Business logic
├── Models/              # DTOs and domain models
├── Configuration/       # Service-specific config
├── Program.cs           # Entry point
└── appsettings.json     # Configuration
```

#### Shared Library Structure
```
Sensormine.LibraryName/
├── Interfaces/          # Contracts
├── Models/              # Shared models
├── Implementations/     # Default implementations (optional)
└── Extensions/          # Extension methods
```

### Creating a New Service

1. **Create Project**
```bash
dotnet new webapi -n MyService.API -o src/Services/MyService.API
dotnet sln add src/Services/MyService.API/MyService.API.csproj
```

2. **Add Shared Dependencies**
```xml
<ItemGroup>
  <ProjectReference Include="..\..\Shared\Sensormine.Core\Sensormine.Core.csproj" />
  <ProjectReference Include="..\..\Shared\Sensormine.Messaging\Sensormine.Messaging.csproj" />
</ItemGroup>
```

3. **Configure Service**
- Add health checks
- Configure OpenTelemetry
- Set up dependency injection
- Add middleware

### Coding Standards

#### Naming Conventions
```csharp
// Classes and methods: PascalCase
public class DeviceService { }
public void ProcessData() { }

// Private fields: camelCase with underscore
private readonly ILogger _logger;

// Properties: PascalCase
public string DeviceId { get; set; }

// Constants: PascalCase
private const int MaxRetries = 3;

// Interfaces: I prefix
public interface IDeviceRepository { }
```

#### Async Patterns
```csharp
// Always use async/await for I/O operations
public async Task<Device> GetDeviceAsync(string id, CancellationToken cancellationToken)
{
    return await _repository.GetByIdAsync(id, cancellationToken);
}

// Accept CancellationToken
public async Task UpdateAsync(Device device, CancellationToken cancellationToken = default)
{
    // Implementation
}
```

#### Error Handling
```csharp
// Use specific exceptions
throw new ArgumentNullException(nameof(device));
throw new InvalidOperationException("Device not found");

// Log errors with context
try
{
    await ProcessDeviceAsync(device);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to process device {DeviceId}", device.Id);
    throw;
}
```

#### Dependency Injection
```csharp
// Constructor injection (preferred)
public class DeviceService
{
    private readonly IDeviceRepository _repository;
    private readonly ILogger<DeviceService> _logger;

    public DeviceService(
        IDeviceRepository repository, 
        ILogger<DeviceService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
}

// Register in Program.cs
builder.Services.AddScoped<IDeviceRepository, DeviceRepository>();
builder.Services.AddScoped<DeviceService>();
```

### Configuration Management

#### appsettings.json Structure
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "TimescaleDB": "Host=localhost;Port=5432;Database=sensormine_timeseries",
    "Redis": "localhost:6379"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "GroupId": "device-api-group"
  },
  "OpenTelemetry": {
    "ServiceName": "Device.API",
    "JaegerEndpoint": "http://localhost:4317"
  }
}
```

#### Environment-Specific Configuration
- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Development overrides
- `appsettings.Production.json` - Production settings
- Environment variables override all

#### Accessing Configuration
```csharp
// Options pattern (preferred)
public class KafkaOptions
{
    public string BootstrapServers { get; set; }
    public string GroupId { get; set; }
}

// Registration
builder.Services.Configure<KafkaOptions>(
    builder.Configuration.GetSection("Kafka"));

// Usage
public class MyService
{
    private readonly KafkaOptions _options;

    public MyService(IOptions<KafkaOptions> options)
    {
        _options = options.Value;
    }
}
```

## Testing

### Unit Tests
```csharp
public class DeviceServiceTests
{
    private readonly Mock<IDeviceRepository> _mockRepository;
    private readonly DeviceService _service;

    public DeviceServiceTests()
    {
        _mockRepository = new Mock<IDeviceRepository>();
        _service = new DeviceService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetDeviceAsync_ValidId_ReturnsDevice()
    {
        // Arrange
        var deviceId = "device-123";
        var expectedDevice = new Device { DeviceId = deviceId };
        _mockRepository
            .Setup(r => r.GetByIdAsync(deviceId, default))
            .ReturnsAsync(expectedDevice);

        // Act
        var result = await _service.GetDeviceAsync(deviceId);

        // Assert
        result.Should().NotBeNull();
        result.DeviceId.Should().Be(deviceId);
    }
}
```

### Integration Tests
```csharp
public class DeviceApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public DeviceApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetDevice_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/api/devices/device-123");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

### Running Tests
```bash
# All tests
dotnet test

# Specific project
dotnet test tests/Sensormine.Core.Tests

# With coverage
dotnet test /p:CollectCoverage=true

# Filter by category
dotnet test --filter Category=Unit
dotnet test --filter Category=Integration
```

## Debugging

### Visual Studio
1. Set breakpoints in code
2. Press F5 or click "Start Debugging"
3. Choose service to debug

### VS Code
1. Open Debug panel (Ctrl+Shift+D)
2. Select configuration (e.g., "Launch Device.API")
3. Press F5

### Attach to Running Container
```bash
# Find container
docker ps

# Attach debugger (VS 2022)
Debug → Attach to Process → Docker (Linux Container)
```

## Database Migrations

### Entity Framework Core
```bash
# Add migration
dotnet ef migrations add InitialCreate --project src/Services/Device.API

# Update database
dotnet ef database update --project src/Services/Device.API

# Revert migration
dotnet ef database update PreviousMigration --project src/Services/Device.API
```

## API Testing

### Using Swagger UI
1. Run service
2. Navigate to `http://localhost:5000/swagger`
3. Try out endpoints

### Using .http Files
Create `Requests.http`:
```http
### Get Device
GET http://localhost:5000/api/devices/device-123
Authorization: Bearer {{token}}

### Create Device
POST http://localhost:5000/api/devices
Content-Type: application/json

{
  "deviceId": "device-456",
  "name": "Temperature Sensor",
  "deviceType": "SENSOR"
}
```

## Performance Profiling

### dotnet-trace
```bash
# Install tool
dotnet tool install --global dotnet-trace

# Collect trace
dotnet trace collect --process-id <pid>

# View in PerfView or Visual Studio
```

### BenchmarkDotNet
```csharp
[MemoryDiagnoser]
public class DeviceBenchmarks
{
    [Benchmark]
    public void SerializeDevice()
    {
        var device = new Device { DeviceId = "test" };
        JsonSerializer.Serialize(device);
    }
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process
taskkill /PID <pid> /F
```

#### Docker Issues
```bash
# Reset Docker
docker system prune -a

# Restart services
docker-compose down
docker-compose up -d
```

#### Build Errors
```bash
# Clean solution
dotnet clean
rm -rf **/bin **/obj

# Restore packages
dotnet restore

# Rebuild
dotnet build
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes following coding standards
3. Write tests
4. Ensure all tests pass: `dotnet test`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request

## Resources

- [.NET Documentation](https://docs.microsoft.com/dotnet)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
