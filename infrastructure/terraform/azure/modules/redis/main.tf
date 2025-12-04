# Redis Cache Module

resource "azurerm_redis_cache" "main" {
  name                = var.redis_name
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = var.capacity
  family              = var.family
  sku_name            = var.sku_name
  
  enable_non_ssl_port           = false
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false
  
  redis_configuration {
    enable_authentication         = true
    maxmemory_policy             = "allkeys-lru"
    notify_keyspace_events       = "KEA"
    rdb_backup_enabled           = var.sku_name == "Premium" ? true : false
    rdb_backup_frequency         = var.sku_name == "Premium" ? 60 : null
    rdb_storage_connection_string = var.sku_name == "Premium" ? var.backup_storage_connection_string : null
  }

  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 3
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "redis" {
  name                = "${var.redis_name}-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.redis_name}-psc"
    private_connection_resource_id = azurerm_redis_cache.main.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  tags = var.tags
}

output "redis_id" {
  value = azurerm_redis_cache.main.id
}

output "hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "ssl_port" {
  value = azurerm_redis_cache.main.ssl_port
}

output "primary_access_key" {
  value     = azurerm_redis_cache.main.primary_access_key
  sensitive = true
}

output "connection_string" {
  value     = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False"
  sensitive = true
}
