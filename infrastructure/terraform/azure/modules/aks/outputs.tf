# Azure Kubernetes Service Outputs

output "cluster_name" {
  description = "The name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_id" {
  description = "The ID of the AKS cluster"
  value       = azurerm_kubernetes_cluster.main.id
}

output "kubeconfig" {
  description = "Raw kubeconfig for the AKS cluster"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "host" {
  description = "The Kubernetes cluster server host"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].host
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "The cluster CA certificate"
  value       = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
  sensitive   = true
}

output "client_key" {
  description = "The client key for authentication"
  value       = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_key)
  sensitive   = true
}

output "client_certificate" {
  description = "The client certificate for authentication"
  value       = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].client_certificate)
  sensitive   = true
}

output "identity_principal_id" {
  description = "The Principal ID of the system assigned managed identity"
  value       = azurerm_kubernetes_cluster.main.identity[0].principal_id
}

output "kubelet_identity_object_id" {
  description = "The Object ID of the kubelet identity"
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "node_resource_group" {
  description = "The resource group name for AKS managed resources"
  value       = azurerm_kubernetes_cluster.main.node_resource_group
}

output "fqdn" {
  description = "The FQDN of the Azure Kubernetes managed cluster"
  value       = azurerm_kubernetes_cluster.main.fqdn
}
