# Azure IoT Hub Outputs

output "iothub_id" {
  description = "The ID of the IoT Hub"
  value       = azurerm_iothub.main.id
}

output "iothub_name" {
  description = "The name of the IoT Hub"
  value       = azurerm_iothub.main.name
}

output "hostname" {
  description = "The hostname of the IoT Hub"
  value       = azurerm_iothub.main.hostname
}

output "event_hub_events_endpoint" {
  description = "The Event Hub-compatible endpoint for device events"
  value       = azurerm_iothub.main.event_hub_events_endpoint
}

output "event_hub_events_path" {
  description = "The Event Hub-compatible path for device events"
  value       = azurerm_iothub.main.event_hub_events_path
}

output "iothub_connection_string" {
  description = "The primary connection string for IoT Hub"
  value       = "HostName=${azurerm_iothub.main.hostname};SharedAccessKeyName=${azurerm_iothub_shared_access_policy.iothubowner.name};SharedAccessKey=${azurerm_iothub_shared_access_policy.iothubowner.primary_key}"
  sensitive   = true
}

output "shared_access_policy_key" {
  description = "The primary key for the iothubowner policy"
  value       = azurerm_iothub_shared_access_policy.iothubowner.primary_key
  sensitive   = true
}
