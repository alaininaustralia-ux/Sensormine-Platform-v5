/**
 * Device Simulator Types
 * Types for simulating various IoT device protocols
 */

export type ProtocolType = 
  | 'mqtt'
  | 'http'
  | 'websocket'
  | 'modbus'
  | 'opcua';

export type DeviceStatus = 'idle' | 'running' | 'error' | 'connecting';

export type SensorType = 
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'flow'
  | 'level'
  | 'vibration'
  | 'voltage'
  | 'current'
  | 'power'
  | 'speed'
  | 'position'
  | 'ph'
  | 'co2'
  | 'light';

export interface SensorConfig {
  id: string;
  name: string;
  type: SensorType;
  unit: string;
  minValue: number;
  maxValue: number;
  precision: number;
  variance: number; // Random variance percentage
}

export interface DeviceConfig {
  id: string;
  name: string;
  description: string;
  protocol: ProtocolType;
  sensors: SensorConfig[];
  intervalMs: number;
  enabled: boolean;
}

// Protocol-specific configurations
export interface MqttConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  clientId: string;
  topic: string;
  qos: 0 | 1 | 2;
  useTls: boolean;
}

export interface HttpConfig {
  endpoint: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  authType: 'none' | 'basic' | 'bearer' | 'apikey';
  authValue?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  heartbeatInterval: number;
}

export interface ModbusConfig {
  host: string;
  port: number;
  unitId: number;
  registerType: 'holding' | 'input' | 'coil';
  startAddress: number;
}

export interface OpcUaConfig {
  endpointUrl: string;
  securityMode: 'None' | 'Sign' | 'SignAndEncrypt';
  nodeIds: string[];
}

export interface SimulationState {
  devices: DeviceConfig[];
  activeSimulations: Map<string, SimulationInstance>;
  logs: SimulationLog[];
}

export interface SimulationInstance {
  deviceId: string;
  status: DeviceStatus;
  startedAt: Date;
  messageCount: number;
  errorCount: number;
  lastMessage?: TelemetryMessage | Record<string, unknown>;
  lastError?: string;
}

export interface TelemetryMessage {
  deviceId: string;
  timestamp: string;
  sensors: SensorReading[];
}

export interface SensorReading {
  sensorId: string;
  name: string;
  value: number;
  unit: string;
  quality: 'good' | 'bad' | 'uncertain';
}

export interface SimulationLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  deviceId: string;
  protocol: ProtocolType;
  message: string;
  data?: unknown;
}

// Default sensor configurations
export const DEFAULT_SENSOR_CONFIGS: Record<SensorType, Omit<SensorConfig, 'id' | 'name'>> = {
  temperature: { type: 'temperature', unit: '°C', minValue: -20, maxValue: 50, precision: 1, variance: 5 },
  humidity: { type: 'humidity', unit: '%', minValue: 0, maxValue: 100, precision: 1, variance: 3 },
  pressure: { type: 'pressure', unit: 'bar', minValue: 0, maxValue: 10, precision: 2, variance: 2 },
  flow: { type: 'flow', unit: 'L/min', minValue: 0, maxValue: 100, precision: 1, variance: 10 },
  level: { type: 'level', unit: 'm', minValue: 0, maxValue: 10, precision: 2, variance: 1 },
  vibration: { type: 'vibration', unit: 'mm/s', minValue: 0, maxValue: 50, precision: 2, variance: 15 },
  voltage: { type: 'voltage', unit: 'V', minValue: 0, maxValue: 480, precision: 1, variance: 2 },
  current: { type: 'current', unit: 'A', minValue: 0, maxValue: 100, precision: 2, variance: 5 },
  power: { type: 'power', unit: 'kW', minValue: 0, maxValue: 1000, precision: 1, variance: 8 },
  speed: { type: 'speed', unit: 'RPM', minValue: 0, maxValue: 3600, precision: 0, variance: 3 },
  position: { type: 'position', unit: 'mm', minValue: 0, maxValue: 1000, precision: 1, variance: 0.5 },
  ph: { type: 'ph', unit: 'pH', minValue: 0, maxValue: 14, precision: 2, variance: 2 },
  co2: { type: 'co2', unit: 'ppm', minValue: 400, maxValue: 5000, precision: 0, variance: 10 },
  light: { type: 'light', unit: 'lux', minValue: 0, maxValue: 10000, precision: 0, variance: 20 },
};

export const PROTOCOL_DISPLAY_NAMES: Record<ProtocolType, string> = {
  mqtt: 'MQTT',
  http: 'HTTP/REST',
  websocket: 'WebSocket',
  modbus: 'Modbus TCP',
  opcua: 'OPC UA',
};
