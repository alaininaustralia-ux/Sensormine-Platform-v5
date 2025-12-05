export { BaseProtocolSimulator } from './base-simulator';
export type { LogCallback, StatusCallback } from './base-simulator';

export { HttpSimulator, getDefaultHttpConfig } from './http-simulator';
export { MqttSimulator, getDefaultMqttConfig } from './mqtt-simulator';
export { WebSocketSimulator, getDefaultWebSocketConfig } from './websocket-simulator';
export { ModbusSimulator, getDefaultModbusConfig } from './modbus-simulator';
export { OpcUaSimulator, getDefaultOpcUaConfig } from './opcua-simulator';

import { DeviceConfig, ProtocolType, HttpConfig, MqttConfig, WebSocketConfig, ModbusConfig, OpcUaConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';
import { HttpSimulator, getDefaultHttpConfig } from './http-simulator';
import { MqttSimulator, getDefaultMqttConfig } from './mqtt-simulator';
import { WebSocketSimulator, getDefaultWebSocketConfig } from './websocket-simulator';
import { ModbusSimulator, getDefaultModbusConfig } from './modbus-simulator';
import { OpcUaSimulator, getDefaultOpcUaConfig } from './opcua-simulator';

export type ProtocolConfig = HttpConfig | MqttConfig | WebSocketConfig | ModbusConfig | OpcUaConfig;

/**
 * Factory function to create appropriate simulator based on protocol
 */
export function createSimulator(
  device: DeviceConfig,
  config: ProtocolConfig,
  onLog: LogCallback,
  onStatus: StatusCallback
): BaseProtocolSimulator {
  switch (device.protocol) {
    case 'http':
      return new HttpSimulator(device, config as HttpConfig, onLog, onStatus);
    case 'mqtt':
      return new MqttSimulator(device, config as MqttConfig, onLog, onStatus);
    case 'websocket':
      return new WebSocketSimulator(device, config as WebSocketConfig, onLog, onStatus);
    case 'modbus':
      return new ModbusSimulator(device, config as ModbusConfig, onLog, onStatus);
    case 'opcua':
      return new OpcUaSimulator(device, config as OpcUaConfig, onLog, onStatus);
    default:
      throw new Error(`Unsupported protocol: ${device.protocol}`);
  }
}

/**
 * Get default configuration for a protocol
 */
export function getDefaultProtocolConfig(protocol: ProtocolType, deviceId: string): ProtocolConfig {
  switch (protocol) {
    case 'http':
      return getDefaultHttpConfig();
    case 'mqtt':
      return getDefaultMqttConfig(deviceId);
    case 'websocket':
      return getDefaultWebSocketConfig();
    case 'modbus':
      return getDefaultModbusConfig();
    case 'opcua':
      return getDefaultOpcUaConfig();
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}
