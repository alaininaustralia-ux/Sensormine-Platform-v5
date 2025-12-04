# Sensormine Platform - Terraform Root Configuration

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  # Configure backend for state storage
  # backend "s3" {
  #   bucket = "sensormine-terraform-state"
  #   key    = "platform/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Variables
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace for deployment"
  type        = string
  default     = "sensormine"
}

# Modules
module "kubernetes_cluster" {
  source = "./modules/kubernetes"
  
  environment   = var.environment
  cluster_name  = var.cluster_name
}

module "storage" {
  source = "./modules/storage"
  
  environment = var.environment
}

module "messaging" {
  source = "./modules/messaging"
  
  environment = var.environment
}

# Outputs
output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value       = module.kubernetes_cluster.endpoint
  sensitive   = true
}

output "namespace" {
  description = "Deployed namespace"
  value       = var.namespace
}
