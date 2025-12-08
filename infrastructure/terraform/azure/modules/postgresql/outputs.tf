# PostgreSQL Flexible Server Outputs

output "server_id" {
  description = "The ID of the PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "fqdn" {
  description = "The FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "server_name" {
  description = "The name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "administrator_login" {
  description = "The administrator login name"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
  sensitive   = true
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=sensormine;Username=${var.administrator_login};Password=${var.administrator_password};SSL Mode=Require;"
  sensitive   = true
}

output "timeseries_connection_string" {
  description = "TimescaleDB connection string"
  value       = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=timeseries;Username=${var.administrator_login};Password=${var.administrator_password};SSL Mode=Require;"
  sensitive   = true
}

output "metadata_connection_string" {
  description = "Metadata database connection string"
  value       = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=metadata;Username=${var.administrator_login};Password=${var.administrator_password};SSL Mode=Require;"
  sensitive   = true
}

output "database_names" {
  description = "List of created database names"
  value       = [for db in azurerm_postgresql_flexible_server_database.databases : db.name]
}
