using Ingestion.Service.Services;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.TimeSeries;
using Npgsql;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Ingestion Service API", Version = "v1" });
});

// Add TimescaleDB repository with connection pooling
var connectionString = builder.Configuration.GetConnectionString("TimescaleDb") 
    ?? "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123";

// Configure connection pooling
var pooledConnectionString = new NpgsqlConnectionStringBuilder(connectionString)
{
    Pooling = true,
    MinPoolSize = 5,
    MaxPoolSize = 100,
    ConnectionIdleLifetime = 300, // 5 minutes
    ConnectionPruningInterval = 10
}.ToString();

// Configure Npgsql data source with dynamic JSON support
var dataSourceBuilder = new NpgsqlDataSourceBuilder(pooledConnectionString);
dataSourceBuilder.EnableDynamicJson(); // Required for Dictionary<string, object> to JSONB serialization
var dataSource = dataSourceBuilder.Build();

builder.Services.AddScoped<IDbConnection>(sp => dataSource.CreateConnection());
builder.Services.AddScoped<ITimeSeriesRepository>(sp =>
{
    var connection = sp.GetRequiredService<IDbConnection>();
    // TODO: Implement proper tenant context resolution
    // For now, use empty GUID until multi-tenant authentication is implemented
    return new TimescaleDbRepository(connection, "00000000-0000-0000-0000-000000000000");
});

// Add Schema Registry Client
builder.Services.AddHttpClient<ISchemaRegistryClient, SchemaRegistryClient>();

// Add Dead Letter Queue Service
builder.Services.AddSingleton<IDeadLetterQueueService, DeadLetterQueueService>();

// Add Kafka consumer background service
builder.Services.AddHostedService<TelemetryConsumerService>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ingestion Service API v1"));
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// Status endpoint
app.MapGet("/", () => new
{
    service = "Ingestion Service",
    version = "1.0.0",
    status = "running",
    kafka = new { topic = "telemetry.raw", status = "consuming" },
    database = new { type = "TimescaleDB", status = "connected" }
});

app.Run();
