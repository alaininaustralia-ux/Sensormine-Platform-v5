using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Polly;
using Polly.Extensions.Http;
using Sensormine.MCP.Server.Middleware;
using Sensormine.MCP.Server.Services;
using Sensormine.MCP.Server.Services.Clients;
using Sensormine.MCP.Server.Services.Resources;
using Sensormine.MCP.Server.Services.Tools;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sensormine MCP Server",
        Version = "v1",
        Description = "Model Context Protocol server for AI agent integration"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Jwt:Authority"];
        options.Audience = builder.Configuration["Jwt:Audience"];
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = builder.Configuration.GetValue<bool>("Jwt:ValidateIssuer"),
            ValidateAudience = builder.Configuration.GetValue<bool>("Jwt:ValidateAudience"),
            ValidateLifetime = builder.Configuration.GetValue<bool>("Jwt:ValidateLifetime"),
            ValidateIssuerSigningKey = builder.Configuration.GetValue<bool>("Jwt:ValidateIssuerSigningKey")
        };
    });

builder.Services.AddAuthorization();

// Redis for caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
    options.InstanceName = builder.Configuration["Redis:InstanceName"];
});

// HTTP Clients with Polly for resilience
var retryPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

var timeoutPolicy = Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(30));

builder.Services.AddHttpClient<IDeviceApiClient, DeviceApiClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:DeviceApi"]!);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
})
.AddPolicyHandler(retryPolicy)
.AddPolicyHandler(timeoutPolicy);

builder.Services.AddHttpClient<IQueryApiClient, QueryApiClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:QueryApi"]!);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
})
.AddPolicyHandler(retryPolicy)
.AddPolicyHandler(timeoutPolicy);

builder.Services.AddHttpClient<IDigitalTwinApiClient, DigitalTwinApiClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:DigitalTwinApi"]!);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
})
.AddPolicyHandler(retryPolicy)
.AddPolicyHandler(timeoutPolicy);

// Resource Providers
builder.Services.AddScoped<IResourceProvider, DeviceResourceProvider>();
builder.Services.AddScoped<IResourceProvider, AssetResourceProvider>();

// Tool Handlers
builder.Services.AddScoped<IToolHandler, QueryDevicesTool>();
builder.Services.AddScoped<IToolHandler, QueryTelemetryTool>();
builder.Services.AddScoped<IToolHandler, QueryAssetHierarchyTool>();

// CORS - Allow frontend origins
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:3020",  // Frontend
                "http://localhost:3021",  // Device Simulator
                "http://localhost:5000",  // API Gateway
                "http://localhost:5134"   // API Gateway alt port
            )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Health checks
builder.Services.AddHealthChecks()
    .AddRedis(builder.Configuration["Redis:ConnectionString"]!)
    .AddUrlGroup(new Uri(builder.Configuration["ServiceUrls:DeviceApi"]! + "/health"), name: "device-api")
    .AddUrlGroup(new Uri(builder.Configuration["ServiceUrls:QueryApi"]! + "/health"), name: "query-api");

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// Tenant context middleware
app.UseMiddleware<TenantContextMiddleware>();

app.MapControllers();

// Health check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");

app.Run();
