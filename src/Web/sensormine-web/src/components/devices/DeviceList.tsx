/**
 * Device List Component
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BatteryIcon,
  PlusIcon,
  SearchIcon,
  SignalIcon,
  WifiIcon,
} from 'lucide-react';

// Mock data for demonstration
const mockDevices = [
  {
    id: '1',
    deviceId: 'NEXUS-001',
    name: 'Water Tank Sensor',
    type: 'NEXUS_PROBE',
    status: 'Active',
    lastSeen: '2 minutes ago',
    battery: 85,
    signal: 92,
    location: 'Building A - Floor 1',
    sensors: 3,
  },
  {
    id: '2',
    deviceId: 'NEXUS-002',
    name: 'HVAC Monitor',
    type: 'NEXUS_PROBE',
    status: 'Active',
    lastSeen: '5 minutes ago',
    battery: 72,
    signal: 88,
    location: 'Building A - Floor 2',
    sensors: 4,
  },
  {
    id: '3',
    deviceId: 'MODBUS-001',
    name: 'PLC Gateway',
    type: 'MODBUS_TCP',
    status: 'Maintenance',
    lastSeen: '1 hour ago',
    battery: null,
    signal: 95,
    location: 'Factory Floor',
    sensors: 12,
  },
  {
    id: '4',
    deviceId: 'OPCUA-001',
    name: 'SCADA Interface',
    type: 'OPC_UA',
    status: 'Active',
    lastSeen: '30 seconds ago',
    battery: null,
    signal: 100,
    location: 'Control Room',
    sensors: 24,
  },
  {
    id: '5',
    deviceId: 'NEXUS-003',
    name: 'Environmental Monitor',
    type: 'NEXUS_PROBE',
    status: 'Inactive',
    lastSeen: '3 days ago',
    battery: 12,
    signal: 0,
    location: 'Storage Area',
    sensors: 2,
  },
];

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  Active: 'success',
  Maintenance: 'warning',
  Inactive: 'destructive',
};

export function DeviceList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredDevices = mockDevices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesType = typeFilter === 'all' || device.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="NEXUS_PROBE">Nexus Probe</SelectItem>
                <SelectItem value="MODBUS_TCP">Modbus TCP</SelectItem>
                <SelectItem value="OPC_UA">OPC UA</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/devices/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Device Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((device) => (
          <Link key={device.id} href={`/devices/${device.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {device.deviceId}
                    </CardDescription>
                  </div>
                  <Badge variant={statusColors[device.status]}>{device.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{device.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{device.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sensors</span>
                    <span className="font-medium">{device.sensors} configured</span>
                  </div>
                  <div className="flex items-center gap-4 border-t pt-3">
                    {device.battery !== null && (
                      <div className="flex items-center gap-1 text-sm">
                        <BatteryIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{device.battery}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm">
                      <SignalIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{device.signal}%</span>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {device.lastSeen}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WifiIcon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No devices found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
