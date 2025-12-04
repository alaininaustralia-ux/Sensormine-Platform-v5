namespace Sensormine.Connectors;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Sensormine.Connectors.Abstractions;

/// <summary>
/// Extension methods for registering connector services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds connector services to the service collection
    /// </summary>
    public static IServiceCollection AddSensormineConnectors(this IServiceCollection services)
    {
        services.AddSingleton<IConnectorFactory, ConnectorFactory>();
        services.AddSingleton<IConnectorManager, ConnectorManager>();

        return services;
    }

    /// <summary>
    /// Adds connector services and starts them as a hosted service
    /// </summary>
    public static IServiceCollection AddSensormineConnectorsWithHosting(this IServiceCollection services)
    {
        services.AddSensormineConnectors();
        services.AddHostedService<ConnectorHostedService>();

        return services;
    }
}

/// <summary>
/// Hosted service that manages connector lifecycle
/// </summary>
public class ConnectorHostedService : IHostedService
{
    private readonly IConnectorManager _connectorManager;

    /// <summary>
    /// Creates a new connector hosted service
    /// </summary>
    public ConnectorHostedService(IConnectorManager connectorManager)
    {
        _connectorManager = connectorManager;
    }

    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await _connectorManager.StartAllAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task StopAsync(CancellationToken cancellationToken)
    {
        await _connectorManager.StopAllAsync(cancellationToken);
    }
}
