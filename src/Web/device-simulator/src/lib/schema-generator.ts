/**
 * Schema-based Data Generator
 * Generates realistic telemetry data from JSON Schema definitions
 */

import { faker } from '@faker-js/faker';

export interface SchemaProperty {
  type: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  description?: string;
  examples?: unknown[];
}

export interface JsonSchema {
  $schema?: string;
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
  title?: string;
  description?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  items?: SchemaProperty;
}

/**
 * Generate data based on JSON Schema
 */
export function generateFromSchema(schema: JsonSchema | string): unknown {
  // Parse schema if it's a string
  const parsedSchema: JsonSchema = typeof schema === 'string' 
    ? JSON.parse(schema) 
    : schema;

  if (!parsedSchema.type) {
    throw new Error('Schema must have a type property');
  }

  switch (parsedSchema.type) {
    case 'object':
      return generateObjectFromSchema(parsedSchema);
    case 'array':
      return generateArrayFromSchema(parsedSchema);
    default:
      return generatePropertyValue('value', parsedSchema as SchemaProperty);
  }
}

/**
 * Generate object data from schema
 */
function generateObjectFromSchema(schema: JsonSchema): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  if (!schema.properties) {
    return result;
  }

  // Generate required properties first
  const required = schema.required || [];
  const properties = schema.properties;

  for (const [key, propSchema] of Object.entries(properties)) {
    // Always generate required fields, 80% chance for optional fields
    if (required.includes(key) || Math.random() < 0.8) {
      result[key] = generatePropertyValue(key, propSchema);
    }
  }

  return result;
}

/**
 * Generate array data from schema
 */
function generateArrayFromSchema(schema: JsonSchema): unknown[] {
  const items = schema.items;
  if (!items) {
    return [];
  }

  // Generate 1-5 items
  const count = Math.floor(Math.random() * 5) + 1;
  const result: unknown[] = [];

  for (let i = 0; i < count; i++) {
    result.push(generatePropertyValue(`item_${i}`, items));
  }

  return result;
}

/**
 * Generate a single property value based on its schema
 */
function generatePropertyValue(propertyName: string, schema: SchemaProperty): unknown {
  // Handle const values
  if (schema.const !== undefined) {
    return schema.const;
  }

  // Handle enum values
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[Math.floor(Math.random() * schema.enum.length)];
  }

  // Use examples if provided
  if (schema.examples && schema.examples.length > 0) {
    return schema.examples[Math.floor(Math.random() * schema.examples.length)];
  }

  // Generate based on type and format
  return generateByTypeAndFormat(propertyName, schema);
}

/**
 * Generate value based on type and format
 */
function generateByTypeAndFormat(propertyName: string, schema: SchemaProperty): unknown {
  const type = schema.type;
  const format = schema.format;

  // Handle specific formats first
  if (format) {
    switch (format) {
      case 'date-time':
        return new Date().toISOString();
      case 'date':
        return faker.date.recent().toISOString().split('T')[0];
      case 'time':
        return new Date().toTimeString().split(' ')[0];
      case 'email':
        return faker.internet.email();
      case 'hostname':
        return faker.internet.domainName();
      case 'ipv4':
        return faker.internet.ip();
      case 'ipv6':
        return faker.internet.ipv6();
      case 'uri':
      case 'url':
        return faker.internet.url();
      case 'uuid':
        return faker.string.uuid();
    }
  }

  // Generate by type
  switch (type) {
    case 'string':
      return generateString(propertyName, schema);
    case 'number':
      return generateNumber(schema);
    case 'integer':
      return generateInteger(schema);
    case 'boolean':
      return Math.random() < 0.5;
    case 'object':
      return generateObjectFromSchema(schema as JsonSchema);
    case 'array':
      return generateArrayFromSchema(schema as JsonSchema);
    default:
      return null;
  }
}

/**
 * Generate string value with realistic data based on property name
 */
function generateString(propertyName: string, schema: SchemaProperty): string {
  const name = propertyName.toLowerCase();
  
  // Smart generation based on property name
  if (name.includes('id') || name.includes('uuid')) {
    return faker.string.uuid();
  }
  if (name.includes('email')) {
    return faker.internet.email();
  }
  if (name.includes('phone') || name.includes('tel')) {
    return faker.phone.number();
  }
  if (name.includes('name')) {
    if (name.includes('first')) return faker.person.firstName();
    if (name.includes('last')) return faker.person.lastName();
    if (name.includes('full')) return faker.person.fullName();
    if (name.includes('company')) return faker.company.name();
    return faker.person.fullName();
  }
  if (name.includes('address')) {
    return faker.location.streetAddress();
  }
  if (name.includes('city')) {
    return faker.location.city();
  }
  if (name.includes('country')) {
    return faker.location.country();
  }
  if (name.includes('description') || name.includes('desc')) {
    return faker.lorem.sentence();
  }
  if (name.includes('url') || name.includes('website')) {
    return faker.internet.url();
  }
  if (name.includes('timestamp') || name.includes('time')) {
    return new Date().toISOString();
  }
  if (name.includes('status')) {
    return faker.helpers.arrayElement(['active', 'inactive', 'pending', 'completed']);
  }
  if (name.includes('type')) {
    return faker.helpers.arrayElement(['type-a', 'type-b', 'type-c']);
  }
  if (name.includes('version')) {
    return faker.system.semver();
  }

  // Use pattern if provided
  if (schema.pattern) {
    // Simple pattern matching for common cases
    if (schema.pattern.includes('[0-9]')) {
      return faker.string.numeric(schema.maxLength || 10);
    }
  }

  // Use length constraints
  const minLength = schema.minLength || 5;
  const maxLength = schema.maxLength || 50;
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  
  return faker.lorem.words(Math.ceil(length / 6)).substring(0, length);
}

