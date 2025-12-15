/**
 * Step 2: Probe Configuration
 */

'use client';

import { useEffect, useState } from 'react';
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
import { Plus, Trash2, Radio, Loader2, Info } from 'lucide-react';
import { nexusConfigurationApi } from '@/lib/api';
import type { 
  CreateNexusConfigurationRequest, 
  ProbeConfig,
  ProbeTypeInfo,
  SensorTypeInfo,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StepProbeConfigurationProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  updateFormData: (data: Partial<CreateNexusConfigurationRequest>) => void;
}

export function StepProbeConfiguration({ formData, updateFormData }: StepProbeConfigurationProps) {
  const { toast } = useToast();
  const [probeTypes, setProbeTypes] = useState<ProbeTypeInfo[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProbeType, setSelectedProbeType] = useState<string>('');

  const probes = formData.probeConfigurations || [];

  // Load probe types and sensor types from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [probeTypesData, sensorTypesData] = await Promise.all([
          nexusConfigurationApi.getProbeTypes(),
          nexusConfigurationApi.getSensorTypes(),
        ]);
        setProbeTypes(probeTypesData);
        setSensorTypes(sensorTypesData);
      } catch (error) {
        console.error('Error loading probe/sensor types:', error);
        toast({
          title: 'Error',
          description: 'Failed to load probe and sensor types. Using defaults.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Load sensor types filtered by probe type
  const loadSensorTypesForProbe = async (probeType: string) => {
    try {
      const filteredSensors = await nexusConfigurationApi.getSensorTypes(probeType);
      setSensorTypes(filteredSensors);
      setSelectedProbeType(probeType);
    } catch (error) {
      console.error('Error loading sensor types:', error);
    }
  };

  const addProbe = () => {
    const defaultProbeType = probeTypes[0]?.type || 'RS485';
    const defaultSensorType = sensorTypes[0]?.type || 'Temperature';
    const defaultUnit = sensorTypes.find(s => s.type === defaultSensorType)?.defaultUnit || '°C';
    
    const newProbe: ProbeConfig = {
      probeId: `probe_${Date.now()}`,
      probeName: `Probe ${probes.length + 1}`,
      probeType: defaultProbeType as ProbeConfig['probeType'],
      sensorType: defaultSensorType,
      unit: defaultUnit,
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
                    <Label className="flex items-center gap-2">
                      Probe Type
                      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                    </Label>
                    <Select
                      value={probe.probeType}
                      onValueChange={(value) => {
                        updateProbe(index, { probeType: value as ProbeConfig['probeType'] });
                        // Load compatible sensor types when probe type changes
                        loadSensorTypesForProbe(value);
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {probeTypes.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            <div className="flex flex-col">
                              <span>{type.displayName}</span>
                              {type.description && (
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Sensor Type
                      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                    </Label>
                    <Select
                      value={probe.sensorType}
                      onValueChange={(value) => {
                        const selectedSensor = sensorTypes.find(s => s.type === value);
                        updateProbe(index, { 
                          sensorType: value,
                          unit: selectedSensor?.defaultUnit || probe.unit 
                        });
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sensorTypes.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            <div className="flex flex-col">
                              <span>{type.displayName}</span>
                              {type.description && (
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {probe.probeType && sensorTypes.length === 0 && !loading && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        No compatible sensors found for {probe.probeType}
                      </p>
                    )}
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
