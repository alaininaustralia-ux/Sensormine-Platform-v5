using NexusConfiguration.API.DTOs;

namespace NexusConfiguration.API.Services;

public interface IDocumentParsingService
{
    Task<ParseDocumentResponse> ParseDocumentAsync(ParseDocumentRequest request, Guid tenantId, string? userId = null);
}
