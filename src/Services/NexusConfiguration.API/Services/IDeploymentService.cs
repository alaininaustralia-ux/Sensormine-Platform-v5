using NexusConfiguration.API.DTOs;

namespace NexusConfiguration.API.Services;

public interface IDeploymentService
{
    Task<DeployConfigurationResponse> DeployConfigurationAsync(DeployConfigurationRequest request, Guid tenantId, string? userId = null);
}
