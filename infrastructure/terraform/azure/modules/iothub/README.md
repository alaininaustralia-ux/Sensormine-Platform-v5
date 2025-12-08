# Azure IoT Hub Module

This module creates an Azure IoT Hub for device connectivity, telemetry ingestion, and device management with Event Hubs integration.

## Features

- **Device Connectivity**: MQTT, AMQP, HTTPS protocols
- **Device Twin**: Store device metadata and configuration
- **Cloud-to-Device**: Send commands and notifications to devices
- **File Upload**: Upload files from devices to Azure Storage
- **Event Hub Integration**: Route telemetry to Event Hubs for processing
- **DPS Integration**: Device Provisioning Service support

## Usage

```hcl
module "iothub" {
  source = "./modules/iothub"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  iothub_name         = "iot-sensormine-prod"
  subnet_id           = azurerm_subnet.services.id
  
  sku_name                   = "S2"
  sku_capacity               = 2
  eventhub_connection_string = module.eventhubs.connection_string
  
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
| iothub_name | Name of the IoT Hub | string | - | yes |
| subnet_id | Subnet ID for private endpoint | string | - | yes |
| sku_name | IoT Hub SKU (F1, S1, S2, S3) | string | S2 | no |
| sku_capacity | Number of IoT Hub units | number | 2 | no |
| eventhub_connection_string | Event Hubs connection string for routing | string | - | yes |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| iothub_id | The ID of the IoT Hub |
| iothub_name | The name of the IoT Hub |
| hostname | IoT Hub hostname |
| event_hub_events_endpoint | Event Hub-compatible endpoint |
| iothub_connection_string | Connection string (sensitive) |

## SKU Comparison

| Feature | F1 (Free) | S1 (Standard) | S2 | S3 |
|---------|-----------|---------------|----|----|
| Daily Messages | 8,000 | 400,000 | 6M | 300M |
| Max Devices | 500 | Unlimited | Unlimited | Unlimited |
| Device Twins | ✅ | ✅ | ✅ | ✅ |
| Cloud-to-Device | ❌ | ✅ | ✅ | ✅ |
| File Upload | ❌ | ✅ | ✅ | ✅ |
| IoT Edge | ❌ | ✅ | ✅ | ✅ |
| Cost/Month | Free | $25/unit | $250/unit | $2,500/unit |

## Recommended Configurations

### Development
```hcl
sku_name     = "F1"  # Free tier
sku_capacity = 1
```

### Production (Small)
```hcl
sku_name     = "S1"
sku_capacity = 1  # 400k messages/day
```

### Production (Large)
```hcl
sku_name     = "S2"
sku_capacity = 2  # 12M messages/day
```

## Device Connection

### MQTT Connection

```csharp
using Microsoft.Azure.Devices.Client;

var deviceId = "device-001";
var deviceKey = "device-shared-access-key";
var iotHubHostname = "iot-sensormine-prod.azure-devices.net";

var connectionString = $"HostName={iotHubHostname};DeviceId={deviceId};SharedAccessKey={deviceKey}";
var deviceClient = DeviceClient.CreateFromConnectionString(connectionString, TransportType.Mqtt);

await deviceClient.OpenAsync();

// Send telemetry
var telemetry = new
{
    temperature = 72.5,
    humidity = 45.2,
    timestamp = DateTime.UtcNow
};

var message = new Message(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(telemetry)));
await deviceClient.SendEventAsync(message);

// Receive cloud-to-device message
var receivedMessage = await deviceClient.ReceiveAsync();
if (receivedMessage != null)
{
    var data = Encoding.UTF8.GetString(receivedMessage.GetBytes());
    Console.WriteLine($"Received: {data}");
    await deviceClient.CompleteAsync(receivedMessage);
}

await deviceClient.CloseAsync();
```

### Device Twin

```csharp
// Update reported properties
var twin = await deviceClient.GetTwinAsync();
var patch = new
{
    firmware_version = "2.1.0",
    battery_level = 85
};

