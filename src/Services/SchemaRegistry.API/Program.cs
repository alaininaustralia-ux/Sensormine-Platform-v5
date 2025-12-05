using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sensormine.Storage.Data;
using Sensormine.Storage.Interfaces;
using Sensormine.Storage.Repositories;
using Sensormine.Storage.Services;
using Sensormine.AI.Services;
using SchemaRegistry.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3020", "http://localhost:3021", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add Database Context with JSON support
var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("DefaultConnection"));
dataSourceBuilder.EnableDynamicJson(); // Required for JSONB columns with List<string> etc.
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(dataSource));

// Add Repository and Services
builder.Services.AddScoped<ISchemaRepository, SchemaRepository>();
builder.Services.AddScoped<ISchemaValidationService, SchemaValidationService>();

// Add Centralized AI Metering Service (Singleton for in-memory metrics)
builder.Services.AddSingleton<IAiMeteringService, AiMeteringService>();

// Add AI Schema Generator Service
var anthropicConfig = new AnthropicConfig
{
    ApiKey = builder.Configuration["Anthropic:ApiKey"] ?? throw new InvalidOperationException("Anthropic:ApiKey not configured"),
    Model = builder.Configuration["Anthropic:Model"] ?? "claude-haiku-4-5",
    MaxTokens = int.Parse(builder.Configuration["Anthropic:MaxTokens"] ?? "8192"),
    TimeoutMinutes = int.Parse(builder.Configuration["Anthropic:TimeoutMinutes"] ?? "5")
};
builder.Services.AddSingleton(anthropicConfig);
builder.Services.AddHttpClient<IAiSchemaGeneratorService, AnthropicSchemaGeneratorService>();

var app = builder.Build();

// Apply database migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error applying database migrations");
        throw; // Re-throw to prevent startup if DB is not available
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
// Disable HTTPS redirection in development to avoid CORS issues
// app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
