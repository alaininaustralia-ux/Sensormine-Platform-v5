# Key Vault Module

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = var.keyvault_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = var.tenant_id
  sku_name                   = "premium"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    
    virtual_network_subnet_ids = [var.subnet_id]
  }

  access_policy {
    tenant_id = var.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Recover",
      "Backup",
      "Restore",
      "Purge"
    ]
  }

  # AKS managed identity access
  access_policy {
    tenant_id = var.tenant_id
    object_id = var.aks_principal_id

    secret_permissions = [
      "Get",
      "List"
    ]
  }

  tags = var.tags
}

# Store secrets
resource "azurerm_key_vault_secret" "secrets" {
  for_each = var.secrets
  
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault.main]
}

output "keyvault_id" {
  value = azurerm_key_vault.main.id
}

output "vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}
