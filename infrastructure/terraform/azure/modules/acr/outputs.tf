# Azure Container Registry Outputs

output "acr_id" {
  description = "The ID of the Azure Container Registry"
  value       = azurerm_container_registry.main.id
}

output "login_server" {
  description = "The login server URL for the container registry"
  value       = azurerm_container_registry.main.login_server
}

output "admin_username" {
  description = "The admin username for the container registry"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "admin_password" {
  description = "The admin password for the container registry"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

output "identity_principal_id" {
  description = "The Principal ID of the System Assigned Managed Identity"
  value       = azurerm_container_registry.main.identity[0].principal_id
}
