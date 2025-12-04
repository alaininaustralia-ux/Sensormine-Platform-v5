# Terraform Outputs

output "subscription_id" {
  value       = data.azurerm_client_config.current.subscription_id
  description = "Azure subscription ID"
}

output "tenant_id" {
  value       = data.azurerm_client_config.current.tenant_id
  description = "Azure tenant ID"
}

output "resource_group_id" {
  value       = azurerm_resource_group.main.id
  description = "Resource group ID"
}

output "vnet_id" {
  value       = azurerm_virtual_network.main.id
  description = "Virtual network ID"
}

output "aks_identity_principal_id" {
  value       = module.aks.identity_principal_id
  description = "AKS managed identity principal ID"
}

output "log_analytics_workspace_id" {
  value       = azurerm_log_analytics_workspace.main.workspace_id
  description = "Log Analytics workspace ID"
}

output "connection_info" {
  value = {
    postgresql = {
      host     = module.postgresql.fqdn
      port     = 5432
      database = "sensormine"
      username = var.db_admin_username
    }
    redis = {
      host = module.redis.hostname
      port = 6380
      ssl  = true
    }
    eventhub = {
      namespace = module.eventhubs.namespace_name
      endpoint  = module.eventhubs.endpoint
    }
    storage = {
      name     = module.storage.storage_account_name
      endpoint = module.storage.primary_blob_endpoint
    }
    iothub = {
      hostname = module.iothub.hostname
    }
  }
  description = "Connection information for all services"
  sensitive   = true
}

output "kubernetes_config" {
  value = {
    host                   = module.aks.host
    cluster_ca_certificate = module.aks.cluster_ca_certificate
  }
  description = "Kubernetes cluster configuration"
  sensitive   = true
}
