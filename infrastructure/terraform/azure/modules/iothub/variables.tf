variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "iothub_name" {
  description = "IoT Hub name"
  type        = string
}

variable "sku_name" {
  description = "IoT Hub SKU (F1, S1, S2, S3)"
  type        = string
  default     = "S2"
}

variable "sku_capacity" {
  description = "Number of provisioned units"
  type        = number
  default     = 2
}

variable "subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
}

variable "eventhub_connection_string" {
  description = "Event Hub connection string for telemetry routing"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
