import { SensorConfig, SensorReading, TelemetryMessage, DeviceConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Generator utilities for simulating sensor telemetry
 */

// Store previous values to create smooth transitions
const previousValues: Map<string, number> = new Map();

/**
 * Generate a random value within range with variance from previous value
 */
export function generateSensorValue(
  config: SensorConfig,
  previousValue?: number
): number {
  const { minValue, maxValue, variance, precision } = config;
  const range = maxValue - minValue;
  
  // If no previous value, start at midpoint with some randomness
  if (previousValue === undefined) {
    const midpoint = (minValue + maxValue) / 2;
    const randomOffset = (Math.random() - 0.5) * range * 0.3;
    return clampAndRound(midpoint + randomOffset, minValue, maxValue, precision);
  }
  
  // Apply random walk with variance
  const maxChange = range * (variance / 100);
  const change = (Math.random() - 0.5) * 2 * maxChange;
  const newValue = previousValue + change;
  
  return clampAndRound(newValue, minValue, maxValue, precision);
}

/**
 * Clamp value within range and round to precision
 */
function clampAndRound(value: number, min: number, max: number, precision: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  const factor = Math.pow(10, precision);
  return Math.round(clamped * factor) / factor;
}

/**
 * Generate a sensor reading with simulated value
 */
export function generateSensorReading(config: SensorConfig): SensorReading {
  const key = config.id;
  const previousValue = previousValues.get(key);
  const value = generateSensorValue(config, previousValue);
  
  previousValues.set(key, value);
  
  // Occasionally generate quality issues (1% chance)
  const quality: SensorReading['quality'] = Math.random() < 0.01 
    ? (Math.random() < 0.5 ? 'uncertain' : 'bad')
    : 'good';
  
  return {
    sensorId: config.id,
    name: config.name,
    value,
    unit: config.unit,
    quality,
  };
}

/**
 * Generate a complete telemetry message for a device
 */
export function generateTelemetryMessage(device: DeviceConfig): TelemetryMessage {
  return {
    deviceId: device.id,
    timestamp: new Date().toISOString(),
    sensors: device.sensors.map(sensor => generateSensorReading(sensor)),
  };
}

/**
 * Generate device diagnostics data
 */
export function generateDiagnostics(deviceId: string): Record<string, unknown> {
  return {
    deviceId,
    timestamp: new Date().toISOString(),
    diagnostics: {
      battery: Math.round(Math.random() * 30 + 70), // 70-100%
      signalStrength: Math.round(Math.random() * 40 + 60), // 60-100 dBm
      temperature: Math.round((Math.random() * 20 + 30) * 10) / 10, // 30-50°C
      uptime: Math.round(Math.random() * 86400 * 30), // Up to 30 days in seconds
      firmwareVersion: '1.2.3',
      memoryUsage: Math.round(Math.random() * 30 + 40), // 40-70%
      cpuUsage: Math.round(Math.random() * 40 + 20), // 20-60%
    },
  };
}

/**
 * Reset stored values for a device (useful when stopping simulation)
 */
export function resetDeviceValues(deviceId: string, sensors: SensorConfig[]): void {
  sensors.forEach(sensor => {
    previousValues.delete(sensor.id);
  });
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a device serial number
 */
export function generateSerialNumber(): string {
  const prefix = 'SM-NX-';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${randomPart}`;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}
