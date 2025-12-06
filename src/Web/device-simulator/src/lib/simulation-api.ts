// Simulation API client

const SIMULATION_API_URL = process.env.NEXT_PUBLIC_SIMULATION_API_URL || 'http://localhost:5200';

export interface SimulatedSensor {
  name: string;
  sensorType: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

export interface SimulatedDevice {
  deviceId: string;
  name: string;
  protocol?: string;
  interval: number;
  topic?: string;
  sensors: SimulatedSensor[];
  customPayload?: Record<string, unknown>;
}

export interface QuickStartRequest {
  deviceId?: string;
  name?: string;
  interval?: number;
}

export interface SimulationLogEntry {
  timestamp: string;
  deviceId: string;
  topic: string;
  payload: string;
  status: string;
}

export const simulationApi = {
  async startDevice(device: SimulatedDevice): Promise<{ message: string }> {
    const response = await fetch(`${SIMULATION_API_URL}/api/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start device');
    }
    
    return response.json();
  },

  async stopDevice(deviceId: string): Promise<{ message: string }> {
    const response = await fetch(`${SIMULATION_API_URL}/api/simulation/stop/${deviceId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop device');
    }
    
    return response.json();
  },

  async getActiveDevices(): Promise<SimulatedDevice[]> {
    const response = await fetch(`${SIMULATION_API_URL}/api/simulation/active`);
    
    if (!response.ok) {
      throw new Error('Failed to get active devices');
    }
    
    return response.json();
  },

  async quickStart(request: QuickStartRequest = {}): Promise<{ message: string; deviceId: string }> {
    const response = await fetch(`${SIMULATION_API_URL}/api/simulation/quick-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to quick start');
    }
    
    return response.json();
  },

  async getLogs(deviceId?: string, limit: number = 50): Promise<SimulationLogEntry[]> {
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    params.append('limit', limit.toString());
    
    const response = await fetch(`${SIMULATION_API_URL}/api/simulation/logs?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to get logs');
    }
    
    return response.json();
  },
};
