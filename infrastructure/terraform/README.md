# Sensormine Platform - Terraform Infrastructure

This directory contains Terraform configurations for deploying the Sensormine Platform across multiple cloud providers and on-premises environments.

## 📁 Directory Structure

```
infrastructure/terraform/
├── README.md                  # This file
├── .gitignore                 # Terraform-specific gitignore
├── main.tf                    # Root configuration (cloud-agnostic)
├── azure/                     # Azure-specific infrastructure
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── environments/          # Environment-specific configs
│   │   ├── dev.tfvars
│   │   ├── staging.tfvars
│   │   └── prod.tfvars
│   └── modules/               # Azure resource modules
│       ├── acr/               # Azure Container Registry
│       ├── aks/               # Azure Kubernetes Service
│       ├── postgresql/        # PostgreSQL with TimescaleDB
│       ├── redis/             # Azure Cache for Redis
│       ├── eventhubs/         # Event Hubs (Kafka)
│       ├── storage/           # Blob Storage
│       ├── keyvault/          # Key Vault
│       └── iothub/            # IoT Hub
├── aws/                       # AWS-specific infrastructure (Coming Soon)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── environments/
│   └── modules/
│       ├── eks/               # Elastic Kubernetes Service
│       ├── rds/               # RDS PostgreSQL
│       ├── elasticache/       # ElastiCache Redis
│       ├── msk/               # Managed Streaming for Kafka
│       ├── ecr/               # Elastic Container Registry
│       └── s3/                # S3 Storage
├── gcp/                       # GCP-specific infrastructure (Coming Soon)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── environments/
│   └── modules/
│       ├── gke/               # Google Kubernetes Engine
│       ├── cloudsql/          # Cloud SQL PostgreSQL
│       ├── memorystore/       # Memorystore Redis
│       ├── pubsub/            # Cloud Pub/Sub
│       ├── gcr/               # Google Container Registry
│       └── gcs/               # Cloud Storage
├── on-premises/               # On-premises/hybrid infrastructure (Coming Soon)
│   ├── kubernetes/            # Self-managed Kubernetes
│   ├── kafka/                 # Apache Kafka cluster
│   ├── postgresql/            # PostgreSQL + TimescaleDB
│   └── storage/               # MinIO object storage
└── modules/                   # Cloud-agnostic modules
    ├── kubernetes/            # Generic Kubernetes resources
    ├── messaging/             # Message broker abstraction
    └── storage/               # Object storage abstraction
```

## 🚀 Quick Start

### Prerequisites

1. **Install Terraform**
   ```bash
   # Windows (using Chocolatey)
   choco install terraform
   
   # macOS (using Homebrew)
   brew install terraform
   
   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **Verify Installation**
   ```bash
   terraform version
   ```

### Deploy to Azure

See [azure/README.md](azure/README.md) for detailed Azure deployment instructions.

**Quick Deploy**:

```bash
# Navigate to Azure directory
cd infrastructure/terraform/azure

# Initialize Terraform
terraform init

# Plan deployment (development environment)
terraform plan -var-file="environments/dev.tfvars" -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### Deploy to AWS (Coming Soon)

See [aws/README.md](aws/README.md) for AWS deployment instructions.

### Deploy to GCP (Coming Soon)

See [gcp/README.md](gcp/README.md) for GCP deployment instructions.

## 🏗️ Infrastructure Components

### Compute & Orchestration
- **Kubernetes**: AKS (Azure), EKS (AWS), GKE (GCP), Self-managed
- **Container Registry**: ACR (Azure), ECR (AWS), GCR (GCP), Harbor
- **Node Pools**: System (3-10 nodes), Workload (2-20 nodes)

### Data Storage
- **PostgreSQL**: Azure Flexible Server, RDS, Cloud SQL, Self-hosted
- **TimescaleDB**: Time-series extension on PostgreSQL
- **Object Storage**: Azure Blob, S3, GCS, MinIO
- **Cache**: Azure Redis, ElastiCache, Memorystore, Redis cluster

### Messaging & Streaming
- **Event Streaming**: Event Hubs (Azure), MSK (AWS), Pub/Sub (GCP), Kafka
- **IoT Connectivity**: IoT Hub (Azure), IoT Core (AWS/GCP), MQTT broker

### Security & Secrets
- **Secret Management**: Key Vault (Azure), Secrets Manager (AWS), Secret Manager (GCP)
- **Network Security**: Private endpoints, VNet/VPC, Network policies
- **Identity**: Managed identities, IAM roles, Service accounts

### Observability
- **Monitoring**: Azure Monitor, CloudWatch, Cloud Monitoring, Prometheus
- **Logging**: Log Analytics, CloudWatch Logs, Cloud Logging, Loki
- **Tracing**: Application Insights, X-Ray, Cloud Trace, Jaeger

## 🔐 Security Best Practices

