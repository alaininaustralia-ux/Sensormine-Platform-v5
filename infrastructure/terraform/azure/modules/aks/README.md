# Azure Kubernetes Service (AKS) Module

This module creates a production-ready Azure Kubernetes Service cluster with autoscaling, monitoring, and security features.

## Features

- **Multi-Node Pool**: System and workload node pools with separate scaling
- **Auto-scaling**: Horizontal pod autoscaling and cluster autoscaling
- **Network Security**: Azure CNI with Calico network policies
- **Monitoring**: Integrated with Azure Monitor and Log Analytics
- **Security**: Azure Policy integration, System-assigned managed identity
- **High Availability**: Zone-redundant deployment

## Usage

```hcl
module "aks" {
  source = "./modules/aks"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  cluster_name        = "aks-sensormine-prod"
  dns_prefix          = "sensormine-prod"
  subnet_id           = azurerm_subnet.aks.id
  
  node_pool_vm_size          = "Standard_D4s_v3"
  node_pool_min_count        = 3
  node_pool_max_count        = 10
  workload_node_vm_size      = "Standard_D8s_v3"
  workload_node_min_count    = 2
  workload_node_max_count    = 20
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
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
| cluster_name | Name of the AKS cluster | string | - | yes |
| dns_prefix | DNS prefix for the cluster | string | - | yes |
| subnet_id | Subnet ID for the cluster | string | - | yes |
| node_pool_vm_size | VM size for system node pool | string | Standard_D4s_v3 | no |
| node_pool_min_count | Minimum nodes in system pool | number | 3 | no |
| node_pool_max_count | Maximum nodes in system pool | number | 10 | no |
| workload_node_vm_size | VM size for workload node pool | string | Standard_D4s_v3 | no |
| workload_node_min_count | Minimum nodes in workload pool | number | 2 | no |
| workload_node_max_count | Maximum nodes in workload pool | number | 20 | no |
| kubernetes_version | Kubernetes version | string | latest | no |
| log_analytics_workspace_id | Log Analytics workspace ID | string | - | yes |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| cluster_name | The name of the AKS cluster |
| cluster_id | The ID of the AKS cluster |
| kubeconfig | Raw kubeconfig (sensitive) |
| host | Kubernetes API server endpoint |
| identity_principal_id | Managed identity principal ID |
| node_resource_group | Auto-created resource group name |

## Node Pools

### System Node Pool
- **Purpose**: Running critical system pods (CoreDNS, metrics-server, etc.)
- **Node Labels**: system workload
- **Taints**: None (allows application pods with proper tolerations)
- **Auto-scaling**: Enabled

### Workload Node Pool
- **Purpose**: Running application workloads
- **Node Labels**: workload=application
- **Auto-scaling**: Enabled
- **Customizable**: Separate scaling parameters

## Network Configuration

- **Network Plugin**: Azure CNI
- **Network Policy**: Calico
- **Service CIDR**: 10.1.0.0/16
- **DNS Service IP**: 10.1.0.10
- **Load Balancer**: Standard SKU

## Security Features

1. **Azure Policy**: Enabled for compliance and governance
2. **Managed Identity**: System-assigned for Azure resource access
3. **Network Policies**: Calico for pod-to-pod security
4. **Private Cluster**: Optional (can be enabled)
5. **RBAC**: Kubernetes RBAC enabled by default

## Monitoring

- **Azure Monitor**: Container Insights enabled
- **Log Analytics**: All logs sent to workspace
- **Metrics**: Prometheus-compatible metrics endpoint
- **Diagnostics**: Comprehensive diagnostic settings

## Connecting to the Cluster

```bash
# Get cluster credentials
az aks get-credentials \
  --resource-group rg-sensormine-prod \
  --name aks-sensormine-prod

# Verify connection
kubectl get nodes

# View node pools
kubectl get nodes -L agentpool
```

## Upgrading the Cluster

```bash
# Check available versions
az aks get-upgrades \
  --resource-group rg-sensormine-prod \
  --name aks-sensormine-prod

# Upgrade cluster
az aks upgrade \
  --resource-group rg-sensormine-prod \
  --name aks-sensormine-prod \
  --kubernetes-version 1.28.0
```

## Best Practices

1. **Node Pool Separation**: Keep system and application workloads separate
2. **Auto-scaling**: Set appropriate min/max values for cost optimization
3. **Monitoring**: Always enable Container Insights
4. **Updates**: Keep Kubernetes version up to date
5. **Network Security**: Use Calico network policies
6. **Resource Limits**: Set pod resource requests and limits

## Cost Optimization

- Use **Standard_B** series for dev/test environments
- Use **Standard_D** series for production workloads
- Enable auto-scaling to optimize for variable loads
- Consider spot instances for non-critical workloads
- Use Azure Hybrid Benefit if you have Windows licenses

## VM Size Recommendations

| Environment | System Pool | Workload Pool |
|-------------|-------------|---------------|
| Development | Standard_B2ms (2 vCPU, 8GB) | Standard_B4ms (4 vCPU, 16GB) |
| Staging | Standard_D2s_v3 (2 vCPU, 8GB) | Standard_D4s_v3 (4 vCPU, 16GB) |
| Production | Standard_D4s_v3 (4 vCPU, 16GB) | Standard_D8s_v3 (8 vCPU, 32GB) |

## References

- [AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [AKS Best Practices](https://docs.microsoft.com/en-us/azure/aks/best-practices)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
