variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "redis_name" {
  description = "Redis cache name"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
}

variable "sku_name" {
  description = "Redis SKU name (Basic, Standard, Premium)"
  type        = string
  default     = "Premium"
}

variable "family" {
  description = "Redis family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "P"
}

variable "capacity" {
  description = "Redis cache capacity"
  type        = number
  default     = 1
}

variable "backup_storage_connection_string" {
  description = "Storage connection string for RDB backups (Premium only)"
  type        = string
  default     = null
  sensitive   = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
