using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Sensormine.Core.Security;

/// <summary>
/// Extension methods for registering secret providers
/// </summary>
public static class SecretProviderExtensions
{
    /// <summary>
    /// Adds secret provider based on configuration
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddSecretProvider(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var providerType = configuration["SecretProvider:Type"] ?? "AppSettings";
        
        switch (providerType.ToLowerInvariant())
        {
            case "kubernetes":
            case "k8s":
                services.AddSingleton<ISecretProvider>(sp =>
                {
                    var logger = sp.GetRequiredService<ILogger<KubernetesSecretProvider>>();
                    var basePath = configuration["SecretProvider:Kubernetes:BasePath"];
                    return new KubernetesSecretProvider(logger, basePath);
                });
                break;

            case "appsettings":
            case "development":
            default:
                services.AddSingleton<ISecretProvider, AppSettingsSecretProvider>();
                break;
        }

        return services;
    }

    /// <summary>
    /// Gets a connection string from the secret provider
    /// </summary>
    /// <param name="secretProvider">Secret provider instance</param>
    /// <param name="name">Connection string name (e.g., "DefaultConnection")</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Connection string value</returns>
    public static async Task<string> GetConnectionStringAsync(
        this ISecretProvider secretProvider,
        string name,
        CancellationToken cancellationToken = default)
    {
        // Try ConnectionStrings__Name format (environment variable style)
        var envStyleName = $"ConnectionStrings__{name}";
        if (await secretProvider.SecretExistsAsync(envStyleName, cancellationToken))
        {
            return await secretProvider.GetSecretAsync(envStyleName, cancellationToken);
        }

        // Try direct name
        return await secretProvider.GetSecretAsync(name, cancellationToken);
    }

    /// <summary>
    /// Helper to get database connection string
    /// </summary>
    public static Task<string> GetDatabaseConnectionStringAsync(
        this ISecretProvider secretProvider,
        CancellationToken cancellationToken = default)
    {
        return secretProvider.GetConnectionStringAsync("DefaultConnection", cancellationToken);
    }

    /// <summary>
    /// Helper to get TimescaleDB connection string
    /// </summary>
    public static Task<string> GetTimescaleConnectionStringAsync(
        this ISecretProvider secretProvider,
        CancellationToken cancellationToken = default)
    {
        return secretProvider.GetConnectionStringAsync("TimescaleDb", cancellationToken);
    }
}
