using Identity.API.Data;
using Identity.API.Repositories;
using Identity.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add database context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=sensormine_identity;Username=sensormine;Password=sensormine123";

// Configure Npgsql data source with dynamic JSON support
var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<IdentityDbContext>(options =>
{
    options.UseNpgsql(dataSource);
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});

// Add repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserInvitationRepository, UserInvitationRepository>();

// Add services
builder.Services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddHttpContextAccessor();

// Add controllers
builder.Services.AddControllers();

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

// Add JWT authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] 
    ?? "sensormine-dev-secret-key-change-in-production-minimum-32-characters-long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "sensormine";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "sensormine-app";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add OpenAPI/Swagger
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Apply database migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Database migrations applied successfully");

        // Seed development data
        if (app.Environment.IsDevelopment())
        {
            await SeedDevelopmentData(dbContext, passwordHasher, logger);
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error applying database migrations");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

// Disable HTTPS redirection in development to avoid CORS issues
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "Identity.API" }));

app.Run();

/// <summary>
/// Seed development data (tenant and admin user)
/// </summary>
static async Task SeedDevelopmentData(IdentityDbContext dbContext, IPasswordHasher passwordHasher, ILogger logger)
{
    var defaultTenantId = "00000000-0000-0000-0000-000000000001";
    
    // Check if data already exists
    if (dbContext.Users.Any(u => u.TenantId == defaultTenantId))
    {
        logger.LogInformation("Development data already seeded");
        return;
    }

    logger.LogInformation("Seeding development data...");

    // Create admin user
    var adminUser = new Sensormine.Core.Models.User
    {
        Id = Guid.NewGuid(),
        TenantId = defaultTenantId,
        Email = "admin@sensormine.local",
        FullName = "System Administrator",
        PasswordHash = passwordHasher.HashPassword("Admin123!"),
        Role = Sensormine.Core.Models.UserRole.Administrator,
        IsActive = true,
        IsSuperAdmin = true,
        CreatedAt = DateTimeOffset.UtcNow
    };

    // Create viewer user
    var viewerUser = new Sensormine.Core.Models.User
    {
        Id = Guid.NewGuid(),
        TenantId = defaultTenantId,
        Email = "user@sensormine.local",
        FullName = "Demo User",
        PasswordHash = passwordHasher.HashPassword("User123!"),
        Role = Sensormine.Core.Models.UserRole.Viewer,
        IsActive = true,
        IsSuperAdmin = false,
        CreatedAt = DateTimeOffset.UtcNow
    };

    // Create dashboard editor user
    var editorUser = new Sensormine.Core.Models.User
    {
        Id = Guid.NewGuid(),
        TenantId = defaultTenantId,
        Email = "editor@sensormine.local",
        FullName = "Dashboard Editor",
        PasswordHash = passwordHasher.HashPassword("Editor123!"),
        Role = Sensormine.Core.Models.UserRole.DashboardEditor,
        IsActive = true,
        IsSuperAdmin = false,
        CreatedAt = DateTimeOffset.UtcNow
    };

    // Create super admin user for Alain Blanchette
    var alainUser = new Sensormine.Core.Models.User
    {
        Id = Guid.NewGuid(),
        TenantId = defaultTenantId,
        Email = "alain.blanchette@altra.cloud",
        FullName = "Alain Blanchette",
        PasswordHash = passwordHasher.HashPassword("Admin123!"),
        Role = Sensormine.Core.Models.UserRole.Administrator,
        IsActive = true,
        IsSuperAdmin = true,
        MustChangePassword = true,
        CreatedAt = DateTimeOffset.UtcNow
    };

    dbContext.Users.AddRange(adminUser, viewerUser, editorUser, alainUser);
    await dbContext.SaveChangesAsync();

    logger.LogInformation("Development data seeded successfully");
    logger.LogInformation("Admin user: admin@sensormine.local / Admin123!");
    logger.LogInformation("Viewer user: user@sensormine.local / User123!");
    logger.LogInformation("Editor user: editor@sensormine.local / Editor123!");
    logger.LogInformation("Super Admin: alain.blanchette@altra.cloud / Admin123! (must change password)");
}
