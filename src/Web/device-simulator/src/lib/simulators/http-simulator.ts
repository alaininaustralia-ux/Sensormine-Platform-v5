import { DeviceConfig, HttpConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';

/**
 * HTTP/REST Protocol Simulator
 * Sends telemetry data via HTTP POST/PUT requests
 */
export class HttpSimulator extends BaseProtocolSimulator {
  private httpConfig: HttpConfig;

  constructor(
    device: DeviceConfig,
    config: HttpConfig,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    super(device, config, onLog, onStatus);
    this.httpConfig = config;
  }

  async start(): Promise<void> {
    this.log('info', `Starting HTTP simulator for device ${this.device.name}`);
    this.log('info', `Endpoint: ${this.httpConfig.endpoint}`);
    this.onStatus('running');
    this.startInterval();
  }

  async stop(): Promise<void> {
    this.log('info', `Stopping HTTP simulator for device ${this.device.name}`);
    this.stopInterval();
    this.onStatus('idle');
  }

  protected sendTelemetry(): void {
    const message = this.generateMessage();
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.httpConfig.headers,
    };

    // Add authentication
    if (this.httpConfig.authType === 'bearer' && this.httpConfig.authValue) {
      headers['Authorization'] = `Bearer ${this.httpConfig.authValue}`;
    } else if (this.httpConfig.authType === 'apikey' && this.httpConfig.authValue) {
      headers['X-API-Key'] = this.httpConfig.authValue;
    } else if (this.httpConfig.authType === 'basic' && this.httpConfig.authValue) {
      headers['Authorization'] = `Basic ${btoa(this.httpConfig.authValue)}`;
    }

    // Simulate the HTTP request (in a real app, this would use fetch)
    // For the simulator UI, we'll log the request details
    this.log('debug', `HTTP ${this.httpConfig.method} request`, {
      url: this.httpConfig.endpoint,
      method: this.httpConfig.method,
      headers: { ...headers, Authorization: headers['Authorization'] ? '[REDACTED]' : undefined },
      body: message,
    });

    // Simulate network latency and occasional failures
    const latencyMs = Math.random() * 100 + 50; // 50-150ms
    const shouldFail = Math.random() < 0.02; // 2% failure rate

    setTimeout(() => {
      if (shouldFail) {
        const errorCode = Math.random() < 0.5 ? 500 : 503;
        this.log('error', `HTTP request failed: ${errorCode} ${errorCode === 500 ? 'Internal Server Error' : 'Service Unavailable'}`);
        this.onStatus('running', message, `HTTP ${errorCode}`);
      } else {
        this.log('info', `HTTP request successful: 200 OK (${Math.round(latencyMs)}ms)`);
        this.onStatus('running', message);
      }
    }, latencyMs);
  }
}

/**
 * Get default HTTP configuration
 */
export function getDefaultHttpConfig(): HttpConfig {
  return {
    endpoint: 'http://localhost:5000/api/v1/telemetry',
    method: 'POST',
    headers: {},
    authType: 'none',
  };
}
