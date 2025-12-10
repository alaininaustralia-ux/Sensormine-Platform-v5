# Device Type-Centric Architecture

## Overview

The SensorMine platform uses a **Device Type-centric architecture** where Device Types serve as configuration templates that define protocols, data schemas, custom fields, and alert rules. This approach provides consistency, scalability, and easier management of large device fleets.

---

## Core Concepts

### Device Type
A Device Type is a template that defines:
- **Protocol Configuration**: Communication settings (MQTT, HTTP, WebSocket, OPC UA, Modbus, etc.)
- **Data Schema**: Structure and validation rules for telemetry payloads
- **Custom Fields**: Type-specific metadata fields with validation
- **Alert Templates**: Pre-configured alert rules and thresholds
- **Protocol-Specific Settings**: Sampling rates, batching, compression, etc.

### Device Instance
A Device is a physical or virtual device that:
- **Belongs to a Device Type**: Inherits all configuration from its type
- **Completes Custom Fields**: Provides values for type-defined fields during registration
- **Validates Data**: Telemetry automatically validated against type's schema
- **Inherits Alerts**: Receives default alert rules from type (can override)

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        SETTINGS UI                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐      ┌──────────────────┐             │
│  │ Device Types   │      │ Alert Rules      │             │
│  │                │      │                  │             │
│  │ • Create/Edit  │      │ • Rule Templates │             │
│  │ • Protocol     │      │ • Channels       │             │
│  │ • Schema       │◄─────┤ • Distribution   │             │
│  │ • Custom Fields│      │ • Testing        │             │
│  │ • Alert Temps  │      │                  │             │
│  └────────┬───────┘      └──────────────────┘             │
│           │                                                │
│           │  ┌────────────────────────────┐               │
│           └─►│ Schema Registry            │               │
│              │                            │               │
│              │ • Browse Schemas           │               │
│              │ • Create/Edit              │               │
│              │ • AI Generation            │               │
│              │ • Version Management       │               │
│              └────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Configuration Applied To
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    DEVICE REGISTRATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Select Device Type                                     │
│  2. Dynamic Form Renders (based on Device Type fields)     │
│  3. Complete Custom Fields                                 │
│  4. Validate Input                                         │
│  5. Submit                                                  │
│                                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │  Device Instance Created                     │         │
│  │                                              │         │
│  │  • Device Type Reference                     │         │
│  │  • Custom Field Values                       │         │
│  │  • Protocol Config (from type)               │         │
│  │  • Schema Assignment (from type)             │         │
│  │  • Inherited Alert Rules (from type)         │         │
│  └──────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Telemetry Flow
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA INGESTION                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Device sends telemetry via configured protocol         │
│  2. Edge Gateway receives data                             │
│  3. Schema validation (using Device Type's schema)         │
│  4. Alert evaluation (using inherited + custom rules)      │
│  5. Store in time-series database                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Settings UI Navigation

```
Settings (Main Menu)
│
├── Device Types
│   ├── List View
│   │   ├── Filter by category/tags
│   │   ├── Search by name
│   │   └── Usage statistics
│   │
│   └── Device Type Editor
│       ├── General Settings
│       │   ├── Name, description
│       │   ├── Category and tags
│       │   └── Active/Inactive status
│       │
│       ├── Protocol Configuration
│       │   ├── Protocol type selector
│       │   ├── Connection settings
│       │   ├── Authentication
│       │   └── Sampling/batching
│       │
│       ├── Schema Assignment
│       │   ├── Browse Schema Registry
│       │   ├── Select schema version
│       │   ├── Field mapping
│       │   └── Test with sample data
│       │
│       ├── Custom Fields
│       │   ├── Add field
│       │   ├── Field properties
│       │   ├── Validation rules
│       │   └── Conditional visibility
│       │
│       └── Alert Templates
│           ├── Inherited rules
│           ├── Type-specific rules
│           ├── Default thresholds
│           └── Enable/disable inheritance
│
├── Alert Rules
│   ├── Rule Templates
│   │   ├── List all templates
│   │   ├── Filter by Device Type
│   │   └── Create/Edit/Delete
│   │
│   ├── Delivery Channels
│   │   ├── Email configuration
│   │   ├── SMS configuration
│   │   ├── Microsoft Teams
│   │   └── Webhooks
│   │
│   └── Distribution Lists
│       ├── Create lists
│       ├── Manage members
│       └── Channel preferences
│
├── Schemas
│   ├── Browse Schema Registry
│   ├── Create New Schema
│   │   ├── Manual entry
│   │   └── AI-powered generation
│   ├── Edit Schema
│   └── Version Management
│
├── Integrations
│   ├── MQTT Brokers
│   ├── Industrial Protocols (OPC UA, Modbus)
│   ├── Video Sources (RTSP, CCTV)
│   └── Third-Party APIs
│
└── System
    ├── Users & Roles
    ├── Tenants (if multi-tenant)
    ├── Audit Logs
    └── Performance Settings
```

---

## Device Registration Flow

### Traditional Approach (Old)
1. Enter device serial number
2. Manually configure protocol
3. Select schema from large list
4. Add custom fields ad-hoc
5. Configure alerts after device is created

**Problems:**
- Inconsistent configuration
- Error-prone manual setup
- No standardization
- Time-consuming

### Device Type Approach (New)
1. Select Device Type (e.g., "Temperature Sensor - Nexus")
2. Dynamic form appears with all required fields
3. Complete custom fields (validated in real-time)
4. Submit
5. Device automatically configured with:
   - Protocol settings from type
   - Schema from type
   - Custom field values
   - Alert rules from type

**Benefits:**
- Consistent configuration
- Fast onboarding
- Standardized fleet management
- Fewer errors
- Bulk operations easy

---

## Dynamic Form Generation

### How It Works

When a user selects a Device Type during registration, the system:

1. **Fetches Device Type Configuration**
   - Custom field definitions
   - Validation rules
   - Help text
   - Conditional logic

2. **Generates Form UI**
   ```typescript
   {
     "customFields": [
       {
         "name": "installationDate",
         "label": "Installation Date",
         "type": "date",
         "required": true,
         "helpText": "Date when sensor was installed"
       },
       {
         "name": "location",
         "label": "Location Code",
         "type": "text",
         "required": true,
         "pattern": "^[A-Z]{3}-\\d{3}$",
         "helpText": "Format: ABC-123"
       },
       {
         "name": "temperatureUnit",
         "label": "Temperature Unit",
         "type": "select",
         "options": ["celsius", "fahrenheit"],
         "default": "celsius",
         "required": true
       }
     ]
   }
   ```

3. **Renders Form Components**
   - Text inputs for text fields
   - Date pickers for date fields
   - Dropdowns for select fields
   - Checkboxes for boolean fields
   - Number inputs for numeric fields

4. **Validates in Real-Time**
   - Required field checks
   - Pattern matching
   - Range validation
   - Custom validation rules

5. **Shows/Hides Conditional Fields**
   ```typescript
   {
     "name": "alertThreshold",
     "type": "number",
     "visible": "temperatureUnit === 'celsius'",
     "min": -50,
     "max": 150
   }
   ```

---

## Schema Integration

### Schema Assignment to Device Type

**Configuration (Settings → Device Types → [Type] → Schema):**
```json
{
  "deviceTypeId": "nexus-temp-sensor",
  "schemaId": "temperature-telemetry-v1",
  "schemaVersion": "1.2.0",
  "fieldMappings": {
    "probe1": "temperature",
    "probe2": "humidity",
    "battery": "batteryLevel"
  }
}
```

**All devices of this type inherit the schema:**
- Data validation at ingestion
- Schema-aware dashboards
- Query interfaces know data structure
- Alert rules reference schema fields

### Schema Version Management

When updating a Device Type's schema:
1. Select new schema version
2. System checks compatibility
3. Warns about breaking changes
4. Shows affected devices
5. Option to migrate data
6. Confirm update

---

## Alert Rule Integration

### Alert Template in Device Type

```json
{
  "alertTemplates": [
    {
      "name": "High Temperature Alert",
      "enabled": true,
      "inheritByDefault": true,
      "conditions": [
        {
          "schemaField": "temperature",
          "operator": ">",
          "threshold": 75,
          "duration": "5 minutes"
        }
      ],
      "severity": "critical",
      "deliveryChannels": ["email", "teams"],
      "distributionList": "operations-team"
    }
  ]
}
```

**When a device is registered:**
1. Inherits all enabled alert templates
2. Can customize threshold values
3. Can disable specific alerts
4. Can add device-specific alerts

**Benefits:**
- Consistent alerting across fleet
- Easy bulk updates
- Override capability for exceptions
- Centralized management

---

## API Structure

### Device Type API
```
POST   /api/device-types              # Create device type
GET    /api/device-types              # List all types
GET    /api/device-types/{id}         # Get specific type
PUT    /api/device-types/{id}         # Update type
DELETE /api/device-types/{id}         # Delete type
GET    /api/device-types/{id}/devices # Get devices using this type
POST   /api/device-types/{id}/clone   # Clone type
```

### Device API (Enhanced)
```
POST   /api/devices                   # Register device
  Request body:
  {
    "deviceTypeId": "uuid",
    "serialNumber": "string",
    "customFields": {
      "field1": "value1",
      "field2": "value2"
    }
  }

GET    /api/devices/{id}              # Get device details
  Response includes:
  {
    "id": "uuid",
    "deviceTypeId": "uuid",
    "deviceType": { ... },           # Populated type info
    "schemaId": "uuid",              # Inherited from type
    "customFields": { ... },
    "alertRules": [ ... ]            # Inherited + custom
  }

PUT    /api/devices/{id}/type         # Change device type
  Request body:
  {
    "newDeviceTypeId": "uuid",
    "fieldMappings": { ... }         # Map old to new fields
  }
```

---

## Database Schema

### DeviceTypes Table
```sql
CREATE TABLE device_types (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    protocol_type VARCHAR(50),      -- mqtt, http, opcua, etc.
    protocol_config JSONB,           -- Protocol-specific settings
    schema_id UUID REFERENCES schemas(id),
    custom_field_definitions JSONB,  -- Field metadata
    alert_templates JSONB,           -- Default alert rules
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    tenant_id VARCHAR(100)
);

CREATE INDEX idx_device_types_tenant ON device_types(tenant_id);
CREATE INDEX idx_device_types_category ON device_types(category);
```

### Devices Table (Updated)
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY,
    device_type_id UUID NOT NULL REFERENCES device_types(id),
    serial_number VARCHAR(100) NOT NULL,
    custom_field_values JSONB,       -- Values for type's custom fields
    protocol_config JSONB,           -- Can override type defaults
    alert_rule_overrides JSONB,      -- Custom alert settings
    state VARCHAR(50),               -- active, inactive, maintenance
    location GEOGRAPHY(POINT),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    tenant_id VARCHAR(100),
    UNIQUE(tenant_id, serial_number)
);

