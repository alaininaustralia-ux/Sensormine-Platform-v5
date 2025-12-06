/**
 * Step 2: Probe Configuration
 */

'use client';

import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Trash2, Radio } from 'lucide-react';
import type { CreateNexusConfigurationRequest, ProbeConfig } from '@/lib/api';

interface StepProbeConfigurationProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  updateFormData: (data: Partial<CreateNexusConfigurationRequest>) => void;
}

const PROBE_TYPES = ['RS485', 'RS232', 'OneWire', 'Analog420mA', 'Digital'];
const SENSOR_TYPES = [
  'Temperature',
  'Humidity',
  'Pressure',
  'Flow',
  'Level',
  'Vibration',
  'Voltage',
  'Current',
  'Power',
  'Speed',
  'Position',
  'pH',
  'CO2',
  'Light',
];

export function StepProbeConfiguration({ formData, updateFormData }: StepProbeConfigurationProps) {
  const probes = formData.probeConfigurations || [];

  const addProbe = () => {
    const newProbe: ProbeConfig = {
      probeId: `probe_${Date.now()}`,
      probeName: `Probe ${probes.length + 1}`,
      probeType: 'RS485',
      sensorType: 'Temperature',
      unit: '°C',
      protocolSettings: {},
      samplingIntervalSeconds: 60,
    };

    updateFormData({
      probeConfigurations: [...probes, newProbe],
    });
  };

  const removeProbe = (index: number) => {
    const updatedProbes = probes.filter((_, i) => i !== index);
    updateFormData({ probeConfigurations: updatedProbes });
  };

  const updateProbe = (index: number, updates: Partial<ProbeConfig>) => {
    const updatedProbes = probes.map((probe, i) =>
      i === index ? { ...probe, ...updates } : probe
    );
    updateFormData({ probeConfigurations: updatedProbes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Probe Configuration</h2>
        <p className="text-muted-foreground">
          Add and configure the probes connected to your Nexus device. Each probe represents a sensor or data input.
        </p>
      </div>

      {probes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Probes Configured</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Add your first probe to start configuring sensors for your Nexus device.
            </p>
            <Button onClick={addProbe}>
              <Plus className="mr-2 h-4 w-4" />
              Add Probe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {probes.map((probe, index) => (
              <Card key={probe.probeId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {probe.probeName}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProbe(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription>
                    {probe.probeType} · {probe.sensorType}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Probe Name</Label>
                    <Input
                      value={probe.probeName}
                      onChange={(e) =>
                        updateProbe(index, { probeName: e.target.value })
                      }
                      placeholder="Enter probe name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Probe Type</Label>
                    <Select
                      value={probe.probeType}
                      onValueChange={(value) =>
                        updateProbe(index, { probeType: value as ProbeConfig['probeType'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROBE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sensor Type</Label>
                    <Select
                      value={probe.sensorType}
                      onValueChange={(value) =>
                        updateProbe(index, { sensorType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SENSOR_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={probe.unit}
                      onChange={(e) =>
                        updateProbe(index, { unit: e.target.value })
                      }
                      placeholder="e.g., °C, %, Pa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sampling Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={probe.samplingIntervalSeconds}
                      onChange={(e) =>
                        updateProbe(index, {
                          samplingIntervalSeconds: parseInt(e.target.value) || 60,
                        })
                      }
                      min="1"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={addProbe} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Probe
          </Button>
        </>
      )}
    </div>
  );
}
