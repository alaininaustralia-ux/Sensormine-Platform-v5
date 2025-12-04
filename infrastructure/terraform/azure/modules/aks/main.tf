# AKS Module - Azure Kubernetes Service

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "system"
    vm_size             = var.node_pool_vm_size
    vnet_subnet_id      = var.subnet_id
    enable_auto_scaling = true
    min_count           = var.node_pool_min_count
    max_count           = var.node_pool_max_count
    os_disk_size_gb     = 128
    type                = "VirtualMachineScaleSets"
    
    upgrade_settings {
      max_surge = "10%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  azure_policy_enabled = true

  tags = var.tags
}

resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.workload_node_vm_size
  enable_auto_scaling   = true
  min_count             = var.workload_node_min_count
  max_count             = var.workload_node_max_count
  vnet_subnet_id        = var.subnet_id
  
  node_labels = {
    "workload" = "application"
  }

  tags = var.tags
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "cluster_id" {
  value = azurerm_kubernetes_cluster.main.id
}

output "kubeconfig" {
  value     = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive = true
}

output "host" {
  value = azurerm_kubernetes_cluster.main.kube_config[0].host
}

output "cluster_ca_certificate" {
  value     = base64decode(azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
  sensitive = true
}

output "identity_principal_id" {
  value = azurerm_kubernetes_cluster.main.identity[0].principal_id
}
