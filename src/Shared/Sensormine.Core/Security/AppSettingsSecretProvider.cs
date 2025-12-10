using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Sensormine.Core.Security;

/// <summary>
/// Development-only secret provider that reads from appsettings.json and environment variables
/// NEVER use in production!
/// </summary>
public class AppSettingsSecretProvider : ISecretProvider
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AppSettingsSecretProvider> _logger;

    public string ProviderName => "AppSettings (Development Only)";

    public AppSettingsSecretProvider(
        IConfiguration configuration,
        ILogger<AppSettingsSecretProvider> logger)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _logger.LogWarning(
            "Using AppSettingsSecretProvider - This is NOT secure for production. " +
            "Secrets are stored in configuration files.");
    }

    public Task<string> GetSecretAsync(string secretName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(secretName))
            throw new ArgumentException("Secret name cannot be null or empty", nameof(secretName));

        // Try environment variable first (higher priority)
        var envValue = Environment.GetEnvironmentVariable(secretName);
        if (!string.IsNullOrEmpty(envValue))
        {
            _logger.LogDebug("Retrieved secret '{SecretName}' from environment variable", secretName);
            return Task.FromResult(envValue);
        }

        // Try configuration (appsettings.json)
        var configValue = _configuration[secretName];
        if (!string.IsNullOrEmpty(configValue))
        {
            _logger.LogDebug("Retrieved secret '{SecretName}' from configuration", secretName);
            return Task.FromResult(configValue);
        }

        // Try nested path (e.g., "ConnectionStrings:DefaultConnection")
        var nestedValue = _configuration[secretName.Replace("__", ":")];
        if (!string.IsNullOrEmpty(nestedValue))
        {
            _logger.LogDebug("Retrieved secret '{SecretName}' from nested configuration", secretName);
            return Task.FromResult(nestedValue!);
        }

        _logger.LogError("Secret '{SecretName}' not found in environment variables or configuration", secretName);
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

        // Check configuration
        var configValue = _configuration[secretName] ?? _configuration[secretName.Replace("__", ":")];
        return Task.FromResult(!string.IsNullOrEmpty(configValue));
    }
}
