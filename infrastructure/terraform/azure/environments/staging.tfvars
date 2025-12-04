# Staging Environment Configuration

project_name = "sensormine"
environment  = "staging"
location     = "eastus"

# Network Configuration
vnet_address_space             = "10.1.0.0/16"
aks_subnet_address_prefix      = "10.1.1.0/24"
database_subnet_address_prefix = "10.1.2.0/24"
services_subnet_address_prefix = "10.1.3.0/24"

# AKS Configuration - Medium for staging
aks_node_vm_size   = "Standard_D4s_v3"
aks_node_min_count = 3
aks_node_max_count = 8

# PostgreSQL Configuration - Medium for staging
postgresql_sku        = "GP_Standard_D4s_v3"
postgresql_storage_mb = 65536  # 64 GB

# Redis Configuration - Standard for staging
redis_sku_name = "Standard"
redis_family   = "C"
redis_capacity = 2

# Container Registry
acr_sku = "Standard"

# Event Hubs - Standard for staging
eventhub_sku      = "Standard"
eventhub_capacity = 2

# Storage Account
storage_account_tier     = "Standard"
storage_replication_type = "GRS"

# IoT Hub - Medium tier for staging
iothub_sku_name     = "S2"
iothub_sku_capacity = 2
