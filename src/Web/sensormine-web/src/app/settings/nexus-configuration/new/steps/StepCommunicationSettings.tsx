/**
 * Step 3: Communication Settings
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wifi } from 'lucide-react';
import type { CreateNexusConfigurationRequest, CommunicationSettings } from '@/lib/api';

interface StepCommunicationSettingsProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  updateFormData: (data: Partial<CreateNexusConfigurationRequest>) => void;
}

export function StepCommunicationSettings({ formData, updateFormData }: StepCommunicationSettingsProps) {
  const settings = formData.communicationSettings || {
    protocol: 'MQTT',
    transmissionIntervalSeconds: 300,
    enableBatching: true,
    maxBatchSize: 10,
    enableCompression: false,
  };

  const updateSettings = (updates: Partial<CommunicationSettings>) => {
    updateFormData({
      communicationSettings: { ...settings, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Communication Settings</h2>
        <p className="text-muted-foreground">
          Configure how your Nexus device communicates with the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Protocol Settings
          </CardTitle>
          <CardDescription>
            Choose the communication protocol and configure transmission settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Protocol Selection */}
          <div className="space-y-2">
            <Label>Protocol</Label>
            <Select
              value={settings.protocol}
              onValueChange={(value) =>
                updateSettings({ protocol: value as CommunicationSettings['protocol'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MQTT">MQTT</SelectItem>
                <SelectItem value="HTTP">HTTP</SelectItem>
                <SelectItem value="Azure IoT Hub">Azure IoT Hub</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The communication protocol used to send data to the platform
            </p>
          </div>

          {/* Transmission Interval */}
          <div className="space-y-2">
            <Label>Transmission Interval (seconds)</Label>
            <Input
              type="number"
              value={settings.transmissionIntervalSeconds}
              onChange={(e) =>
                updateSettings({
                  transmissionIntervalSeconds: parseInt(e.target.value) || 300,
                })
              }
              min="10"
            />
            <p className="text-sm text-muted-foreground">
              How often the device sends data to the platform
            </p>
          </div>

          {/* Batching Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Batching</Label>
                <p className="text-sm text-muted-foreground">
                  Send multiple readings in a single transmission
                </p>
              </div>
              <Switch
                checked={settings.enableBatching}
                onCheckedChange={(checked) =>
                  updateSettings({ enableBatching: checked })
                }
              />
            </div>

            {settings.enableBatching && (
              <div className="space-y-2">
                <Label>Max Batch Size</Label>
                <Input
                  type="number"
                  value={settings.maxBatchSize}
                  onChange={(e) =>
                    updateSettings({ maxBatchSize: parseInt(e.target.value) || 10 })
                  }
                  min="1"
                  max="100"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of readings per batch
                </p>
              </div>
            )}
          </div>

          {/* Compression */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress data before transmission to reduce bandwidth
              </p>
            </div>
            <Switch
              checked={settings.enableCompression}
              onCheckedChange={(checked) =>
                updateSettings({ enableCompression: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Protocol-Specific Settings */}
      {settings.protocol === 'MQTT' && (
        <Card>
          <CardHeader>
            <CardTitle>MQTT Settings</CardTitle>
            <CardDescription>
              Configure MQTT broker connection details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Broker URL</Label>
              <Input
                placeholder="mqtt://localhost"
                value={settings.mqttSettings?.brokerUrl || 'mqtt://localhost'}
                onChange={(e) =>
                  updateSettings({
                    mqttSettings: {
                      ...settings.mqttSettings,
                      brokerUrl: e.target.value,
                      port: settings.mqttSettings?.port || 1883,
                      topicPattern: settings.mqttSettings?.topicPattern || 'devices/{deviceId}/telemetry',
                      qoS: settings.mqttSettings?.qoS || 1,
                      useTls: settings.mqttSettings?.useTls || false,
                    },
                  })
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  type="number"
                  value={settings.mqttSettings?.port || 1883}
                  onChange={(e) =>
                    updateSettings({
                      mqttSettings: {
                        ...settings.mqttSettings,
                        brokerUrl: settings.mqttSettings?.brokerUrl || 'mqtt://localhost',
                        port: parseInt(e.target.value) || 1883,
                        topicPattern: settings.mqttSettings?.topicPattern || 'devices/{deviceId}/telemetry',
                        qoS: settings.mqttSettings?.qoS || 1,
                        useTls: settings.mqttSettings?.useTls || false,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>QoS Level</Label>
                <Select
                  value={String(settings.mqttSettings?.qoS || 1)}
                  onValueChange={(value) =>
                    updateSettings({
                      mqttSettings: {
                        ...settings.mqttSettings,
                        brokerUrl: settings.mqttSettings?.brokerUrl || 'mqtt://localhost',
                        port: settings.mqttSettings?.port || 1883,
                        topicPattern: settings.mqttSettings?.topicPattern || 'devices/{deviceId}/telemetry',
                        qoS: parseInt(value),
                        useTls: settings.mqttSettings?.useTls || false,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - At most once</SelectItem>
                    <SelectItem value="1">1 - At least once</SelectItem>
                    <SelectItem value="2">2 - Exactly once</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic Pattern</Label>
              <Input
                placeholder="devices/{deviceId}/telemetry"
                value={settings.mqttSettings?.topicPattern || 'devices/{deviceId}/telemetry'}
                onChange={(e) =>
                  updateSettings({
                    mqttSettings: {
                      ...settings.mqttSettings,
                      brokerUrl: settings.mqttSettings?.brokerUrl || 'mqtt://localhost',
                      port: settings.mqttSettings?.port || 1883,
                      topicPattern: e.target.value,
                      qoS: settings.mqttSettings?.qoS || 1,
                      useTls: settings.mqttSettings?.useTls || false,
                    },
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Use {'{deviceId}'} as placeholder for device ID
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
