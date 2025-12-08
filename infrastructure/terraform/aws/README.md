# Sensormine Platform - AWS Infrastructure

This directory contains Terraform configuration for deploying the complete Sensormine Platform to AWS.

## 📋 Architecture Overview

The infrastructure includes:
- **Amazon EKS** - Elastic Kubernetes Service for container orchestration
- **Amazon RDS** - PostgreSQL database with TimescaleDB extension support
- **Amazon ElastiCache** - Redis cluster for distributed caching
- **Amazon MSK** - Managed Streaming for Apache Kafka
- **Amazon ECR** - Elastic Container Registry for Docker images
- **Amazon S3** - Object storage for videos, CAD models, LiDAR data
- **AWS Secrets Manager** - Secure secret management
- **AWS IoT Core** - Device connectivity and telemetry ingestion
- **Application Load Balancer** - HTTP/HTTPS ingress
- **CloudWatch** - Logging and monitoring

## 🚀 Prerequisites

### 1. AWS CLI
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

### 2. Terraform
```bash
# Download and install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installation
terraform version
```

### 3. kubectl
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### 4. S3 Backend Setup
Create S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket for state
aws s3 mb s3://sensormine-tfstate --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket sensormine-tfstate \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket sensormine-tfstate \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

## 🔧 Configuration

### Environment Files
Three environment configurations are provided:
- `environments/dev.tfvars` - Development (smaller resources)
- `environments/staging.tfvars` - Staging (medium resources)
- `environments/prod.tfvars` - Production (full-scale resources)

### Required Secrets
Set database password as environment variable:

```bash
export TF_VAR_db_admin_password="your-strong-password-here"
```

Or use AWS Secrets Manager:

```bash
# Store password in Secrets Manager
aws secretsmanager create-secret \
  --name sensormine/db-admin-password \
  --secret-string "your-strong-password-here"

# Reference in terraform.tfvars
db_admin_password = data.aws_secretsmanager_secret_version.db_password.secret_string
```

## 🎯 Deployment

### Initialize Terraform
```bash
cd infrastructure/terraform/aws

terraform init \
  -backend-config="bucket=sensormine-tfstate" \
  -backend-config="key=sensormine-dev.terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=terraform-locks"
```

### Plan Deployment
```bash
# Development environment
terraform plan -var-file="environments/dev.tfvars" -out=tfplan

# Staging environment
terraform plan -var-file="environments/staging.tfvars" -out=tfplan

# Production environment
terraform plan -var-file="environments/prod.tfvars" -out=tfplan
```

### Apply Infrastructure
```bash
terraform apply tfplan
```

### Connect to EKS Cluster
```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name sensormine-dev-eks

# Verify connection
kubectl get nodes
```

### Destroy Infrastructure
```bash
terraform destroy -var-file="environments/dev.tfvars"
```

## 📦 Deployed Resources

### Networking
- **VPC**: Custom VPC with public, private, and database subnets across 3 AZs
- **NAT Gateways**: High availability NAT for private subnets
- **Security Groups**: Isolated security groups for each tier
- **VPC Flow Logs**: Network traffic logging to CloudWatch

### Compute
- **EKS Cluster**: Kubernetes 1.28 with 2 node groups (system, workload)
- **System Node Group**: 2-10 nodes for system pods
- **Workload Node Group**: 2-20 nodes for application pods
- **Auto-scaling**: Cluster Autoscaler enabled

### Database
- **RDS PostgreSQL 15**: With Multi-AZ for production
- **TimescaleDB Support**: Extension can be enabled post-deployment
- **Automated Backups**: 35 days retention for production
- **Encryption**: At-rest and in-transit encryption enabled

### Caching
- **ElastiCache Redis 7**: Cluster mode with automatic failover
- **Multi-AZ**: Enabled for production environments
- **Encryption**: At-rest and in-transit encryption

### Messaging
- **MSK Cluster**: Apache Kafka 3.5.1 with 3-6 brokers
- **Encryption**: TLS client-broker, TLS in-cluster
- **Auto-scaling**: Storage auto-scaling enabled
- **Monitoring**: CloudWatch metrics and logs

### Container Registry
- **ECR Repositories**: One per microservice
- **Image Scanning**: Automatic vulnerability scanning
- **Lifecycle Policies**: Automatic cleanup of old images

### Storage
- **S3 Buckets**: Separate buckets for videos, CAD, LiDAR, exports
- **Versioning**: Enabled for production
- **Lifecycle Policies**: Automatic tiering to Glacier
- **Encryption**: Server-side encryption with S3 managed keys

### Security
- **Secrets Manager**: Connection strings and API keys
- **IAM Roles**: IRSA (IAM Roles for Service Accounts) for pods
- **KMS**: Encryption keys for EKS secrets and RDS

