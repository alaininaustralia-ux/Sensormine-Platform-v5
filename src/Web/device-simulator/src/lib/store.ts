import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  DeviceConfig, 
  SimulationLog, 
  SimulationInstance, 
  ProtocolType,
  SensorConfig,
  DEFAULT_SENSOR_CONFIGS,
} from '@/types';
import { generateId, generateSerialNumber } from './data-generator';
import { 
  getDefaultProtocolConfig, 
  ProtocolConfig 
} from './simulators';

const MAX_LOGS = 500;

interface SimulatorStore {
  // State
  devices: DeviceConfig[];
  protocolConfigs: Map<string, ProtocolConfig>;
  simulations: Map<string, SimulationInstance>;
  logs: SimulationLog[];
  
  // Device actions
  addDevice: (device: Omit<DeviceConfig, 'id'>) => string;
  updateDevice: (id: string, updates: Partial<DeviceConfig>) => void;
  deleteDevice: (id: string) => void;
  duplicateDevice: (id: string) => string;
  
  // Sensor actions
  addSensor: (deviceId: string, sensor: Omit<SensorConfig, 'id'>) => void;
  updateSensor: (deviceId: string, sensorId: string, updates: Partial<SensorConfig>) => void;
  deleteSensor: (deviceId: string, sensorId: string) => void;
  
  // Protocol config actions
  setProtocolConfig: (deviceId: string, config: ProtocolConfig) => void;
  getProtocolConfig: (deviceId: string) => ProtocolConfig | undefined;
  
  // Simulation actions
  setSimulationStatus: (deviceId: string, status: 'idle' | 'connecting' | 'running' | 'error') => void;
  startAllSimulations: () => Promise<void>;
  stopAllSimulations: () => Promise<void>;
  
  // Utility functions
  addLog: (log: SimulationLog) => void;
  clearLogs: () => void;
  getDeviceLogs: (deviceId: string) => SimulationLog[];
  
  // Quick create helpers
  createSampleDevice: (protocol: ProtocolType) => string;
}

// Helper to serialize/deserialize Maps
const mapReplacer = (_key: string, value: unknown): unknown => {
  if (value instanceof Map) {
    return { __type: 'Map', entries: Array.from(value.entries()) };
  }
  return value;
};

interface SerializedMap {
  __type: 'Map';
  entries: [string, unknown][];
}

function isSerializedMap(value: unknown): value is SerializedMap {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__type' in value &&
    (value as SerializedMap).__type === 'Map' &&
    'entries' in value &&
    Array.isArray((value as SerializedMap).entries)
  );
}

const mapReviver = (_key: string, value: unknown): unknown => {
  if (isSerializedMap(value)) {
    return new Map(value.entries);
  }
  return value;
};

