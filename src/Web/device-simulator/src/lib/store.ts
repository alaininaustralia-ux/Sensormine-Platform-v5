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
  createSimulator, 
  getDefaultProtocolConfig, 
  ProtocolConfig, 
  BaseProtocolSimulator 
} from './simulators';

const MAX_LOGS = 500;

interface SimulatorStore {
  // State
  devices: DeviceConfig[];
  protocolConfigs: Map<string, ProtocolConfig>;
  simulations: Map<string, SimulationInstance>;
  simulators: Map<string, BaseProtocolSimulator>;
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
  startSimulation: (deviceId: string) => Promise<void>;
  stopSimulation: (deviceId: string) => Promise<void>;
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
      simulators: new Map(),
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
          get().stopSimulation(id);
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

      // Simulation actions
      startSimulation: async (deviceId) => {
        const device = get().devices.find(d => d.id === deviceId);
        if (!device) throw new Error(`Device ${deviceId} not found`);
        
        const config = get().protocolConfigs.get(deviceId);
        if (!config) throw new Error(`No protocol config for device ${deviceId}`);
        
        // Create simulation instance
        const simulation: SimulationInstance = {
          deviceId,
          status: 'connecting',
          startedAt: new Date(),
          messageCount: 0,
          errorCount: 0,
        };
        
        set(state => {
          const newSimulations = new Map(state.simulations);
          newSimulations.set(deviceId, simulation);
          return { simulations: newSimulations };
        });
        
        // Create simulator
        const simulator = createSimulator(
          device,
          config,
          (log) => get().addLog(log),
          (status, message, error) => {
            set(state => {
              const newSimulations = new Map(state.simulations);
              const sim = newSimulations.get(deviceId);
              if (sim) {
                const updated: SimulationInstance = {
                  ...sim,
                  status,
                  lastMessage: message || sim.lastMessage,
                  lastError: error,
                  messageCount: message ? sim.messageCount + 1 : sim.messageCount,
                  errorCount: error ? sim.errorCount + 1 : sim.errorCount,
                };
                newSimulations.set(deviceId, updated);
              }
              return { simulations: newSimulations };
            });
          }
        );
        
        // Store simulator instance (non-persistent)
        const simulators = get().simulators;
        simulators.set(deviceId, simulator);
        
        // Start simulation
        await simulator.start();
      },

      stopSimulation: async (deviceId) => {
        const simulator = get().simulators.get(deviceId);
        if (simulator) {
          await simulator.stop();
          get().simulators.delete(deviceId);
        }
        
        set(state => {
          const newSimulations = new Map(state.simulations);
          const sim = newSimulations.get(deviceId);
          if (sim) {
            newSimulations.set(deviceId, { ...sim, status: 'idle' });
          }
          return { simulations: newSimulations };
        });
      },

      startAllSimulations: async () => {
        const devices = get().devices.filter(d => d.enabled);
        for (const device of devices) {
          const simulation = get().simulations.get(device.id);
          if (!simulation || simulation.status === 'idle') {
            await get().startSimulation(device.id);
          }
        }
      },

      stopAllSimulations: async () => {
        const simulators = get().simulators;
        const deviceIds = Array.from(simulators.keys());
        for (const deviceId of deviceIds) {
          await get().stopSimulation(deviceId);
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
