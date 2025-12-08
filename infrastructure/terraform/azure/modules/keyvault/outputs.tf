# Azure Key Vault Outputs

output "keyvault_id" {
  description = "The ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "keyvault_name" {
  description = "The name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "vault_uri" {
  description = "The URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "tenant_id" {
  description = "The Azure AD tenant ID used by the Key Vault"
  value       = azurerm_key_vault.main.tenant_id
}

output "secret_ids" {
  description = "Map of secret names to their IDs"
  value       = { for k, v in azurerm_key_vault_secret.secrets : k => v.id }
  sensitive   = true
}
