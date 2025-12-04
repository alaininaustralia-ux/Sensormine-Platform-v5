# Sensormine Platform - Azure Infrastructure

This directory contains Terraform configuration for deploying the complete Sensormine Platform to Azure.

## 📋 Architecture Overview

The infrastructure includes:
- **Azure Kubernetes Service (AKS)** - Container orchestration for microservices
- **PostgreSQL Flexible Server** - Primary database with TimescaleDB extension
- **Azure Cache for Redis** - Distributed caching and session management
- **Azure Container Registry** - Private Docker image registry
- **Event Hubs** - Kafka-compatible messaging (alternative to Kafka)
- **Azure Storage Account** - Object storage for videos, CAD models, LiDAR data
- **Azure Key Vault** - Secure secret management
- **Azure IoT Hub** - Device connectivity and telemetry ingestion
- **Application Insights** - Application performance monitoring
- **Log Analytics Workspace** - Centralized logging

## 🚀 Prerequisites

### 1. Azure CLI
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login to Azure
az login

# Set your subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 2. Terraform
```powershell
# Install Terraform
winget install Hashicorp.Terraform

# Verify installation
terraform version
```

### 3. Service Principal
Create a service principal for GitHub Actions:
```powershell
# Create service principal with Contributor role
az ad sp create-for-rbac `
  --name "sensormine-github-actions" `
  --role contributor `
  --scopes /subscriptions/{subscription-id} `
  --sdk-auth

# Save the output JSON - you'll need it for GitHub secrets
```

### 4. Terraform State Storage
Create storage for Terraform state:
```powershell
# Create resource group for state
az group create --name sensormine-tfstate-rg --location eastus

# Create storage account
az storage account create `
  --name sensorminestate `
  --resource-group sensormine-tfstate-rg `
  --location eastus `
  --sku Standard_LRS `
  --encryption-services blob

# Create container
az storage container create `
  --name tfstate `
  --account-name sensorminestate
```

## 🔧 Configuration

### Environment Files
Three environment configurations are provided:
- `environments/dev.tfvars` - Development (smaller resources)
- `environments/staging.tfvars` - Staging (medium resources)
- `environments/prod.tfvars` - Production (full-scale resources)

### Required Secrets
Set these in GitHub Actions secrets:
- `AZURE_CLIENT_ID` - Service principal client ID
- `AZURE_CLIENT_SECRET` - Service principal secret
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `DB_ADMIN_PASSWORD` - PostgreSQL admin password (strong password)
- `TF_STATE_RG` - `sensormine-tfstate-rg`
- `TF_STATE_STORAGE` - `sensorminestate`

### Local Deployment Variables
Copy and customize the example:
```powershell
cd infrastructure/terraform/azure
Copy-Item terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
notepad terraform.tfvars
```

## 🎯 Manual Deployment

### Initialize Terraform
```powershell
cd infrastructure/terraform/azure

terraform init `
  -backend-config="resource_group_name=sensormine-tfstate-rg" `
  -backend-config="storage_account_name=sensorminestate" `
  -backend-config="container_name=tfstate" `
  -backend-config="key=sensormine-dev.terraform.tfstate"
```

### Plan Deployment
```powershell
# Development environment
terraform plan -var-file="environments/dev.tfvars" -out=tfplan

# Staging environment
terraform plan -var-file="environments/staging.tfvars" -out=tfplan

# Production environment
terraform plan -var-file="environments/prod.tfvars" -out=tfplan
```

### Apply Infrastructure
```powershell
terraform apply tfplan
```

### Get Connection Information
```powershell
# Get all outputs
terraform output

# Get specific output (e.g., AKS credentials)
terraform output -json kubernetes_config

# Connect to AKS
az aks get-credentials `
  --resource-group rg-sensormine-dev-eastus `
  --name aks-sensormine-dev-eastus
