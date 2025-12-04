# Messaging Module Placeholder
# Provisions message broker infrastructure

variable "environment" {
  description = "Environment name"
  type        = string
}

# Add your messaging provisioning logic here
# Can be adapted for:
# - AWS MSK (Managed Kafka)
# - Azure Event Hubs
# - Confluent Cloud
# - Self-hosted Kafka
# - NATS

output "kafka_bootstrap_servers" {
  description = "Kafka bootstrap servers"
  value       = "placeholder-kafka-servers"
}

output "mqtt_endpoint" {
  description = "MQTT broker endpoint"
  value       = "placeholder-mqtt-endpoint"
}
