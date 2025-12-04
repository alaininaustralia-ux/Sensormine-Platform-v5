# Variables for Azure Infrastructure

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "sensormine"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

# Network Configuration
variable "vnet_address_space" {
  description = "Address space for virtual network"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aks_subnet_address_prefix" {
  description = "Address prefix for AKS subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "database_subnet_address_prefix" {
  description = "Address prefix for database subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "services_subnet_address_prefix" {
  description = "Address prefix for services subnet"
  type        = string
  default     = "10.0.3.0/24"
}

# AKS Configuration
variable "aks_node_vm_size" {
  description = "VM size for AKS node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "aks_node_min_count" {
  description = "Minimum node count for AKS autoscaling"
  type        = number
  default     = 3
}

variable "aks_node_max_count" {
  description = "Maximum node count for AKS autoscaling"
  type        = number
  default     = 10
}

# PostgreSQL Configuration
variable "db_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "sensormineadmin"
  sensitive   = true
}

variable "db_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "postgresql_sku" {
  description = "PostgreSQL SKU"
  type        = string
  default     = "GP_Standard_D4s_v3"
}

variable "postgresql_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 131072 # 128 GB
}

# Redis Configuration
variable "redis_sku_name" {
  description = "Redis cache SKU name"
  type        = string
  default     = "Premium"
}

variable "redis_family" {
  description = "Redis cache family"
  type        = string
  default     = "P"
}

variable "redis_capacity" {
  description = "Redis cache capacity"
  type        = number
  default     = 1
}

# Container Registry Configuration
variable "acr_sku" {
  description = "Azure Container Registry SKU"
  type        = string
  default     = "Premium"
}

# Event Hubs Configuration
variable "eventhub_sku" {
  description = "Event Hubs namespace SKU"
  type        = string
  default     = "Standard"
}

variable "eventhub_capacity" {
  description = "Event Hubs throughput units"
  type        = number
  default     = 2
}

# Storage Account Configuration
variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "storage_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "GRS"
}

# IoT Hub Configuration
variable "iothub_sku_name" {
  description = "IoT Hub SKU name"
  type        = string
  default     = "S2"
}

variable "iothub_sku_capacity" {
  description = "IoT Hub capacity"
  type        = number
  default     = 2
}
