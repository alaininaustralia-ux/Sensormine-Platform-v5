# Secret Management Configuration

## Overview
This document describes how to configure secrets for different deployment environments.

## ⚠️ SECURITY WARNING
**NEVER commit real secrets to source control!**
- This file shows the structure only
- Actual values must be stored securely
- Use environment variables or secret managers in production

---

## Environment Variables (All Environments)

### Secret Provider Configuration
```bash
# Secret provider type: AppSettings, Kubernetes, AzureKeyVault, AwsSecretsManager, Vault
SECRET_PROVIDER_TYPE=AppSettings

# Kubernetes-specific (if using Kubernetes provider)
SECRET_PROVIDER_KUBERNETES_BASEPATH=/var/run/secrets/sensormine
```

### Database Connection Strings
```bash
# Metadata Database (PostgreSQL + TimescaleDB)
ConnectionStrings__DefaultConnection=Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=CHANGE_ME

# Timeseries Database (TimescaleDB)
ConnectionStrings__TimescaleDb=Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=CHANGE_ME
```

### Message Brokers
```bash
# Kafka
Kafka__BootstrapServers=localhost:9092
Kafka__Username=
Kafka__Password=

# MQTT
MQTT__Host=localhost
MQTT__Port=1883
MQTT__Username=
MQTT__Password=
```

### Caching & Storage
```bash
# Redis
Redis__ConnectionString=localhost:6379,password=CHANGE_ME

# MinIO / S3
MinIO__Endpoint=localhost:9000
MinIO__AccessKey=minio
MinIO__SecretKey=CHANGE_ME
MinIO__UseSSL=false
```

### JWT Authentication
```bash
# JWT signing key (CRITICAL - MUST be different in production)
JWT__SecretKey=CHANGE_ME_TO_RANDOM_256_BIT_KEY
JWT__Issuer=sensormine-platform
JWT__Audience=sensormine-api
JWT__ExpirationMinutes=60
```

### External Services
```bash
# Email (SendGrid, SMTP, etc.)
Email__ApiKey=CHANGE_ME
Email__FromAddress=noreply@sensormine.com

# SMS (Twilio, etc.)
SMS__AccountSid=CHANGE_ME
SMS__AuthToken=CHANGE_ME

# Stripe (Billing)
Stripe__SecretKey=sk_test_CHANGE_ME
Stripe__PublishableKey=pk_test_CHANGE_ME
Stripe__WebhookSecret=whsec_CHANGE_ME
```

---

## Local Development (.env file)

Create `.env` file in project root (already in .gitignore):

```bash
# Copy from .env.example and fill in values
# DO NOT commit this file to source control!

SECRET_PROVIDER_TYPE=AppSettings

# Database
ConnectionStrings__DefaultConnection=Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123
ConnectionStrings__TimescaleDb=Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123

# Kafka
Kafka__BootstrapServers=localhost:9092

# Redis
Redis__ConnectionString=localhost:6379

# MinIO
MinIO__Endpoint=localhost:9000
MinIO__AccessKey=minio
MinIO__SecretKey=minio123

# JWT (development key - not for production!)
JWT__SecretKey=development-key-not-for-production-use-only-minimum-256-bits
```

---

## Kubernetes Secrets

See `infrastructure/kubernetes/secrets/` for examples:
- `database-secrets.yaml`
- `kafka-secrets.yaml`
- `jwt-secrets.yaml`
- `external-services-secrets.yaml`

---

## Cloud Providers

### Azure Key Vault
```bash
SECRET_PROVIDER_TYPE=AzureKeyVault
SecretProvider__AzureKeyVault__VaultUri=https://sensormine-vault.vault.azure.net/
# Uses Managed Identity for authentication (no credentials needed)
```

### AWS Secrets Manager
```bash
SECRET_PROVIDER_TYPE=AwsSecretsManager
SecretProvider__AwsSecretsManager__Region=us-east-1
# Uses IAM roles for authentication (no credentials needed)
```

### HashiCorp Vault
```bash
SECRET_PROVIDER_TYPE=Vault
SecretProvider__Vault__Address=https://vault.company.com:8200
SecretProvider__Vault__Token=VAULT_TOKEN_HERE
SecretProvider__Vault__MountPoint=secret
SecretProvider__Vault__Path=sensormine/production
```

---

## Secret Naming Conventions

Follow these naming patterns for consistency:

### Connection Strings
- `ConnectionStrings__DefaultConnection`
- `ConnectionStrings__TimescaleDb`

### Service Credentials
- `<ServiceName>__Username`
- `<ServiceName>__Password`
- `<ServiceName>__ApiKey`

### Certificates
- `<ServiceName>__Certificate`
- `<ServiceName>__CertificatePassword`

---

## Rotating Secrets

### Process
1. Generate new secret value
2. Store new value in secret provider
3. Update reference in configuration (if secret name changes)
4. Restart affected services
5. Verify services are working with new secret
6. Delete old secret (after grace period)

### Automation
- Use secret rotation policies in cloud providers
- Set up alerts for expiring secrets
- Document rotation schedule (e.g., every 90 days)

---

## Troubleshooting

### Secret Not Found
- Check secret name matches exactly (case-sensitive)
- Verify secret exists in provider
- Check IAM/RBAC permissions
- Review logs for detailed error messages

### Connection Failed
- Verify secret contains correct connection string format
- Check network connectivity to target service
- Verify credentials are valid

---

## Best Practices

1. **Use Secret Managers in Production** - Never use AppSettings provider
2. **Principle of Least Privilege** - Grant minimal required permissions
3. **Rotate Regularly** - Rotate secrets every 90 days minimum
4. **Monitor Access** - Enable audit logging for secret access
5. **Use Managed Identities** - Avoid storing cloud credentials when possible
6. **Encrypt at Rest** - Ensure secret storage is encrypted
7. **Separate Environments** - Use different secrets for dev/staging/prod
8. **Document Secret Owners** - Know who to contact for each secret
