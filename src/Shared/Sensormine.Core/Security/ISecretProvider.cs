namespace Sensormine.Core.Security;

/// <summary>
/// Abstraction for retrieving secrets from various providers
/// (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets, etc.)
/// </summary>
public interface ISecretProvider
{
    /// <summary>
    /// Retrieves a single secret value by name
    /// </summary>
    /// <param name="secretName">Name/key of the secret</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Secret value as string</returns>
    Task<string> GetSecretAsync(string secretName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves multiple secrets in a single call for efficiency
    /// </summary>
    /// <param name="secretNames">Array of secret names to retrieve</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dictionary of secret names to values</returns>
    Task<Dictionary<string, string>> GetSecretsAsync(string[] secretNames, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a secret exists without retrieving its value
    /// </summary>
    /// <param name="secretName">Name/key of the secret</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if secret exists, false otherwise</returns>
    Task<bool> SecretExistsAsync(string secretName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the provider type name for logging/diagnostics
    /// </summary>
    string ProviderName { get; }
}

/// <summary>
/// Exception thrown when a secret cannot be retrieved
/// </summary>
public class SecretNotFoundException : Exception
{
    public string SecretName { get; }

    public SecretNotFoundException(string secretName)
        : base($"Secret '{secretName}' not found")
    {
        SecretName = secretName;
    }

    public SecretNotFoundException(string secretName, string message)
        : base(message)
    {
        SecretName = secretName;
    }

    public SecretNotFoundException(string secretName, string message, Exception innerException)
        : base(message, innerException)
    {
        SecretName = secretName;
    }
}

/// <summary>
/// Exception thrown when secret provider configuration is invalid
/// </summary>
public class SecretProviderConfigurationException : Exception
{
    public SecretProviderConfigurationException(string message)
        : base(message)
    {
    }

    public SecretProviderConfigurationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
