# PostgreSQL Flexible Server Module with TimescaleDB

resource "azurerm_private_dns_zone" "postgres" {
  name                = "${var.server_name}.private.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${var.server_name}-vnet-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = var.vnet_id
  tags                  = var.tags
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location

  administrator_login    = var.administrator_login
  administrator_password = var.administrator_password

  sku_name   = var.sku_name
  version    = "15"
  storage_mb = var.storage_mb

  backup_retention_days        = 35
  geo_redundant_backup_enabled = true
  auto_grow_enabled            = true

  delegated_subnet_id = var.subnet_id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  maintenance_window {
    day_of_week  = 0
    start_hour   = 3
    start_minute = 0
  }

  tags = var.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

# Enable TimescaleDB extension
resource "azurerm_postgresql_flexible_server_configuration" "timescaledb" {
  name      = "shared_preload_libraries"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "timescaledb"
}

# Create databases
resource "azurerm_postgresql_flexible_server_database" "databases" {
  for_each  = toset(var.databases)
  name      = each.value
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Firewall rule for Azure services (if needed)
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  count            = var.allow_azure_services ? 1 : 0
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

output "server_id" {
  value = azurerm_postgresql_flexible_server.main.id
}

output "fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "connection_string" {
  value     = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=sensormine;Username=${var.administrator_login};Password=${var.administrator_password};SSL Mode=Require;"
  sensitive = true
}
