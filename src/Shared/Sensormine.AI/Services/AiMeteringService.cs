using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace Sensormine.AI.Services;

/// <summary>
/// In-memory implementation of AI metering service with Redis/database persistence support
/// </summary>
public class AiMeteringService : IAiMeteringService
{
    private readonly ILogger<AiMeteringService> _logger;
    private readonly ConcurrentBag<AiUsageMetrics> _metricsStore;
    private readonly Dictionary<string, decimal> _costPerMillionTokens;

    public AiMeteringService(ILogger<AiMeteringService> logger)
    {
        _logger = logger;
        _metricsStore = new ConcurrentBag<AiUsageMetrics>();
        
        // Cost per million tokens (input + output combined for simplicity)
        // Update these based on actual provider pricing
        _costPerMillionTokens = new Dictionary<string, decimal>
        {
            { "anthropic:claude-haiku-4-5", 0.25m }, // $0.25 per 1M tokens (Haiku pricing)
            { "anthropic:claude-sonnet-3-5", 3.00m }, // $3.00 per 1M tokens
            { "anthropic:claude-opus-3", 15.00m }, // $15.00 per 1M tokens
            { "openai:gpt-4", 30.00m },
            { "openai:gpt-3.5-turbo", 0.50m },
        };
    }

    public async Task<AiMeteredResponse<TResponse>> CallAiAsync<TRequest, TResponse>(
        string provider,
        string model,
        string operation,
        TRequest request,
        Func<TRequest, Task<TResponse>> callFunc)
    {
        var stopwatch = Stopwatch.StartNew();
        var metrics = new AiUsageMetrics
        {
            Provider = provider,
            Model = model,
            Operation = operation,
            TenantId = GetCurrentTenantId(), // TODO: Implement tenant context
            Timestamp = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation(
                "AI Call Started: Provider={Provider}, Model={Model}, Operation={Operation}, CallId={CallId}",
                provider, model, operation, metrics.CallId);

            // Make the actual AI call
            var response = await callFunc(request);
            stopwatch.Stop();

            metrics.DurationMs = stopwatch.ElapsedMilliseconds;
            metrics.Success = true;

            // Extract token counts from response if available
            ExtractTokenCounts(response, metrics);

            // Calculate cost
            metrics.EstimatedCost = CalculateCost(provider, model, metrics.TotalTokens);

            _logger.LogInformation(
                "AI Call Completed: CallId={CallId}, Duration={Duration}ms, Tokens={Tokens}, Cost=${Cost:F4}",
                metrics.CallId, metrics.DurationMs, metrics.TotalTokens, metrics.EstimatedCost);

            // Store metrics
            _metricsStore.Add(metrics);

            return new AiMeteredResponse<TResponse>
            {
                Response = response,
                Metrics = metrics,
                Success = true
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            metrics.DurationMs = stopwatch.ElapsedMilliseconds;
            metrics.Success = false;
            metrics.ErrorMessage = ex.Message;

            _logger.LogError(ex,
                "AI Call Failed: CallId={CallId}, Provider={Provider}, Model={Model}, Operation={Operation}, Duration={Duration}ms",
                metrics.CallId, provider, model, operation, metrics.DurationMs);

            // Store failed call metrics
            _metricsStore.Add(metrics);

            return new AiMeteredResponse<TResponse>
            {
                Metrics = metrics,
                Success = false,
                Error = ex.Message
            };
        }
    }

    public Task<AiUsageStatistics> GetUsageStatisticsAsync(string tenantId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var metrics = _metricsStore
            .Where(m => m.TenantId == tenantId && m.Timestamp >= start && m.Timestamp <= end)
            .ToList();

        var stats = AggregateMetrics(tenantId, metrics, start, end);
        return Task.FromResult(stats);
    }

    public Task<List<AiUsageStatistics>> GetAllUsageStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var allMetrics = _metricsStore
            .Where(m => m.Timestamp >= start && m.Timestamp <= end)
            .ToList();

        var statsByTenant = allMetrics
            .GroupBy(m => m.TenantId)
            .Select(g => AggregateMetrics(g.Key, g.ToList(), start, end))
            .ToList();

        return Task.FromResult(statsByTenant);
    }

    private AiUsageStatistics AggregateMetrics(string tenantId, List<AiUsageMetrics> metrics, DateTime start, DateTime end)
    {
        var stats = new AiUsageStatistics
        {
            TenantId = tenantId,
            PeriodStart = start,
            PeriodEnd = end,
            TotalCalls = metrics.Count,
            SuccessfulCalls = metrics.Count(m => m.Success),
            FailedCalls = metrics.Count(m => !m.Success),
            TotalInputTokens = metrics.Sum(m => m.InputTokens),
            TotalOutputTokens = metrics.Sum(m => m.OutputTokens),
            TotalCost = metrics.Sum(m => m.EstimatedCost),
            AverageDurationMs = metrics.Any() ? (long)metrics.Average(m => m.DurationMs) : 0
        };

        // Aggregate by provider
        stats.CallsByProvider = metrics
            .GroupBy(m => m.Provider)
            .ToDictionary(g => g.Key, g => g.Count());

        // Aggregate by model
        stats.CallsByModel = metrics
            .GroupBy(m => m.Model)
            .ToDictionary(g => g.Key, g => g.Count());

        // Aggregate by operation
        stats.CallsByOperation = metrics
            .GroupBy(m => m.Operation)
            .ToDictionary(g => g.Key, g => g.Count());

        return stats;
    }

    private void ExtractTokenCounts<TResponse>(TResponse response, AiUsageMetrics metrics)
    {
        // Try to extract token counts from response using reflection
        // Different providers have different response formats
        var responseType = response?.GetType();
        if (responseType == null) return;

        // Anthropic Claude response format
        var usageProperty = responseType.GetProperty("usage");
        if (usageProperty != null)
        {
            var usage = usageProperty.GetValue(response);
            if (usage != null)
            {
                var inputTokensProperty = usage.GetType().GetProperty("input_tokens");
                var outputTokensProperty = usage.GetType().GetProperty("output_tokens");

                if (inputTokensProperty != null)
                    metrics.InputTokens = (int)(inputTokensProperty.GetValue(usage) ?? 0);
                if (outputTokensProperty != null)
                    metrics.OutputTokens = (int)(outputTokensProperty.GetValue(usage) ?? 0);
            }
        }

        // If no token data found, estimate based on response size
        if (metrics.TotalTokens == 0)
        {
            var responseJson = System.Text.Json.JsonSerializer.Serialize(response);
            metrics.InputTokens = EstimateTokens(responseJson) / 2; // Rough estimate
            metrics.OutputTokens = EstimateTokens(responseJson) / 2;
        }
    }

    private int EstimateTokens(string text)
    {
        // Rough estimation: 1 token ≈ 4 characters
        return text.Length / 4;
    }

    private decimal CalculateCost(string provider, string model, int totalTokens)
    {
        var key = $"{provider.ToLower()}:{model.ToLower()}";
        
        if (_costPerMillionTokens.TryGetValue(key, out var costPerMillion))
        {
            return (totalTokens / 1_000_000m) * costPerMillion;
        }

        // Default fallback cost
        _logger.LogWarning("No cost data for {Provider}:{Model}, using default rate", provider, model);
        return (totalTokens / 1_000_000m) * 1.00m; // $1 per 1M tokens default
    }

    private string GetCurrentTenantId()
    {
        // TODO: Get from HttpContext or authentication context
        // For now, return a default tenant
        return "default-tenant";
    }
}
