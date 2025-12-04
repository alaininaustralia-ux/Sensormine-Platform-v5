# Development Environment Configuration

project_name = "sensormine"
environment  = "dev"
location     = "eastus"

# Network Configuration
vnet_address_space             = "10.0.0.0/16"
aks_subnet_address_prefix      = "10.0.1.0/24"
database_subnet_address_prefix = "10.0.2.0/24"
services_subnet_address_prefix = "10.0.3.0/24"

# AKS Configuration - Smaller for dev
aks_node_vm_size   = "Standard_D2s_v3"
aks_node_min_count = 2
aks_node_max_count = 5

# PostgreSQL Configuration - Smaller for dev
postgresql_sku        = "B_Standard_B2s"
postgresql_storage_mb = 32768  # 32 GB

# Redis Configuration - Basic for dev
redis_sku_name = "Basic"
redis_family   = "C"
redis_capacity = 1

# Container Registry
acr_sku = "Basic"

# Event Hubs - Minimal for dev
eventhub_sku      = "Basic"
eventhub_capacity = 1

# Storage Account
storage_account_tier     = "Standard"
storage_replication_type = "LRS"

# IoT Hub - Smaller tier for dev
iothub_sku_name     = "S1"
iothub_sku_capacity = 1
