# Deployment Guide

## Overview

This guide covers deploying the Sensormine Platform v5 to various environments, from local development to production Kubernetes clusters.

## Deployment Targets

- [Local Development](#local-development)
- [Docker Compose](#docker-compose)
- [Kubernetes (Helm)](#kubernetes-helm)
- [Cloud Providers](#cloud-providers)
- [On-Premises](#on-premises)

---

## Local Development

### Quick Start
```bash
# Start infrastructure
docker-compose up -d

# Run service
dotnet run --project src/Services/Device.API
```

### Infrastructure Services
| Service | Port | Credentials |
|---------|------|-------------|
| Kafka | 9092 | - |
| Kafka UI | 8080 | - |
| MQTT | 1883 | anonymous |
| TimescaleDB | 5432 | sensormine/sensormine123 |
| PostgreSQL | 5433 | sensormine/sensormine123 |
| Redis | 6379 | - |
| MinIO | 9000, 9090 | minio/minio123 |
| OpenSearch | 9200 | - |
| Jaeger | 16686 | - |

---

## Docker Compose

### Build Images
```bash
# Build all services
docker-compose -f docker-compose.services.yml build

# Build specific service
docker-compose -f docker-compose.services.yml build device-api
```

### Run Complete Stack
```bash
# Start infrastructure + services
docker-compose -f docker-compose.yml -f docker-compose.services.yml up -d

# View logs
docker-compose logs -f

# Scale service
docker-compose up -d --scale ingestion-service=3

# Stop stack
docker-compose down
```

### Service Configuration
Create `docker-compose.services.yml`:
```yaml
version: '3.8'

services:
  device-api:
    build:
      context: .
      dockerfile: src/Services/Device.API/Dockerfile
    ports:
      - "5001:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__PostgreSQL=Host=postgres;Port=5432;Database=sensormine_metadata
      - Kafka__BootstrapServers=kafka:9092
    depends_on:
      - postgres
      - kafka
    networks:
      - sensormine-network

  ingestion-service:
    build:
      context: .
      dockerfile: src/Services/Ingestion.Service/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - Kafka__BootstrapServers=kafka:9092
      - ConnectionStrings__TimescaleDB=Host=timescaledb;Port=5432
    depends_on:
      - kafka
      - timescaledb
    networks:
      - sensormine-network

networks:
  sensormine-network:
    external: true
```

---

## Kubernetes (Helm)

### Prerequisites
- Kubernetes cluster (1.27+)
- kubectl configured
- Helm 3.12+

### Installation

#### 1. Create Namespace
```bash
kubectl create namespace sensormine
```

#### 2. Configure Values
Edit `infrastructure/helm/sensormine-platform/values.yaml`:
```yaml
global:
  imagePullSecrets:
    - name: docker-registry-secret

services:
  deviceAPI:
    replicaCount: 3
    image:
      repository: your-registry.com/device-api
      tag: "1.0.0"

ingress:
  enabled: true
  hosts:
    - host: api.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
```

#### 3. Install Chart
```bash
# Install with default values
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine

# Install with custom values
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values custom-values.yaml

# Install in dry-run mode (test)
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --dry-run --debug
```

#### 4. Verify Deployment
```bash
# Check release status
helm status sensormine -n sensormine

# List all pods
kubectl get pods -n sensormine

# Check services
kubectl get svc -n sensormine

# View logs
kubectl logs -f deployment/device-api -n sensormine
```

### Upgrade

```bash
# Upgrade release
helm upgrade sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values updated-values.yaml

# Rollback to previous version
helm rollback sensormine 1 -n sensormine

# View release history
helm history sensormine -n sensormine
```

### Uninstall

```bash
# Uninstall release
helm uninstall sensormine -n sensormine

# Delete namespace
kubectl delete namespace sensormine
```

### Custom Helm Values Examples

#### High Availability Setup
```yaml
# ha-values.yaml
services:
  deviceAPI:
    replicaCount: 5
    resources:
      limits:
        cpu: 1000m
        memory: 1Gi
      requests:
        cpu: 500m
        memory: 512Mi
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70

  ingestion:
    replicaCount: 10
    resources:
      limits:
        cpu: 2000m
        memory: 2Gi

timescaledb:
  persistence:
    enabled: true
    size: 500Gi
  replication:
    enabled: true
    numSynchronousReplicas: 2
```

#### External Dependencies
```yaml
# external-deps-values.yaml
kafka:
  enabled: false
  external:
    enabled: true
    bootstrapServers: "kafka-1.example.com:9092,kafka-2.example.com:9092"

timescaledb:
  enabled: false
  external:
    enabled: true
    host: "timescale.example.com"
    port: 5432
    database: "sensormine_timeseries"
    username: "sensormine"
    password: "secure-password"

redis:
  enabled: false
  external:
    enabled: true
    host: "redis.example.com"
    port: 6379
```

---

## Cloud Providers

### AWS (EKS)

#### Infrastructure Setup with Terraform
```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan
terraform plan \
  -var="cluster_name=sensormine-prod" \
  -var="environment=production" \
  -var="aws_region=us-east-1"

# Apply
terraform apply \
  -var="cluster_name=sensormine-prod" \
  -var="environment=production"
```

#### Configure kubectl
```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name sensormine-prod
```

#### Deploy Application
```bash
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values infrastructure/helm/values-aws.yaml
```

#### AWS-Specific Values
```yaml
# values-aws.yaml
global:
  cloudProvider: aws

kafka:
  enabled: false
  external:
    enabled: true
    bootstrapServers: "b-1.kafka.amazonaws.com:9092"

minio:
  enabled: false
  external:
    enabled: true
    endpoint: "s3.amazonaws.com"
    bucket: "sensormine-data"
    region: "us-east-1"

timescaledb:
  enabled: false
  external:
    enabled: true
    host: "sensormine.cluster-xyz.us-east-1.rds.amazonaws.com"

ingress:
  className: "alb"
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
```

### Azure (AKS)

#### Create AKS Cluster
```bash
# Create resource group
az group create --name sensormine-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group sensormine-rg \
  --name sensormine-aks \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group sensormine-rg \
  --name sensormine-aks
```

#### Deploy Application
```bash
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values infrastructure/helm/values-azure.yaml
```

#### Azure-Specific Values
```yaml
# values-azure.yaml
global:
  cloudProvider: azure

kafka:
  enabled: false
  external:
    enabled: true
    bootstrapServers: "sensormine.servicebus.windows.net:9093"

minio:
  enabled: false
  external:
    enabled: true
    endpoint: "https://sensorminestorage.blob.core.windows.net"

ingress:
  className: "azure-application-gateway"
```

### GCP (GKE)

#### Create GKE Cluster
```bash
# Create cluster
gcloud container clusters create sensormine-gke \
  --region us-central1 \
  --num-nodes 3 \
  --machine-type n1-standard-2

# Get credentials
gcloud container clusters get-credentials sensormine-gke \
  --region us-central1
```

#### Deploy Application
```bash
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values infrastructure/helm/values-gcp.yaml
```

---

## On-Premises

### Prerequisites
- Self-managed Kubernetes cluster
- Load balancer (MetalLB or similar)
- Persistent storage (NFS, Ceph, or local)

### Storage Class Configuration
```yaml
# storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: sensormine-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

### Deploy with On-Prem Values
```yaml
# values-onprem.yaml
global:
  storageClass: "sensormine-storage"

ingress:
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"

kafka:
  enabled: true
  persistence:
    storageClass: "sensormine-storage"

timescaledb:
  enabled: true
  persistence:
    storageClass: "sensormine-storage"
```

```bash
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values infrastructure/helm/values-onprem.yaml
```

---

## Air-Gapped Deployment

### 1. Prepare Images
```bash
# Export images
docker save -o sensormine-images.tar \
  sensormine/device-api:1.0.0 \
  sensormine/ingestion-service:1.0.0 \
  # ... all images

# Transfer to air-gapped environment
```

### 2. Load Images
```bash
# Load images
docker load -i sensormine-images.tar

# Push to private registry
docker tag sensormine/device-api:1.0.0 registry.local/device-api:1.0.0
docker push registry.local/device-api:1.0.0
```

### 3. Update Values
```yaml
# values-airgap.yaml
global:
  imageRegistry: "registry.local"
  imagePullSecrets:
    - name: private-registry-secret

services:
  deviceAPI:
    image:
      repository: registry.local/device-api
```

### 4. Deploy
```bash
# Create image pull secret
kubectl create secret docker-registry private-registry-secret \
  --docker-server=registry.local \
  --docker-username=admin \
  --docker-password=password \
  -n sensormine

# Install
helm install sensormine infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values infrastructure/helm/values-airgap.yaml
```

---

## Monitoring & Health Checks

### Check Service Health
```bash
# All pods
kubectl get pods -n sensormine

# Specific service
kubectl describe pod device-api-xxx -n sensormine

# Logs
kubectl logs -f deployment/device-api -n sensormine

# Port forward for local testing
kubectl port-forward svc/device-api 8080:80 -n sensormine
```

### Prometheus Metrics
```bash
# Access metrics endpoint
kubectl port-forward svc/prometheus 9090:9090 -n monitoring

# Query metrics
curl http://localhost:9090/api/v1/query?query=up
```

### Jaeger Tracing
```bash
# Access Jaeger UI
kubectl port-forward svc/jaeger-query 16686:16686 -n observability
```

---

## Backup & Recovery

### Database Backups
```bash
# Backup TimescaleDB
kubectl exec -it timescaledb-0 -n sensormine -- \
  pg_dump -U sensormine sensormine_timeseries > backup.sql

# Restore
kubectl exec -i timescaledb-0 -n sensormine -- \
  psql -U sensormine sensormine_timeseries < backup.sql
```

### Persistent Volume Backups
```bash
# Backup PV using Velero
velero backup create sensormine-backup \
  --include-namespaces sensormine

# Restore
velero restore create --from-backup sensormine-backup
```

---

## Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n sensormine
kubectl logs <pod-name> -n sensormine --previous
```

#### Database Connection Issues
```bash
# Test connectivity
kubectl run -it --rm debug --image=postgres --restart=Never -- \
  psql -h timescaledb.sensormine.svc.cluster.local -U sensormine

# Check service DNS
kubectl exec -it <pod-name> -n sensormine -- nslookup timescaledb
```

#### Kafka Connection Issues
```bash
# Check Kafka pods
kubectl get pods -l app=kafka -n sensormine

# Test Kafka connectivity
kubectl exec -it kafka-0 -n sensormine -- \
  kafka-topics.sh --list --bootstrap-server localhost:9092
```

---

## Security Best Practices

1. **Use Secrets Management**
   - Store sensitive data in Kubernetes Secrets
   - Use external secret managers (Vault, AWS Secrets Manager)

2. **Network Policies**
   - Restrict pod-to-pod communication
   - Limit external access

3. **RBAC**
   - Define service accounts with minimal permissions
   - Use namespaces for isolation

4. **Image Security**
   - Scan images for vulnerabilities
   - Use signed images
   - Regular updates

---

## Performance Tuning

### Resource Optimization
```yaml
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi
```

### Horizontal Pod Autoscaling
```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Database Tuning
- Connection pooling
- Index optimization
- Partitioning strategies
- Continuous aggregations (TimescaleDB)

---

## Support

For deployment assistance:
- Review logs: `kubectl logs -f <pod-name> -n sensormine`
- Check events: `kubectl get events -n sensormine --sort-by='.lastTimestamp'`
- Contact support team
