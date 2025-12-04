variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "cluster_name" {
  description = "AKS cluster name"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix for AKS cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "subnet_id" {
  description = "Subnet ID for AKS nodes"
  type        = string
}

variable "node_pool_vm_size" {
  description = "VM size for default node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "node_pool_min_count" {
  description = "Minimum node count"
  type        = number
  default     = 3
}

variable "node_pool_max_count" {
  description = "Maximum node count"
  type        = number
  default     = 10
}

variable "workload_node_vm_size" {
  description = "VM size for workload node pool"
  type        = string
  default     = "Standard_D8s_v3"
}

variable "workload_node_min_count" {
  description = "Minimum workload node count"
  type        = number
  default     = 2
}

variable "workload_node_max_count" {
  description = "Maximum workload node count"
  type        = number
  default     = 20
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for monitoring"
  type        = string
  default     = null
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
