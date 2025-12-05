import { DeviceConfig, SimulationLog, TelemetryMessage, DeviceStatus } from '@/types';
import { generateTelemetryMessage, resetDeviceValues, generateId } from '../data-generator';

export type LogCallback = (log: SimulationLog) => void;
export type StatusCallback = (status: DeviceStatus, message?: TelemetryMessage, error?: string) => void;

/**
 * Abstract base class for protocol simulators
 */
export abstract class BaseProtocolSimulator {
  protected device: DeviceConfig;
  protected config: unknown;
  protected onLog: LogCallback;
  protected onStatus: StatusCallback;
  protected intervalId: ReturnType<typeof setInterval> | null = null;
  protected isRunning = false;

  constructor(
    device: DeviceConfig,
    config: unknown,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    this.device = device;
    this.config = config;
    this.onLog = onLog;
    this.onStatus = onStatus;
  }

  protected log(level: SimulationLog['level'], message: string, data?: unknown): void {
    this.onLog({
      id: generateId(),
      timestamp: new Date(),
      level,
      deviceId: this.device.id,
      protocol: this.device.protocol,
      message,
      data,
    });
  }

  protected generateMessage(): TelemetryMessage {
    return generateTelemetryMessage(this.device);
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  protected startInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.sendTelemetry();
      }
    }, this.device.intervalMs);
    
    // Send first message immediately
    this.sendTelemetry();
  }

  protected stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    // Reset stored previous values so the next simulation start begins with fresh random values
    // instead of continuing from where the previous simulation left off
    resetDeviceValues(this.device.id, this.device.sensors);
  }

  protected abstract sendTelemetry(): void;
}
