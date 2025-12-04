variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "server_name" {
  description = "PostgreSQL server name"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
}

variable "vnet_id" {
  description = "Virtual network ID"
  type        = string
}

variable "administrator_login" {
  description = "Administrator username"
  type        = string
  sensitive   = true
}

variable "administrator_password" {
  description = "Administrator password"
  type        = string
  sensitive   = true
}

variable "sku_name" {
  description = "PostgreSQL SKU"
  type        = string
  default     = "GP_Standard_D4s_v3"
}

variable "storage_mb" {
  description = "Storage in MB"
  type        = number
  default     = 131072
}

variable "databases" {
  description = "List of databases to create"
  type        = list(string)
  default     = ["sensormine"]
}

variable "allow_azure_services" {
  description = "Allow Azure services to access server"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
