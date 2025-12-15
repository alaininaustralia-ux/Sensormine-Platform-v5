using Microsoft.EntityFrameworkCore;
using Sensormine.Storage.Data;
using Template.API.Services;
using FluentValidation;
using System.Text.Json.Serialization;
using Polly;
using Polly.Extensions.Http;
using Minio;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Template API", Version = "v1" });
});

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// HttpClients
builder.Services.AddHttpClient<SchemaRegistryService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:SchemaRegistryApi"]!);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<DeviceService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:DeviceApi"]!);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<DashboardService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:DashboardApi"]!);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<AlertsService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:AlertsApi"]!);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<DigitalTwinService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:DigitalTwinApi"]!);
    client.Timeout = TimeSpan.FromSeconds(30);
});

// MinIO
var minioConfig = builder.Configuration.GetSection("MinIO");
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    return new MinioClient()
        .WithEndpoint(minioConfig["Endpoint"])
        .WithCredentials(minioConfig["AccessKey"], minioConfig["SecretKey"])
        .WithSSL(minioConfig.GetValue<bool>("UseSsl"))
        .Build();
});

// Services
builder.Services.AddScoped<TemplateService>();
builder.Services.AddScoped<ExportService>();
builder.Services.AddScoped<ImportService>();
builder.Services.AddScoped<ValidationService>();
builder.Services.AddScoped<IWidgetStorageService, MinioWidgetStorageService>();
builder.Services.AddScoped<IWidgetValidationService, WidgetValidationService>();

// Validators
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.MapHealthChecks("/health");

app.Run();
