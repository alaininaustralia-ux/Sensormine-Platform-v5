using Microsoft.EntityFrameworkCore;
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

// Add Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