### Load Balancing
- **Application Load Balancer**: HTTP/HTTPS ingress
- **Target Groups**: Dynamic routing to EKS services
- **SSL/TLS**: AWS Certificate Manager integration

### Monitoring
- **CloudWatch Logs**: Application and audit logs
- **CloudWatch Metrics**: Custom metrics from all services
- **VPC Flow Logs**: Network traffic analysis

## 💰 Cost Estimation

### Development Environment (~$300/month)
- EKS: Free control plane + ~$60/month for 2 t3.medium nodes
- RDS: db.t3.medium ~$60/month
- ElastiCache: cache.t3.micro ~$15/month
- MSK: 2x kafka.t3.small ~$120/month
- Data Transfer & Storage: ~$45/month

### Production Environment (~$3,200/month)
- EKS: Free control plane + ~$800/month for 5-20 m5.xlarge nodes
- RDS: db.r6g.2xlarge Multi-AZ ~$1,200/month
- ElastiCache: 3x cache.r6g.large ~$300/month
- MSK: 6x kafka.m5.2xlarge ~$1,600/month
- Load Balancer: ~$50/month
- Data Transfer & Storage: ~$250/month

*Estimates for us-east-1 region, actual costs vary by usage*

## 🔐 Security Best Practices

### Network Security
1. **Private Subnets**: All application resources in private subnets
2. **Security Groups**: Least privilege security group rules
3. **VPC Endpoints**: S3 and ECR VPC endpoints to avoid internet traffic
4. **Network ACLs**: Additional layer of network security

### Access Control
1. **IAM Roles**: Use IRSA for pod-level IAM permissions
2. **Least Privilege**: Minimal required permissions for each service
3. **MFA**: Enforce MFA for console access
4. **Access Logging**: CloudTrail for all API calls

### Data Protection
1. **Encryption at Rest**: KMS encryption for all data stores
2. **Encryption in Transit**: TLS 1.2+ for all connections
3. **Secrets Management**: Never store secrets in code or environment variables
4. **Database Backups**: Automated backups with point-in-time recovery

### Compliance
1. **Audit Logging**: CloudWatch Logs with 365-day retention
2. **Compliance Standards**: AWS Config rules for compliance
3. **Vulnerability Scanning**: ECR image scanning
4. **Patch Management**: Automated OS patching for RDS and ElastiCache

## 📊 Monitoring Setup

### CloudWatch Dashboards
```bash
# Create custom dashboard
aws cloudwatch put-dashboard --dashboard-name Sensormine-Overview \
  --dashboard-body file://dashboards/overview.json
```

### Alarms
Key metrics to monitor:
- EKS node CPU/Memory > 80%
- RDS CPU > 80%, Free Storage < 20%
- ElastiCache CPU > 75%, Evictions > 0
- MSK Disk Usage > 80%
- ALB 5xx errors > 1%

### Application Logging
```yaml
# Log to CloudWatch
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [OUTPUT]
        Name cloudwatch_logs
        Match *
        region us-east-1
        log_group_name /aws/sensormine-dev/application
        auto_create_group true
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
See `.github/workflows/aws-deploy.yml` for automated deployment.

### Manual Deployment Steps
1. Build Docker images
2. Push to ECR
3. Update Kubernetes manifests
4. Deploy via Helm

```bash
# Push image to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${ECR_URL}

docker build -t device-api:latest .
docker tag device-api:latest ${ECR_URL}/device-api:latest
docker push ${ECR_URL}/device-api:latest

# Deploy to EKS
helm upgrade --install sensormine ./helm/sensormine-platform \
  --namespace sensormine \
  --set image.tag=latest
```

## 🛠️ Troubleshooting

### EKS Access Issues
```bash
# Update kubeconfig
aws eks update-kubeconfig --name sensormine-dev-eks --region us-east-1

# Verify IAM permissions
aws sts get-caller-identity

# Check EKS cluster status
aws eks describe-cluster --name sensormine-dev-eks --region us-east-1
```

### RDS Connection Issues
```bash
# Test connectivity from EKS pod
kubectl run -it --rm psql --image=postgres:15 --restart=Never -- \
  psql -h ${RDS_ENDPOINT} -U sensormineadmin -d sensormine
```

### MSK Connection Issues
```bash
# Get bootstrap brokers
aws kafka get-bootstrap-brokers \
  --cluster-arn ${MSK_ARN}

# Test from EKS pod
kubectl run -it --rm kafka-test --image=confluentinc/cp-kafka:latest --restart=Never -- \
  kafka-topics --bootstrap-server ${MSK_ENDPOINT} --list
```

## 📚 Additional Resources

- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [MSK Developer Guide](https://docs.aws.amazon.com/msk/latest/developerguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## 🤝 Support

For infrastructure issues:
1. Check Terraform logs: `TF_LOG=DEBUG terraform apply`
2. Check AWS Console for resource status
3. Review CloudWatch Logs for application errors
4. Check GitHub Actions workflow logs
