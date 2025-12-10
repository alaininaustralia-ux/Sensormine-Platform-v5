using Microsoft.Extensions.Logging;

namespace Sensormine.Core.Security;

/// <summary>
/// Secret provider for Kubernetes secrets mounted as files or environment variables
/// Reads secrets from /var/run/secrets/ or environment variables
/// </summary>
public class KubernetesSecretProvider : ISecretProvider
{
    private readonly ILogger<KubernetesSecretProvider> _logger;
    private readonly string _secretsBasePath;

    public string ProviderName => "Kubernetes Secrets";

    public KubernetesSecretProvider(
        ILogger<KubernetesSecretProvider> logger,
        string? secretsBasePath = null)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _secretsBasePath = secretsBasePath ?? "/var/run/secrets/sensormine";

        _logger.LogInformation("Kubernetes secret provider initialized with base path: {BasePath}", _secretsBasePath);
    }

    public async Task<string> GetSecretAsync(string secretName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(secretName))
            throw new ArgumentException("Secret name cannot be null or empty", nameof(secretName));

        // First, try environment variable (K8s env from secret)
        var envValue = Environment.GetEnvironmentVariable(secretName);
        if (!string.IsNullOrEmpty(envValue))
        {
            _logger.LogDebug("Retrieved secret '{SecretName}' from environment variable", secretName);
            return envValue;
        }

        // Second, try mounted secret file
        var secretFilePath = Path.Combine(_secretsBasePath, secretName);
        if (File.Exists(secretFilePath))
        {
            try
            {
                var content = await File.ReadAllTextAsync(secretFilePath, cancellationToken);
                _logger.LogDebug("Retrieved secret '{SecretName}' from file: {FilePath}", secretName, secretFilePath);
                return content.Trim(); // Kubernetes secrets often have trailing newlines
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading secret file: {FilePath}", secretFilePath);
                throw new SecretNotFoundException(
                    secretName,
                    $"Error reading secret from file: {secretFilePath}",
                    ex);
            }
        }

        _logger.LogError(
            "Secret '{SecretName}' not found in environment variables or at path: {FilePath}",
            secretName,
            secretFilePath);

        throw new SecretNotFoundException(secretName);
    }

    public async Task<Dictionary<string, string>> GetSecretsAsync(
        string[] secretNames,
        CancellationToken cancellationToken = default)
    {
        var results = new Dictionary<string, string>();

        foreach (var secretName in secretNames)
        {
            try
            {
                var value = await GetSecretAsync(secretName, cancellationToken);
                results[secretName] = value;
            }
            catch (SecretNotFoundException ex)
            {
                _logger.LogWarning(ex, "Secret '{SecretName}' not found, skipping", secretName);
            }
        }

        return results;
    }

    public Task<bool> SecretExistsAsync(string secretName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(secretName))
            return Task.FromResult(false);

        // Check environment variable
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable(secretName)))
            return Task.FromResult(true);

        // Check file
        var secretFilePath = Path.Combine(_secretsBasePath, secretName);
        return Task.FromResult(File.Exists(secretFilePath));
    }
}
