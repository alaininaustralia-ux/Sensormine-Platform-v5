/**
 * Step 3: Communication Settings
 */

'use client';

import { useEffect, useState } from 'react';
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
import { Wifi, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nexusConfigurationApi, type CommunicationProtocolInfo } from '@/lib/api/nexusConfiguration';
import type { CreateNexusConfigurationRequest, CommunicationSettings } from '@/lib/api';

interface StepCommunicationSettingsProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  updateFormData: (data: Partial<CreateNexusConfigurationRequest>) => void;
}

export function StepCommunicationSettings({ formData, updateFormData }: StepCommunicationSettingsProps) {
  const { toast } = useToast();
  const [protocols, setProtocols] = useState<CommunicationProtocolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  const settings = formData.communicationSettings || {
    protocol: 'MQTT',
    transmissionIntervalSeconds: 300,
    enableBatching: true,
    maxBatchSize: 10,
    enableCompression: false,
  };

  // Load communication protocols from API
  useEffect(() => {
    const loadProtocols = async () => {
      try {
        setLoading(true);
        const data = await nexusConfigurationApi.getCommunicationProtocols();
        setProtocols(data);
        
        // If current protocol doesn't exist in loaded protocols, set to first available
        if (data.length > 0 && !data.find(p => p.protocol === settings.protocol)) {
          updateSettings({ protocol: data[0].protocol as CommunicationSettings['protocol'] });
        }
      } catch (error) {
        console.error('Error loading communication protocols:', error);
        toast({
          title: 'Error',
          description: 'Failed to load communication protocols. Using defaults.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadProtocols();
  }, [toast]);

  const updateSettings = (updates: Partial<CommunicationSettings>) => {
    updateFormData({
      communicationSettings: { ...settings, ...updates },
    });
  };

  // Get current protocol info
  const currentProtocol = protocols.find(p => p.protocol === settings.protocol);

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
            <Label className="flex items-center gap-2">
              Protocol
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            </Label>
            <Select
              value={settings.protocol}
              onValueChange={(value) =>
                updateSettings({ protocol: value as CommunicationSettings['protocol'] })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {protocols.map((proto) => (
                  <SelectItem key={proto.protocol} value={proto.protocol}>
                    <div className="flex flex-col">
                      <span>{proto.displayName}</span>
                      {proto.description && (
                        <span className="text-xs text-muted-foreground">
                          {proto.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProtocol?.description && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {currentProtocol.description}
              </p>
            )}
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
                      topicPattern: settings.mqttSettings?.topicPattern || 'sensormine/tenants/{tenantId}/devices/{deviceId}/telemetry',
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
                        topicPattern: settings.mqttSettings?.topicPattern || 'sensormine/tenants/{tenantId}/devices/{deviceId}/telemetry',
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
                        topicPattern: settings.mqttSettings?.topicPattern || 'sensormine/tenants/{tenantId}/devices/{deviceId}/telemetry',
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
              <div className="space-y-3">
                {/* Radio buttons for default vs custom */}
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="topic-default"
                    name="topic-pattern-mode"
                    checked={!useCustomTopic}
                    onChange={() => {
                      setUseCustomTopic(false);
                      updateSettings({
                        mqttSettings: {
                          ...settings.mqttSettings,
                          brokerUrl: settings.mqttSettings?.brokerUrl || 'mqtt://localhost',
                          port: settings.mqttSettings?.port || 1883,
                          topicPattern: 'sensormine/tenants/{tenantId}/devices/{deviceId}/telemetry',
                          qoS: settings.mqttSettings?.qoS || 1,
                          useTls: settings.mqttSettings?.useTls || false,
                        },
                      });
                    }}
                    className="h-4 w-4 text-primary cursor-pointer"
                  />
                  <label htmlFor="topic-default" className="text-sm font-medium cursor-pointer">
                    Use Sensormine Default Pattern
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="topic-custom"
                    name="topic-pattern-mode"
                    checked={useCustomTopic}
                    onChange={() => {
                      setUseCustomTopic(true);
                      updateSettings({
                        mqttSettings: {
                          ...settings.mqttSettings,
                          brokerUrl: settings.mqttSettings?.brokerUrl || 'mqtt://localhost',
                          port: settings.mqttSettings?.port || 1883,
                          topicPattern: '',
                          qoS: settings.mqttSettings?.qoS || 1,
                          useTls: settings.mqttSettings?.useTls || false,
                        },
                      });
                    }}
                    className="h-4 w-4 text-primary cursor-pointer"
                  />
                  <label htmlFor="topic-custom" className="text-sm font-medium cursor-pointer">
                    Use Custom Pattern
                  </label>
                </div>

                {/* Show input only when custom is selected */}
                {useCustomTopic ? (
                  <div className="space-y-2 pl-6">
                    <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Warning:</strong> Custom topic patterns may not work with Sensormine's ingestion pipeline. Use only if you have a specific integration requirement.
                      </p>
                    </div>
                    <Input
                      placeholder="your/custom/pattern/{tenantId}/{deviceId}"
                      value={settings.mqttSettings?.topicPattern || ''}
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Use {'{tenantId}'} for tenant ID and {'{deviceId}'} for device ID
                    </p>
                  </div>
                ) : (
                  <div className="pl-6">
                    <div className="font-mono text-sm bg-muted px-3 py-2 rounded-md break-all">
                      sensormine/tenants/{'{tenantId}'}/devices/{'{deviceId}'}/telemetry
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Standard Sensormine compliance topic pattern
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
