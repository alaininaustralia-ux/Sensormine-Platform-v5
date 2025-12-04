namespace Sensormine.Connectors.Abstractions;

using Microsoft.Extensions.Logging;
using Sensormine.Connectors.Models;
using System.Diagnostics;

/// <summary>
/// Base class for all connector implementations
/// </summary>
public abstract class ConnectorBase : IConnector
{
    protected readonly ILogger Logger;
    protected readonly ConnectorConfiguration Configuration;
    private readonly object _statusLock = new();
    private ConnectionStatus _status = ConnectionStatus.Disconnected;
    private string? _lastError;
    private DateTimeOffset? _lastDataReceivedAt;
    private long _successfulReads;
    private long _failedReads;
    private readonly List<double> _latencies = new();
    private DateTimeOffset? _lastErrorAt;

    /// <summary>
    /// Creates a new connector base
    /// </summary>
    protected ConnectorBase(ConnectorConfiguration configuration, ILogger logger)
    {
        Configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Guid Id => Configuration.Id;

    /// <inheritdoc />
    public string Name => Configuration.Name;

    /// <inheritdoc />
    public abstract ConnectorType Type { get; }

    /// <inheritdoc />
    public string TenantId => Configuration.TenantId;

    /// <inheritdoc />
    public ConnectionStatus Status
    {
        get
        {
            lock (_statusLock)
            {
                return _status;
            }
        }
        protected set
        {
            lock (_statusLock)
            {
                if (_status != value)
                {
                    var oldStatus = _status;
                    _status = value;
                    Logger.LogInformation("Connector {Name} ({Id}) status changed from {OldStatus} to {NewStatus}",
                        Name, Id, oldStatus, value);
                }
            }
        }
    }

    /// <inheritdoc />
    public bool IsConnected => Status == ConnectionStatus.Connected;

    /// <inheritdoc />
    public string? LastError => _lastError;

    /// <inheritdoc />
    public DateTimeOffset? LastDataReceivedAt => _lastDataReceivedAt;

    /// <inheritdoc />
    public abstract Task ConnectAsync(CancellationToken cancellationToken = default);

    /// <inheritdoc />
    public abstract Task DisconnectAsync(CancellationToken cancellationToken = default);

    /// <inheritdoc />
    public virtual Task<ConnectorHealthStatus> GetHealthStatusAsync(CancellationToken cancellationToken = default)
    {
        double avgLatency = 0;
        lock (_latencies)
        {
            if (_latencies.Count > 0)
            {
                avgLatency = _latencies.Average();
            }
        }

        var status = new ConnectorHealthStatus
        {
            Status = Status,
            IsHealthy = Status == ConnectionStatus.Connected,
            Message = GetStatusMessage(),
            CheckedAt = DateTimeOffset.UtcNow,
            SuccessfulReads = Interlocked.Read(ref _successfulReads),
            FailedReads = Interlocked.Read(ref _failedReads),
            AverageLatencyMs = avgLatency,
            LastError = _lastError,
            LastErrorAt = _lastErrorAt
        };

        return Task.FromResult(status);
    }

    /// <summary>
    /// Records a successful read operation
    /// </summary>
    protected void RecordSuccess(double latencyMs)
    {
        Interlocked.Increment(ref _successfulReads);
        _lastDataReceivedAt = DateTimeOffset.UtcNow;

        lock (_latencies)
        {
            _latencies.Add(latencyMs);
            // Keep only last 100 latency measurements
            if (_latencies.Count > 100)
            {
                _latencies.RemoveAt(0);
            }
        }
    }

    /// <summary>
    /// Records a failed read operation
    /// </summary>
    protected void RecordFailure(string errorMessage)
    {
        Interlocked.Increment(ref _failedReads);
        _lastError = errorMessage;
        _lastErrorAt = DateTimeOffset.UtcNow;
        Logger.LogWarning("Connector {Name} ({Id}) read failed: {Error}", Name, Id, errorMessage);
    }

    /// <summary>
    /// Sets the connector to error state
    /// </summary>
    protected void SetError(string errorMessage)
    {
        _lastError = errorMessage;
        _lastErrorAt = DateTimeOffset.UtcNow;
        Status = ConnectionStatus.Error;
        Logger.LogError("Connector {Name} ({Id}) error: {Error}", Name, Id, errorMessage);
    }

    /// <summary>
    /// Gets a human-readable status message
    /// </summary>
    protected virtual string GetStatusMessage()
    {
        return Status switch
        {
            ConnectionStatus.Disconnected => "Not connected",
            ConnectionStatus.Connecting => "Connecting...",
            ConnectionStatus.Connected => "Connected and healthy",
            ConnectionStatus.Reconnecting => "Reconnecting...",
            ConnectionStatus.Error => $"Error: {_lastError ?? "Unknown error"}",
            _ => "Unknown status"
        };
    }

    /// <summary>
    /// Measures the time to execute an async operation
    /// </summary>
    protected async Task<(T Result, double ElapsedMs)> MeasureAsync<T>(Func<Task<T>> operation)
    {
        var stopwatch = Stopwatch.StartNew();
        var result = await operation();
        stopwatch.Stop();
        return (result, stopwatch.Elapsed.TotalMilliseconds);
    }

    /// <inheritdoc />
    public abstract ValueTask DisposeAsync();
}

/// <summary>
/// Base class for polling connectors
/// </summary>
public abstract class PollingConnectorBase : ConnectorBase, IPollingConnector
{
    private CancellationTokenSource? _pollingCts;
    private Task? _pollingTask;
    private bool _isPolling;