/**
 * Generate number value within constraints
 */
function generateNumber(schema: SchemaProperty): number {
  const min = schema.minimum !== undefined ? schema.minimum : 0;
  const max = schema.maximum !== undefined ? schema.maximum : 100;
  
  const value = min + Math.random() * (max - min);
  
  // Round to reasonable precision (2 decimal places by default)
  return Math.round(value * 100) / 100;
}

/**
 * Generate integer value within constraints
 */
function generateInteger(schema: SchemaProperty): number {
  const min = schema.minimum !== undefined ? Math.ceil(schema.minimum) : 0;
  const max = schema.maximum !== undefined ? Math.floor(schema.maximum) : 100;
  
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Extract sensor-like properties from schema for continuous simulation
 */
export interface SchemaBasedSensor {
  path: string;
  name: string;
  type: 'number' | 'integer' | 'boolean' | 'string';
  min?: number;
  max?: number;
  values?: unknown[];
  format?: string;
}

/**
 * Parse schema to extract simulatable sensors
 */
export function extractSensorsFromSchema(schema: JsonSchema | string): SchemaBasedSensor[] {
  const parsedSchema: JsonSchema = typeof schema === 'string' 
    ? JSON.parse(schema) 
    : schema;

  const sensors: SchemaBasedSensor[] = [];

  if (parsedSchema.type === 'object' && parsedSchema.properties) {
    for (const [key, propSchema] of Object.entries(parsedSchema.properties)) {
      if (isSimulatable(propSchema)) {
        sensors.push({
          path: key,
          name: key,
          type: propSchema.type as 'number' | 'integer' | 'boolean' | 'string',
          min: propSchema.minimum,
          max: propSchema.maximum,
          values: propSchema.enum,
          format: propSchema.format,
        });
      }
    }
  }

  return sensors;
}

/**
 * Check if a property can be continuously simulated
 */
function isSimulatable(schema: SchemaProperty): boolean {
  return ['number', 'integer', 'boolean'].includes(schema.type) || 
         (schema.type === 'string' && (!!schema.enum || schema.format === 'date-time'));
}

/**
 * Generate continuous value for a sensor with smooth transitions
 */
const sensorState = new Map<string, number>();

export function generateContinuousValue(
  sensor: SchemaBasedSensor, 
  deviceId: string
): unknown {
  const key = `${deviceId}_${sensor.path}`;

  switch (sensor.type) {
    case 'number':
    case 'integer': {
      const min = sensor.min ?? 0;
      const max = sensor.max ?? 100;
      const previousValue = sensorState.get(key) ?? (min + max) / 2;
      
      // Random walk with 10% variance
      const variance = (max - min) * 0.1;
      const change = (Math.random() - 0.5) * variance;
      let newValue = previousValue + change;
      
      // Clamp to range
      newValue = Math.max(min, Math.min(max, newValue));
      
      // Round integers
      if (sensor.type === 'integer') {
        newValue = Math.round(newValue);
      } else {
        newValue = Math.round(newValue * 100) / 100;
      }
      
      sensorState.set(key, newValue);
      return newValue;
    }

    case 'boolean':
      // Toggle occasionally (10% chance)
      if (Math.random() < 0.1) {
        const previousValue = sensorState.get(key) ?? 0;
        const newValue = previousValue === 1 ? 0 : 1;
        sensorState.set(key, newValue);
        return newValue === 1;
      }
      return (sensorState.get(key) ?? 0) === 1;

    case 'string':
      if (sensor.values) {
        // Cycle through enum values occasionally
        if (Math.random() < 0.2) {
          const currentIndex = sensorState.get(key) ?? 0;
          const nextIndex = (currentIndex + 1) % sensor.values.length;
          sensorState.set(key, nextIndex);
          return sensor.values[nextIndex];
        }
        const currentIndex = sensorState.get(key) ?? 0;
        return sensor.values[currentIndex];
      }
      if (sensor.format === 'date-time') {
        return new Date().toISOString();
      }
      return faker.lorem.word();

    default:
      return null;
  }
}

/**
 * Reset state for a device
 */
export function resetSensorState(deviceId: string): void {
  const keys = Array.from(sensorState.keys());
  for (const key of keys) {
    if (key.startsWith(deviceId)) {
      sensorState.delete(key);
    }
  }
}
