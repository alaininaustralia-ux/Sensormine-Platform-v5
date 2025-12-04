# IoT Hub Module

resource "azurerm_iothub" "main" {
  name                = var.iothub_name
  resource_group_name = var.resource_group_name
  location            = var.location

  sku {
    name     = var.sku_name
    capacity = var.sku_capacity
  }

  endpoint {
    type                       = "AzureIotHub.EventHub"
    connection_string          = var.eventhub_connection_string
    name                       = "telemetry-eventhub"
    batch_frequency_in_seconds = 60
    max_chunk_size_in_bytes    = 10485760
    encoding                   = "JSON"
  }

  route {
    name           = "telemetry-route"
    source         = "DeviceMessages"
    condition      = "true"
    endpoint_names = ["telemetry-eventhub"]
    enabled        = true
  }

  fallback_route {
    source         = "DeviceMessages"
    condition      = "true"
    endpoint_names = ["events"]
    enabled        = true
  }

  public_network_access_enabled = false

  tags = var.tags
}

resource "azurerm_private_endpoint" "iothub" {
  name                = "${var.iothub_name}-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.iothub_name}-psc"
    private_connection_resource_id = azurerm_iothub.main.id
    subresource_names              = ["iotHub"]
    is_manual_connection           = false
  }

  tags = var.tags
}

output "iothub_id" {
  value = azurerm_iothub.main.id
}

output "hostname" {
  value = azurerm_iothub.main.hostname
}

output "event_hub_events_endpoint" {
  value = azurerm_iothub.main.event_hub_events_endpoint
}

output "event_hub_events_path" {
  value = azurerm_iothub.main.event_hub_events_path
}
