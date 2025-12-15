# Nexus Configuration API - Integration Complete

**Date:** December 12, 2025  
**Status:** ✅ Backend Connected to Frontend

---

## 🎯 Summary

Successfully integrated the NexusConfiguration.API backend service with the sensormine-web frontend. The API provides AI-powered configuration building for Nexus IoT devices with helper endpoints for easier UI integration.

---

## 🔌 Connection Details

### API Configuration

**Backend Service:**
- **API Name:** NexusConfiguration.API
- **Port:** 5179
- **Base URL:** `http://localhost:5179`
- **Database:** `sensormine_metadata` (Port 5452)
- **Container:** `sensormine-timescaledb`

**Frontend Configuration:**
- **Environment Variable:** `NEXT_PUBLIC_NEXUS_CONFIG_API_URL=http://localhost:5179`
- **Location:** `src/Web/sensormine-web/.env.local`
- **API Client:** `src/Web/sensormine-web/src/lib/api/nexusConfiguration.ts`

---

## 📋 API Endpoints

### Core Configuration Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/api/NexusConfiguration` | List all configurations (paginated) |
| **GET** | `/api/NexusConfiguration/{id}` | Get specific configuration by ID |
| **GET** | `/api/NexusConfiguration/templates` | Get configuration templates |
| **GET** | `/api/NexusConfiguration/search` | Search configurations by term |
| **POST** | `/api/NexusConfiguration` | Create new configuration |
| **PUT** | `/api/NexusConfiguration/{id}` | Update existing configuration |
| **DELETE** | `/api/NexusConfiguration/{id}` | Delete configuration |

### AI-Powered Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/NexusConfiguration/parse-document` | Parse technical datasheet (PDF/MD/TXT) with Claude AI |
| **POST** | `/api/NexusConfiguration/generate-logic` | Generate custom transformation logic |
| **POST** | `/api/NexusConfiguration/validate-logic` | Validate custom logic code |
| **POST** | `/api/NexusConfiguration/deploy` | Deploy to Device.API & SchemaRegistry.API |

### 🆕 Builder Helper Endpoints (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/api/NexusConfiguration/probe-types` | Get available probe types (RS485, RS232, OneWire, etc.) |
| **GET** | `/api/NexusConfiguration/sensor-types` | Get sensor types (optionally filter by probe type) |
| **GET** | `/api/NexusConfiguration/communication-protocols` | Get available protocols (MQTT, HTTP, Azure IoT Hub) |
| **POST** | `/api/NexusConfiguration/validate` | Pre-deployment configuration validation |

---

## 🛠️ Builder Helper Endpoints Details

### 1. Probe Types (`GET /probe-types`)

Returns available hardware probe interfaces for Nexus devices.

**Response Example:**
```json
[
  {
    "type": "RS485",
    "displayName": "RS-485",
    "description": "Industrial RS-485 Modbus RTU communication",
    "supportedProtocols": ["Modbus RTU", "Modbus ASCII"],
    "defaultSettings": {
      "BaudRate": "9600",
      "DataBits": "8",
      "StopBits": "1",
      "Parity": "None"
    }
  }
]
```

**Supported Probe Types:**
- **RS485** - Industrial Modbus communication
- **RS232** - Serial communication
- **OneWire** - Dallas 1-Wire temperature sensors
- **Analog420mA** - 4-20mA current loop sensors
- **Digital** - Digital I/O

### 2. Sensor Types (`GET /sensor-types?probeType={type}`)

Returns available sensor types and their characteristics.

**Query Parameters:**
- `probeType` (optional) - Filter sensors compatible with specific probe type

**Response Example:**
```json
[
  {
    "type": "Temperature",
    "displayName": "Temperature",
    "description": "Temperature measurement",
    "defaultUnit": "°C",
    "compatibleProbeTypes": ["RS485", "RS232", "OneWire", "Analog420mA"],
    "typicalMinValue": -40,
    "typicalMaxValue": 125,
    "commonUnits": ["°C", "°F", "K"]
  }
]
```

**Supported Sensor Types:**
- Temperature, Humidity, Pressure, Flow, Level
- Vibration, pH, Conductivity, Dissolved Oxygen
- Power, Digital Input

### 3. Communication Protocols (`GET /communication-protocols`)

Returns available communication protocols and their settings.

**Response Example:**
```json
[
  {
    "protocol": "MQTT",
    "displayName": "MQTT",
    "description": "Lightweight messaging protocol for IoT",
    "requiresBrokerUrl": true,
    "supportsCompression": true,
    "supportsBatching": true,
    "defaultSettings": {
      "BrokerUrl": "mqtt://localhost",
      "Port": 1883,
      "QoS": 1,
      "TopicPattern": "devices/{deviceId}/telemetry",
      "UseTls": false
    }
  }
]
```

**Supported Protocols:**
- **MQTT** - Lightweight IoT messaging
- **HTTP** - RESTful API communication
- **Azure IoT Hub** - Microsoft Azure IoT with DPS

### 4. Configuration Validation (`POST /validate`)

Validates configuration before saving or deployment.

**Request Body:**
```json
{
  "name": "Factory Floor Sensors",
  "probeConfigurations": [
    {
      "probeId": "probe1",
      "probeName": "Temperature Sensor",
      "probeType": "RS485",
      "sensorType": "Temperature",
      "unit": "°C",
      "samplingIntervalSeconds": 60
    }
  ],
  "communicationSettings": {
    "protocol": "MQTT",
    "transmissionIntervalSeconds": 300
  }
}
```

