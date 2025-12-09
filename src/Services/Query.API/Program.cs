using Query.API.Services;
using Query.API.GraphQL;
using Sensormine.Core.Interfaces;
using Sensormine.Storage.TimeSeries;
using Sensormine.Storage;
using Sensormine.Storage.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

// Add GraphQL
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query.API.GraphQL.Query>()
    .AddType<TelemetryDataType>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3020", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sensormine Query API",
        Version = "v1",
        Description = "Time-series data query API for the Sensormine Platform. " +
                      "Provides endpoints for querying, aggregating, and analyzing time-series sensor data.",
        Contact = new OpenApiContact
        {
            Name = "Sensormine Platform",
            Email = "support@sensormine.io"
        }
    });
    
    // Include XML comments for API documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Register tenant provider (default implementation)
builder.Services.AddScoped<ITenantProvider, DefaultTenantProvider>();

// Register time-series repository (in-memory for development, use TimescaleDb in production)
var connectionString = builder.Configuration.GetConnectionString("TimescaleDb");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddTimescaleDbTimeSeriesRepository(connectionString);
}
else
{
    builder.Services.AddInMemoryTimeSeriesRepository();
}

// Register Device repository for device metadata access
var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("DefaultConnection"));
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<Sensormine.Storage.Data.ApplicationDbContext>(options =>
{
    options.UseNpgsql(dataSource);
});
builder.Services.AddScoped<IDeviceRepository, DeviceRepository>();

// Register query service
builder.Services.AddScoped<ITimeSeriesQueryService, TimeSeriesQueryService>();

// Register Schema Registry HTTP client
builder.Services.AddHttpClient<ISchemaRegistryClient, SchemaRegistryClient>(client =>
{
    var schemaRegistryUrl = builder.Configuration.GetValue<string>("ServiceUrls:SchemaRegistry") 
                            ?? "http://localhost:5021";
    client.BaseAddress = new Uri(schemaRegistryUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Register Digital Twin HTTP client for asset-based queries
builder.Services.AddHttpClient("DigitalTwin", client =>
{
    var digitalTwinUrl = builder.Configuration.GetValue<string>("ServiceUrls:DigitalTwin") 
                         ?? "http://localhost:5297";
    client.BaseAddress = new Uri(digitalTwinUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
    // Add tenant header from current context in the controller
});

// Register telemetry parser service
builder.Services.AddScoped<ITelemetryParserService, TelemetryParserService>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sensormine Query API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger at root
    });
}

// Disable HTTPS redirection in development to avoid CORS preflight issues
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

// Add GraphQL endpoint
app.MapGraphQL("/graphql");

// Add a simple info endpoint
app.MapGet("/info", () => new
{
    Service = "Query.API",
    Version = "1.0.0",
    Description = "Sensormine Time-Series Query API",
    Endpoints = new[]
    {
        "GET  /api/timeseries/{measurement}",
        "POST /api/timeseries/{measurement}/query",
        "POST /api/timeseries/{measurement}/aggregate",
        "GET  /api/timeseries/{measurement}/device/{deviceId}/latest",
        "POST /api/timeseries/{measurement}/devices/latest",
        "POST /graphql - GraphQL endpoint with Banana Cake Pop UI"
    }
}).WithName("ServiceInfo").WithTags("Info");

app.Run();

/// <summary>
/// Default tenant provider implementation that extracts tenant ID from JWT claims
/// </summary>
public class DefaultTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DefaultTenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetTenantId()
    {
        var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
        
        if (string.IsNullOrEmpty(tenantIdClaim))
        {
            // Fallback to default tenant for development/testing
            return "00000000-0000-0000-0000-000000000001";
        }

        return tenantIdClaim;
    }

    public void SetTenantId(string tenantId)
    {
        // Not used when extracting from JWT, but required by interface
        throw new NotSupportedException("SetTenantId is not supported when using JWT-based tenant resolution. Tenant ID is extracted from JWT claims.");
    }
}