CREATE INDEX idx_devices_type ON devices(device_type_id);
CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_state ON devices(state);
```

---

## Migration Path

### Phase 1: Create Device Type Infrastructure ✅
- Device Type API endpoints
- Database schema
- Basic CRUD operations

### Phase 2: Settings UI
- Device Type management UI
- Custom field editor
- Schema assignment interface
- Alert template configuration

### Phase 3: Device Registration Integration
- Dynamic form generator
- Device Type selector
- Custom field validation
- Inheritance logic

### Phase 4: Alert Integration
- Alert rule templates in Device Types
- Inheritance to devices
- Override capability
- Bulk alert operations

### Phase 5: Enhanced Features
- Device Type versioning
- Configuration templates
- Import/Export device types
- Device Type marketplace

---

## Benefits Summary

### For Administrators
- Centralized configuration management
- Consistent device setup
- Bulk operations on device fleets
- Easier troubleshooting
- Template reuse

### For Field Technicians
- Faster device registration
- Guided workflows
- Fewer errors
- Mobile-friendly
- Offline capability

### For Operations
- Standardized monitoring
- Predictable alert patterns
- Fleet-wide analytics
- Easier scaling
- Compliance support

### For Developers
- Clear data contracts
- Schema-driven development
- Type-safe queries
- Better testing
- API consistency

---

**Document Version:** 1.0  
**Last Updated:** December 5, 2025  
**Status:** Architecture Defined - Implementation In Progress
