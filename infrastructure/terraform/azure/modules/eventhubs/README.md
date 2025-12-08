# Azure Event Hubs Module (Kafka-Compatible)

This module creates an Azure Event Hubs namespace with multiple Event Hubs for Kafka-compatible event streaming and messaging.

## Features

- **Kafka Compatibility**: Drop-in replacement for Apache Kafka
- **Auto-Inflate**: Automatically scale throughput units based on load
- **Virtual Network**: Private network access with service endpoints
- **Consumer Groups**: Multiple consumers per Event Hub
- **Geo-Disaster Recovery**: Optional pairing with secondary region
- **Capture**: Optional data capture to Azure Storage or Data Lake

## Usage

```hcl
module "eventhubs" {
  source = "./modules/eventhubs"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  namespace_name      = "evhns-sensormine-prod"
  subnet_id           = azurerm_subnet.services.id
  
  sku      = "Standard"
  capacity = 2
  
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
  
  tags = {
    Environment = "production"
    Project     = "Sensormine"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | string | - | yes |
| location | Azure region | string | - | yes |
| namespace_name | Name of the Event Hubs namespace | string | - | yes |
| subnet_id | Subnet ID for network rules | string | - | yes |
| sku | Event Hubs SKU (Basic, Standard, Premium) | string | Standard | no |
| capacity | Throughput units (TUs) | number | 2 | no |
| event_hubs | List of Event Hubs to create | list(object) | [] | yes |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| namespace_id | The ID of the Event Hubs namespace |
| namespace_name | The name of the namespace |
| connection_string | Primary connection string (sensitive) |
| kafka_endpoint | Kafka-compatible endpoint |
| event_hub_names | List of Event Hub names |
| event_hub_ids | Map of Event Hub IDs |

## SKU Comparison

| Feature | Basic | Standard | Premium | Dedicated |
|---------|-------|----------|---------|-----------|
| Max Throughput | 1 MB/s | 20 MB/s (auto-inflate) | 80 MB/s+ | 1+ GB/s |
| Throughput Units | 1 | 1-20 (auto-inflate to 40) | 1-16 PUs | Custom |
| Retention | 1 day | 1-7 days | 90 days | 90 days |
| Partitions/Hub | 32 | 32 | 100 | 1024 |
| Consumer Groups | 1 | 20 | 100 | 1000 |
| Kafka | ❌ | ✅ | ✅ | ✅ |
| Capture | ❌ | ✅ | ✅ | ✅ |
| Geo-DR | ❌ | ❌ | ✅ | ✅ |
| Private Link | ❌ | ❌ | ✅ | ✅ |

## Throughput Units vs Processing Units

### Throughput Units (TUs) - Standard Tier
- **1 TU** = 1 MB/s ingress, 2 MB/s egress, 1000 events/s
- **Cost**: ~$22/TU/month + $0.028 per million events
- **Auto-inflate**: Automatically scale from 1-20 TUs (or 40 with support)

### Processing Units (PUs) - Premium Tier
- **1 PU** = 5 MB/s ingress, 10 MB/s egress
- **Cost**: ~$700/PU/month (includes 1M events)
- **Dedicated CPU and memory**
- **Predictable performance**

## Recommended Configurations

### Development
```hcl
sku      = "Basic"
capacity = 1
partitions = 2
retention = 1
```

### Staging/Production (Standard)
```hcl
sku      = "Standard"
capacity = 2  # with auto-inflate to 20
partitions = 32
retention = 7
```

### Production (Premium)
```hcl
sku      = "Premium"
capacity = 1  # PU
partitions = 100
retention = 90
```

## Use Cases in Sensormine Platform

1. **Telemetry Ingestion**: Real-time device telemetry streaming
2. **Device Events**: Device connectivity, health, configuration changes
3. **Alert Distribution**: Push alerts to multiple consumers
4. **Audit Logs**: Central audit log streaming
5. **Data Pipeline**: ETL pipeline trigger events
6. **Real-time Analytics**: Stream processing for dashboards

## Event Hub Configuration

### telemetry-ingestion
- **Partitions**: 32 (high throughput)
- **Retention**: 7 days
- **Use Case**: Device telemetry from thousands of devices
- **Consumers**: Ingestion.Service, StreamProcessing.Service

### device-events
- **Partitions**: 8 (moderate throughput)
- **Retention**: 7 days
- **Use Case**: Device lifecycle events, config changes
- **Consumers**: Device.API, Alerts.API

### alerts
- **Partitions**: 4 (lower throughput)
- **Retention**: 7 days
- **Use Case**: Alert notifications, threshold violations
- **Consumers**: Notification services, dashboard updates

## Kafka Compatibility

Event Hubs supports Kafka protocol 1.0+. Simply point your Kafka clients to the Event Hubs endpoint.

### Connection String Format

```
Endpoint=sb://evhns-sensormine-prod.servicebus.windows.net/;
SharedAccessKeyName=RootManageSharedAccessKey;
SharedAccessKey=your-key;
EntityPath=telemetry-ingestion
```

### Kafka Endpoint

```
evhns-sensormine-prod.servicebus.windows.net:9093
```

## Producing Events (.NET)

### Using Azure SDK

```csharp
using Azure.Messaging.EventHubs;
using Azure.Messaging.EventHubs.Producer;

