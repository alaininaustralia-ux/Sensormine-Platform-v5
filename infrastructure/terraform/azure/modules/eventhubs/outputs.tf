# Event Hubs Namespace Outputs

output "namespace_id" {
  description = "The ID of the Event Hubs namespace"
  value       = azurerm_eventhub_namespace.main.id
}

output "namespace_name" {
  description = "The name of the Event Hubs namespace"
  value       = azurerm_eventhub_namespace.main.name
}

output "endpoint" {
  description = "The Event Hubs endpoint"
  value       = azurerm_eventhub_namespace.main.default_primary_connection_string
  sensitive   = true
}

output "connection_string" {
  description = "The primary connection string for the Event Hubs namespace"
  value       = azurerm_eventhub_namespace.main.default_primary_connection_string
  sensitive   = true
}

output "secondary_connection_string" {
  description = "The secondary connection string for the Event Hubs namespace"
  value       = azurerm_eventhub_namespace.main.default_secondary_connection_string
  sensitive   = true
}

output "kafka_endpoint" {
  description = "The Kafka-compatible endpoint"
  value       = "${azurerm_eventhub_namespace.main.name}.servicebus.windows.net:9093"
}

output "event_hub_names" {
  description = "List of created Event Hub names"
  value       = [for hub in azurerm_eventhub.hubs : hub.name]
}

output "event_hub_ids" {
  description = "Map of Event Hub names to their IDs"
  value       = { for k, v in azurerm_eventhub.hubs : k => v.id }
}
