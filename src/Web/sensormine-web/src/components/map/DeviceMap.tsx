/**
 * Device Map Component
 * Interactive map showing devices with GPS coordinates
 */

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface DeviceType {
  id: string;
  name: string;
}

interface Device {
  id: string;
  deviceId: string;
  name: string;
  deviceTypeId: string;
  deviceTypeName: string;
  location: Location;
  status: string;
  lastSeenAt?: string;
}

export function DeviceMap() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch device types
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await fetch('/api/devicetype', {
          headers: {
            'X-Tenant-Id': '00000000-0000-0000-0000-000000000001',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch device types');
        }

        const data = await response.json();
        
        // Handle paginated response
        if (data.items && Array.isArray(data.items)) {
          setDeviceTypes(data.items);
        } else if (Array.isArray(data)) {
          setDeviceTypes(data);
        } else {
          console.error('Device types response is not an array:', data);
          setDeviceTypes([]);
        }
      } catch (err) {
        console.error('Error fetching device types:', err);
        setDeviceTypes([]);
      }
    };

    fetchDeviceTypes();
  }, []);

  // Fetch devices with GPS
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      setError(null);

      try {
        const url =
          selectedDeviceType === 'all'
            ? '/api/Device/with-gps'
            : `/api/Device/with-gps?deviceTypeId=${selectedDeviceType}`;

        const response = await fetch(url, {
          headers: {
            'X-Tenant-Id': '00000000-0000-0000-0000-000000000001',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }

        const data = await response.json();
        
        // Handle paginated response
        if (data.items && Array.isArray(data.items)) {
          setDevices(data.items);
        } else if (Array.isArray(data)) {
          setDevices(data);
        } else {
          console.error('Devices response is not an array:', data);
          setDevices([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [selectedDeviceType]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">
              {devices.length} device{devices.length !== 1 ? 's' : ''} with GPS
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Label htmlFor="device-type-filter">Filter by type:</Label>
            <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
              <SelectTrigger id="device-type-filter" className="w-[200px]">
                <SelectValue placeholder="All device types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All device types</SelectItem>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MapPin className="h-12 w-12 mb-2" />
            <p>No devices with GPS coordinates found</p>
            <p className="text-sm">
              {selectedDeviceType !== 'all'
                ? 'Try selecting a different device type'
                : 'Add GPS coordinates to devices to see them on the map'}
            </p>
          </div>
        ) : (
          <MapView devices={devices} />
        )}
      </Card>
    </div>
  );
}
