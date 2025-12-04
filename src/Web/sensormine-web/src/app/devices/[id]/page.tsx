/**
 * Device Detail Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DeviceConfigurationForm } from '@/components/devices/DeviceConfigurationForm';
import { SensorConfiguration, Sensor } from '@/components/devices/SensorConfiguration';
import {
  ActivityIcon,
  ArrowLeftIcon,
  BatteryIcon,
  ClockIcon,
  MapPinIcon,
  RefreshCwIcon,
  Settings2Icon,
  SignalIcon,
  ThermometerIcon,
  WrenchIcon,
} from 'lucide-react';

// Mock data for demonstration
const mockDevice = {
  id: '1',
  deviceId: 'NEXUS-001',
  name: 'Water Tank Sensor',
  description: 'Primary water tank temperature and level monitoring',
  type: 'NEXUS_PROBE',
  status: 'Active',
  lastSeen: '2 minutes ago',
  battery: 85,
  signal: 92,
  location: 'Building A - Floor 1',
  firmware: 'v2.3.1',
  ipAddress: '192.168.1.100',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  registeredAt: '2024-01-15T10:30:00Z',
  tags: ['production', 'critical'],
};

const mockSensors: Sensor[] = [
  {
    id: '1',
    name: 'Tank Temperature',
    type: 'temperature',
    unit: '°C',
    interface: 'RS485',
    address: '1',
    samplingRate: 1000,
    enabled: true,
    minValue: -20,
    maxValue: 100,
    scaleFactor: 0.1,
    offset: 0,
    alertThresholds: { low: 5, high: 35 },
  },
  {
    id: '2',
    name: 'Water Level',
    type: 'level',
    unit: '%',
    interface: '4-20MA',
    address: '2',
    samplingRate: 5000,
    enabled: true,
    minValue: 0,
    maxValue: 100,
    scaleFactor: 6.25,
    offset: -25,
    alertThresholds: { low: 10, high: 95 },
  },
  {
    id: '3',
    name: 'Ambient Humidity',
    type: 'humidity',
    unit: '%RH',
    interface: 'ONEWIRE',
    address: '28-000000001234',
    samplingRate: 10000,
    enabled: false,
  },
];

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  Active: 'success',
  Maintenance: 'warning',
  Inactive: 'destructive',
};

export default function DeviceDetailPage() {
  useParams(); // Keep for potential future use with dynamic routing

  const [device] = useState(mockDevice);
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAddSensor = (sensor: Omit<Sensor, 'id'>) => {
    const newSensor: Sensor = {
      ...sensor,
      id: String(Date.now()),
    };
    setSensors((prev) => [...prev, newSensor]);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/devices">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
              <Badge variant={statusColors[device.status]}>{device.status}</Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{device.deviceId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <WrenchIcon className="mr-2 h-4 w-4" />
            Maintenance
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <BatteryIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Battery</p>
              <p className="text-2xl font-bold">{device.battery}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <SignalIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Signal</p>
              <p className="text-2xl font-bold">{device.signal}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sensors</p>
              <p className="text-2xl font-bold">{sensors.filter((s) => s.enabled).length}/{sensors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <ClockIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Seen</p>
              <p className="text-lg font-medium">{device.lastSeen}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <ActivityIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sensors">
            <ThermometerIcon className="mr-2 h-4 w-4" />
            Sensors
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings2Icon className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{device.type.replace('_', ' ')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Firmware</span>
                  <span className="font-medium">{device.firmware}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-mono text-sm">{device.ipAddress}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MAC Address</span>
                  <span className="font-mono text-sm">{device.macAddress}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-medium">
                    {new Date(device.registeredAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{device.location}</p>
                    <p className="text-sm text-muted-foreground">
                      Physical location of the device
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {device.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{device.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Sensor Readings</CardTitle>
                <CardDescription>Latest data from configured sensors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {sensors
                    .filter((s) => s.enabled)
                    .map((sensor) => (
                      <div
                        key={sensor.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <div className="rounded-full bg-primary/10 p-2">
                          <ThermometerIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{sensor.name}</p>
                          <p className="text-xl font-bold">
                            {sensor.type === 'temperature' && '23.5'}
                            {sensor.type === 'level' && '67'}
                            {sensor.type === 'humidity' && '45'}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                              {sensor.unit}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sensors Tab */}
        <TabsContent value="sensors" className="mt-6">
          <SensorConfiguration
            sensors={sensors}
            onAddSensor={handleAddSensor}
          />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="mt-6">
          <DeviceConfigurationForm
            initialConfig={{
              name: device.name,
              description: device.description,
              deviceType: device.type,
              serialNumber: device.deviceId,
              location: device.location,
              tags: device.tags,
              connectionType: 'TCP',
              host: device.ipAddress,
              port: 502,
              enabled: device.status === 'Active',
              samplingIntervalMs: 1000,
              batchSize: 100,
              retryAttempts: 3,
              timeoutMs: 5000,
              authMethod: 'NONE',
            }}
            onSave={(config) => {
              console.log('Save config:', config);
              alert('Configuration saved!');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
