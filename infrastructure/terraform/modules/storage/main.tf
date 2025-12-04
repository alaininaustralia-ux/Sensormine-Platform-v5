# Storage Module Placeholder
# Provisions object storage (S3-compatible)

variable "environment" {
  description = "Environment name"
  type        = string
}

# Add your storage provisioning logic here
# Can be adapted for:
# - AWS S3
# - Azure Blob Storage
# - Google Cloud Storage
# - MinIO
# - Ceph

output "bucket_name" {
  description = "Storage bucket name"
  value       = "sensormine-${var.environment}"
}

output "endpoint" {
  description = "Storage endpoint"
  value       = "placeholder-endpoint"
}
