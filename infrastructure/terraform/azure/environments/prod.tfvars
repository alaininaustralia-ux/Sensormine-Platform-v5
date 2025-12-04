# Production Environment Configuration

project_name = "sensormine"
environment  = "prod"
location     = "eastus"

# Network Configuration
vnet_address_space             = "10.2.0.0/16"
aks_subnet_address_prefix      = "10.2.1.0/24"
database_subnet_address_prefix = "10.2.2.0/24"
services_subnet_address_prefix = "10.2.3.0/24"

# AKS Configuration - Large for production
aks_node_vm_size   = "Standard_D8s_v3"
aks_node_min_count = 5
aks_node_max_count = 20

# PostgreSQL Configuration - Large for production
postgresql_sku        = "GP_Standard_D16s_v3"
postgresql_storage_mb = 262144  # 256 GB

# Redis Configuration - Premium for production
redis_sku_name = "Premium"
redis_family   = "P"
redis_capacity = 2

# Container Registry
acr_sku = "Premium"

# Event Hubs - Premium for production
eventhub_sku      = "Standard"
eventhub_capacity = 4

# Storage Account
storage_account_tier     = "Standard"
storage_replication_type = "GRS"

# IoT Hub - Large tier for production
iothub_sku_name     = "S3"
iothub_sku_capacity = 4