// Create producer
var connectionString = configuration.GetConnectionString("EventHubs");
var producer = new EventHubProducerClient(connectionString, "telemetry-ingestion");

// Send batch
using var eventBatch = await producer.CreateBatchAsync();

var telemetryData = new
{
    DeviceId = "device-001",
    Temperature = 72.5,
    Humidity = 45.2,
    Timestamp = DateTime.UtcNow
};

var eventData = new EventData(JsonSerializer.SerializeToUtf8Bytes(telemetryData));
eventBatch.TryAdd(eventData);

await producer.SendAsync(eventBatch);

// Dispose
await producer.DisposeAsync();
```

### Using Kafka Client

```csharp
using Confluent.Kafka;

var config = new ProducerConfig
{
    BootstrapServers = "evhns-sensormine-prod.servicebus.windows.net:9093",
    SecurityProtocol = SecurityProtocol.SaslSsl,
    SaslMechanism = SaslMechanism.Plain,
    SaslUsername = "$ConnectionString",
    SaslPassword = connectionString
};

using var producer = new ProducerBuilder<string, string>(config).Build();

var result = await producer.ProduceAsync("telemetry-ingestion",
    new Message<string, string>
    {
        Key = "device-001",
        Value = JsonSerializer.Serialize(telemetryData)
    });

Console.WriteLine($"Delivered to partition {result.Partition} at offset {result.Offset}");
```

## Consuming Events (.NET)

### Using Azure SDK

```csharp
using Azure.Messaging.EventHubs.Consumer;

// Create consumer
var connectionString = configuration.GetConnectionString("EventHubs");
var consumer = new EventHubConsumerClient(
    "$Default",  // consumer group
    connectionString,
    "telemetry-ingestion");

// Read events
await foreach (var partitionEvent in consumer.ReadEventsAsync())
{
    var data = partitionEvent.Data;
    var body = Encoding.UTF8.GetString(data.EventBody.ToArray());
    
    Console.WriteLine($"Partition: {partitionEvent.Partition.PartitionId}");
    Console.WriteLine($"Offset: {data.Offset}");
    Console.WriteLine($"Data: {body}");
}
```

### Using Kafka Consumer

```csharp
using Confluent.Kafka;

var config = new ConsumerConfig
{
    BootstrapServers = "evhns-sensormine-prod.servicebus.windows.net:9093",
    GroupId = "ingestion-service",
    SecurityProtocol = SecurityProtocol.SaslSsl,
    SaslMechanism = SaslMechanism.Plain,
    SaslUsername = "$ConnectionString",
    SaslPassword = connectionString,
    AutoOffsetReset = AutoOffsetReset.Earliest
};

