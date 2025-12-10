# Field Mapping Implementation

## Overview
Field mapping allows device types to expose a unified field list that merges schema fields (from SchemaRegistry), custom fields (from DeviceType), and system fields (built-in). Users can assign friendly names and metadata to fields, making them more usable in the dashboard designer and Query API.

## Architecture

### Components

#### 1. Database Layer
- **Table**: `field_mappings` in `sensormine_metadata` database
- **Columns**:
  - `id`, `tenant_id`, `device_type_id`, `field_name`, `field_source`
  - `friendly_name`, `description`, `unit`, `data_type`
  - `min_value`, `max_value`, `is_queryable`, `is_visible`
  - `display_order`, `category`, `tags` (JSONB), `default_aggregation`
  - `supports_aggregations` (JSONB), `format_string`
  - `created_at`, `updated_at`, `created_by`
- **Indexes**: `tenant_id`, `device_type_id`, unique(`device_type_id`, `field_name`), `is_queryable`
- **Foreign Key**: `device_type_id` → `device_types(id)` ON DELETE CASCADE

#### 2. Domain Models
- **FieldMapping** (`Sensormine.Core.Models`): Entity representing a field mapping
- **FieldSource** (enum): Schema, CustomField, System
- **FieldDataType** (enum): Number, String, Boolean, Object, Array, Timestamp

#### 3. Repository Layer
- **IFieldMappingRepository** (`Sensormine.Core.Repositories`)
- **FieldMappingRepository** (`Sensormine.Storage.Repositories`)
- **Operations**:
  - `GetByDeviceTypeIdAsync` - Get all mappings for a device type
  - `GetByFieldNameAsync` - Find specific field mapping
  - `CreateAsync`, `UpdateAsync`, `DeleteAsync` - Standard CRUD
  - `CreateManyAsync`, `UpdateManyAsync` - Bulk operations
  - `DeleteByDeviceTypeIdAsync` - Cascade delete
  - `ExistsAsync` - Check for duplicate field names

#### 4. Service Layer
- **IFieldMappingService** (`Device.API/Services`)
- **FieldMappingService** implementation:
  - `GetFieldMappingsForDeviceTypeAsync` - Returns merged field list from all sources
  - `SynchronizeFieldMappingsAsync` - Creates/updates mappings when schema or device type changes
  - `UpdateFieldMappingsAsync` - Batch update user-editable fields

#### 5. API Layer
- **FieldMappingController** (`Device.API/Controllers`)
  - `GET /api/devicetype/{deviceTypeId}/fields` - Get field mappings
  - `PUT /api/devicetype/{deviceTypeId}/fields` - Update field mappings
  - `POST /api/devicetype/{deviceTypeId}/fields/sync` - Synchronize fields after schema change

- **DeviceTypeController** - Extended to populate `Fields` property in responses
  - `GET /api/devicetype/{id}` - Returns device type with merged field list

#### 6. DTOs
- **FieldMappingResponse** - API response DTO with `FromEntity` mapper
- **FieldMappingRequest** - Update request DTO
- **BulkUpdateFieldMappingsRequest** - Batch update request
- **DeviceTypeResponse** - Extended with `List<FieldMappingResponse> Fields` property

#### 7. Schema Integration
- **ISchemaRegistryClient** - Extended with `GetSchemaAsync` method
- **SchemaRegistryClient** - Fetches full schema with `schema_definition` from SchemaRegistry.API
- **SchemaResponse** class: Id, Name, SchemaType, SchemaDefinition (JsonDocument)

## Field Sources

### 1. System Fields (Built-in)
Standard fields available for all device types:
- `battery_level` (Number, 0-100%)
- `signal_strength` (Number, 0-100%)
- `latitude` (Number, decimal degrees)
- `longitude` (Number, decimal degrees)

### 2. Schema Fields
Fields parsed from the schema definition in SchemaRegistry.API:
- **JSON Schema**: Parsed from `properties` object
- **Avro Schema**: Parsed from `fields` array
- Field properties: name, type, description (from schema)
- Automatically mapped to FieldDataType

