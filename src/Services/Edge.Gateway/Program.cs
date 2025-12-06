using Edge.Gateway.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Edge Gateway API", Version = "v1" });
});

// Add Device API Client
builder.Services.AddHttpClient<IDeviceApiClient, DeviceApiClient>();

// Add Rate Limiter Service
builder.Services.AddSingleton<IRateLimiterService, RateLimiterService>();

// Add MQTT background service
builder.Services.AddHostedService<MqttService>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Edge Gateway API v1"));
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// Status endpoint
app.MapGet("/", () => new
{
    service = "Edge Gateway",
    version = "1.0.0",
    status = "running",
    mqtt = new { port = 1883, status = "listening" }
});

app.Run();
