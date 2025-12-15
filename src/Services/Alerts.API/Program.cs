using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Interfaces;
using Sensormine.Storage.Data;
using Sensormine.Storage.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Allow string to enum conversion
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123";

// Configure Npgsql for dynamic JSON serialization
var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(dataSource)
           .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Add Repositories
builder.Services.AddScoped<IAlertRuleRepository, AlertRuleRepository>();
builder.Services.AddScoped<IAlertInstanceRepository, AlertInstanceRepository>();

// Add Notification Service
builder.Services.Configure<Alerts.API.Services.NotificationSettings>(
    builder.Configuration.GetSection("Notifications"));
builder.Services.AddHttpClient(); // For webhook notifications
builder.Services.AddScoped<Alerts.API.Services.INotificationService, Alerts.API.Services.NotificationService>();

// Add Query.API HttpClient
builder.Services.AddHttpClient("QueryApi", client =>
{
    var queryApiUrl = builder.Configuration["QueryApiUrl"] ?? "http://localhost:5079";
    client.BaseAddress = new Uri(queryApiUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Add Background Services
builder.Services.AddHostedService<Alerts.API.Services.AlertEvaluationService>();

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

var app = builder.Build();

// Run database migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
// Disable HTTPS redirection in development to avoid CORS issues
// app.UseHttpsRedirection();

app.MapControllers();

app.Run();
