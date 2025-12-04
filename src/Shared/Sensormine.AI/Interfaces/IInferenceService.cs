namespace Sensormine.AI.Interfaces;

/// <summary>
/// ML inference service interface
/// </summary>
public interface IInferenceService
{
    /// <summary>
    /// Run inference on input data
    /// </summary>
    /// <param name="modelName">Model identifier</param>
    /// <param name="input">Input data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Inference result</returns>
    Task<InferenceResult> InferAsync(string modelName, object input, CancellationToken cancellationToken = default);

    /// <summary>
    /// Run batch inference
    /// </summary>
    Task<IEnumerable<InferenceResult>> InferBatchAsync(string modelName, IEnumerable<object> inputs, CancellationToken cancellationToken = default);
}

/// <summary>
/// Inference result
/// </summary>
public class InferenceResult
{
    /// <summary>
    /// Model name
    /// </summary>
    public string ModelName { get; set; } = string.Empty;

    /// <summary>
    /// Inference outputs
    /// </summary>
    public Dictionary<string, object> Outputs { get; set; } = new();

    /// <summary>
    /// Confidence scores
    /// </summary>
    public Dictionary<string, float>? Confidence { get; set; }

    /// <summary>
    /// Inference duration in milliseconds
    /// </summary>
    public double DurationMs { get; set; }

    /// <summary>
    /// Timestamp
    /// </summary>
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
