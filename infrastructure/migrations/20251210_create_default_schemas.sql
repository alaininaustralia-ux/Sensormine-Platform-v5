-- Create default schemas for device types
-- Date: 2025-12-10

-- Temperature Sensor Schema
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Temperature Sensor Schema',
    'Schema for temperature sensors with environmental data',
    'Active',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11111111-2222-2222-2222-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '1.0',
    '{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "temperature": {
      "type": "number",
      "minimum": -50,
      "maximum": 150,
      "unit": "°C",
      "description": "Temperature reading in Celsius"
    },
    "humidity": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "unit": "%",
      "description": "Relative humidity percentage"
    },
    "pressure": {
      "type": "number",
      "minimum": 900,
      "maximum": 1100,
      "unit": "hPa",
      "description": "Atmospheric pressure"
    },
    "battery": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "unit": "%",
      "description": "Battery level percentage"
    },
    "location": {
      "type": "object",
      "properties": {
        "latitude": {
          "type": "number",
          "minimum": -90,
          "maximum": 90
        },
        "longitude": {
          "type": "number",
          "minimum": -180,
          "maximum": 180
        },
        "altitude": {
          "type": "number",
          "minimum": -500,
          "maximum": 9000
        }
      }
    }
  },
  "required": ["temperature"]
}',
    'Initial version',
    true,
    NOW(),
    'system'
) ON CONFLICT DO NOTHING;

UPDATE schemas 
SET current_version_id = '11111111-2222-2222-2222-111111111111'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Industrial Equipment Schema
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Industrial Equipment Schema',
    'Schema for industrial equipment monitoring',
    'Active',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '22222222-3333-3333-3333-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '1.0',
    '{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "vibration": {
      "type": "number",
      "minimum": 0,
      "maximum": 10,
      "unit": "mm/s",
      "description": "Vibration level"
    },
    "temperature": {
      "type": "number",
      "minimum": 0,
      "maximum": 200,
      "unit": "°C",
      "description": "Operating temperature"
    },
    "pressure": {
      "type": "number",
      "minimum": 0,
      "maximum": 20,
      "unit": "bar",
      "description": "System pressure"
    },
    "speed": {
      "type": "number",
      "minimum": 0,
      "maximum": 5000,
      "unit": "RPM",
      "description": "Rotation speed"
    },
    "power": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000,
      "unit": "kW",
      "description": "Power consumption"
    },
    "status": {
      "type": "string",
      "enum": ["running", "stopped", "idle", "error"],
      "description": "Equipment status"
    },
    "running": {
      "type": "boolean",
      "description": "Is equipment running"
    }
  },
  "required": ["status", "running"]
}',
    'Initial version',
    true,
    NOW(),
    'system'
) ON CONFLICT DO NOTHING;

UPDATE schemas 
SET current_version_id = '22222222-3333-3333-3333-222222222222'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Assign schemas to device types
UPDATE device_types 
SET schema_id = '11111111-1111-1111-1111-111111111111'
WHERE name = 'Temperature Sensor';

UPDATE device_types 
SET schema_id = '22222222-2222-2222-2222-222222222222'
WHERE name = 'Industrial Equipment';