### Secrets Management
1. **Never commit secrets**: Use `.tfvars` files (gitignored)
2. **Use secret management**: Store in Key Vault/Secrets Manager
3. **Environment variables**: Pass sensitive values via env vars
4. **State encryption**: Enable encryption for remote state

### Network Security
1. **Private endpoints**: All resources in private network
2. **Network segmentation**: Separate subnets for different tiers
3. **Firewall rules**: Minimal and specific access rules
4. **TLS/SSL**: Enforce encrypted connections

### Access Control
1. **Least privilege**: Minimal required permissions
2. **RBAC**: Role-based access control
3. **Managed identities**: Use instead of service principals
4. **Audit logging**: Enable for all resources

## 💰 Cost Management

### Cost Optimization Strategies

1. **Right-sizing**
   - Start with smaller SKUs
   - Scale based on actual usage metrics
   - Use burstable tiers for non-prod

2. **Auto-scaling**
   - Enable cluster autoscaling (3-10 nodes)
   - Use horizontal pod autoscaling
   - Event Hubs auto-inflate

3. **Reserved Capacity**
   - 1-year or 3-year commitments
   - Save 30-65% on compute
   - PostgreSQL, Redis, Kubernetes nodes

4. **Storage Lifecycle**
   - Hot → Cool → Archive tiers
   - Automatic data tiering
   - Delete old backups

5. **Dev/Test Environments**
   - Use B-series (Burstable) VMs
   - Basic SKUs for Redis, storage
   - Shut down after hours

### Cost Estimation by Environment

| Environment | Azure | AWS | GCP | Components |
|-------------|-------|-----|-----|------------|
| **Development** | $300/mo | $250/mo | $280/mo | Small SKUs, LRS, Basic tiers |
| **Staging** | $800/mo | $700/mo | $750/mo | Medium SKUs, GRS, Standard tiers |
| **Production** | $3,500/mo | $3,200/mo | $3,400/mo | Large SKUs, HA, Premium tiers |

*Estimates based on moderate usage, East US / us-east-1 / us-central1*

## 📊 Multi-Cloud Comparison

| Feature | Azure | AWS | GCP |
|---------|-------|-----|-----|
| **Kubernetes** | AKS (Free control plane) | EKS ($0.10/hr) | GKE (Free for 1 cluster) |
| **PostgreSQL** | Flexible Server | RDS | Cloud SQL |
| **Redis** | Cache for Redis | ElastiCache | Memorystore |
| **Kafka** | Event Hubs | MSK | Pub/Sub* |
| **Container Registry** | ACR | ECR | GCR/Artifact Registry |
| **Object Storage** | Blob Storage | S3 | Cloud Storage |
| **Secrets** | Key Vault | Secrets Manager | Secret Manager |
| **IoT** | IoT Hub | IoT Core | IoT Core |

*Pub/Sub is not Kafka, but provides similar functionality

## 🔄 State Management

### Local State (Development)
- State stored in `terraform.tfstate` file
- Suitable for testing and development
- Not recommended for production

### Remote State (Production)

#### Azure
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "sensormine-tfstate-rg"
    storage_account_name = "sensorminestate"
    container_name       = "tfstate"
    key                  = "sensormine-prod.terraform.tfstate"
  }
}
```

#### AWS
```hcl
terraform {
  backend "s3" {
    bucket         = "sensormine-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

#### GCP
```hcl
terraform {
  backend "gcs" {
    bucket  = "sensormine-tfstate"
    prefix  = "prod"
  }
}
```

## 🧪 Testing Infrastructure

### Validate Configuration
```bash
terraform validate
```

### Check Formatting
```bash
terraform fmt -recursive
```

### Static Analysis
```bash
# Install tfsec
brew install tfsec  # macOS
choco install tfsec # Windows

# Run security scan
tfsec .

# Install checkov
pip install checkov

# Run policy checks
checkov -d .
```

### Cost Estimation
```bash
# Install Infracost
brew install infracost  # macOS

# Generate cost estimate
infracost breakdown --path .
```

## 🔧 Troubleshooting

### Common Issues

1. **State Lock**
   ```bash
   # Force unlock (use with caution)
   terraform force-unlock LOCK_ID
   ```

2. **Provider Version Conflicts**
   ```bash
   # Upgrade providers
   terraform init -upgrade
   ```

3. **Resource Dependency Issues**
   ```bash
   # Visualize dependency graph
   terraform graph | dot -Tsvg > graph.svg
   ```

4. **Debug Mode**
   ```bash
   # Enable verbose logging
   export TF_LOG=DEBUG
   terraform apply
   ```

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

## 🤝 Contributing

When adding new infrastructure:

1. **Module Structure**: Follow existing module patterns
2. **Documentation**: Include comprehensive README.md
3. **Variables**: Document all variables with descriptions
4. **Outputs**: Export useful outputs
5. **Tagging**: Apply consistent tagging strategy
6. **Security**: Follow security best practices
7. **Testing**: Validate with `terraform plan`

## 📄 License

This infrastructure code is part of the Sensormine Platform v5 project.
