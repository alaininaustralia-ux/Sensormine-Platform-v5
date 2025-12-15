using AI.API.Models;

namespace AI.API.Services;

public interface IAiAgentService
{
    Task<AiQueryResponse> ProcessQueryAsync(string userQuery, string tenantId);
}
