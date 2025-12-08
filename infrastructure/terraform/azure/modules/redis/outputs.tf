# Azure Cache for Redis Outputs

output "redis_id" {
  description = "The ID of the Redis Cache"
  value       = azurerm_redis_cache.main.id
}

output "hostname" {
  description = "The hostname of the Redis Cache"
  value       = azurerm_redis_cache.main.hostname
}

output "ssl_port" {
  description = "The SSL port of the Redis Cache"
  value       = azurerm_redis_cache.main.ssl_port
}

output "port" {
  description = "The non-SSL port of the Redis Cache (if enabled)"
  value       = azurerm_redis_cache.main.port
}

output "primary_access_key" {
  description = "The Primary Access Key for the Redis Cache"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "secondary_access_key" {
  description = "The Secondary Access Key for the Redis Cache"
  value       = azurerm_redis_cache.main.secondary_access_key
  sensitive   = true
}

output "connection_string" {
  description = "Redis connection string"
  value       = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False"
  sensitive   = true
}

output "stackexchange_connection_string" {
  description = "StackExchange.Redis formatted connection string"
  value       = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False,syncTimeout=30000"
  sensitive   = true
}