**Response Example:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "field": "ProbeConfigurations",
      "message": "Consider adding more probe configurations to fully utilize device capabilities."
    }
  ],
  "suggestions": [
    "Configuration looks good! You can save or deploy it.",
    "Define schema field mappings to structure your telemetry data."
  ]
}
```

**Validation Rules:**
- Configuration name is required
- No duplicate probe IDs
- Sampling interval ≥ 1 second
- Valid probe types: RS485, RS232, OneWire, Analog420mA, Digital
- MQTT requires broker URL
- MQTT QoS must be 0, 1, or 2
- Azure IoT Hub requires Scope ID
- Batch size ≥ 1 when batching enabled

---

## 📦 Frontend API Client Usage

### Import
```typescript
import { 
  nexusConfigurationApi, 
  ProbeTypeInfo, 
  SensorTypeInfo 
} from '@/lib/api';
```

### Examples

```typescript
// Get all configurations
const configurations = await nexusConfigurationApi.getAll(page, pageSize);

// Get probe types for UI dropdown
const probeTypes = await nexusConfigurationApi.getProbeTypes();

// Get sensor types compatible with RS485
const sensorTypes = await nexusConfigurationApi.getSensorTypes('RS485');

// Get communication protocols
const protocols = await nexusConfigurationApi.getCommunicationProtocols();

// Validate before saving
const validation = await nexusConfigurationApi.validateConfiguration({
  name: 'My Configuration',
  probeConfigurations: [...],
  communicationSettings: {...}
});

if (validation.isValid) {
  // Save configuration
  await nexusConfigurationApi.create(configData);
}

// Parse datasheet with AI
const parseResult = await nexusConfigurationApi.parseDocument({
  fileName: 'sensor-datasheet.pdf',
  fileContent: base64Content,
  fileType: 'PDF'
});

// Generate custom logic
const logicResult = await nexusConfigurationApi.generateLogic({
  prompt: 'Convert temperature from Celsius to Fahrenheit',
  language: 'CSharp'
});

// Deploy to platform
const deployResult = await nexusConfigurationApi.deploy({
  configurationId: 'uuid',
  createDeviceType: true,
  createSchema: true,
  deviceTypeName: 'Factory Sensor',
  schemaName: 'FactorySensorSchema'
});
```

---

## 🗄️ Database Schema

### Table: `nexus_configurations`

**Location:** `sensormine_metadata` database  
**Port:** 5452  
**Connection String:** `Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123`

**Key Columns:**
- `id` (UUID) - Primary key
- `tenant_id` (UUID) - Multi-tenant isolation
- `name` (string) - Configuration name
- `probe_configurations` (JSONB) - Probe settings
- `schema_field_mappings` (JSONB) - Field mappings
- `communication_settings` (JSONB) - Protocol settings
- `custom_logic` (text) - Transformation code
- `status` (string) - Draft, Validated, Deployed
- `is_template` (boolean) - Template flag
- `device_type_id` (UUID) - Linked Device Type
- `schema_id` (UUID) - Linked Schema
- `created_at`, `updated_at` (timestamp)

---

## 🧪 Testing

### Start Backend
```powershell
cd src/Services/NexusConfiguration.API
dotnet run
```

**Swagger UI:** http://localhost:5179/swagger

### Start Frontend
```powershell
cd src/Web/sensormine-web
npm run dev
```

**UI:** http://localhost:3020/settings/nexus-configuration

### Test API Connection
```typescript
// In browser console (http://localhost:3020)
const api = await fetch('http://localhost:5179/api/NexusConfiguration/probe-types');
const data = await api.json();
console.log(data);
```

---

## 🎨 UI Pages

| Page | Path | Description |
|------|------|-------------|
| **Configuration List** | `/settings/nexus-configuration` | Browse, search, filter configurations |
| **New Configuration** | `/settings/nexus-configuration/new` | Create new configuration with wizard |
| **Edit Configuration** | `/settings/nexus-configuration/[id]` | Edit existing configuration |
| **Templates** | `/settings/nexus-configuration/templates` | Browse configuration templates |

---

## 🚀 Next Steps

### Recommended Enhancements

1. **Configuration Wizard Component** - Step-by-step builder UI
2. **Real-time Validation** - Live validation as user types
3. **Template Gallery** - Pre-built configuration templates
4. **Visual Probe Designer** - Drag-and-drop probe configuration
5. **Schema Field Mapper** - Visual mapping interface
6. **Test Configuration** - Simulate configuration before deployment
7. **Version History** - Track configuration changes over time
8. **Bulk Operations** - Deploy to multiple devices

### Mobile App Integration (User Stories 15.1-15.3)

The API is ready for mobile app integration:
- Load device schemas and Nexus capabilities
- Apply configuration from JSON
- Offline configuration support (cache in SQLite)
- NFC-based configuration deployment

---

## 📚 Related Documentation

- **[DATABASE.md](./DATABASE.md)** - Database architecture
- **[service-ports.md](./service-ports.md)** - Port assignments
- **[user-stories.md](./user-stories.md)** - User stories (2.5, 15.1-15.3)
- **Backend:** `src/Services/NexusConfiguration.API/`
- **Frontend:** `src/Web/sensormine-web/src/app/settings/nexus-configuration/`

---

## ✅ Verification Checklist

- [x] Backend builds successfully
- [x] Database connection configured (port 5452)
- [x] Frontend environment variable added
- [x] API client methods created
- [x] Helper endpoints implemented
- [x] TypeScript types defined
- [x] Builder helper endpoints:
  - [x] GET /probe-types
  - [x] GET /sensor-types
  - [x] GET /communication-protocols
  - [x] POST /validate

---

**Status:** ✅ **Ready for Development**

The NexusConfiguration.API is now fully connected to the frontend and ready for UI development. All helper endpoints are available to support a rich configuration builder experience.
