# Deployment Guide

**Last Updated:** December 10, 2025  
**Status:** Production-Ready  
**Deployment Targets:** Docker Compose (Dev), Kubernetes (Prod), AWS, Azure, GCP, On-Premises

---

## 🎯 Overview

This guide covers deploying the Sensormine Platform v5 across different environments, from local development to production cloud deployments.

---

## 📋 Quick Reference

| Environment | Use Case | Complexity | Recommended For |
|------------|----------|------------|-----------------|
| **Docker Compose** | Local development, testing | Low | Developers, POC |
| **Kubernetes (Helm)** | Production, staging | Medium | Production workloads |
| **AWS EKS** | Cloud production | Medium | AWS customers |
| **Azure AKS** | Cloud production | Medium | Azure customers |
| **GCP GKE** | Cloud production | Medium | GCP customers |
| **On-Premises** | Private deployment | High | Enterprise, regulated industries |
| **Air-Gapped** | Secure, isolated environments | High | Government, defense, banking |

---

## 🐳 Docker Compose Deployment

### Use Cases
- Local development
- Integration testing
- Proof of concept
- Small-scale deployments

### Prerequisites
- Docker Desktop 4.25+
- Docker Compose 2.20+
- 16GB RAM minimum
- 50GB disk space

### Quick Start

```powershell
# Clone repository
git clone https://github.com/alaininaustralia-ux/Sensormine-Platform-v5.git
cd Sensormine-Platform-v5

# Start infrastructure
docker-compose up -d

# Verify services
docker ps

# View logs
docker-compose logs -f
```

### Infrastructure Services

| Service | Port | Credentials | Health Check |
|---------|------|-------------|--------------|
| **TimescaleDB** | 5452 | sensormine/sensormine123 | `docker exec sensormine-timescaledb psql -U sensormine -c "SELECT 1"` |
| **Kafka** | 9092 | None | `docker exec sensormine-kafka kafka-topics.sh --list --bootstrap-server localhost:9092` |
| **MQTT** | 1883, 9001 | None | `docker exec sensormine-mqtt mosquitto_sub -t test -C 1` |
| **Redis** | 6379 | None | `docker exec sensormine-redis redis-cli ping` |
| **MinIO** | 9000, 9090 | minio/minio123 | `curl http://localhost:9000/minio/health/live` |

---

## ☸️ Kubernetes (Helm) Deployment

### Prerequisites
- Kubernetes 1.27+
- kubectl configured
- Helm 3.12+
- Persistent storage provisioner

### Installation Steps

```bash
# Create namespace
kubectl create namespace sensormine

# Install chart
helm install sensormine ./infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values custom-values.yaml

# Check status
helm status sensormine -n sensormine
```

### High Availability Configuration

```yaml
services:
  deviceAPI:
    replicaCount: 5
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70

timescaledb:
  replication:
    enabled: true
    numSynchronousReplicas: 2
  backup:
    enabled: true
    schedule: "0 2 * * *"
```

---

## ☁️ Cloud Provider Deployments

### AWS (EKS)

```bash
# Create cluster
terraform apply -var="cluster_name=sensormine-prod"

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name sensormine-prod

# Deploy
helm install sensormine ./infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values values-aws.yaml
```

### Azure (AKS)

```bash
# Create cluster
az aks create --resource-group sensormine-rg --name sensormine-aks

# Get credentials
az aks get-credentials --resource-group sensormine-rg --name sensormine-aks

# Deploy
helm install sensormine ./infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values values-azure.yaml
```

### GCP (GKE)

```bash
# Create cluster
gcloud container clusters create sensormine-gke --region us-central1

# Get credentials
gcloud container clusters get-credentials sensormine-gke --region us-central1

# Deploy
helm install sensormine ./infrastructure/helm/sensormine-platform \
  --namespace sensormine \
  --values values-gcp.yaml
```

---

## 🔍 Monitoring & Health Checks

```bash
# Check pods
kubectl get pods -n sensormine

# View logs
kubectl logs -f deployment/device-api -n sensormine

# Port forward
kubectl port-forward svc/device-api 8080:80 -n sensormine
```

---

## 💾 Backup & Recovery

### Database Backups

```bash
# Manual backup
kubectl exec -it timescaledb-0 -n sensormine -- \
  pg_dump -U sensormine sensormine_metadata | \
  gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup-20251210.sql.gz | \
  kubectl exec -i timescaledb-0 -n sensormine -- \
  psql -U sensormine sensormine_metadata
```

### Cluster Backup with Velero

```bash
# Create backup
velero backup create sensormine-full-backup \
  --include-namespaces sensormine

# Restore
velero restore create --from-backup sensormine-full-backup
```

---

## 🔒 Security Best Practices

1. **Network Policies**: Restrict pod-to-pod communication
2. **Secrets Management**: Use external secret managers (Vault, AWS Secrets Manager)
3. **RBAC**: Define service accounts with minimal permissions
4. **Image Security**: Scan images, use signed images
5. **Pod Security**: Run as non-root, drop capabilities

---

## ⚡ Performance Tuning

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
```

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n sensormine
kubectl logs <pod-name> -n sensormine --previous
kubectl get events -n sensormine --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
kubectl exec -it <pod-name> -n sensormine -- nc -zv timescaledb 5432
kubectl exec -it <pod-name> -n sensormine -- nslookup timescaledb
```

---

## 📚 Related Documentation

- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Container architecture
- **[LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md)** - Local setup
- **[DATABASE.md](./DATABASE.md)** - Database operations
- **[APPLICATION.md](./APPLICATION.md)** - Microservices architecture

---

**Last Review:** December 10, 2025  
**Next Review:** January 10, 2026  
**Owner:** Platform Team
