variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "acr_name" {
  description = "Container registry name"
  type        = string
}

variable "sku" {
  description = "ACR SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Premium"
}

variable "subnet_id" {
  description = "Subnet ID for network rules"
  type        = string
}

variable "aks_principal_id" {
  description = "AKS managed identity principal ID for ACR pull access"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