### 3. Custom Fields
Fields defined in `DeviceType.CustomFields`:
- Properties: Name, Label, Type, Required, DefaultValue, HelpText
- Mapped from CustomFieldType to FieldDataType

## Field Merging Logic

1. **Fetch System Fields** - Standard fields for all devices
2. **Fetch Schema Fields** (if SchemaId present)
   - Call SchemaRegistry.API to get full schema
   - Parse JSON Schema or Avro schema
   - Extract field definitions
3. **Fetch Custom Fields** from DeviceType
4. **Merge All Sources**:
   - Retrieve existing field mappings from database
   - For each field (system/schema/custom), check if mapping exists:
     - If exists: Use existing mapping (preserves user customizations)
     - If not: Create new mapping with auto-generated friendly name
5. **Auto-Generate Friendly Names**:
   - Convert snake_case/camelCase to Title Case
   - Example: `battery_level` → "Battery Level"

## Usage Workflow

### 1. Create Device Type
```http
POST /api/devicetype
{
  "name": "Temperature Sensor",
  "schemaId": "guid-of-schema",
  "customFields": [
    { "name": "location", "label": "Location", "type": "String" }
  ]
}
```

### 2. Get Device Type with Fields
```http
GET /api/devicetype/{id}
```
Response includes merged field list:
```json
{
  "id": "...",
  "name": "Temperature Sensor",
  "fields": [
    {
      "fieldName": "temperature",
      "fieldSource": "Schema",
      "friendlyName": "Temperature",
      "dataType": "Number",
      "unit": "°C",
      "isQueryable": true,
      "isVisible": true
    },
    {
      "fieldName": "location",
      "fieldSource": "CustomField",
      "friendlyName": "Location",
      "dataType": "String",
      "isQueryable": true,
      "isVisible": true
    },
    {
      "fieldName": "battery_level",
      "fieldSource": "System",
      "friendlyName": "Battery Level",
      "dataType": "Number",
      "unit": "%",
      "minValue": 0,
      "maxValue": 100
    }
  ]
}
```

### 3. Update Field Mappings
```http
PUT /api/devicetype/{id}/fields
{
  "fieldMappings": [
    {
      "fieldName": "temperature",
      "friendlyName": "Ambient Temperature",
      "description": "Temperature reading from sensor",
      "unit": "°F",
      "isVisible": true,
      "displayOrder": 1
    }
  ]
}
```

### 4. Synchronize After Schema Change
```http
POST /api/devicetype/{id}/fields/sync
```
Re-parses schema and updates field mappings.

## Schema Parsing

### JSON Schema
```json
{
  "type": "object",
  "properties": {
    "temperature": {
      "type": "number",
      "description": "Temperature in Celsius"
    }
  }
}
```
Parsed into:
- Field name: `temperature`
- Data type: `Number`
- Description: "Temperature in Celsius"

### Avro Schema
```json
{
  "type": "record",
  "fields": [
    {
      "name": "temperature",
      "type": "double",
      "doc": "Temperature in Celsius"
    }
  ]
}
```
Parsed into:
- Field name: `temperature`
- Data type: `Number`
- Description: "Temperature in Celsius"

## Type Mappings

### JSON Schema → FieldDataType
- `number`, `integer` → Number
- `string` → String
- `boolean` → Boolean
- `object` → Object
- `array` → Array

### Avro → FieldDataType
- `int`, `long`, `float`, `double` → Number
- `string` → String
- `boolean` → Boolean
- `record` → Object
- `array` → Array

### CustomFieldType → FieldDataType
- `String`, `Text`, `Email`, `Phone`, `Url` → String
- `Number`, `Integer`, `Decimal`, `Currency` → Number
- `Boolean`, `Checkbox` → Boolean
- `DateTime`, `Date`, `Time` → Timestamp
- `Select`, `Radio`, `Dropdown` → String
- `Json` → Object

## Query API Integration (Future)

