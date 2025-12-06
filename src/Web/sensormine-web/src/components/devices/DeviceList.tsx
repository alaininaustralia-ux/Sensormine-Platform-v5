/**
 * Device List Component
 */

'use client';

import { useState, useEffect } from 'react';
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
  RefreshCwIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { getDevices, type ApiDevice } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

// Extended device type for UI display
interface DeviceDisplay extends ApiDevice {
  battery?: number | null;
  signal?: number | null;
  sensors?: number;
}

// Mock data for demonstration (fallback)
const mockDevices: DeviceDisplay[] = [
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
    schemaName: 'Water Tank Telemetry',
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
    schemaName: 'HVAC Sensor Data',
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
    schemaName: 'Industrial PLC Schema',
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
    schemaName: 'SCADA Telemetry',
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
    schemaName: undefined,
  },
];

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  Active: 'success',
  Maintenance: 'warning',
  Inactive: 'destructive',
};

export function DeviceList() {
  const [devices, setDevices] = useState<DeviceDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching devices from API...');
      const response = await getDevices();
      console.log('Devices API response:', response);
      
      // Map API devices to display format
      const displayDevices: DeviceDisplay[] = response.data.devices.map(device => ({
        ...device,
        // Extract metadata if available
        battery: device.metadata?.battery ? Number(device.metadata.battery) : null,
        signal: device.metadata?.signal ? Number(device.metadata.signal) : null,
        sensors: device.customFieldValues?.sensorCount ? Number(device.customFieldValues.sensorCount) : 0,
      }));
      
      console.log('Mapped devices:', displayDevices);
      setDevices(displayDevices);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      
      // Check if it's a 404 (no devices found) - treat as empty array
      if (err instanceof Error && err.message === 'Not Found') {
        console.log('Got 404, treating as empty device list');
        setDevices([]);
        setError(null); // Clear error - empty state is valid
      } else {
        const errorMsg = `Failed to load devices: ${err instanceof Error ? err.message : 'Unknown error'}. Using mock data.`;
        console.warn(errorMsg);
        setError(errorMsg);
        // Fallback to mock data on other errors
        setDevices(mockDevices);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || device.deviceTypeName?.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique device types and statuses for filters
  const deviceTypes = Array.from(new Set(devices.map(d => d.deviceTypeName).filter(Boolean))) as string[];
  const deviceStatuses = Array.from(new Set(devices.map(d => d.status)));

  const formatLastSeen = (lastSeenAt?: string) => {
    if (!lastSeenAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                disabled={loading}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {deviceStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {deviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDevices}
              disabled={loading}
              title="Refresh devices"
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/devices/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCwIcon className="h-12 w-12 text-muted-foreground animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">Loading devices...</h3>
          </CardContent>
        </Card>
      )}

      {/* Device Grid */}
      {!loading && (
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
                    <Badge variant={statusColors[device.status] || 'secondary'}>
                      {device.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">
                        {device.deviceTypeName || 'Unknown'}
                      </span>
                    </div>
                    {device.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium text-xs">
                          {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {device.serialNumber && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Serial</span>
                        <span className="font-medium font-mono text-xs">
                          {device.serialNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Schema</span>
                      <span className="font-medium text-xs">
                        {device.schemaName || (
                          <span className="italic text-muted-foreground">Not set</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 border-t pt-3">
                      {device.battery !== null && device.battery !== undefined && (
                        <div className="flex items-center gap-1 text-sm">
                          <BatteryIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{device.battery}%</span>
                        </div>
                      )}
                      {device.signal !== null && device.signal !== undefined && (
                        <div className="flex items-center gap-1 text-sm">
                          <SignalIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{device.signal}%</span>
                        </div>
                      )}
                      <div className="ml-auto text-xs text-muted-foreground">
                        {formatLastSeen(device.lastSeenAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredDevices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WifiIcon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No devices found</h3>
            <p className="text-sm text-muted-foreground">
              {devices.length === 0 
                ? 'Get started by registering your first device'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {devices.length === 0 && (
              <Link href="/devices/new" className="mt-4">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Register Device
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
