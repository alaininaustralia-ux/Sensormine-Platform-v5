using System.Collections.Concurrent;

namespace Edge.Gateway.Services;

/// <summary>
/// Rate limiter service using sliding window algorithm
/// </summary>
public interface IRateLimiterService
{
    Task<bool> AllowRequestAsync(string deviceId);
    void ResetDevice(string deviceId);
}

public class RateLimiterService : IRateLimiterService
{
    private readonly ConcurrentDictionary<string, DeviceRateLimit> _deviceLimits = new();
    private readonly int _maxMessagesPerWindow;
    private readonly TimeSpan _windowDuration;
    private readonly ILogger<RateLimiterService> _logger;

    public RateLimiterService(ILogger<RateLimiterService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _maxMessagesPerWindow = configuration.GetValue<int>("RateLimiting:MaxMessagesPerWindow", 100);
        _windowDuration = TimeSpan.FromSeconds(configuration.GetValue<int>("RateLimiting:WindowSeconds", 60));
    }

    public Task<bool> AllowRequestAsync(string deviceId)
    {
        var limit = _deviceLimits.GetOrAdd(deviceId, _ => new DeviceRateLimit());
        
        lock (limit)
        {
            var now = DateTimeOffset.UtcNow;
            
            // Remove expired timestamps
            while (limit.Timestamps.Count > 0 && now - limit.Timestamps.Peek() > _windowDuration)
            {
                limit.Timestamps.Dequeue();
            }

            // Check if under limit
            if (limit.Timestamps.Count >= _maxMessagesPerWindow)
            {
                _logger.LogWarning(
                    "Rate limit exceeded for device {DeviceId}: {Count} messages in {Window}s",
                    deviceId,
                    limit.Timestamps.Count,
                    _windowDuration.TotalSeconds);
                return Task.FromResult(false);
            }

            // Add new timestamp
            limit.Timestamps.Enqueue(now);
            return Task.FromResult(true);
        }
    }

    public void ResetDevice(string deviceId)
    {
        _deviceLimits.TryRemove(deviceId, out _);
    }

    private class DeviceRateLimit
    {
        public Queue<DateTimeOffset> Timestamps { get; } = new();
    }
}