Field mappings enable Query API to:
1. **Query by Friendly Name**: Users query using friendly names like "Ambient Temperature"
2. **Column Mapping**: Map friendly names to actual TimescaleDB column names:
   - Schema fields → `telemetry_data` table columns
   - Custom fields → `custom_fields.{fieldname}` JSONB paths
   - System fields → Built-in columns (battery_level, signal_strength, etc.)
3. **Metadata for Visualization**: Provide units, data types, min/max for chart rendering

Example Query API request:
```http
POST /api/query
{
  "deviceTypeId": "guid",
  "fields": ["Ambient Temperature", "Battery Level"],
  "startTime": "2025-01-01T00:00:00Z",
  "endTime": "2025-01-10T00:00:00Z",
  "aggregation": "avg",
  "interval": "1h"
}
```

Query API uses field mappings to:
- Resolve "Ambient Temperature" → `custom_fields.temperature`
- Resolve "Battery Level" → `battery_level` column
- Apply correct aggregations based on data type

## Benefits

1. **User-Friendly**: Dashboard designer shows friendly names instead of technical field names
2. **Flexible**: Supports multiple field sources (schema, custom, system)
3. **Consistent**: Same field list used across Device API, Query API, and frontend
4. **Maintainable**: Field mappings persist when schema changes
5. **Multi-Tenant**: Tenant isolation enforced at repository level
6. **Extensible**: Easy to add new field sources or metadata

## Files Modified/Created

### Database
- `infrastructure/migrations/20251210_add_field_mappings.sql` (already existed, applied)

### Backend - Core
- `src/Shared/Sensormine.Core/Models/FieldMapping.cs` (already existed)
- `src/Shared/Sensormine.Core/Repositories/IFieldMappingRepository.cs` (created)

### Backend - Storage
- `src/Shared/Sensormine.Storage/Data/ApplicationDbContext.cs` (modified - added FieldMappings DbSet)
- `src/Shared/Sensormine.Storage/Repositories/FieldMappingRepository.cs` (created)

### Backend - Device.API
- `src/Services/Device.API/DTOs/FieldMappingDTOs.cs` (created)
- `src/Services/Device.API/DTOs/DeviceTypeResponse.cs` (modified - added Fields property)
- `src/Services/Device.API/Services/IFieldMappingService.cs` (created)
- `src/Services/Device.API/Services/FieldMappingService.cs` (created)
- `src/Services/Device.API/Services/ISchemaRegistryClient.cs` (modified - added GetSchemaAsync)
- `src/Services/Device.API/Services/SchemaRegistryClient.cs` (modified - implemented GetSchemaAsync)
- `src/Services/Device.API/Controllers/FieldMappingController.cs` (created)
- `src/Services/Device.API/Controllers/DeviceTypeController.cs` (modified - added IFieldMappingService, populate Fields)
- `src/Services/Device.API/Program.cs` (modified - registered services)

## Testing

### Manual Testing
1. Create device type with schema
2. Call GET `/api/devicetype/{id}` - verify fields array populated
3. Call PUT `/api/devicetype/{id}/fields` - update friendly names
4. Call GET again - verify changes persisted
5. Call POST `/api/devicetype/{id}/fields/sync` - verify fields re-synchronized

### Integration Points to Test
- Schema change → Field mappings update
- Device type update → Field mappings preserved
- Device type delete → Field mappings cascade deleted
- Tenant isolation → Cannot access other tenant's field mappings

## Next Steps (Not Yet Implemented)

1. **Frontend UI**:
   - Field mapping editor component
   - Display fields in device type detail page
   - Drag-and-drop field reordering
   - Field visibility toggles

2. **Query API Integration**:
   - Use field mappings to resolve friendly names to TimescaleDB columns
   - Apply correct aggregations based on data type
   - Support filtering by friendly names

3. **Dashboard Designer**:
   - Widget configuration uses friendly names
   - Auto-populate field dropdowns from device type fields
   - Display units and data types in UI

4. **Validation**:
   - Prevent duplicate field names within device type
   - Validate data types match schema
   - Ensure required fields are present

5. **Audit Trail**:
   - Track field mapping changes
   - Record who updated friendly names
   - Version history for field mappings
