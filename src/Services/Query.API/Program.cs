using Query.API.Services;
using Sensormine.Core.Interfaces;
using Sensormine.Storage.TimeSeries;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

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
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
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

// Register query service
builder.Services.AddScoped<ITimeSeriesQueryService, TimeSeriesQueryService>();

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

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

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
        "POST /api/timeseries/{measurement}/devices/latest"
    }
}).WithName("ServiceInfo").WithTags("Info");

app.Run();

/// <summary>
/// Default tenant provider implementation
/// </summary>
public class DefaultTenantProvider : ITenantProvider
{
    private string _tenantId = "default";

    public string GetTenantId() => _tenantId;

    public void SetTenantId(string tenantId)
    {
        _tenantId = tenantId ?? throw new ArgumentNullException(nameof(tenantId));
    }
}
