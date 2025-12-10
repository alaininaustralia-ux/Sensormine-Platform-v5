'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DeviceConfig, 
  ProtocolType, 
  SensorConfig, 
  SensorType,
  DEFAULT_SENSOR_CONFIGS,
  PROTOCOL_DISPLAY_NAMES,
  MqttConfig,
  HttpConfig,
  WebSocketConfig,
  ModbusConfig,
  OpcUaConfig,
} from '@/types';
import { useSimulatorStore } from '@/lib/store';
import { generateId } from '@/lib/data-generator';
import { getDefaultProtocolConfig, ProtocolConfig } from '@/lib/simulators';

interface DeviceEditorProps {
  device?: DeviceConfig;
  onClose: () => void;
}

export function DeviceEditor({ device, onClose }: DeviceEditorProps) {
  const { addDevice, updateDevice, setProtocolConfig, getProtocolConfig } = useSimulatorStore();
  
  const [formData, setFormData] = useState<Omit<DeviceConfig, 'id'>>(() => 
    device ? {
      name: device.name,
      description: device.description,
      protocol: device.protocol,
      sensors: [...device.sensors],
      intervalMs: device.intervalMs,
      enabled: device.enabled,
    } : {
      name: '',
      description: '',
      protocol: 'mqtt' as ProtocolType,
      sensors: [],
      intervalMs: 5000,
      enabled: true,
    }
  );

  // Temporary placeholder ID used for protocol config before the device is created
  const TEMP_DEVICE_ID = 'pending-device';

  const [protocolConfigState, setProtocolConfigState] = useState<ProtocolConfig>(() => {
    if (device) {
      return getProtocolConfig(device.id) || getDefaultProtocolConfig(device.protocol, device.id);
    }
    return getDefaultProtocolConfig('mqtt', TEMP_DEVICE_ID);
  });

  // Update protocol config when protocol changes
  useEffect(() => {
    if (!device) {
      setProtocolConfigState(getDefaultProtocolConfig(formData.protocol, TEMP_DEVICE_ID));
    }
  }, [formData.protocol, device]);

  const handleAddSensor = () => {
    const newSensor: SensorConfig = {
      id: generateId(),
      name: `Sensor ${formData.sensors.length + 1}`,
      ...DEFAULT_SENSOR_CONFIGS.temperature,
    };
    setFormData(prev => ({
      ...prev,
      sensors: [...prev.sensors, newSensor],
    }));
  };

  const handleUpdateSensor = (index: number, updates: Partial<SensorConfig>) => {
    setFormData(prev => ({
      ...prev,
      sensors: prev.sensors.map((s, i) => 
        i === index ? { ...s, ...updates } : s
      ),
    }));
  };

  const handleSensorTypeChange = (index: number, type: SensorType) => {
    const defaults = DEFAULT_SENSOR_CONFIGS[type];
    handleUpdateSensor(index, {
      type,
      unit: defaults.unit,
      minValue: defaults.minValue,
      maxValue: defaults.maxValue,
      precision: defaults.precision,
      variance: defaults.variance,
    });
  };

  const handleDeleteSensor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sensors: prev.sensors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (device) {
      updateDevice(device.id, formData);
      setProtocolConfig(device.id, protocolConfigState);
    } else {
      const newId = addDevice(formData);
      setProtocolConfig(newId, protocolConfigState);
    }
    
    onClose();
  };

  const renderProtocolConfig = () => {
    switch (formData.protocol) {
      case 'mqtt':
        return <MqttConfigEditor 
          config={protocolConfigState as MqttConfig} 
          onChange={setProtocolConfigState} 
        />;
      case 'http':
        return <HttpConfigEditor 
          config={protocolConfigState as HttpConfig} 
          onChange={setProtocolConfigState} 
        />;
      case 'websocket':
        return <WebSocketConfigEditor 
          config={protocolConfigState as WebSocketConfig} 
          onChange={setProtocolConfigState} 
        />;
      case 'modbus':
        return <ModbusConfigEditor 
          config={protocolConfigState as ModbusConfig} 
          onChange={setProtocolConfigState} 
        />;
      case 'opcua':
        return <OpcUaConfigEditor 
          config={protocolConfigState as OpcUaConfig} 
          onChange={setProtocolConfigState} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{device ? 'Edit Device' : 'Create Device'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Device"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <Select
                    id="protocol"
                    value={formData.protocol}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      protocol: e.target.value as ProtocolType 
                    }))}
                  >
                    {Object.entries(PROTOCOL_DISPLAY_NAMES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Device description..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Publish Interval (ms)</Label>
                <Input
                  id="interval"
                  type="number"
                  min={100}
                  max={60000}
                  value={formData.intervalMs}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    intervalMs: parseInt(e.target.value) || 5000 
                  }))}
                />
              </div>
            </div>

            {/* Protocol Config */}
            <div className="space-y-4">
              <h3 className="font-medium">{PROTOCOL_DISPLAY_NAMES[formData.protocol]} Configuration</h3>
              {renderProtocolConfig()}
            </div>

            {/* Sensors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Sensors</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSensor}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sensor
                </Button>
              </div>
              
              {formData.sensors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No sensors configured. Add sensors to generate telemetry data.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.sensors.map((sensor, index) => (
                    <div key={sensor.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-6 gap-2 items-end">
                        <div className="col-span-2">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={sensor.name}
                            onChange={e => handleUpdateSensor(index, { name: e.target.value })}
                            placeholder="Sensor name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={sensor.type}
                            onChange={e => handleSensorTypeChange(index, e.target.value as SensorType)}
                          >
                            {Object.keys(DEFAULT_SENSOR_CONFIGS).map(type => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Min</Label>
                          <Input
                            type="number"
                            value={sensor.minValue}
                            onChange={e => handleUpdateSensor(index, { 
                              minValue: parseFloat(e.target.value) || 0 
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max</Label>
                          <Input
                            type="number"
                            value={sensor.maxValue}
                            onChange={e => handleUpdateSensor(index, { 
                              maxValue: parseFloat(e.target.value) || 100 
                            })}
                          />
                        </div>
                        <div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSensor(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {device ? 'Save Changes' : 'Create Device'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Protocol-specific config editors
function MqttConfigEditor({ config, onChange }: { config: MqttConfig; onChange: (c: MqttConfig) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Broker URL</Label>
        <Input
          value={config.brokerUrl}
          onChange={e => onChange({ ...config, brokerUrl: e.target.value })}
          placeholder="mqtt://localhost"
        />
      </div>
      <div className="space-y-2">
        <Label>Port</Label>
        <Input
          type="number"
          value={config.port}
          onChange={e => onChange({ ...config, port: parseInt(e.target.value) || 1883 })}
        />
      </div>
      <div className="col-span-2 space-y-2">
        <Label>Topic</Label>
        <Input
          value={config.topic}
          onChange={e => onChange({ ...config, topic: e.target.value })}
          placeholder="devices/{deviceId}/telemetry"
        />
      </div>
      <div className="space-y-2">
        <Label>QoS</Label>
        <Select
          value={(config.qos ?? 1).toString()}
          onChange={e => onChange({ ...config, qos: parseInt(e.target.value) as 0 | 1 | 2 })}
        >
          <option value="0">0 - At most once</option>
          <option value="1">1 - At least once</option>
          <option value="2">2 - Exactly once</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Client ID</Label>
        <Input
          value={config.clientId}
          onChange={e => onChange({ ...config, clientId: e.target.value })}
        />
      </div>
    </div>
  );
}

function HttpConfigEditor({ config, onChange }: { config: HttpConfig; onChange: (c: HttpConfig) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-2">
          <Label>Endpoint URL</Label>
          <Input
            value={config.endpoint}
            onChange={e => onChange({ ...config, endpoint: e.target.value })}
            placeholder="http://localhost:5200/api/simulation/publish"
          />
        </div>
        <div className="space-y-2">
          <Label>Method</Label>
          <Select
            value={config.method}
            onChange={e => onChange({ ...config, method: e.target.value as 'POST' | 'PUT' })}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Auth Type</Label>
          <Select
            value={config.authType}
            onChange={e => onChange({ ...config, authType: e.target.value as HttpConfig['authType'] })}
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="apikey">API Key</option>
            <option value="basic">Basic Auth</option>
          </Select>
        </div>
        {config.authType !== 'none' && (
          <div className="space-y-2">
            <Label>{config.authType === 'basic' ? 'username:password' : 'Token/Key'}</Label>
            <Input
              type="password"
              value={config.authValue || ''}
              onChange={e => onChange({ ...config, authValue: e.target.value })}
              placeholder={config.authType === 'basic' ? 'user:pass' : 'your-token-here'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function WebSocketConfigEditor({ config, onChange }: { config: WebSocketConfig; onChange: (c: WebSocketConfig) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>WebSocket URL</Label>
        <Input
          value={config.url}
          onChange={e => onChange({ ...config, url: e.target.value })}
          placeholder="ws://localhost:5200/ws/simulation"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reconnect Interval (ms)</Label>
          <Input
            type="number"
            value={config.reconnectInterval}
            onChange={e => onChange({ ...config, reconnectInterval: parseInt(e.target.value) || 5000 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Heartbeat Interval (ms)</Label>
          <Input
            type="number"
            value={config.heartbeatInterval}
            onChange={e => onChange({ ...config, heartbeatInterval: parseInt(e.target.value) || 30000 })}
          />
        </div>
      </div>
    </div>
  );
}

function ModbusConfigEditor({ config, onChange }: { config: ModbusConfig; onChange: (c: ModbusConfig) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Host</Label>
        <Input
          value={config.host}
          onChange={e => onChange({ ...config, host: e.target.value })}
          placeholder="192.168.1.100"
        />
      </div>
      <div className="space-y-2">
        <Label>Port</Label>
        <Input
          type="number"
          value={config.port}
          onChange={e => onChange({ ...config, port: parseInt(e.target.value) || 502 })}
        />
      </div>
      <div className="space-y-2">
        <Label>Unit ID</Label>
        <Input
          type="number"
          min={1}
          max={247}
          value={config.unitId}
          onChange={e => onChange({ ...config, unitId: parseInt(e.target.value) || 1 })}
        />
      </div>
      <div className="space-y-2">
        <Label>Register Type</Label>
        <Select
          value={config.registerType}
          onChange={e => onChange({ ...config, registerType: e.target.value as ModbusConfig['registerType'] })}
        >
          <option value="holding">Holding Registers</option>
          <option value="input">Input Registers</option>
          <option value="coil">Coils</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Start Address</Label>
        <Input
          type="number"
          min={0}
          value={config.startAddress}
          onChange={e => onChange({ ...config, startAddress: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}

function OpcUaConfigEditor({ config, onChange }: { config: OpcUaConfig; onChange: (c: OpcUaConfig) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Endpoint URL</Label>
        <Input
          value={config.endpointUrl}
          onChange={e => onChange({ ...config, endpointUrl: e.target.value })}
          placeholder="opc.tcp://localhost:4840"
        />
      </div>
      <div className="space-y-2">
        <Label>Security Mode</Label>
        <Select
          value={config.securityMode}
          onChange={e => onChange({ ...config, securityMode: e.target.value as OpcUaConfig['securityMode'] })}
        >
          <option value="None">None</option>
          <option value="Sign">Sign</option>
          <option value="SignAndEncrypt">Sign and Encrypt</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Node IDs (comma-separated)</Label>
        <Input
          value={config.nodeIds.join(', ')}
          onChange={e => onChange({ 
            ...config, 
            nodeIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
          })}
          placeholder="ns=2;s=Temperature, ns=2;s=Humidity"
        />
      </div>
    </div>
  );
}
