# Sensormine Platform - AWS Infrastructure
# Terraform configuration for complete AWS deployment

# Local variables
locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "Sensormine-Platform-v5"
    },
    var.additional_tags
  )
  
  name_prefix = "${var.project_name}-${var.environment}"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC and Networking
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = [for k, v in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, k)]
  public_subnets  = [for k, v in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, k + 48)]
  database_subnets = [for k, v in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, k + 64)]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  # Tags for Kubernetes
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${local.name_prefix}-eks" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${local.name_prefix}-eks" = "shared"
  }

  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "${local.name_prefix}-eks"
  cluster_version = var.eks_cluster_version
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  
  node_instance_types = var.eks_node_instance_types
  node_desired_size   = var.eks_node_desired_size
  node_min_size       = var.eks_node_min_size
  node_max_size       = var.eks_node_max_size
  
  tags = local.common_tags
}

# RDS PostgreSQL with TimescaleDB
module "rds" {
  source = "./modules/rds"
  
  identifier = "${local.name_prefix}-db"
  
  engine         = "postgres"
  engine_version = "15.5"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = "sensormine"
  username = var.db_admin_username
  password = var.db_admin_password
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnets
  security_group_ids = [module.eks.cluster_security_group_id]
  
  multi_az               = var.environment == "prod" ? true : false
  backup_retention_period = var.environment == "prod" ? 35 : 7
  
  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"
  
  cluster_id           = "${local.name_prefix}-redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = "default.redis7"
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [module.eks.cluster_security_group_id]
  
  automatic_failover_enabled = var.environment == "prod" ? true : false
  multi_az_enabled          = var.environment == "prod" ? true : false
  
  tags = local.common_tags
}

# MSK (Managed Streaming for Kafka)
module "msk" {
  source = "./modules/msk"
  
  cluster_name    = "${local.name_prefix}-kafka"
  kafka_version   = var.msk_kafka_version
  instance_type   = var.msk_broker_instance_type
  number_of_brokers = var.msk_number_of_brokers
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  security_group_ids = [module.eks.cluster_security_group_id]
  
  ebs_volume_size = var.msk_storage_per_broker
  
  encryption_in_transit_client_broker = "TLS"
  encryption_in_transit_in_cluster    = true
  
  tags = local.common_tags
}

# ECR (Elastic Container Registry)
module "ecr" {
  source = "./modules/ecr"
  
  repository_names = [
    "apigateway",
    "device-api",
    "query-api",
    "ingestion-service",
    "alerts-api",
    "digitaltwin-api",
    "schemaregistry-api",
    "edge-gateway",
    "streamprocessing-service",
    "videometadata-api",
    "billing-api"
  ]
  
  image_tag_mutability = "MUTABLE"
  scan_on_push        = true
  
  lifecycle_policy = {
    expire_untagged_images_days = 30
    keep_tagged_images_count    = 50
  }
  
  tags = local.common_tags
}

# S3 Storage Buckets
module "s3" {
  source = "./modules/s3"
  
  bucket_name_prefix = local.name_prefix
  
  buckets = {
    videos = {
      versioning_enabled = var.s3_versioning_enabled
      lifecycle_rules = [
        {
          id      = "archive-old-videos"
          enabled = true
          transitions = [
            {
              days          = 90
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    cad-models = {
      versioning_enabled = var.s3_versioning_enabled
    }
    lidar-data = {
      versioning_enabled = false
      lifecycle_rules = [
        {
          id      = "archive-lidar"
          enabled = true
          transitions = [
            {
              days          = 30
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    exports = {
      versioning_enabled = false
      lifecycle_rules = [
        {
          id      = "delete-old-exports"
          enabled = true
          expiration = {
            days = 30
          }
        }
      ]
    }
  }
  
  tags = local.common_tags
}

# Secrets Manager
module "secrets_manager" {
  source = "./modules/secrets-manager"
  
  secrets = {
    "rds-connection-string" = {
      description = "PostgreSQL connection string"
      value       = module.rds.connection_string
    }
    "redis-connection-string" = {
      description = "Redis connection string"
      value       = module.elasticache.connection_string
    }
    "kafka-bootstrap-servers" = {
      description = "Kafka bootstrap servers"
      value       = module.msk.bootstrap_brokers_tls
    }
  }
  
  recovery_window_days = var.environment == "prod" ? 30 : 7
  
  tags = local.common_tags
}

# IoT Core
module "iot_core" {
  source = "./modules/iot-core"
  
  thing_type_name = var.iot_thing_type_name
  
  # IoT Rule to forward telemetry to MSK
  iot_rules = [
    {
      name        = "telemetry_to_kafka"
      description = "Forward device telemetry to MSK"
      sql         = "SELECT * FROM 'telemetry/#'"
      actions = [
        {
          kafka = {
            destination_arn = module.msk.cluster_arn
            topic          = "telemetry-ingestion"
          }
        }
      ]
    }
  ]
  
  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${local.name_prefix}/application"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "audit" {
  name              = "/aws/${local.name_prefix}/audit"
  retention_in_days = var.environment == "prod" ? 365 : 90
  
  tags = local.common_tags
}

# Application Load Balancer for Ingress
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = module.s3.bucket_ids["exports"]
    prefix  = "alb-logs"
    enabled = true
  }

  tags = local.common_tags
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb-sg" })
}
