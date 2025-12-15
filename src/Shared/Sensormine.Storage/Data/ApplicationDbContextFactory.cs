using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Sensormine.Storage.Data;

/// <summary>
/// Design-time DbContext factory for Entity Framework migrations
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        
        // Use a connection string for migrations - this is only used at design time
        // The actual connection string is configured in appsettings.json for each service
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123",
            npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
            });

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
