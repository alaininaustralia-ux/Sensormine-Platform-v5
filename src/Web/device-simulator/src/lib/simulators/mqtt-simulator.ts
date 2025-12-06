import { DeviceConfig, MqttConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';
import { generateFromSchema, generateContinuousValue, extractSensorsFromSchema, JsonSchema } from '../schema-generator';

/**
 * MQTT Protocol Simulator
 * Publishes telemetry data to MQTT broker
 * Supports both sensor-based and JSON Schema-based generation
 * Note: In browser environment, this simulates MQTT behavior
 */
export class MqttSimulator extends BaseProtocolSimulator {
  private mqttConfig: MqttConfig;
  private connected = false;
  private schema?: JsonSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private schemaSensors?: any[];

  constructor(
    device: DeviceConfig,
    config: MqttConfig,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    super(device, config, onLog, onStatus);
    this.mqttConfig = config;
    
    // Check if this is a schema-based device
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((config as any).schema) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.schema = (config as any).schema;
      if (this.schema) {
        this.schemaSensors = extractSensorsFromSchema(this.schema);
        this.log('info', 'Schema-based device detected');
      }
    }
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

    // Use schema-based generation if available, otherwise use sensor-based
    const message = this.schema ? this.generateSchemaMessage() : this.generateMessage();
    const topicTemplate = this.mqttConfig.topic || 'devices/{deviceId}/telemetry';
    const topic = topicTemplate.replace('{deviceId}', this.device.id);
    
    // Actually publish to MQTT via Simulation.API
    this.log('debug', `Publishing to topic: ${topic}`, {
      topic,
      qos: this.mqttConfig.qos,
      payloadSize: JSON.stringify(message).length,
    });

    // Import and use the simulation API to publish real MQTT messages
    import('../simulation-api').then(({ simulationApi }) => {
      simulationApi.publish({
        topic,
        payload: message as Record<string, unknown>,
        deviceId: this.device.id,
      })
      .then(() => {
        this.log('info', `Published message (${JSON.stringify(message).length} bytes, QoS ${this.mqttConfig.qos})`);
        this.onStatus('running', message);
      })
      .catch((error) => {
        this.log('error', `Publish failed: ${error.message}`);
        this.onStatus('running', message, `Error: ${error.message}`);
      });
    }).catch((error) => {
      this.log('error', `Failed to load simulation API: ${error.message}`);
      this.onStatus('running', message, 'API Error');
    });
  }

  /**
   * Generate message from JSON Schema with continuous values
   */
  private generateSchemaMessage(): Record<string, unknown> {
    if (!this.schema) {
      return this.generateMessage() as unknown as Record<string, unknown>;
    }

    const baseMessage = generateFromSchema(this.schema) as Record<string, unknown>;

    // Override with continuous values for simulatable sensors
    if (this.schemaSensors && this.schemaSensors.length > 0) {
      for (const sensor of this.schemaSensors) {
        if (baseMessage[sensor.path] !== undefined) {
          baseMessage[sensor.path] = generateContinuousValue(sensor, this.device.id);
        }
      }
    }

    // Ensure deviceId and timestamp are set correctly
    if (baseMessage.deviceId === undefined) {
      baseMessage.deviceId = this.device.id;
    }
    if (baseMessage.timestamp === undefined || this.schema.properties?.timestamp?.format === 'date-time') {
      baseMessage.timestamp = new Date().toISOString();
    }

    return baseMessage;
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
    topic: `devices/{deviceId}/telemetry`,
    qos: 1,
    useTls: false,
  };
}