    /// <summary>
    /// Creates a new polling connector base
    /// </summary>
    protected PollingConnectorBase(ConnectorConfiguration configuration, ILogger logger)
        : base(configuration, logger)
    {
    }

    /// <inheritdoc />
    public bool IsPolling => _isPolling;

    /// <inheritdoc />
    public event EventHandler<DataReceivedEventArgs>? DataReceived;

    /// <summary>
    /// Gets the polling interval in milliseconds
    /// </summary>
    protected abstract int PollingIntervalMs { get; }

    /// <inheritdoc />
    public abstract Task<IReadOnlyList<DataPoint>> PollDataAsync(CancellationToken cancellationToken = default);

    /// <inheritdoc />
    public virtual Task StartPollingAsync(CancellationToken cancellationToken = default)
    {
        if (_isPolling)
        {
            Logger.LogWarning("Connector {Name} ({Id}) is already polling", Name, Id);
            return Task.CompletedTask;
        }

        _pollingCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _isPolling = true;
        _pollingTask = PollingLoopAsync(_pollingCts.Token);

        Logger.LogInformation("Connector {Name} ({Id}) started polling with interval {Interval}ms",
            Name, Id, PollingIntervalMs);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public virtual async Task StopPollingAsync(CancellationToken cancellationToken = default)
    {
        if (!_isPolling)
        {
            return;
        }

        _isPolling = false;
        _pollingCts?.Cancel();

        if (_pollingTask != null)
        {
            try
            {
                await _pollingTask.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken);
            }
            catch (TimeoutException)
            {
                Logger.LogWarning("Connector {Name} ({Id}) polling task did not stop in time", Name, Id);
            }
            catch (OperationCanceledException)
            {
                // Expected
            }
        }

        _pollingCts?.Dispose();
        _pollingCts = null;
        _pollingTask = null;

        Logger.LogInformation("Connector {Name} ({Id}) stopped polling", Name, Id);
    }

    private async Task PollingLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested && _isPolling)
        {
            try
            {
                if (IsConnected)
                {
                    var (dataPoints, elapsedMs) = await MeasureAsync(() => PollDataAsync(cancellationToken));

                    if (dataPoints.Count > 0)
                    {
                        RecordSuccess(elapsedMs);
                        OnDataReceived(dataPoints);
                    }
                }

                await Task.Delay(PollingIntervalMs, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                RecordFailure(ex.Message);
                Logger.LogError(ex, "Connector {Name} ({Id}) polling error", Name, Id);

                // Wait before retrying on error
                await Task.Delay(Math.Min(PollingIntervalMs * 2, 30000), cancellationToken);
            }
        }
    }

    /// <summary>
    /// Raises the DataReceived event
    /// </summary>
    protected virtual void OnDataReceived(IReadOnlyList<DataPoint> dataPoints)
    {
        DataReceived?.Invoke(this, new DataReceivedEventArgs
        {
            ConnectorId = Id,
            DataPoints = dataPoints,
            ReceivedAt = DateTimeOffset.UtcNow
        });
    }

    /// <inheritdoc />
    public override async ValueTask DisposeAsync()
    {
        await StopPollingAsync();
        await DisconnectAsync();
        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// Base class for subscription-based connectors
/// </summary>
public abstract class SubscriptionConnectorBase : ConnectorBase, ISubscriptionConnector
{
    protected readonly List<SubscriptionItem> ActiveSubscriptions = new();

    /// <summary>
    /// Creates a new subscription connector base
    /// </summary>
    protected SubscriptionConnectorBase(ConnectorConfiguration configuration, ILogger logger)
        : base(configuration, logger)
    {
    }

    /// <inheritdoc />
    public event EventHandler<DataReceivedEventArgs>? DataReceived;

    /// <inheritdoc />
    public abstract Task SubscribeAsync(IEnumerable<SubscriptionItem> items, CancellationToken cancellationToken = default);

    /// <inheritdoc />
    public abstract Task UnsubscribeAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default);

    /// <inheritdoc />
    public IReadOnlyList<SubscriptionItem> GetSubscriptions()
    {
        lock (ActiveSubscriptions)
        {
            return ActiveSubscriptions.ToList().AsReadOnly();
        }
    }

    /// <summary>
    /// Raises the DataReceived event
    /// </summary>
    protected virtual void OnDataReceived(IReadOnlyList<DataPoint> dataPoints)
    {
        DataReceived?.Invoke(this, new DataReceivedEventArgs
        {
            ConnectorId = Id,
            DataPoints = dataPoints,
            ReceivedAt = DateTimeOffset.UtcNow
        });
    }

    /// <inheritdoc />
    public override async ValueTask DisposeAsync()
    {
        await DisconnectAsync();
        GC.SuppressFinalize(this);
    }
}
