using Microsoft.EntityFrameworkCore;
using NexusConfiguration.API.Data;
using NexusConfiguration.API.Repositories;
using NexusConfiguration.API.Services;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Nexus Configuration API",
        Version = "v1",
        Description = "API for creating and managing Nexus device configurations with AI-powered document parsing"
    });
});

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=sensormine_nexus;Username=postgres;Password=postgres";

var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<NexusConfigurationDbContext>(options =>
    options.UseNpgsql(dataSource));

// Register repositories
builder.Services.AddScoped<INexusConfigurationRepository, NexusConfigurationRepository>();

// Register application services
builder.Services.AddScoped<IDocumentParsingService, DocumentParsingService>();
builder.Services.AddScoped<ICustomLogicService, CustomLogicService>();
builder.Services.AddScoped<IDeploymentService, DeploymentService>();

// Add HttpClient for external API calls
builder.Services.AddHttpClient();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3020", "http://localhost:3021")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<NexusConfigurationDbContext>();

var app = builder.Build();

// Apply database migrations automatically
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<NexusConfigurationDbContext>();
    try
    {
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error applying database migrations");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Nexus Configuration API v1");
    });
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

app.Run();
