# Field Mapping Feature

## Quick Overview

Field mapping allows users to assign friendly names and metadata to device type fields, making them easier to use in dashboards and queries.

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Device Type Editor → Field Mappings Tab                   │ │
│  │  ┌──────────────┬──────────────┬────────┬──────┬─────────┐│ │
│  │  │ Field Name   │ Friendly Name│ Source │ Type │ Actions ││ │
│  │  ├──────────────┼──────────────┼────────┼──────┼─────────┤│ │
│  │  │ battery_level│ Battery %    │System  │Number│ 👁️ ✏️  ││ │
│  │  │ temperature  │ Temperature  │Schema  │Number│ 👁️ ✏️  ││ │
│  │  │ location     │ Location     │Custom  │String│ 👁️ ✏️  ││ │
│  │  └──────────────┴──────────────┴────────┴──────┴─────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ API Calls
┌─────────────────────────────────────────────────────────────────┐
│                      DEVICE.API BACKEND                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  FieldMappingService - Merges 3 Field Sources              │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │   SYSTEM    │  │    SCHEMA    │  │  CUSTOM FIELDS  │  │ │
│  │  │   FIELDS    │  │    FIELDS    │  │                 │  │ │
│  │  │             │  │              │  │                 │  │ │
│  │  │ • battery   │  │ • temperature│  │ • location      │  │ │
│  │  │ • signal    │  │ • pressure   │  │ • calibration   │  │ │
│  │  │ • latitude  │  │ • humidity   │  │ • notes         │  │ │
│  │  │ • longitude │  │              │  │                 │  │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │         ↓                 ↓                   ↓            │ │
│  │         └─────────────────┴───────────────────┘            │ │
│  │                           ↓                                │ │
│  │                   Unified Field List                       │ │
│  │                  with Friendly Names                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Database
┌─────────────────────────────────────────────────────────────────┐
│                     field_mappings TABLE                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ id | device_type_id | field_name | friendly_name | ...    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 1  | abc-123        | battery    | Battery %     | System │ │
│  │ 2  | abc-123        | temp       | Temperature   | Schema │ │
│  │ 3  | abc-123        | location   | Location      | Custom │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Field Sources

### 🔧 System Fields (Built-in)
Pre-defined fields available for all device types:
- `battery_level` → "Battery Level (%)"
- `signal_strength` → "Signal Strength (%)"
- `latitude` → "Latitude (°)"
- `longitude` → "Longitude (°)"

### 📋 Schema Fields
Fields defined in the device schema (JSON Schema or Avro):
```json
{
  "properties": {
    "temperature": { "type": "number", "description": "Ambient temperature" },
    "humidity": { "type": "number", "description": "Relative humidity" }
  }
}
```

### ✏️ Custom Fields
User-defined metadata fields in device type:
```json
{
  "customFields": [
    { "name": "location", "label": "Location", "type": "String" },
    { "name": "notes", "label": "Notes", "type": "Text" }
  ]
}
```

## Usage Example

### 1. Define Device Type
```json
POST /api/devicetype
{
  "name": "Temperature Sensor",
  "schemaId": "guid-of-temp-schema",
  "customFields": [
    { "name": "location", "label": "Location", "type": "String" }
  ]
}
```

### 2. Get Merged Fields
```json
GET /api/devicetype/{id}/fields
[
  {
    "fieldName": "temperature",
    "friendlyName": "Temperature",
    "fieldSource": "Schema",
    "dataType": "Number",
    "unit": "°C",
    "isVisible": true,
    "isQueryable": true
  },
  {
    "fieldName": "location",
    "friendlyName": "Location",
    "fieldSource": "CustomField",
    "dataType": "String",
    "isVisible": true,
    "isQueryable": true
  },
  {
    "fieldName": "battery_level",
    "friendlyName": "Battery Level",
    "fieldSource": "System",
    "dataType": "Number",
    "unit": "%",
    "minValue": 0,
    "maxValue": 100
  }
]
```

### 3. Update Friendly Names
```json
PUT /api/devicetype/{id}/fields
{
  "fieldMappings": [
    {
      "fieldName": "temperature",
      "friendlyName": "Ambient Temperature (°C)",
      "description": "Room temperature sensor reading",
      "unit": "°C",
      "isVisible": true,
      "displayOrder": 1
    }
  ]
}
```

### 4. Query with Friendly Names (Future)
```json
POST /api/query
{
  "deviceTypeId": "guid",
  "fields": ["Ambient Temperature (°C)", "Battery Level"],
  "aggregation": "avg",
  "interval": "1h"
}
```

## Benefits

### 👥 For Users
- **Readable Names**: "Battery Level" instead of "battery_level"
- **Consistent UI**: Same names across dashboards, queries, and configuration
- **Customizable**: Change names without modifying schemas
- **Organized**: Group fields by category, control visibility

### 🔧 For Developers
- **Type-Safe**: Strong typing throughout
- **Flexible**: Works with any schema format (JSON Schema, Avro)
- **Maintainable**: Single source of truth for field metadata
- **Extensible**: Easy to add new field sources

### 📊 For Dashboards
- **Widget Config**: Select fields by friendly name
- **Auto-Labeling**: Charts show friendly names + units
- **Field Discovery**: Dropdown populated from merged field list

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | `field_mappings` table with indexes |
| Repository Layer | ✅ Complete | CRUD + bulk operations |
| Service Layer | ✅ Complete | Field merging, schema parsing |
| API Endpoints | ✅ Complete | GET, PUT, POST sync |
| Frontend Component | ✅ Complete | Field editor with dialog |
| Integration Tests | ✅ Complete | PowerShell test script |
| Documentation | ✅ Complete | Implementation + testing guides |
| Query API Integration | 📋 Planned | Field resolver service |
| Dashboard Integration | 📋 Planned | Widget field selection |

## Quick Start

### Backend
```bash
# Ensure infrastructure is running
docker-compose up -d

# Run Device.API
cd src/Services/Device.API
dotnet run
```

### Frontend
```bash
# Run Next.js frontend
cd src/Web/sensormine-web
npm run dev
```

### Test
```powershell
# Run integration tests
.\test-field-mappings.ps1
```

### UI Access
1. Open `http://localhost:3000`
2. Navigate to **Settings → Device Types**
3. Select a device type
4. Go to **Field Mappings** tab
5. Edit friendly names and metadata

## Documentation

- 📖 [Complete Implementation Guide](./field-mapping-implementation.md)
- 🧪 [Testing Guide](./field-mapping-testing.md)
- 🔌 [Query API Integration](./query-api-field-mapping-integration.md)
- 📋 [Complete Summary](./field-mapping-complete-summary.md)

## API Endpoints

```
GET    /api/devicetype/{id}               # Returns device type with fields
GET    /api/devicetype/{id}/fields        # Get field mappings
PUT    /api/devicetype/{id}/fields        # Update field mappings
POST   /api/devicetype/{id}/fields/sync   # Synchronize fields
```

## Key Features

✨ **Automatic Merging**: Combines schema, custom, and system fields  
🎨 **Friendly Names**: User-customizable display names  
🔄 **Schema Sync**: Auto-updates when schema changes  
💾 **Persistence**: User customizations preserved across syncs  
🏷️ **Rich Metadata**: Units, ranges, categories, aggregations  
👁️ **Visibility Control**: Show/hide fields in UI  
🔍 **Queryable Flag**: Mark fields for dashboard queries  
📊 **Display Order**: Custom sorting for UI presentation  
🌍 **Multi-Tenant**: Full tenant isolation  

---

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: December 10, 2025
