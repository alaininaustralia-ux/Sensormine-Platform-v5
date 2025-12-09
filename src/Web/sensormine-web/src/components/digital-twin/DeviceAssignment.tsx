'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, CheckCircle2, Circle, Cpu, MoveRight, X, Loader2 } from 'lucide-react';
import { Asset } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getDevices, type Device as ApiDevice } from '@/lib/api/devices';

// Device type for assignment
interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  assetId?: string;
  deviceTypeId?: string;
  deviceTypeName?: string;
}

interface DeviceCardProps {
  device: Device;
  onAssign: (deviceId: string) => void;
  onUnassign: (deviceId: string) => void;
  selectedAssetId?: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onAssign, onUnassign, selectedAssetId }) => {
  const isAssignedToSelected = device.assetId === selectedAssetId;
  const isAssignedElsewhere = device.assetId && device.assetId !== selectedAssetId;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border rounded-md bg-background',
        isAssignedToSelected && 'border-green-500 bg-green-50 dark:bg-green-950',
        isAssignedElsewhere && 'opacity-50'
      )}
    >
      <Cpu className="h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{device.name}</p>
        <p className="text-xs text-muted-foreground truncate">{device.type}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
        {isAssignedToSelected ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUnassign(device.id)}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Unassign
          </Button>
        ) : !isAssignedElsewhere && selectedAssetId ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAssign(device.id)}
            className="h-7 text-xs"
          >
            <MoveRight className="h-3 w-3 mr-1" />
            Assign
          </Button>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};

export const DeviceAssignment: React.FC = () => {
  const { selectedAsset } = useDigitalTwinStore();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignment, setFilterAssignment] = useState<string>('all');

  // Load devices from API
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        const response = await getDevices({ page: 1, pageSize: 100 });
        
        // Transform API devices to our Device interface
        const transformedDevices: Device[] = response.data.devices.map((apiDevice: ApiDevice) => ({
          id: apiDevice.id,
          name: apiDevice.name,
          type: apiDevice.deviceTypeName || 'Unknown',
          status: apiDevice.status === 'Active' ? 'online' : 'offline',
          deviceTypeId: apiDevice.deviceTypeId,
          deviceTypeName: apiDevice.deviceTypeName,
          assetId: undefined, // TODO: Load from device-asset mappings
        }));
        
        setDevices(transformedDevices);
      } catch (error) {
        console.error('Failed to load devices:', error);
        toast({
          title: 'Error',
          description: 'Failed to load devices from API',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, [toast]);

  const handleAssign = (deviceId: string) => {
    if (!selectedAsset) return;

    setDevices((prev) =>
      prev.map((dev) =>
        dev.id === deviceId ? { ...dev, assetId: selectedAsset.id } : dev
      )
    );

    const device = devices.find((d) => d.id === deviceId);
    toast({
      title: 'Device Assigned',
      description: `${device?.name} has been assigned to ${selectedAsset.name}`,
    });

    // TODO: Call API to persist assignment
    console.log(`Assigned device ${deviceId} to asset ${selectedAsset.id}`);
  };

  const handleUnassign = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    const assetName = selectedAsset?.name || 'asset';

    setDevices((prev) =>
      prev.map((dev) =>
        dev.id === deviceId ? { ...dev, assetId: undefined } : dev
      )
    );

    toast({
      title: 'Device Unassigned',
      description: `${device?.name} has been removed from ${assetName}`,
    });

    // TODO: Call API to persist unassignment
    console.log(`Unassigned device ${deviceId}`);
  };

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || !filterStatus || device.status === filterStatus;

    const matchesAssignment =
      filterAssignment === 'all' ||
      !filterAssignment ||
      (filterAssignment === 'assigned' && device.assetId) ||
      (filterAssignment === 'unassigned' && !device.assetId);

    return matchesSearch && matchesStatus && matchesAssignment;
  });

  // Get assignment count for selected asset
  const assignedToSelectedCount = selectedAsset 
    ? devices.filter((d) => d.assetId === selectedAsset.id).length 
    : 0;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Available Devices</CardTitle>
          <CardDescription>Loading devices...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Available Devices</CardTitle>
            <CardDescription>
              {selectedAsset ? (
                <>
                  Assign devices to <strong>{selectedAsset.name}</strong>
                  {assignedToSelectedCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {assignedToSelectedCount} assigned
                    </Badge>
                  )}
                </>
              ) : (
                'Select an asset from the tree to assign devices'
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAssignment} onValueChange={setFilterAssignment}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All devices</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device List */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-2 pr-4">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                selectedAssetId={selectedAsset?.id}
              />
            ))}
            {filteredDevices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No devices found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
