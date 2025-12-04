variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "namespace_name" {
  description = "Event Hubs namespace name"
  type        = string
}

variable "sku" {
  description = "Event Hubs SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "capacity" {
  description = "Throughput units"
  type        = number
  default     = 2
}

variable "subnet_id" {
  description = "Subnet ID for network rules"
  type        = string
}

variable "event_hubs" {
  description = "List of Event Hubs to create"
  type = list(object({
    name              = string
    partition_count   = number
    message_retention = number
  }))
  default = []
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
