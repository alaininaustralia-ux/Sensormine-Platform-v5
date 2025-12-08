# Azure Key Vault Module

This module creates an Azure Key Vault for secure storage of secrets, keys, and certificates with private network access and comprehensive access policies.

## Features

- **Secrets Management**: Securely store connection strings, API keys, passwords
- **Private Network Access**: Private endpoint for VNet-only access
- **RBAC Integration**: Azure AD role-based access control
- **Soft Delete**: 90-day recovery period for deleted secrets
- **Purge Protection**: Prevents permanent deletion during retention period
- **Access Policies**: Fine-grained permissions for users and applications
- **Audit Logging**: All access attempts logged

## Usage

```hcl
module "keyvault" {
  source = "./modules/keyvault"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  keyvault_name       = "kv-sensormine-prod"
  subnet_id           = azurerm_subnet.services.id
  aks_principal_id    = module.aks.identity_principal_id
  tenant_id           = data.azurerm_client_config.current.tenant_id
  
  secrets = {
    "postgresql-connection-string" = module.postgresql.connection_string
    "redis-connection-string"      = module.redis.connection_string
    "eventhub-connection-string"   = module.eventhubs.connection_string
    "storage-connection-string"    = module.storage.connection_string
    "stripe-api-key"               = var.stripe_api_key
    "twilio-auth-token"            = var.twilio_auth_token
  }
  
  tags = {
    Environment = "production"
    Project     = "Sensormine"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | string | - | yes |
| location | Azure region | string | - | yes |
| keyvault_name | Name of the Key Vault (3-24 chars) | string | - | yes |
| subnet_id | Subnet ID for private endpoint | string | - | yes |
| tenant_id | Azure AD tenant ID | string | - | yes |
| aks_principal_id | AKS managed identity principal ID | string | - | yes |
| secrets | Map of secret names to values | map(string) | {} | no |
| sku_name | Key Vault SKU (standard or premium) | string | standard | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| keyvault_id | The ID of the Key Vault |
| keyvault_name | The name of the Key Vault |
| vault_uri | The URI of the Key Vault |
| secret_ids | Map of secret names to IDs |

## SKU Comparison

| Feature | Standard | Premium |
|---------|----------|---------|
| Secrets | ✅ | ✅ |
| Keys | ✅ | ✅ |
| Certificates | ✅ | ✅ |
| HSM-backed keys | ❌ | ✅ |
| Cost | ~$0.03/10k operations | ~$1/key/month + operations |

## Use Cases in Sensormine Platform

1. **Database Credentials**: PostgreSQL, TimescaleDB connection strings
2. **API Keys**: Third-party service keys (Stripe, Twilio, Claude AI)
3. **Certificates**: SSL/TLS certificates for services
4. **Encryption Keys**: Customer-managed encryption keys
5. **Service Principals**: Azure AD application secrets
6. **OAuth Tokens**: Long-lived OAuth refresh tokens

## Accessing Secrets from .NET

### Using Azure SDK

```csharp
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

// In Program.cs
builder.Services.AddSingleton(sp =>
{
    var keyVaultUrl = builder.Configuration["KeyVault:Url"];
    return new SecretClient(
        new Uri(keyVaultUrl),
        new DefaultAzureCredential());
});

// In service/controller
public class DeviceService
{
    private readonly SecretClient _secretClient;
    
    public DeviceService(SecretClient secretClient)
    {
        _secretClient = secretClient;
    }
    
    public async Task<string> GetApiKeyAsync()
    {
        var secret = await _secretClient.GetSecretAsync("api-key");
        return secret.Value.Value;
    }
}
```

### Using Configuration Builder

```csharp
// In Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add Key Vault to configuration
if (!builder.Environment.IsDevelopment())
{
    var keyVaultUrl = builder.Configuration["KeyVault:Url"];
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUrl),
        new DefaultAzureCredential());
}

// Now secrets are accessible via IConfiguration
var connectionString = builder.Configuration["postgresql-connection-string"];
```

### Using Managed Identity

For AKS pods, use Azure AD Pod Identity or Workload Identity:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: device-api
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: device-api-sa
  containers:
  - name: device-api
    image: acr.azurecr.io/device-api:latest
    env:
    - name: AZURE_CLIENT_ID
      value: "managed-identity-client-id"
```

## Azure CLI Usage

```bash
# Set secret
az keyvault secret set \
  --vault-name kv-sensormine-prod \
  --name "api-key" \
  --value "secret-value"

# Get secret
az keyvault secret show \
  --vault-name kv-sensormine-prod \
  --name "api-key" \
  --query value -o tsv

# List secrets
az keyvault secret list \
  --vault-name kv-sensormine-prod \
  --output table

# Delete secret (soft delete)
az keyvault secret delete \
  --vault-name kv-sensormine-prod \
  --name "api-key"

# Recover deleted secret
az keyvault secret recover \
  --vault-name kv-sensormine-prod \
  --name "api-key"

# Purge (permanent delete)
az keyvault secret purge \
  --vault-name kv-sensormine-prod \
  --name "api-key"
```

