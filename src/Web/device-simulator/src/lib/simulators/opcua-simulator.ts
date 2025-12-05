import { DeviceConfig, OpcUaConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';

/**
 * OPC UA Protocol Simulator
 * Simulates OPC UA node read/subscribe operations
 */
export class OpcUaSimulator extends BaseProtocolSimulator {
  private opcuaConfig: OpcUaConfig;
  private connected = false;
  private sessionId: string | null = null;
  private subscriptionId = 0;
  private sequenceNumber = 0;

  constructor(
    device: DeviceConfig,
    config: OpcUaConfig,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    super(device, config, onLog, onStatus);
    this.opcuaConfig = config;
  }

  async start(): Promise<void> {
    this.log('info', `Starting OPC UA simulator for device ${this.device.name}`);
    this.log('info', `Endpoint: ${this.opcuaConfig.endpointUrl}`);
    this.log('info', `Security Mode: ${this.opcuaConfig.securityMode}`);
    
    this.onStatus('connecting');
    
    // Simulate OPC UA connection handshake
    await this.simulateConnect();
    
    if (this.connected) {
      await this.createSubscription();
      this.onStatus('running');
      this.startInterval();
    }
  }

  async stop(): Promise<void> {
    this.log('info', `Stopping OPC UA simulator for device ${this.device.name}`);
    this.stopInterval();
    
    if (this.connected) {
      // Close subscription
      if (this.subscriptionId > 0) {
        this.log('info', `Deleting subscription: ${this.subscriptionId}`);
        await new Promise(resolve => setTimeout(resolve, 30));
        this.log('info', 'Subscription deleted');
      }
      
      // Close session
      this.log('info', `Closing session: ${this.sessionId}`);
      await new Promise(resolve => setTimeout(resolve, 50));
      this.sessionId = null;
      
      // Close secure channel
      this.log('info', 'Closing secure channel...');
      await new Promise(resolve => setTimeout(resolve, 30));
      this.connected = false;
      this.log('info', 'OPC UA connection closed');
    }
    
    this.onStatus('idle');
  }

  private async simulateConnect(): Promise<void> {
    // Step 1: Get Endpoints
    this.log('info', 'GetEndpoints request...');
    await new Promise(resolve => setTimeout(resolve, 50));
    this.log('debug', 'Received endpoint list', {
      endpoints: [
        { securityMode: 'None', securityPolicy: 'None' },
        { securityMode: 'Sign', securityPolicy: 'Basic256Sha256' },
        { securityMode: 'SignAndEncrypt', securityPolicy: 'Basic256Sha256' },
      ],
    });

    // Step 2: Open Secure Channel
    this.log('info', `Opening secure channel (SecurityMode: ${this.opcuaConfig.securityMode})...`);
    const channelDelay = Math.random() * 100 + 50;
    await new Promise(resolve => setTimeout(resolve, channelDelay));
    
    // Simulate connection failures (3%)
    if (Math.random() < 0.03) {
      const errorMsg = 'OPC UA connection failed: BadSecurityChecksFailed';
      this.log('error', errorMsg);
      this.onStatus('error', undefined, errorMsg);
      this.connected = false;
      return;
    }
    
    this.log('info', `Secure channel opened (${Math.round(channelDelay)}ms)`);

    // Step 3: Create Session
    this.log('info', 'Creating session...');
    const sessionDelay = Math.random() * 50 + 30;
    await new Promise(resolve => setTimeout(resolve, sessionDelay));
    
    this.sessionId = `ns=0;i=${Math.floor(Math.random() * 100000 + 1000)}`;
    this.log('info', `Session created: ${this.sessionId}`);

    // Step 4: Activate Session
    this.log('info', 'Activating session...');
    await new Promise(resolve => setTimeout(resolve, 30));
    this.log('info', 'Session activated');

    this.connected = true;
  }

  private async createSubscription(): Promise<void> {
    this.log('info', 'Creating subscription...');
    await new Promise(resolve => setTimeout(resolve, 30));
    
    this.subscriptionId = Math.floor(Math.random() * 10000) + 1;
    this.log('info', `Subscription created: ${this.subscriptionId}`);
    
    // Create monitored items for each sensor
    const nodeIds = this.device.sensors.map((s, i) => 
      this.opcuaConfig.nodeIds[i] || `ns=2;s=Sensor_${s.name.replace(/\s+/g, '_')}`
    );
    
    this.log('info', `Creating ${nodeIds.length} monitored items...`);
    await new Promise(resolve => setTimeout(resolve, 20));
    
    this.log('debug', 'Monitored items created', {
      subscriptionId: this.subscriptionId,
      items: nodeIds.map((nodeId, i) => ({
        itemId: i + 1,
        nodeId,
        samplingInterval: this.device.intervalMs,
        queueSize: 10,
      })),
    });
  }

  protected sendTelemetry(): void {
    if (!this.connected) {
      this.log('warn', 'Cannot publish: OPC UA not connected');
      return;
    }

    const message = this.generateMessage();
    this.sequenceNumber++;
    
    // Simulate data change notification
    const dataChangeItems = message.sensors.map((sensor, i) => ({
      clientHandle: i + 1,
      nodeId: this.opcuaConfig.nodeIds[i] || `ns=2;s=Sensor_${sensor.name.replace(/\s+/g, '_')}`,
      value: {
        value: sensor.value,
        statusCode: sensor.quality === 'good' ? 'Good' : 
                    sensor.quality === 'uncertain' ? 'Uncertain' : 'Bad',
        sourceTimestamp: message.timestamp,
        serverTimestamp: new Date().toISOString(),
      },
      dataType: 'Double',
    }));

    this.log('debug', `PublishResponse (Sequence: ${this.sequenceNumber})`, {
      subscriptionId: this.subscriptionId,
      sequenceNumber: this.sequenceNumber,
      notificationMessage: {
        sequenceNumber: this.sequenceNumber,
        publishTime: new Date().toISOString(),
        dataChangeNotification: {
          monitoredItems: dataChangeItems,
        },
      },
    });

    // Simulate network latency
    const latencyMs = Math.random() * 40 + 15; // 15-55ms
    const shouldFail = Math.random() < 0.01; // 1% failure rate

    setTimeout(() => {
      if (shouldFail) {
        this.log('error', 'OPC UA publish failed: BadServiceUnsupported');
        this.onStatus('running', message, 'BadServiceUnsupported');
      } else {
        this.log('info', `Data change notification (${dataChangeItems.length} items, seq: ${this.sequenceNumber})`);
        this.onStatus('running', message);
      }
    }, latencyMs);
  }
}

/**
 * Get default OPC UA configuration
 */
export function getDefaultOpcUaConfig(): OpcUaConfig {
  return {
    endpointUrl: 'opc.tcp://localhost:4840',
    securityMode: 'None',
    nodeIds: [
      'ns=2;s=Temperature',
      'ns=2;s=Humidity',
      'ns=2;s=Pressure',
    ],
  };
}
