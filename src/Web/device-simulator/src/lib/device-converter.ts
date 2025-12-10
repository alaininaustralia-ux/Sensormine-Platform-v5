/**
 * Converts API devices to simulator device configurations
 */

import { DeviceConfig, SensorConfig, ProtocolType } from '@/types';
import { ApiDevice, ApiDeviceType, ApiSchema } from './api-client';

interface JsonSchemaProperty {
  type?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  [key: string]: unknown;
}

/**
 * Parse JSON schema and extract sensor fields
 */
export function extractSensorsFromSchema(jsonSchemaString: string): SensorConfig[] {
  try {
    const schema = JSON.parse(jsonSchemaString) as { properties?: Record<string, JsonSchemaProperty> };
    const sensors: SensorConfig[] = [];
    
    if (!schema.properties) return sensors;

    // Skip common metadata fields
    const skipFields = ['deviceId', 'timestamp', 'tenantId', 'id'];
    
    Object.entries(schema.properties).forEach(([fieldName, fieldDef]) => {
      if (skipFields.includes(fieldName)) return;
      
      const sensor: SensorConfig = {
        id: `sensor-${fieldName}`,
        name: fieldDef.description || fieldName,
        type: mapSchemaTypeToSensorType(fieldDef),
        unit: extractUnit(fieldDef.description || ''),
        minValue: fieldDef.minimum ?? getDefaultMin(fieldDef.type || 'number'),
        maxValue: fieldDef.maximum ?? getDefaultMax(fieldDef.type || 'number'),
        precision: fieldDef.type === 'number' ? 2 : 0,
        variance: 10, // 10% default variance
      };
      
      sensors.push(sensor);
    });
    
    return sensors;
  } catch (error) {
    console.error('Failed to parse schema:', error);
    return [];
  }
}

function mapSchemaTypeToSensorType(fieldDef: JsonSchemaProperty): SensorConfig['type'] {
  // Check description for hints
  const desc = (fieldDef.description || '').toLowerCase();
  if (desc.includes('temperature')) return 'temperature';
  if (desc.includes('humidity')) return 'humidity';
  if (desc.includes('pressure')) return 'pressure';
  if (desc.includes('flow')) return 'flow';
  if (desc.includes('level')) return 'level';
  if (desc.includes('vibration')) return 'vibration';
  if (desc.includes('voltage')) return 'voltage';
  if (desc.includes('current')) return 'current';
  if (desc.includes('power')) return 'power';
  if (desc.includes('speed')) return 'speed';
  if (desc.includes('position')) return 'position';
  if (desc.includes('ph')) return 'ph';
  if (desc.includes('co2')) return 'co2';
  if (desc.includes('light') || desc.includes('lux')) return 'light';
  
  // Default to temperature as fallback
  return 'temperature';
}

function extractUnit(description: string): string {
  const unitPatterns = [
    { pattern: /in\s+(°C|celsius)/i, unit: '°C' },
    { pattern: /in\s+(°F|fahrenheit)/i, unit: '°F' },
    { pattern: /in\s+(%|percent)/i, unit: '%' },
    { pattern: /in\s+(Pa|pascal|kPa|bar)/i, unit: 'Pa' },
    { pattern: /in\s+(L\/min|l\/min)/i, unit: 'L/min' },
    { pattern: /in\s+(m\/s²|g)/i, unit: 'm/s²' },
    { pattern: /in\s+(V|volts?)/i, unit: 'V' },
    { pattern: /in\s+(A|amps?)/i, unit: 'A' },
    { pattern: /in\s+(W|watts?)/i, unit: 'W' },
    { pattern: /in\s+(rpm)/i, unit: 'RPM' },
    { pattern: /in\s+(ppm)/i, unit: 'ppm' },
    { pattern: /in\s+(ppb)/i, unit: 'ppb' },
    { pattern: /in\s+(lux)/i, unit: 'lux' },
    { pattern: /in\s+(dB)/i, unit: 'dB' },
    { pattern: /in\s+(μg\/m³)/i, unit: 'μg/m³' },
    { pattern: /in\s+(mg\/L)/i, unit: 'mg/L' },
    { pattern: /in\s+(cm|meters?)/i, unit: 'cm' },
  ];
  
  for (const { pattern, unit } of unitPatterns) {
    if (pattern.test(description)) return unit;
  }
  
  return '';
}

function getDefaultMin(type: string): number {
  if (type === 'boolean') return 0;
  return 0;
}

function getDefaultMax(type: string): number {
  if (type === 'boolean') return 1;
  if (type === 'integer') return 100;
  return 100;
}

/**
 * Detect protocol from device type name or metadata
 */
export function detectProtocol(deviceType: ApiDeviceType, device: ApiDevice): ProtocolType {
  // Check explicit protocol field
  if (deviceType.protocol) {
    const proto = deviceType.protocol.toLowerCase();
    if (proto.includes('mqtt')) return 'mqtt';
    if (proto.includes('http') || proto.includes('rest')) return 'http';
    if (proto.includes('websocket') || proto.includes('ws')) return 'websocket';
    if (proto.includes('modbus')) return 'modbus';
    if (proto.includes('opc')) return 'opcua';
  }
  
  // Check device metadata
  if (device.metadata) {
    const proto = JSON.stringify(device.metadata).toLowerCase();
    if (proto.includes('mqtt')) return 'mqtt';
    if (proto.includes('modbus')) return 'modbus';
    if (proto.includes('opcua')) return 'opcua';
  }
  
  // Default: MQTT is most common for IoT devices
  return 'mqtt';
}

/**
 * Convert API device to simulator device configuration
 */
export function convertApiDeviceToSimulatorConfig(
  device: ApiDevice,
  deviceType?: ApiDeviceType,
  schema?: ApiSchema
): DeviceConfig {
  // Extract sensors from schema if available
  const sensors = schema?.currentVersion?.jsonSchema
    ? extractSensorsFromSchema(schema.currentVersion.jsonSchema)
    : [];
  
  // If no sensors from schema, create default sensor based on device type
  if (sensors.length === 0) {
    sensors.push({
      id: 'sensor-default',
      name: 'Default Sensor',
      type: 'temperature',
      unit: '',
      minValue: 0,
      maxValue: 100,
      precision: 2,
      variance: 10,
    });
  }
  
  // Detect protocol
  const protocol = deviceType ? detectProtocol(deviceType, device) : 'mqtt';
  
  return {
    id: device.id,
    name: device.name,
    description: `${device.deviceTypeName} (${device.deviceId})`,
    protocol,
    sensors,
    intervalMs: 5000, // 5 seconds
    enabled: device.status.toLowerCase() === 'active',
  };
}

/**
 * Batch convert multiple devices
 */
export function convertApiDevicesToSimulatorConfigs(
  devices: ApiDevice[],
  deviceTypes: Map<string, ApiDeviceType>,
  schemas: Map<string, ApiSchema>
): DeviceConfig[] {
  return devices.map(device => {
    const deviceType = deviceTypes.get(device.deviceTypeId);
    const schema = deviceType?.schemaId ? schemas.get(deviceType.schemaId) : undefined;
    
    return convertApiDeviceToSimulatorConfig(device, deviceType, schema);
  });
}
