import { DeviceConfig, ModbusConfig } from '@/types';
import { BaseProtocolSimulator, LogCallback, StatusCallback } from './base-simulator';

/**
 * Modbus TCP Protocol Simulator
 * Simulates Modbus register read/write operations
 */
export class ModbusSimulator extends BaseProtocolSimulator {
  private modbusConfig: ModbusConfig;
  private connected = false;
  private transactionId = 0;

  constructor(
    device: DeviceConfig,
    config: ModbusConfig,
    onLog: LogCallback,
    onStatus: StatusCallback
  ) {
    super(device, config, onLog, onStatus);
    this.modbusConfig = config;
  }

  async start(): Promise<void> {
    this.log('info', `Starting Modbus TCP simulator for device ${this.device.name}`);
    this.log('info', `Host: ${this.modbusConfig.host}:${this.modbusConfig.port}`);
    this.log('info', `Unit ID: ${this.modbusConfig.unitId}`);
    this.log('info', `Register Type: ${this.modbusConfig.registerType}`);
    this.log('info', `Start Address: ${this.modbusConfig.startAddress}`);
    
    this.onStatus('connecting');
    
    // Simulate TCP connection
    await this.simulateConnect();
    
    if (this.connected) {
      this.onStatus('running');
      this.startInterval();
    }
  }

  async stop(): Promise<void> {
    this.log('info', `Stopping Modbus TCP simulator for device ${this.device.name}`);
    this.stopInterval();
    
    if (this.connected) {
      this.log('info', 'Closing TCP connection...');
      await new Promise(resolve => setTimeout(resolve, 50));
      this.connected = false;
      this.log('info', 'TCP connection closed');
    }
    
    this.onStatus('idle');
  }

  private async simulateConnect(): Promise<void> {
    this.log('info', `Establishing TCP connection to ${this.modbusConfig.host}:${this.modbusConfig.port}...`);
    
    // Simulate TCP handshake delay
    const connectDelay = Math.random() * 100 + 20;
    await new Promise(resolve => setTimeout(resolve, connectDelay));
    
    // Simulate connection failures (4%)
    if (Math.random() < 0.04) {
      const errorMsg = 'TCP connection failed: Connection refused';
      this.log('error', errorMsg);
      this.onStatus('error', undefined, errorMsg);
      this.connected = false;
      return;
    }
    
    this.connected = true;
    this.log('info', `TCP connected (${Math.round(connectDelay)}ms)`);
  }

  private getModbusFunctionCode(): number {
    switch (this.modbusConfig.registerType) {
      case 'coil': return 0x01; // Read Coils
      case 'input': return 0x04; // Read Input Registers
      case 'holding': return 0x03; // Read Holding Registers
      default: return 0x03;
    }
  }

  protected sendTelemetry(): void {
    if (!this.connected) {
      this.log('warn', 'Cannot send: TCP not connected');
      return;
    }

    const message = this.generateMessage();
    const functionCode = this.getModbusFunctionCode();
    this.transactionId++;
    
    // Simulate Modbus request/response
    const registerCount = this.device.sensors.length * 2; // 2 registers per sensor (32-bit float)
    
    // Build Modbus TCP frame info
    const modbusFrame = {
      transactionId: this.transactionId,
      protocolId: 0x0000, // Modbus protocol
      unitId: this.modbusConfig.unitId,
      functionCode,
      startAddress: this.modbusConfig.startAddress,
      registerCount,
    };

    this.log('debug', `Modbus request (Transaction: ${this.transactionId})`, {
      ...modbusFrame,
      functionName: this.getFunctionName(functionCode),
    });

    // Simulate Modbus response latency
    const latencyMs = Math.random() * 30 + 10; // 10-40ms (industrial network)
    const shouldFail = Math.random() < 0.02; // 2% failure rate

    setTimeout(() => {
      if (shouldFail) {
        const exceptionCode = Math.random() < 0.5 ? 0x02 : 0x04;
        const exceptionName = exceptionCode === 0x02 ? 'ILLEGAL_DATA_ADDRESS' : 'SLAVE_DEVICE_FAILURE';
        this.log('error', `Modbus exception: ${exceptionName} (0x${exceptionCode.toString(16).padStart(2, '0')})`);
        this.onStatus('running', message, `Modbus exception: ${exceptionName}`);
      } else {
        // Log successful response with register values
        const registerValues = message.sensors.map((s, i) => ({
          address: this.modbusConfig.startAddress + (i * 2),
          value: s.value,
          raw: this.floatToRegisters(s.value),
        }));
        
        this.log('info', `Modbus response received (${registerCount} registers, ${Math.round(latencyMs)}ms)`);
        this.log('debug', 'Register values', registerValues);
        this.onStatus('running', message);
      }
    }, latencyMs);
  }

  private getFunctionName(code: number): string {
    const names: Record<number, string> = {
      0x01: 'Read Coils',
      0x02: 'Read Discrete Inputs',
      0x03: 'Read Holding Registers',
      0x04: 'Read Input Registers',
      0x05: 'Write Single Coil',
      0x06: 'Write Single Register',
      0x0F: 'Write Multiple Coils',
      0x10: 'Write Multiple Registers',
    };
    return names[code] || `Unknown (0x${code.toString(16)})`;
  }

  private floatToRegisters(value: number): [number, number] {
    // Convert float to two 16-bit registers (big-endian)
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, false);
    return [view.getUint16(0, false), view.getUint16(2, false)];
  }
}

/**
 * Get default Modbus configuration
 */
export function getDefaultModbusConfig(): ModbusConfig {
  return {
    host: '192.168.1.100',
    port: 502,
    unitId: 1,
    registerType: 'holding',
    startAddress: 0,
  };
}
