using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Sensormine.AI.Services;

/// <summary>
/// Centralized AI metering service for tracking all AI API calls, usage, and costs
/// </summary>
public interface IAiMeteringService
{
    /// <summary>
    /// Call an AI model with automatic metering and tracking
    /// </summary>
    /// <typeparam name="TRequest">Request type</typeparam>
    /// <typeparam name="TResponse">Response type</typeparam>
    /// <param name="provider">AI provider (Anthropic, OpenAI, etc.)</param>
    /// <param name="model">Model identifier</param>
    /// <param name="operation">Operation name for tracking</param>
    /// <param name="request">Request data</param>
    /// <param name="callFunc">Function that makes the actual AI API call</param>
    /// <returns>Metered AI response with usage statistics</returns>
    Task<AiMeteredResponse<TResponse>> CallAiAsync<TRequest, TResponse>(
        string provider,
        string model,
        string operation,
        TRequest request,
        Func<TRequest, Task<TResponse>> callFunc);

    /// <summary>
    /// Get usage statistics for a specific tenant
    /// </summary>
    Task<AiUsageStatistics> GetUsageStatisticsAsync(string tenantId, DateTime? startDate = null, DateTime? endDate = null);

    /// <summary>
    /// Get usage statistics across all tenants
    /// </summary>
    Task<List<AiUsageStatistics>> GetAllUsageStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null);
}

/// <summary>
/// Metered AI response wrapper with usage tracking
/// </summary>
public class AiMeteredResponse<T>
{
    public T Response { get; set; } = default!;
    public AiUsageMetrics Metrics { get; set; } = new();
    public bool Success { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Detailed metrics for a single AI call
/// </summary>
public class AiUsageMetrics
{
    public string CallId { get; set; } = Guid.NewGuid().ToString();
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public long DurationMs { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int TotalTokens => InputTokens + OutputTokens;
    public decimal EstimatedCost { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Aggregated usage statistics
/// </summary>
public class AiUsageStatistics
{
    public string TenantId { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int TotalCalls { get; set; }
    public int SuccessfulCalls { get; set; }
    public int FailedCalls { get; set; }
    public long TotalInputTokens { get; set; }
    public long TotalOutputTokens { get; set; }
    public long TotalTokens => TotalInputTokens + TotalOutputTokens;
    public decimal TotalCost { get; set; }
    public long AverageDurationMs { get; set; }
    public Dictionary<string, int> CallsByProvider { get; set; } = new();
    public Dictionary<string, int> CallsByModel { get; set; } = new();
    public Dictionary<string, int> CallsByOperation { get; set; } = new();
}