```

### Destroy Infrastructure
```powershell
terraform destroy -var-file="environments/dev.tfvars"
```

## 🤖 Automated Deployment with GitHub Actions

### Workflow Triggers
The deployment workflow (`.github/workflows/azure-deploy.yml`) runs on:
- **Push to master/main** - Automatic deployment after merge
- **Pull requests** - Plan only, shows changes in PR comments
- **Manual dispatch** - Deploy specific environment via GitHub UI

### Workflow Steps
1. **Terraform Plan** - Validates and plans infrastructure changes
2. **Terraform Apply** - Applies changes to Azure (master/main only)
3. **Docker Build & Push** - Builds all microservice images and pushes to ACR
4. **Deploy to AKS** - Updates Kubernetes deployments via Helm
5. **Deploy Frontend** - Deploys Next.js app to Azure Static Web Apps

### Manual Trigger
1. Go to GitHub Actions tab
2. Select "Azure Infrastructure Deployment"
3. Click "Run workflow"
4. Select environment (dev/staging/prod)
5. Click "Run workflow"

## 📦 Module Structure

```
infrastructure/terraform/azure/
├── main.tf                 # Main infrastructure config
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── terraform.tfvars.example
├── environments/           # Environment-specific configs
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── modules/                # Reusable Terraform modules
    ├── aks/                # Azure Kubernetes Service
    ├── postgresql/         # PostgreSQL with TimescaleDB
    ├── redis/              # Azure Cache for Redis
    ├── acr/                # Azure Container Registry
    ├── eventhubs/          # Event Hubs (Kafka)
    ├── storage/            # Azure Storage Account
    ├── keyvault/           # Azure Key Vault
    └── iothub/             # Azure IoT Hub
```

## 🔐 Security Considerations

1. **Private Endpoints** - All Azure services use private endpoints (no public access)
2. **Network Isolation** - Resources segmented by subnet with NSG rules
3. **Key Vault Integration** - All secrets stored in Azure Key Vault
4. **Managed Identities** - Services use Azure AD managed identities
5. **Role-Based Access** - Least privilege RBAC assignments
6. **TLS/SSL** - All connections encrypted in transit
7. **Backup & DR** - Geo-redundant backups for critical resources

## 📊 Cost Estimation

### Development Environment
- AKS: ~$150/month (2 D2s_v3 nodes)
- PostgreSQL: ~$50/month (B2s)
- Redis: ~$15/month (Basic C1)
- Storage: ~$20/month (LRS)
- Event Hubs: ~$20/month (Basic)
- IoT Hub: ~$25/month (S1)
- **Total: ~$280/month**

### Production Environment
- AKS: ~$1,200/month (5-20 D8s_v3 nodes)
- PostgreSQL: ~$600/month (D16s_v3 with HA)
- Redis: ~$250/month (Premium P2)
- Storage: ~$100/month (GRS + lifecycle)
- Event Hubs: ~$100/month (Standard, 4 TUs)
- IoT Hub: ~$1,000/month (S3, 4 units)
- **Total: ~$3,250/month**

## 🛠️ Troubleshooting

### Terraform State Lock
If state is locked:
```powershell
# Force unlock (use with caution)
terraform force-unlock LOCK_ID
```

### AKS Connection Issues
```powershell
# Get fresh credentials
az aks get-credentials `
  --resource-group rg-sensormine-dev-eastus `
  --name aks-sensormine-dev-eastus `
  --overwrite-existing

# Verify connection
kubectl get nodes
```

### PostgreSQL Connection
```powershell
# Get connection string from Key Vault
az keyvault secret show `
  --vault-name kv-sensormine-dev-eastus `
  --name postgresql-connection-string `
  --query value -o tsv
```

### View Terraform State
```powershell
# List all resources in state
terraform state list

# Show specific resource
terraform state show azurerm_kubernetes_cluster.main
```

## 📚 Additional Resources

- [Azure Terraform Provider Documentation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [AKS Best Practices](https://docs.microsoft.com/en-us/azure/aks/best-practices)
- [PostgreSQL Flexible Server](https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [Terraform Azure Backend](https://www.terraform.io/docs/language/settings/backends/azurerm.html)

## 🤝 Support

For infrastructure issues:
1. Check Terraform logs: `terraform show`
2. Check Azure Portal for resource status
3. Review GitHub Actions workflow logs
4. Check Application Insights for application errors