using var consumer = new ConsumerBuilder<string, string>(config).Build();
consumer.Subscribe("telemetry-ingestion");

while (true)
{
    var result = consumer.Consume();
    Console.WriteLine($"Key: {result.Message.Key}, Value: {result.Message.Value}");
}
```

## Partitioning Strategy

Partitions enable parallel processing:

1. **Partition Key**: Use device ID for ordering per device
2. **Round-Robin**: Omit key for load balancing
3. **Manual**: Specify partition number for control

```csharp
// Partition by device ID (maintains order per device)
var eventData = new EventData(data)
{
    PartitionKey = deviceId
};

// Round-robin (no order guarantee)
var eventData = new EventData(data);

// Manual partition
await producer.SendAsync(new[] { eventData }, new SendEventOptions 
{ 
    PartitionId = "0" 
});
```

## Consumer Groups

Create consumer groups for independent consumers:

```bash
# Create consumer group
az eventhubs eventhub consumer-group create \
  --resource-group rg-sensormine-prod \
  --namespace-name evhns-sensormine-prod \
  --eventhub-name telemetry-ingestion \
  --name stream-processor
```

Consumer groups in Sensormine:
- **$Default**: General purpose consumers
- **ingestion-service**: Data ingestion to TimescaleDB
- **stream-processor**: Real-time analytics
- **backup**: Archive to storage

## Monitoring and Metrics

Key metrics:

- **Incoming Messages**: Messages/second per hub
- **Outgoing Messages**: Messages/second per consumer
- **Throttled Requests**: Indicates capacity issues
- **Capture Backlog**: Lag in capture process
- **Consumer Lag**: Offset difference per consumer group

Set alerts for:
- Throttled requests > 0
- Consumer lag > 10,000 events
- Availability < 99.9%

## Auto-Inflate Configuration

Automatically scale throughput units:

```hcl
resource "azurerm_eventhub_namespace" "main" {
  # ... other config ...
  
  auto_inflate_enabled     = true
  maximum_throughput_units = 20
}
```

**Benefits**:
- Handles traffic spikes automatically
- Only pay for TUs used
- No downtime during scaling

## Capture Feature

Automatically archive events to storage:

```hcl
resource "azurerm_eventhub" "telemetry" {
  # ... other config ...
  
  capture_description {
    enabled  = true
    encoding = "Avro"
    
    destination {
      name = "EventHubArchive.AzureBlockBlob"
      
      archive_name_format = "{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}"
      blob_container_name = "telemetry-archive"
      storage_account_id  = azurerm_storage_account.archive.id
    }
  }
}
```

## Geo-Disaster Recovery (Premium)

Pair with secondary region for DR:

```bash
# Create DR pairing
az eventhubs georecovery-alias set \
  --resource-group rg-sensormine-prod \
  --namespace-name evhns-sensormine-prod \
  --alias-name sensormine-dr \
  --partner-namespace /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.EventHub/namespaces/evhns-sensormine-prod-dr
```

## Cost Optimization

1. **Right-size TUs**: Start with 2, monitor usage
2. **Auto-inflate**: Only pay for what you use
3. **Retention**: 1 day for dev, 7 days for prod
4. **Capture**: Use cheaper storage for long-term retention
5. **Basic for Non-Prod**: Save costs in dev/test

**Cost Example** (Standard, East US):
- 2 TUs: ~$44/month
- Auto-inflate to 10 TUs (peak): ~$220/month
- Ingress events: $0.028 per million events

## Migration from Kafka

Event Hubs is Kafka-compatible, minimal changes needed:

1. Change `bootstrap.servers` to Event Hubs endpoint
2. Add SASL authentication
3. Update topic names to Event Hub names
4. Optionally adjust partition counts

## References

- [Azure Event Hubs Documentation](https://docs.microsoft.com/en-us/azure/event-hubs/)
- [Kafka on Event Hubs](https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-for-kafka-ecosystem-overview)
- [Best Practices](https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-best-practices)
- [Performance Tuning](https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-scalability)
