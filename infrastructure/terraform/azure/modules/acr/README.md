# Azure Container Registry (ACR) Module

This module creates an Azure Container Registry for storing Docker images with private network access and integrated security features.

## Features

- **Private Network Access**: Network rules restrict access to specified virtual networks
- **Security**: Trust policies and retention policies enabled
- **AKS Integration**: Automatic role assignment for AKS cluster to pull images
- **System-Assigned Managed Identity**: For secure authentication
- **Image Retention**: 30-day retention policy for untagged images

## Usage

```hcl
module "acr" {
  source = "./modules/acr"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  acr_name            = "acrsensormineprod"
  subnet_id           = azurerm_subnet.services.id
  aks_principal_id    = module.aks.identity_principal_id
  
  sku = "Premium"
  
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
| acr_name | Name of the container registry | string | - | yes |
| subnet_id | Subnet ID for private network access | string | - | yes |
| aks_principal_id | Principal ID of AKS managed identity | string | - | yes |
| sku | ACR SKU (Basic, Standard, Premium) | string | Premium | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| acr_id | The ID of the Azure Container Registry |
| login_server | The login server URL |
| admin_username | The admin username (sensitive) |
| admin_password | The admin password (sensitive) |
| identity_principal_id | The Principal ID of the managed identity |

## SKU Comparison

| Feature | Basic | Standard | Premium |
|---------|-------|----------|---------|
| Storage | 10 GB | 100 GB | 500 GB |
| Webhook | 2 | 10 | 500 |
| Geo-replication | ❌ | ❌ | ✅ |
| Private Link | ❌ | ❌ | ✅ |
| Content Trust | ❌ | ❌ | ✅ |
| Zone Redundancy | ❌ | ❌ | ✅ |

## Security Features

1. **Admin Disabled**: Admin account is disabled, uses AKS managed identity
2. **Network Rules**: Default deny with explicit allow rules
3. **Trust Policy**: Docker Content Trust enabled
4. **Retention Policy**: Automatic cleanup of old images
5. **RBAC**: Least privilege access via AcrPull role

## Example: Building and Pushing Images

```bash
# Login to ACR using Azure CLI
az acr login --name acrsensormineprod

# Build and tag image
docker build -t acrsensormineprod.azurecr.io/device-api:v1.0.0 .

# Push image
docker push acrsensormineprod.azurecr.io/device-api:v1.0.0
```

## Integration with AKS

The module automatically grants the AKS cluster's managed identity the `AcrPull` role, allowing pods to pull images without additional credentials.

## References

- [Azure Container Registry Documentation](https://docs.microsoft.com/en-us/azure/container-registry/)
- [ACR Best Practices](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-best-practices)