export const useSimulatorStore = create<SimulatorStore>()(
  persist(
    (set, get) => ({
      devices: [],
      protocolConfigs: new Map(),
      simulations: new Map(),
      logs: [],

      // Device actions
      addDevice: (device) => {
        const id = generateId();
        const newDevice: DeviceConfig = {
          ...device,
          id,
        };
        
        set(state => ({
          devices: [...state.devices, newDevice],
        }));
        
        // Set default protocol config
        get().setProtocolConfig(id, getDefaultProtocolConfig(device.protocol, id));
        
        return id;
      },

      updateDevice: (id, updates) => {
        set(state => ({
          devices: state.devices.map(d => 
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      deleteDevice: (id) => {
        // Stop simulation if running
        const simulation = get().simulations.get(id);
        if (simulation && simulation.status === 'running') {
          get().setSimulationStatus(id, 'idle');
        }
        
        set(state => {
          const newConfigs = new Map(state.protocolConfigs);
          newConfigs.delete(id);
          
          const newSimulations = new Map(state.simulations);
          newSimulations.delete(id);
          
          return {
            devices: state.devices.filter(d => d.id !== id),
            protocolConfigs: newConfigs,
            simulations: newSimulations,
          };
        });
      },

      duplicateDevice: (id) => {
        const device = get().devices.find(d => d.id === id);
        if (!device) throw new Error(`Device ${id} not found`);
        
        const newId = generateId();
        const newDevice: DeviceConfig = {
          ...device,
          id: newId,
          name: `${device.name} (Copy)`,
          sensors: device.sensors.map(s => ({ ...s, id: generateId() })),
        };
        
        set(state => ({
          devices: [...state.devices, newDevice],
        }));
        
        // Copy protocol config
        const config = get().protocolConfigs.get(id);
        if (config) {
          get().setProtocolConfig(newId, { ...config });
        }
        
        return newId;
      },

      // Sensor actions
      addSensor: (deviceId, sensor) => {
        const id = generateId();
        const newSensor: SensorConfig = { ...sensor, id };
        
        set(state => ({
          devices: state.devices.map(d => 
            d.id === deviceId 
              ? { ...d, sensors: [...d.sensors, newSensor] }
              : d
          ),
        }));
      },

      updateSensor: (deviceId, sensorId, updates) => {
        set(state => ({
          devices: state.devices.map(d => 
            d.id === deviceId 
              ? {
                  ...d,
                  sensors: d.sensors.map(s => 
                    s.id === sensorId ? { ...s, ...updates } : s
                  ),
                }
              : d
          ),
        }));
      },

      deleteSensor: (deviceId, sensorId) => {
        set(state => ({
          devices: state.devices.map(d => 
            d.id === deviceId 
              ? { ...d, sensors: d.sensors.filter(s => s.id !== sensorId) }
              : d
          ),
        }));
      },

      // Protocol config actions
      setProtocolConfig: (deviceId, config) => {
        set(state => {
          const newConfigs = new Map(state.protocolConfigs);
          newConfigs.set(deviceId, config);
          return { protocolConfigs: newConfigs };
        });
      },

      getProtocolConfig: (deviceId) => {
        return get().protocolConfigs.get(deviceId);
      },

      // Simulation actions (now handled by Simulation API backend)
      setSimulationStatus: (deviceId, status) => {
        set(state => {
          const newSimulations = new Map(state.simulations);
          const existing = newSimulations.get(deviceId);
          
          if (existing) {
            newSimulations.set(deviceId, { ...existing, status });
          } else {
            newSimulations.set(deviceId, {
              deviceId,
              status,
              startedAt: new Date(),
              messageCount: 0,
              errorCount: 0,
            });
          }
          
          return { simulations: newSimulations };
        });
      },

      startAllSimulations: async () => {
        const { devices, getProtocolConfig } = get();
        
        for (const device of devices) {
          if (!device.enabled) continue;
          
          try {
            get().setSimulationStatus(device.id, 'connecting');
            
            const protocolConfig = getProtocolConfig(device.id);
            const mqttTopic = protocolConfig && 'topic' in protocolConfig 
              ? (protocolConfig as { topic: string }).topic 
              : `devices/${device.id}/telemetry`;
            
            const { simulationApi } = await import('./simulation-api');
            await simulationApi.startDevice({
              deviceId: device.id,
              name: device.name,
              protocol: device.protocol,
              interval: device.intervalMs,
              topic: mqttTopic,
              sensors: device.sensors.map(s => ({
                name: s.name,
                sensorType: s.type,
                minValue: s.minValue,
                maxValue: s.maxValue,
                unit: s.unit,
              })),
            });
            
            get().setSimulationStatus(device.id, 'running');
          } catch (error) {
            get().setSimulationStatus(device.id, 'error');
            console.error(`Failed to start ${device.name}:`, error);
          }
        }
      },

      stopAllSimulations: async () => {
        const { devices } = get();
        const { simulationApi } = await import('./simulation-api');
        
        for (const device of devices) {
          const simulation = get().simulations.get(device.id);
          if (simulation?.status === 'running') {
            try {
              await simulationApi.stopDevice(device.id);
              get().setSimulationStatus(device.id, 'idle');
            } catch (error) {
              console.error(`Failed to stop ${device.name}:`, error);
            }
          }
        }
      },

      // Utility functions
      addLog: (log) => {
        set(state => {
          const newLogs = [log, ...state.logs].slice(0, MAX_LOGS);
          return { logs: newLogs };
        });
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      getDeviceLogs: (deviceId) => {
        return get().logs.filter(l => l.deviceId === deviceId);
      },

      // Quick create helpers
      createSampleDevice: (protocol) => {
        const serialNumber = generateSerialNumber();
        const device: Omit<DeviceConfig, 'id'> = {
          name: `${protocol.toUpperCase()} Device ${serialNumber}`,
          description: `Sample ${protocol} device for testing`,
          protocol,
          sensors: [
            {
              id: generateId(),
              name: 'Temperature',
              ...DEFAULT_SENSOR_CONFIGS.temperature,
            },
            {
              id: generateId(),
              name: 'Humidity',
              ...DEFAULT_SENSOR_CONFIGS.humidity,
            },
            {
              id: generateId(),
              name: 'Pressure',
              ...DEFAULT_SENSOR_CONFIGS.pressure,
            },
          ],
          intervalMs: 5000,
          enabled: true,
        };
        
        return get().addDevice(device);
      },
    }),
    {
      name: 'device-simulator-storage',
      storage: createJSONStorage(() => localStorage, {
        replacer: mapReplacer,
        reviver: mapReviver,
      }),
      partialize: (state) => ({
        devices: state.devices,
        protocolConfigs: state.protocolConfigs,
      }),
    }
  )
);
