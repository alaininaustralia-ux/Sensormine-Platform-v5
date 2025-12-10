/**
 * Data Simulator Component for Devices
 * 
 * Starts/stops background simulations that generate realistic telemetry data
 * based on device schemas and send it via MQTT to test the platform data flow.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  PlayIcon,
  ZapIcon,
  ActivityIcon,
  Square as StopIcon,
} from 'lucide-react';
import { Device } from '@/lib/api/devices';
import { getSchema, Schema } from '@/lib/api/schemas';
import { startSimulation, stopSimulation, getActiveSimulations, SimulatedSensor } from '@/lib/api/simulation';

type TopicStrategy = 'multi-tenant' | 'device';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface JsonSchemaProperty {
  type?: string | string[];
  minimum?: number;
  maximum?: number;
  unit?: string;
  properties?: Record<string, JsonSchemaProperty>; // For nested objects like location
}

interface JsonSchemaDefinition {
  properties?: Record<string, JsonSchemaProperty>;
}

function normalizeSchemaType(type?: string | string[]): 'number' | 'boolean' | 'string' | 'object' {
  const values = Array.isArray(type) ? type : type ? [type] : [];
  if (values.includes('number') || values.includes('integer')) {
    return 'number';
  }
  if (values.includes('boolean')) {
    return 'boolean';
  }
  if (values.includes('object')) {
    return 'object';
  }
  return 'string';
}

function getSchemaDefinition(schema: Schema): JsonSchemaDefinition | null {
  const jsonSchema =
    schema.currentVersion?.jsonSchema ||
    schema.versions?.find(version => version.isActive)?.jsonSchema ||
    schema.versions?.[0]?.jsonSchema;

  if (!jsonSchema) {
    return null;
  }

  try {
    return JSON.parse(jsonSchema) as JsonSchemaDefinition;
  } catch (error) {
    console.warn('Failed to parse schema JSON:', error);
    return null;
  }
}

function computeTopic(device: Device, strategy: TopicStrategy): string {
  const tenantId = device.tenantId || DEFAULT_TENANT_ID;

  if (strategy === 'multi-tenant') {
    return `sensormine/tenants/${tenantId}/devices/${device.deviceId}/telemetry`;
  }

  return `devices/${device.deviceId}/telemetry`;
}

interface DataGeneratorProps {
  device: Device;
  onClose: () => void;
  onSimulationStart?: (deviceId: string) => void;
  onSimulationStop?: (deviceId: string) => void;
}

interface SimulatorState {
  interval: number; // seconds
  isRunning: boolean;
  topicStrategy: TopicStrategy;
}

export function DataGenerator({ device, onClose, onSimulationStart, onSimulationStop }: DataGeneratorProps) {
  const [state, setState] = useState<SimulatorState>({
    interval: 5,
    isRunning: false,
    topicStrategy: 'multi-tenant',
  });
  
  const [deviceSchema, setDeviceSchema] = useState<Schema | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

  // Load device schema
  useEffect(() => {
    const loadDeviceSchema = async () => {
      if (!device.schemaId) {
        addLog('Device does not have an assigned schema.');
        return;
      }

      try {
        const schema = await getSchema(device.schemaId);
        setDeviceSchema(schema);
        addLog(`Loaded schema: ${schema.name}`);
      } catch (error) {
        console.error('Failed to load device schema:', error);
        addLog('Failed to load device schema.');
      }
    };
    loadDeviceSchema();
  }, [device.schemaId, addLog]);

  // Check if simulation is already running
  useEffect(() => {
    const checkActiveSimulation = async () => {
      try {
        const response = await getActiveSimulations();
        const isRunning = response.data.some(d => d.deviceId === device.deviceId);
        if (isRunning) {
          setState(prev => ({ ...prev, isRunning: true }));
          addLog('Simulation is already running for this device');
        }
      } catch (error) {
        console.error('Failed to check active simulations:', error);
      }
    };
    checkActiveSimulation();
  }, [device.deviceId, addLog]);

  const handleTopicStrategyChange = useCallback((strategy: TopicStrategy) => {
    setState(prev => ({
      ...prev,
      topicStrategy: strategy,
    }));
  }, []);

  // Build sensor list from schema for simulation API
  const buildSensorList = useCallback((): SimulatedSensor[] => {
    if (!deviceSchema) return [];

    const schemaDefinition = getSchemaDefinition(deviceSchema);
    const properties = schemaDefinition?.properties;
    if (!properties) return [];

    return Object.entries(properties)
      .filter(([name]) => !['timestamp', 'deviceId', 'tenantId'].includes(name))
      .map(([name, prop]) => ({
        name,
        sensorType: normalizeSchemaType(prop.type),
        minValue: prop.minimum,
        maxValue: prop.maximum,
        unit: prop.unit,
      }));
  }, [deviceSchema]);

  const startSimulationHandler = useCallback(async () => {
    if (!deviceSchema) {
      addLog('No schema loaded for device.');
      return;
    }

    setIsStarting(true);
    const topic = computeTopic(device, state.topicStrategy);
    const sensors = buildSensorList();

    try {
      addLog(`Starting simulation for device ${device.name}...`);
      addLog(`Topic: ${topic}`);
      addLog(`Interval: ${state.interval}s`);
      addLog(`Sensors: ${sensors.length}`);

      await startSimulation({
        deviceId: device.deviceId,
        name: device.name,
        protocol: 'MQTT',
        interval: state.interval * 1000, // Convert seconds to milliseconds
        topic,
        sensors,
      });

      setState(prev => ({ ...prev, isRunning: true }));
      addLog('✓ Simulation started successfully');
      
      if (onSimulationStart) {
        onSimulationStart(device.id);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // If already running, update state instead of showing error
      if (errorMsg.includes('already running')) {
        setState(prev => ({ ...prev, isRunning: true }));
        addLog('ℹ Simulation is already running for this device');
        if (onSimulationStart) {
          onSimulationStart(device.id);
        }
      } else {
        addLog(`✗ Failed to start simulation: ${errorMsg}`);
        console.error('Simulation start error:', error);
      }
    } finally {
      setIsStarting(false);
    }
  }, [device, deviceSchema, state.interval, state.topicStrategy, buildSensorList, addLog, onSimulationStart]);

  const stopSimulationHandler = useCallback(async () => {
    setIsStopping(true);

    try {
      addLog(`Stopping simulation for device ${device.name}...`);
      
      await stopSimulation(device.deviceId);

      setState(prev => ({ ...prev, isRunning: false }));
      addLog('✓ Simulation stopped successfully');
      
      if (onSimulationStop) {
        onSimulationStop(device.id);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`✗ Failed to stop simulation: ${errorMsg}`);
      console.error('Simulation stop error:', error);
    } finally {
      setIsStopping(false);
    }
  }, [device, addLog, onSimulationStop]);



  const resolvedTopic = useMemo(() => {
    return computeTopic(device, state.topicStrategy);
  }, [device, state.topicStrategy]);

  const schemaFieldCount = useMemo(() => {
    if (!deviceSchema) return 0;
    const schemaDefinition = getSchemaDefinition(deviceSchema);
    const properties = schemaDefinition?.properties;
    if (!properties) return 0;
    return Object.keys(properties).filter(k => k !== 'timestamp' && k !== 'deviceId' && k !== 'tenantId').length;
  }, [deviceSchema]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZapIcon className="w-5 h-5" />
            <CardTitle>Device Simulator</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <CardDescription>
          Start/stop background simulation for {device.name} based on its schema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Interval (seconds)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="3600"
              value={state.interval}
              onChange={(e) => setState(prev => ({ ...prev, interval: Number(e.target.value) }))}
              disabled={state.isRunning}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-strategy">Topic Strategy</Label>
            <Select
              value={state.topicStrategy}
              onValueChange={(value) => handleTopicStrategyChange(value as TopicStrategy)}
              disabled={state.isRunning}
            >
              <SelectTrigger id="topic-strategy">
                <SelectValue placeholder="Select topic strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multi-tenant">Multi-tenant (recommended)</SelectItem>
                <SelectItem value="device">Device-only (legacy)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Multi-tenant topics include the tenant GUID for proper data routing.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mqtt-topic">MQTT Topic</Label>
          <Input
            id="mqtt-topic"
            readOnly
            value={resolvedTopic}
            className="font-mono text-xs"
          />
        </div>

        {/* Schema Info */}
        {deviceSchema && (
          <div className="space-y-2">
            <Label>Schema Configuration</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">{deviceSchema.name}</div>
              <div className="text-xs text-muted-foreground">{deviceSchema.description}</div>
              <div className="text-xs mt-2">
                <strong>Fields:</strong> {schemaFieldCount} telemetry fields
              </div>
            </div>
          </div>
        )}

        {!deviceSchema && (
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">
              No schema assigned to this device. Please assign a schema to enable simulation.
            </div>
          </div>
        )}

        {/* Status and Controls */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className={`w-4 h-4 ${state.isRunning ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {state.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {state.isRunning ? (
              <Button 
                onClick={stopSimulationHandler} 
                variant="destructive" 
                size="sm"
                disabled={isStopping}
              >
                <StopIcon className="w-4 h-4 mr-1" />
                {isStopping ? 'Stopping...' : 'Stop Simulation'}
              </Button>
            ) : (
              <Button 
                onClick={startSimulationHandler} 
                disabled={!deviceSchema || isStarting}
                size="sm"
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                {isStarting ? 'Starting...' : 'Start Simulation'}
              </Button>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-2">
          <Label>Activity Log</Label>
          <div className="h-32 p-2 bg-muted rounded-md overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No activity yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