## Access Policies

The module grants the following permissions:

### AKS Managed Identity
- **Secrets**: Get, List
- **Certificates**: Get, List
- **Keys**: Get, List

### Service Principal (for deployments)
- **Secrets**: All permissions
- **Certificates**: All permissions
- **Keys**: All permissions

### Users (via RBAC)
- **Key Vault Secrets User**: Read secrets
- **Key Vault Secrets Officer**: Manage secrets
- **Key Vault Administrator**: Full access

## Security Best Practices

1. **Managed Identity**: Use Azure AD managed identities, avoid access keys
2. **Least Privilege**: Grant minimum required permissions
3. **Private Network**: Use private endpoints, disable public access
4. **Audit Logs**: Monitor access in Log Analytics
5. **Rotation**: Rotate secrets regularly (90 days recommended)
6. **Soft Delete**: Always enable soft delete and purge protection
7. **Firewall**: Restrict access to specific IP ranges if needed

## Secret Versioning

Key Vault maintains version history:

```csharp
// Get specific version
var secret = await secretClient.GetSecretAsync("api-key", "version-id");

// Get all versions
await foreach (var secretProperties in secretClient.GetPropertiesOfSecretVersionsAsync("api-key"))
{
    Console.WriteLine($"Version: {secretProperties.Version}, Created: {secretProperties.CreatedOn}");
}

// Set new version (automatic)
await secretClient.SetSecretAsync("api-key", "new-value");
```

## Monitoring and Alerts

Key metrics to monitor:

- **Service API Hits**: Total requests to Key Vault
- **Availability**: Service availability (target: 99.9%)
- **Latency**: API call latency
- **Capacity**: Storage capacity used
- **Failed Requests**: Authentication/authorization failures

Set up alerts for:
- High failed request rate
- Unusual access patterns
- Secrets approaching expiration

## Certificate Management

Store SSL/TLS certificates:

```bash
# Import certificate
az keyvault certificate import \
  --vault-name kv-sensormine-prod \
  --name "wildcard-cert" \
  --file certificate.pfx \
  --password "cert-password"

# Auto-renewal with Let's Encrypt
az keyvault certificate set-attributes \
  --vault-name kv-sensormine-prod \
  --name "wildcard-cert" \
  --enabled true
```

## Key Management

Generate and manage encryption keys:

```bash
# Create key
az keyvault key create \
  --vault-name kv-sensormine-prod \
  --name "data-encryption-key" \
  --kty RSA \
  --size 2048

# Encrypt data
az keyvault key encrypt \
  --vault-name kv-sensormine-prod \
  --name "data-encryption-key" \
  --algorithm RSA-OAEP \
  --value "sensitive-data"

# Decrypt data
az keyvault key decrypt \
  --vault-name kv-sensormine-prod \
  --name "data-encryption-key" \
  --algorithm RSA-OAEP \
  --value "encrypted-data"
```

## Disaster Recovery

- **Geo-Replication**: Key Vault data is automatically replicated to paired region
- **Soft Delete**: 90-day retention allows recovery from accidental deletion
- **Backup**: Export secrets to secure storage for DR scenarios

```bash
# Backup secret
az keyvault secret backup \
  --vault-name kv-sensormine-prod \
  --name "api-key" \
  --file api-key-backup.blob

# Restore secret
az keyvault secret restore \
  --vault-name kv-sensormine-prod-dr \
  --file api-key-backup.blob
```

## Cost Optimization

- **Standard SKU**: Sufficient for most workloads
- **API Call Limits**: Cache secrets in application memory
- **Batch Operations**: Reduce API calls by batching
- **Monitor Usage**: Track operations to identify optimization opportunities

**Pricing** (Standard SKU):
- Operations: $0.03 per 10,000 transactions
- Secrets/Keys: No additional charge
- Certificates: $3 per renewal

## Integration with CI/CD

```yaml
# GitHub Actions example
- name: Get secrets from Key Vault
  uses: Azure/get-keyvault-secrets@v1
  with:
    keyvault: "kv-sensormine-prod"
    secrets: 'postgresql-connection-string, redis-connection-string'
  id: keyvaultSecrets

- name: Deploy with secrets
  env:
    DB_CONNECTION: ${{ steps.keyvaultSecrets.outputs.postgresql-connection-string }}
    REDIS_CONNECTION: ${{ steps.keyvaultSecrets.outputs.redis-connection-string }}
  run: |
    # deployment commands
```

## References

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Managed Identity Integration](https://docs.microsoft.com/en-us/azure/key-vault/general/managed-identity)
- [Security Baseline](https://docs.microsoft.com/en-us/security/benchmark/azure/baselines/key-vault-security-baseline)