await deviceClient.UpdateReportedPropertiesAsync(
    new TwinCollection(JsonSerializer.Serialize(patch)));

// Receive desired property updates
await deviceClient.SetDesiredPropertyUpdateCallbackAsync((desiredProperties, context) =>
{
    Console.WriteLine($"Desired properties update: {desiredProperties.ToJson()}");
    return Task.CompletedTask;
}, null);
```

## Service-Side Operations

### Manage Devices

```csharp
using Microsoft.Azure.Devices;

var connectionString = "HostName=iot-sensormine-prod.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=key";
var registryManager = RegistryManager.CreateFromConnectionString(connectionString);

// Register device
var device = new Device("device-001");
var registeredDevice = await registryManager.AddDeviceAsync(device);
Console.WriteLine($"Device Key: {registeredDevice.Authentication.SymmetricKey.PrimaryKey}");

// Get device
var deviceInfo = await registryManager.GetDeviceAsync("device-001");

// Delete device
await registryManager.RemoveDeviceAsync("device-001");
```

### Send Cloud-to-Device Message

```csharp
var serviceClient = ServiceClient.CreateFromConnectionString(connectionString);

var commandMessage = new Message(Encoding.UTF8.GetBytes("reboot"));
await serviceClient.SendAsync("device-001", commandMessage);
```

## Message Routing

Route device telemetry to Event Hubs:

```hcl
resource "azurerm_iothub_route" "telemetry" {
  name               = "telemetry-route"
  resource_group_name = var.resource_group_name
  iothub_name        = azurerm_iothub.main.name
  source             = "DeviceMessages"
  condition          = "true"
  endpoint_names     = [azurerm_iothub_endpoint_eventhub.telemetry.name]
  enabled            = true
}

resource "azurerm_iothub_endpoint_eventhub" "telemetry" {
  name                = "telemetry-endpoint"
  resource_group_name = var.resource_group_name
  iothub_name         = azurerm_iothub.main.name
  connection_string   = var.eventhub_connection_string
}
```

## Device Provisioning Service (DPS)

Auto-provision devices:

```bash
# Create DPS
az iot dps create \
  --name dps-sensormine-prod \
  --resource-group rg-sensormine-prod \
  --location eastus

# Link to IoT Hub
az iot dps linked-hub create \
  --dps-name dps-sensormine-prod \
  --resource-group rg-sensormine-prod \
  --connection-string "HostName=iot-sensormine-prod.azure-devices.net;..."

# Add enrollment group
az iot dps enrollment-group create \
  --dps-name dps-sensormine-prod \
  --resource-group rg-sensormine-prod \
  --enrollment-id sensors \
  --certificate-path root-ca.pem
```

## Monitoring

Key metrics:
- **Connected Devices**: Active device connections
- **Telemetry Messages**: Messages sent per day
- **C2D Messages**: Cloud-to-device messages
- **Twin Operations**: Device twin reads/updates
- **Throttled Requests**: Rate limit exceeded

## Security Best Practices

1. **Per-Device Keys**: Unique key per device
2. **X.509 Certificates**: Use certificates instead of shared keys
3. **DPS**: Auto-provisioning with enrollment groups
4. **Token Rotation**: Rotate SAS tokens regularly
5. **Private Endpoint**: VNet-only access

## Cost Optimization

1. **Right-size SKU**: Start with S1, scale based on message volume
2. **Message Batching**: Batch telemetry to reduce message count
3. **Compression**: Compress payloads
4. **Free Tier**: Use F1 for development

## Integration with Sensormine

1. **Edge Gateway**: Publish device data to IoT Hub via MQTT
2. **Event Hubs**: Route telemetry to Event Hubs namespace
3. **Ingestion Service**: Consume from Event Hub-compatible endpoint
4. **Device API**: Manage device registry via IoT Hub REST API

## References

- [Azure IoT Hub Documentation](https://docs.microsoft.com/en-us/azure/iot-hub/)
- [IoT Hub SDKs](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-sdks)
- [MQTT Support](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-mqtt-support)
