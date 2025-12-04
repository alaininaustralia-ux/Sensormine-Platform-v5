# Azure Container Registry Module

resource "azurerm_container_registry" "main" {
  name                = var.acr_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = false

  identity {
    type = "SystemAssigned"
  }

  network_rule_set {
    default_action = "Deny"
    
    virtual_network {
      action    = "Allow"
      subnet_id = var.subnet_id
    }
  }

  retention_policy {
    days    = 30
    enabled = true
  }

  trust_policy {
    enabled = true
  }

  tags = var.tags
}

# Grant AKS pull access to ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = var.aks_principal_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}

output "acr_id" {
  value = azurerm_container_registry.main.id
}

output "login_server" {
  value = azurerm_container_registry.main.login_server
}

output "admin_username" {
  value = azurerm_container_registry.main.admin_username
}
