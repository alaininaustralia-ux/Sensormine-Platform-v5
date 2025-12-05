import { DeviceConfig, MqttConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';

/**
 * MQTT Protocol Simulator
 * Publishes telemetry data to MQTT broker
 * Note: In browser environment, this simulates MQTT behavior
 */
export class MqttSimulator extends BaseProtocolSimulator {
  private mqttConfig: MqttConfig;
  private connected = false;

  constructor(
    device: DeviceConfig,
    config: MqttConfig,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    super(device, config, onLog, onStatus);
    this.mqttConfig = config;
  }

  async start(): Promise<void> {
    this.log('info', `Starting MQTT simulator for device ${this.device.name}`);
    this.log('info', `Broker: ${this.mqttConfig.brokerUrl}:${this.mqttConfig.port}`);
    this.log('info', `Topic: ${this.mqttConfig.topic}`);
    this.log('info', `Client ID: ${this.mqttConfig.clientId}`);
    
    this.onStatus('connecting');
    
    // Simulate connection delay
    await this.simulateConnect();
    
    if (this.connected) {
      this.onStatus('running');
      this.startInterval();
    }
  }

  async stop(): Promise<void> {
    this.log('info', `Stopping MQTT simulator for device ${this.device.name}`);
    this.stopInterval();
    
    if (this.connected) {
      this.log('info', 'Disconnecting from MQTT broker...');
      // Simulate disconnect delay
      await new Promise(resolve => setTimeout(resolve, 100));
      this.connected = false;
      this.log('info', 'Disconnected from MQTT broker');
    }
    
    this.onStatus('idle');
  }

  private async simulateConnect(): Promise<void> {
    this.log('info', 'Connecting to MQTT broker...');
    
    // Simulate connection delay (100-500ms)
    const connectDelay = Math.random() * 400 + 100;
    await new Promise(resolve => setTimeout(resolve, connectDelay));
    
    // Simulate occasional connection failures (5%)
    if (Math.random() < 0.05) {
      const errorMsg = 'Connection refused: Unable to connect to broker';
      this.log('error', errorMsg);
      this.onStatus('error', undefined, errorMsg);
      this.connected = false;
      return;
    }
    
    this.connected = true;
    this.log('info', `Connected to MQTT broker (${Math.round(connectDelay)}ms)`);
    
    if (this.mqttConfig.username) {
      this.log('info', `Authenticated as: ${this.mqttConfig.username}`);
    }
  }

  protected sendTelemetry(): void {
    if (!this.connected) {
      this.log('warn', 'Cannot publish: Not connected to broker');
      return;
    }

    const message = this.generateMessage();
    const payload = JSON.stringify(message);
    const topic = this.mqttConfig.topic.replace('{deviceId}', this.device.id);
    
    // Simulate publish
    this.log('debug', `Publishing to topic: ${topic}`, {
      topic,
      qos: this.mqttConfig.qos,
      payloadSize: payload.length,
    });

    // Simulate network latency
    const latencyMs = Math.random() * 50 + 10; // 10-60ms
    const shouldFail = Math.random() < 0.01; // 1% failure rate

    setTimeout(() => {
      if (shouldFail) {
        this.log('error', 'Publish failed: Network timeout');
        this.onStatus('running', message, 'Publish timeout');
      } else {
        this.log('info', `Published message (${payload.length} bytes, QoS ${this.mqttConfig.qos})`);
        this.onStatus('running', message);
      }
    }, latencyMs);
  }
}

/**
 * Get default MQTT configuration
 */
export function getDefaultMqttConfig(deviceId: string): MqttConfig {
  return {
    brokerUrl: 'mqtt://localhost',
    port: 1883,
    clientId: `device-${deviceId}`,
    topic: `sensormine/devices/{deviceId}/telemetry`,
    qos: 1,
    useTls: false,
  };
}
