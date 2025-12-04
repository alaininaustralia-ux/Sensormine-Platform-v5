namespace Sensormine.Storage.TimeSeries;

using Microsoft.Extensions.DependencyInjection;
using Sensormine.Storage.Interfaces;

/// <summary>
/// Extension methods for registering time-series services
/// </summary>
public static class TimeSeriesServiceExtensions
{
    /// <summary>
    /// Adds in-memory time-series repository (for development/testing)
    /// </summary>
    public static IServiceCollection AddInMemoryTimeSeriesRepository(this IServiceCollection services)
    {
        services.AddScoped<ITimeSeriesRepository>(sp =>
        {
            var tenantProvider = sp.GetService<Core.Interfaces.ITenantProvider>();
            var tenantId = tenantProvider?.GetTenantId() ?? "default";
            return new InMemoryTimeSeriesRepository(tenantId);
        });
        
        return services;
    }

    /// <summary>
    /// Adds TimescaleDB time-series repository
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="connectionString">PostgreSQL/TimescaleDB connection string</param>
    public static IServiceCollection AddTimescaleDbTimeSeriesRepository(
        this IServiceCollection services, 
        string connectionString)
    {
        services.AddScoped<ITimeSeriesRepository>(sp =>
        {
            var tenantProvider = sp.GetService<Core.Interfaces.ITenantProvider>();
            var tenantId = tenantProvider?.GetTenantId() ?? "default";
            var connection = new Npgsql.NpgsqlConnection(connectionString);
            return new TimescaleDbRepository(connection, tenantId);
        });
        
        return services;
    }
}
