# Event Hubs Module (Kafka-compatible)

resource "azurerm_eventhub_namespace" "main" {
  name                = var.namespace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  capacity            = var.capacity
  
  auto_inflate_enabled     = true
  maximum_throughput_units = 20
  
  network_rulesets {
    default_action = "Deny"
    
    virtual_network_rule {
      subnet_id = var.subnet_id
    }
  }

  tags = var.tags
}

resource "azurerm_eventhub" "hubs" {
  for_each = { for hub in var.event_hubs : hub.name => hub }
  
  name                = each.value.name
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = var.resource_group_name
  partition_count     = each.value.partition_count
  message_retention   = each.value.message_retention
}

resource "azurerm_eventhub_consumer_group" "default" {
  for_each = { for hub in var.event_hubs : hub.name => hub }
  
  name                = "$Default"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.hubs[each.key].name
  resource_group_name = var.resource_group_name
}

output "namespace_id" {
  value = azurerm_eventhub_namespace.main.id
}

output "namespace_name" {
  value = azurerm_eventhub_namespace.main.name
}

output "endpoint" {
  value = azurerm_eventhub_namespace.main.default_primary_connection_string
  sensitive = true
}

output "connection_string" {
  value     = azurerm_eventhub_namespace.main.default_primary_connection_string
  sensitive = true
}

output "kafka_endpoint" {
  value = "${azurerm_eventhub_namespace.main.name}.servicebus.windows.net:9093"
}
