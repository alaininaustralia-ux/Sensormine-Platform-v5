namespace Sensormine.AI.Interfaces;

/// <summary>
/// Vector embedding service interface
/// </summary>
public interface IEmbeddingService
{
    /// <summary>
    /// Generate embeddings for text
    /// </summary>
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate embeddings for multiple texts
    /// </summary>
    Task<IEnumerable<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate similarity between two embeddings
    /// </summary>
    float CalculateSimilarity(float[] embedding1, float[] embedding2);
}

/// <summary>
/// Vector store interface for semantic search
/// </summary>
public interface IVectorStore
{
    /// <summary>
    /// Add embedding to store
    /// </summary>
    Task AddAsync(string id, float[] embedding, Dictionary<string, object>? metadata = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Search similar vectors
    /// </summary>
    Task<IEnumerable<VectorSearchResult>> SearchAsync(float[] queryEmbedding, int topK = 10, Dictionary<string, object>? filters = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete embedding from store
    /// </summary>
    Task DeleteAsync(string id, CancellationToken cancellationToken = default);
}

/// <summary>
/// Vector search result
/// </summary>
public class VectorSearchResult
{
    public string Id { get; set; } = string.Empty;
    public float Score { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
