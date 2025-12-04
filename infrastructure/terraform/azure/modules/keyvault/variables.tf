variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "keyvault_name" {
  description = "Key Vault name"
  type        = string
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for network rules"
  type        = string
}

variable "aks_principal_id" {
  description = "AKS managed identity principal ID"
  type        = string
}

variable "secrets" {
  description = "Map of secrets to store in Key Vault"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
