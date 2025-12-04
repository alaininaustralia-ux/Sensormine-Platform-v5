/**
 * Sensor Configuration Component
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ActivityIcon,
  AlertTriangleIcon,
  EditIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
  ThermometerIcon,
  GaugeIcon,
  DropletIcon,
  WindIcon,
  ZapIcon,
} from 'lucide-react';

// Sensor types and their icons
const sensorTypeIcons: Record<string, React.ReactNode> = {
  temperature: <ThermometerIcon className="h-4 w-4" />,
  pressure: <GaugeIcon className="h-4 w-4" />,
  humidity: <DropletIcon className="h-4 w-4" />,
  flow: <WindIcon className="h-4 w-4" />,
  power: <ZapIcon className="h-4 w-4" />,
  generic: <ActivityIcon className="h-4 w-4" />,
};

export interface Sensor {
  id: string;
  name: string;
  type: string;
  unit: string;
  interface: string;
  address: string;
  samplingRate: number;
  enabled: boolean;
  minValue?: number;
  maxValue?: number;
  scaleFactor?: number;
  offset?: number;
  alertThresholds?: {
    low?: number;
    high?: number;
  };
}

interface SensorConfigurationProps {
  sensors: Sensor[];
  onAddSensor?: (sensor: Omit<Sensor, 'id'>) => void;
}

const interfaceOptions = [
  { value: 'RS485', label: 'RS-485 (Modbus)' },
  { value: 'RS232', label: 'RS-232 Serial' },
  { value: 'ONEWIRE', label: 'OneWire' },
  { value: '4-20MA', label: '4-20mA Analog' },
  { value: 'VOLTAGE', label: '0-10V Analog' },
  { value: 'MQTT', label: 'MQTT Topic' },
  { value: 'OPCUA', label: 'OPC UA Node' },
];

const sensorTypeOptions = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'pressure', label: 'Pressure' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'flow', label: 'Flow Rate' },
  { value: 'power', label: 'Power/Energy' },
  { value: 'level', label: 'Level' },
  { value: 'vibration', label: 'Vibration' },
  { value: 'generic', label: 'Generic/Custom' },
];

const unitOptions: Record<string, string[]> = {
  temperature: ['°C', '°F', 'K'],
  pressure: ['bar', 'psi', 'kPa', 'MPa'],
  humidity: ['%RH'],
  flow: ['L/min', 'm³/h', 'GPM'],
  power: ['W', 'kW', 'A', 'V'],
  level: ['%', 'm', 'mm', 'cm'],
  vibration: ['mm/s', 'g'],
  generic: ['', 'count', '%'],
};

export function SensorConfiguration({
  sensors,
  onAddSensor,
}: SensorConfigurationProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'temperature',
    unit: '°C',
    interface: 'RS485',
    address: '',
    samplingRate: 1000,
    enabled: true,
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
    scaleFactor: 1,
    offset: 0,
    alertLow: undefined as number | undefined,
    alertHigh: undefined as number | undefined,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'temperature',
      unit: '°C',
      interface: 'RS485',
      address: '',
      samplingRate: 1000,
      enabled: true,
      minValue: undefined,
      maxValue: undefined,
      scaleFactor: 1,
      offset: 0,
      alertLow: undefined,
      alertHigh: undefined,
    });
  };

  const handleAddSensor = () => {
    if (onAddSensor) {
      onAddSensor({
        name: formData.name,
        type: formData.type,
        unit: formData.unit,
        interface: formData.interface,
        address: formData.address,
        samplingRate: formData.samplingRate,
        enabled: formData.enabled,
        minValue: formData.minValue,
        maxValue: formData.maxValue,
        scaleFactor: formData.scaleFactor,
        offset: formData.offset,
        alertThresholds: {
          low: formData.alertLow,
          high: formData.alertHigh,
        },
      });
    }
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleTypeChange = (type: string) => {
    const units = unitOptions[type] || [''];
    setFormData((prev) => ({
      ...prev,
      type,
      unit: units[0],
    }));
  };

  // Sensor form content - inline JSX to avoid component during render
  const sensorFormContent = (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Sensor Name</Label>
          <Input
            id="name"
            placeholder="e.g., Tank Temperature"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Sensor Type</Label>
          <Select value={formData.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sensorTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interface">Interface</Label>
          <Select
            value={formData.interface}
            onValueChange={(v) => setFormData((prev) => ({ ...prev, interface: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {interfaceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address / Topic</Label>
          <Input
            id="address"
            placeholder="e.g., 1 or sensors/temp1"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={formData.unit}
            onValueChange={(v) => setFormData((prev) => ({ ...prev, unit: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(unitOptions[formData.type] || ['']).map((unit) => (
                <SelectItem key={unit || 'none'} value={unit || 'none'}>
                  {unit || 'None'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="samplingRate">Sampling Rate (ms)</Label>
          <Input
            id="samplingRate"
            type="number"
            min={100}
            value={formData.samplingRate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, samplingRate: parseInt(e.target.value) || 1000 }))
            }
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
          />
          <Label htmlFor="enabled">Enabled</Label>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 font-medium">Data Processing</h4>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="minValue">Min Value</Label>
            <Input
              id="minValue"
              type="number"
              placeholder="Optional"
              value={formData.minValue ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxValue">Max Value</Label>
            <Input
              id="maxValue"
              type="number"
              placeholder="Optional"
              value={formData.maxValue ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scaleFactor">Scale Factor</Label>
            <Input
              id="scaleFactor"
              type="number"
              step="0.001"
              value={formData.scaleFactor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, scaleFactor: parseFloat(e.target.value) || 1 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offset">Offset</Label>
            <Input
              id="offset"
              type="number"
              step="0.1"
              value={formData.offset}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, offset: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 font-medium">Alert Thresholds</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="alertLow">Low Alert Threshold</Label>
            <Input
              id="alertLow"
              type="number"
              placeholder="Optional"
              value={formData.alertLow ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  alertLow: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alertHigh">High Alert Threshold</Label>
            <Input
              id="alertHigh"
              type="number"
              placeholder="Optional"
              value={formData.alertHigh ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  alertHigh: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sensor Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure sensors and data collection parameters
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Sensor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Sensor</DialogTitle>
              <DialogDescription>
                Configure a new sensor input for this device
              </DialogDescription>
            </DialogHeader>
            {sensorFormContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSensor} disabled={!formData.name || !formData.address}>
                Add Sensor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sensors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2Icon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No sensors configured</h3>
            <p className="text-sm text-muted-foreground">
              Add sensors to start collecting data from this device
            </p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add First Sensor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sensors.map((sensor) => (
            <Card key={sensor.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {sensorTypeIcons[sensor.type] || sensorTypeIcons.generic}
                    <div>
                      <CardTitle className="text-base">{sensor.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {sensor.interface} @ {sensor.address}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sensor.enabled ? 'success' : 'secondary'}>
                      {sensor.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Button variant="ghost" size="icon-sm" aria-label="Edit sensor">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Delete sensor">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <span className="font-medium">{sensor.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit:</span>{' '}
                    <span className="font-medium">{sensor.unit || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sampling:</span>{' '}
                    <span className="font-medium">{sensor.samplingRate}ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scale:</span>{' '}
                    <span className="font-medium">
                      ×{sensor.scaleFactor || 1} + {sensor.offset || 0}
                    </span>
                  </div>
                  {sensor.alertThresholds && (
                    <div className="col-span-2 mt-2 flex items-center gap-2 rounded bg-muted p-2">
                      <AlertTriangleIcon className="h-4 w-4 text-warning" />
                      <span className="text-xs">
                        Alerts: {sensor.alertThresholds.low ?? '—'} to{' '}
                        {sensor.alertThresholds.high ?? '—'} {sensor.unit}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
