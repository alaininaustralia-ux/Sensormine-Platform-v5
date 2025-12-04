namespace Sensormine.Messaging.Interfaces;

/// <summary>
/// Generic message publisher interface
/// </summary>
public interface IMessagePublisher
{
    /// <summary>
    /// Publish a message to a topic
    /// </summary>
    /// <typeparam name="T">Message type</typeparam>
    /// <param name="topic">Topic name</param>
    /// <param name="message">Message payload</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task PublishAsync<T>(string topic, T message, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Publish a batch of messages
    /// </summary>
    Task PublishBatchAsync<T>(string topic, IEnumerable<T> messages, CancellationToken cancellationToken = default) where T : class;
}

/// <summary>
/// Generic message consumer interface
/// </summary>
public interface IMessageConsumer
{
    /// <summary>
    /// Subscribe to a topic and process messages
    /// </summary>
    /// <typeparam name="T">Message type</typeparam>
    /// <param name="topic">Topic name</param>
    /// <param name="handler">Message handler function</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task SubscribeAsync<T>(string topic, Func<T, Task> handler, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Unsubscribe from a topic
    /// </summary>
    Task UnsubscribeAsync(string topic, CancellationToken cancellationToken = default);
}
