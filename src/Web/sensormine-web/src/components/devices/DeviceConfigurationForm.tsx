/**
 * Device Configuration Form Component
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CpuIcon,
  MapPinIcon,
  NetworkIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from 'lucide-react';

export interface DeviceConfig {
  // Basic Info
  name: string;
  description: string;
  deviceType: string;
  serialNumber: string;
  location: string;
  tags: string[];

  // Network Settings
  connectionType: string;
  host: string;
  port: number;
  mqttBroker?: string;
  mqttTopic?: string;

  // Advanced Settings
  enabled: boolean;
  samplingIntervalMs: number;
  batchSize: number;
  retryAttempts: number;
  timeoutMs: number;

  // Security
  authMethod: string;
  username?: string;
  password?: string;
  certificatePath?: string;
}

interface DeviceConfigurationFormProps {
  initialConfig?: Partial<DeviceConfig>;
  onSave?: (config: DeviceConfig) => void;
  onCancel?: () => void;
}

const deviceTypes = [
  { value: 'NEXUS_PROBE', label: 'Nexus Probe' },
  { value: 'MODBUS_TCP', label: 'Modbus TCP' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU' },
  { value: 'OPC_UA', label: 'OPC UA' },
  { value: 'BACNET', label: 'BACnet/IP' },
  { value: 'ETHERNET_IP', label: 'EtherNet/IP' },
  { value: 'MQTT', label: 'External MQTT' },
];

const connectionTypes = [
  { value: 'TCP', label: 'TCP/IP' },
  { value: 'SERIAL', label: 'Serial (RS-232/RS-485)' },
  { value: 'MQTT', label: 'MQTT' },
  { value: 'HTTP', label: 'HTTP/REST' },
];

const authMethods = [
  { value: 'NONE', label: 'None' },
  { value: 'BASIC', label: 'Username/Password' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'TOKEN', label: 'API Token' },
];

export function DeviceConfigurationForm({
  initialConfig,
  onSave,
  onCancel,
}: DeviceConfigurationFormProps) {
  const [config, setConfig] = useState<DeviceConfig>({
    name: initialConfig?.name || '',
    description: initialConfig?.description || '',
    deviceType: initialConfig?.deviceType || 'NEXUS_PROBE',
    serialNumber: initialConfig?.serialNumber || '',
    location: initialConfig?.location || '',
    tags: initialConfig?.tags || [],
    connectionType: initialConfig?.connectionType || 'TCP',
    host: initialConfig?.host || '',
    port: initialConfig?.port || 502,
    mqttBroker: initialConfig?.mqttBroker || '',
    mqttTopic: initialConfig?.mqttTopic || '',
    enabled: initialConfig?.enabled ?? true,
    samplingIntervalMs: initialConfig?.samplingIntervalMs || 1000,
    batchSize: initialConfig?.batchSize || 100,
    retryAttempts: initialConfig?.retryAttempts || 3,
    timeoutMs: initialConfig?.timeoutMs || 5000,
    authMethod: initialConfig?.authMethod || 'NONE',
    username: initialConfig?.username || '',
    password: initialConfig?.password || '',
    certificatePath: initialConfig?.certificatePath || '',
  });

  const [tagInput, setTagInput] = useState('');

  const updateConfig = <K extends keyof DeviceConfig>(key: K, value: DeviceConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !config.tags.includes(tagInput.trim())) {
      updateConfig('tags', [...config.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateConfig('tags', config.tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    onSave?.(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Configuration</CardTitle>
        <CardDescription>
          Configure device connection and operational parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">
              <CpuIcon className="mr-2 h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="network">
              <NetworkIcon className="mr-2 h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="security">
              <ShieldCheckIcon className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Water Tank Monitor"
                  value={config.name}
                  onChange={(e) => updateConfig('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type *</Label>
                <Select
                  value={config.deviceType}
                  onValueChange={(v) => updateConfig('deviceType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the device"
                value={config.description}
                onChange={(e) => updateConfig('description', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  placeholder="e.g., NEXUS-001"
                  value={config.serialNumber}
                  onChange={(e) => updateConfig('serialNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    className="pl-9"
                    placeholder="e.g., Building A - Floor 1"
                    value={config.location}
                    onChange={(e) => updateConfig('location', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {config.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {config.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <Select
                value={config.connectionType}
                onValueChange={(v) => updateConfig('connectionType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {connectionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.connectionType === 'TCP' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="host">Host / IP Address *</Label>
                  <Input
                    id="host"
                    placeholder="e.g., 192.168.1.100"
                    value={config.host}
                    onChange={(e) => updateConfig('host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port *</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="e.g., 502"
                    value={config.port}
                    onChange={(e) => updateConfig('port', parseInt(e.target.value) || 502)}
                  />
                </div>
              </div>
            )}

            {config.connectionType === 'MQTT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mqttBroker">MQTT Broker URL</Label>
                  <Input
                    id="mqttBroker"
                    placeholder="e.g., mqtt://broker.example.com:1883"
                    value={config.mqttBroker}
                    onChange={(e) => updateConfig('mqttBroker', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqttTopic">MQTT Topic</Label>
                  <Input
                    id="mqttTopic"
                    placeholder="e.g., sensors/+/data"
                    value={config.mqttTopic}
                    onChange={(e) => updateConfig('mqttTopic', e.target.value)}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="enabled">Enable Device</Label>
                <p className="text-sm text-muted-foreground">
                  When disabled, no data will be collected from this device
                </p>
              </div>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig('enabled', checked)}
              />
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="samplingIntervalMs">Sampling Interval (ms)</Label>
                <Input
                  id="samplingIntervalMs"
                  type="number"
                  min={100}
                  value={config.samplingIntervalMs}
                  onChange={(e) =>
                    updateConfig('samplingIntervalMs', parseInt(e.target.value) || 1000)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How often to read data from the device
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min={1}
                  max={1000}
                  value={config.batchSize}
                  onChange={(e) => updateConfig('batchSize', parseInt(e.target.value) || 100)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of readings to batch before sending
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  min={0}
                  max={10}
                  value={config.retryAttempts}
                  onChange={(e) => updateConfig('retryAttempts', parseInt(e.target.value) || 3)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of retries on connection failure
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeoutMs">Connection Timeout (ms)</Label>
                <Input
                  id="timeoutMs"
                  type="number"
                  min={1000}
                  value={config.timeoutMs}
                  onChange={(e) => updateConfig('timeoutMs', parseInt(e.target.value) || 5000)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum wait time for connection
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authMethod">Authentication Method</Label>
              <Select
                value={config.authMethod}
                onValueChange={(v) => updateConfig('authMethod', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {authMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.authMethod === 'BASIC' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) => updateConfig('username', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) => updateConfig('password', e.target.value)}
                  />
                </div>
              </div>
            )}

            {config.authMethod === 'CERTIFICATE' && (
              <div className="space-y-2">
                <Label htmlFor="certificatePath">Certificate Path</Label>
                <Input
                  id="certificatePath"
                  placeholder="/path/to/certificate.pem"
                  value={config.certificatePath}
                  onChange={(e) => updateConfig('certificatePath', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Path to the client certificate file
                </p>
              </div>
            )}

            {config.authMethod === 'TOKEN' && (
              <div className="space-y-2">
                <Label htmlFor="apiToken">API Token</Label>
                <Input
                  id="apiToken"
                  type="password"
                  placeholder="Enter API token"
                  value={config.password}
                  onChange={(e) => updateConfig('password', e.target.value)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={!config.name}>
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
