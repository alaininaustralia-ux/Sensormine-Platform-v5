import { DeviceConfig, WebSocketConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';

/**
 * WebSocket Protocol Simulator
 * Streams telemetry data via WebSocket connection
 */
export class WebSocketSimulator extends BaseProtocolSimulator {
  private wsConfig: WebSocketConfig;
  private connected = false;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    device: DeviceConfig,
    config: WebSocketConfig,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    super(device, config, onLog, onStatus);
    this.wsConfig = config;
  }

  async start(): Promise<void> {
    this.log('info', `Starting WebSocket simulator for device ${this.device.name}`);
    this.log('info', `Server URL: ${this.wsConfig.url}`);
    
    this.onStatus('connecting');
    
    // Simulate WebSocket connection
    await this.simulateConnect();
    
    if (this.connected) {
      this.onStatus('running');
      this.startInterval();
      this.startHeartbeat();
    }
  }

  async stop(): Promise<void> {
    this.log('info', `Stopping WebSocket simulator for device ${this.device.name}`);
    this.stopInterval();
    this.stopHeartbeat();
    
    if (this.connected) {
      this.log('info', 'Closing WebSocket connection...');
      // Simulate close handshake
      await new Promise(resolve => setTimeout(resolve, 50));
      this.connected = false;
      this.log('info', 'WebSocket connection closed (code: 1000, reason: Normal closure)');
    }
    
    this.onStatus('idle');
  }

  private async simulateConnect(): Promise<void> {
    this.log('info', 'Opening WebSocket connection...');
    this.log('debug', 'Performing WebSocket handshake...');
    
    // Simulate connection delay (50-200ms)
    const connectDelay = Math.random() * 150 + 50;
    await new Promise(resolve => setTimeout(resolve, connectDelay));
    
    // Simulate occasional connection failures (3%)
    if (Math.random() < 0.03) {
      const errorMsg = 'WebSocket connection failed: Unable to establish connection';
      this.log('error', errorMsg);
      this.onStatus('error', undefined, errorMsg);
      this.connected = false;
      return;
    }
    
    this.connected = true;
    this.log('info', `WebSocket connected (${Math.round(connectDelay)}ms)`);
    this.log('debug', 'Upgrade: websocket, Connection: Upgrade');
  }

  private startHeartbeat(): void {
    if (this.wsConfig.heartbeatInterval > 0) {
      this.heartbeatIntervalId = setInterval(() => {
        if (this.connected) {
          this.log('debug', 'Sending heartbeat ping');
          // Simulate pong response
          setTimeout(() => {
            if (this.connected) {
              this.log('debug', 'Received heartbeat pong');
            }
          }, Math.random() * 20 + 5);
        }
      }, this.wsConfig.heartbeatInterval);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  protected sendTelemetry(): void {
    if (!this.connected) {
      this.log('warn', 'Cannot send: WebSocket not connected');
      return;
    }

    const message = this.generateMessage();
    const payload = JSON.stringify(message);
    
    // Simulate WebSocket frame
    this.log('debug', `Sending WebSocket frame (${payload.length} bytes)`, {
      opcode: 0x01, // Text frame
      fin: true,
      masked: true,
      payloadLength: payload.length,
    });

    // Simulate network latency (very low for WebSocket)
    const latencyMs = Math.random() * 20 + 5; // 5-25ms
    const shouldFail = Math.random() < 0.005; // 0.5% failure rate

    setTimeout(() => {
      if (shouldFail) {
        this.log('error', 'WebSocket send failed: Connection reset');
        this.onStatus('running', message, 'Send failed');
      } else {
        this.log('info', `Message sent (${payload.length} bytes)`);
        this.onStatus('running', message);
      }
    }, latencyMs);
  }
}

/**
 * Get default WebSocket configuration
 */
export function getDefaultWebSocketConfig(): WebSocketConfig {
  return {
    url: 'ws://localhost:5000/ws/telemetry',
    reconnectInterval: 5000,
    heartbeatInterval: 30000,
  };
}
