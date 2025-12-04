# Sensormine Platform - Azure Infrastructure
# Terraform configuration for complete Azure deployment

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  # Backend for Terraform state - configure after first run
  backend "azurerm" {
    resource_group_name  = "sensormine-tfstate-rg"
    storage_account_name = "sensorminestate"
    container_name       = "tfstate"
    key                  = "sensormine.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# Local variables
locals {
  common_tags = {
    Project     = "Sensormine"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Repository  = "Sensormine-Platform-v5"
  }
  
  resource_suffix = "${var.project_name}-${var.environment}-${var.location}"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.resource_suffix}"
  location = var.location
  tags     = local.common_tags
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.resource_suffix}"
  address_space       = [var.vnet_address_space]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# Subnets
resource "azurerm_subnet" "aks" {
  name                 = "snet-aks"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.aks_subnet_address_prefix]
}

resource "azurerm_subnet" "database" {
  name                 = "snet-database"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.database_subnet_address_prefix]
  
  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_subnet" "services" {
  name                 = "snet-services"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.services_subnet_address_prefix]
}

# AKS Cluster
module "aks" {
  source = "./modules/aks"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  cluster_name        = "aks-${local.resource_suffix}"
  dns_prefix          = "sensormine-${var.environment}"
  subnet_id           = azurerm_subnet.aks.id
  
  node_pool_vm_size          = var.aks_node_vm_size
  node_pool_min_count        = var.aks_node_min_count
  node_pool_max_count        = var.aks_node_max_count
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  tags = local.common_tags
}

# PostgreSQL with TimescaleDB
module "postgresql" {
  source = "./modules/postgresql"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  server_name         = "psql-${local.resource_suffix}"
  subnet_id           = azurerm_subnet.database.id
  vnet_id             = azurerm_virtual_network.main.id
  
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  sku_name              = var.postgresql_sku
  storage_mb            = var.postgresql_storage_mb
  
  databases = [
    "sensormine",
    "timeseries",
    "metadata"
  ]
  
  tags = local.common_tags
}

# Redis Cache
module "redis" {
  source = "./modules/redis"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  redis_name          = "redis-${local.resource_suffix}"
  subnet_id           = azurerm_subnet.services.id
  
  sku_name     = var.redis_sku_name
  capacity     = var.redis_capacity
  family       = var.redis_family
  
  tags = local.common_tags
}

# Azure Container Registry
module "acr" {
  source = "./modules/acr"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  acr_name            = "acr${replace(local.resource_suffix, "-", "")}"
  subnet_id           = azurerm_subnet.services.id
  aks_principal_id    = module.aks.identity_principal_id
  
  sku = var.acr_sku
  
  tags       = local.common_tags
  depends_on = [module.aks]
}

# Event Hubs (for Kafka compatibility)
module "eventhubs" {
  source = "./modules/eventhubs"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  namespace_name      = "evhns-${local.resource_suffix}"
  subnet_id           = azurerm_subnet.services.id
  
  sku      = var.eventhub_sku
  capacity = var.eventhub_capacity
  
  event_hubs = [
    {
      name              = "telemetry-ingestion"
      partition_count   = 32
      message_retention = 7
    },
    {
      name              = "device-events"
      partition_count   = 8
      message_retention = 7
    },
    {
      name              = "alerts"
      partition_count   = 4
      message_retention = 7
    }
  ]
  
  tags = local.common_tags
}

# Storage Account
module "storage" {
  source = "./modules/storage"
  
  resource_group_name  = azurerm_resource_group.main.name
  location             = azurerm_resource_group.main.location
  storage_account_name = "st${replace(local.resource_suffix, "-", "")}"
  subnet_id            = azurerm_subnet.services.id
  
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_replication_type
  
  containers = [
    "videos",
    "cad-models",
    "lidar-data",
    "exports"
  ]
  
  tags = local.common_tags
}

# Key Vault
module "keyvault" {
  source = "./modules/keyvault"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  keyvault_name       = "kv-${local.resource_suffix}"
  subnet_id           = azurerm_subnet.services.id
  aks_principal_id    = module.aks.identity_principal_id
  
  tenant_id = data.azurerm_client_config.current.tenant_id
  
  secrets = {
    "postgresql-connection-string" = module.postgresql.connection_string
    "redis-connection-string"      = module.redis.connection_string
    "eventhub-connection-string"   = module.eventhubs.connection_string
    "storage-connection-string"    = module.storage.connection_string
  }
  
  tags       = local.common_tags
  depends_on = [module.aks, module.postgresql, module.redis, module.eventhubs, module.storage]
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "appi-${local.resource_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"
  
  tags = local.common_tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.resource_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  
  tags = local.common_tags
}

# IoT Hub (for device connectivity)
module "iothub" {
  source = "./modules/iothub"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  iothub_name         = "iot-${local.resource_suffix}"
  subnet_id           = azurerm_subnet.services.id
  
  sku_name                    = var.iothub_sku_name
  sku_capacity                = var.iothub_sku_capacity
  eventhub_connection_string  = module.eventhubs.connection_string
  
  tags       = local.common_tags
  depends_on = [module.eventhubs]
}

# Data sources
data "azurerm_client_config" "current" {}

# Outputs
output "resource_group_name" {
  value       = azurerm_resource_group.main.name
  description = "Resource group name"
}

output "aks_cluster_name" {
  value       = module.aks.cluster_name
  description = "AKS cluster name"
}

output "aks_kubeconfig" {
  value       = module.aks.kubeconfig
  description = "Kubernetes config for AKS cluster"
  sensitive   = true
}

output "postgresql_fqdn" {
  value       = module.postgresql.fqdn
  description = "PostgreSQL server FQDN"
}

output "redis_hostname" {
  value       = module.redis.hostname
  description = "Redis cache hostname"
}

output "acr_login_server" {
  value       = module.acr.login_server
  description = "ACR login server"
}

output "storage_account_name" {
  value       = module.storage.storage_account_name
  description = "Storage account name"
}

output "keyvault_uri" {
  value       = module.keyvault.vault_uri
  description = "Key Vault URI"
}

output "application_insights_instrumentation_key" {
  value       = azurerm_application_insights.main.instrumentation_key
  description = "Application Insights instrumentation key"
  sensitive   = true
}

output "iothub_hostname" {
  value       = module.iothub.hostname
  description = "IoT Hub hostname"
}
