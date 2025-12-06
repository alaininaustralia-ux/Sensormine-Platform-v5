using NexusConfiguration.API.DTOs;

namespace NexusConfiguration.API.Services;

public interface ICustomLogicService
{
    Task<GenerateCustomLogicResponse> GenerateLogicAsync(GenerateCustomLogicRequest request, Guid tenantId, string? userId = null);
    Task<ValidateCustomLogicResponse> ValidateLogicAsync(ValidateCustomLogicRequest request);
}
