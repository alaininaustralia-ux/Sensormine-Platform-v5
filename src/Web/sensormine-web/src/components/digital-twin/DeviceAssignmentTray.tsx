'use client';

import React, { useState, useEffect } from 'react';
import { Asset } from '@/lib/api/digital-twin';
import { Device, getDevices } from '@/lib/api/devices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Search,
  Plus,
  Unlink,
  Loader2,
  HardDrive,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DeviceAssignmentTrayProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceAssignmentTray: React.FC<DeviceAssignmentTrayProps> = ({
  asset,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [assignedDevices, setAssignedDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices when tray opens
  useEffect(() => {
    if (isOpen) {
      fetchDevices();
      // TODO: Fetch assigned devices for this asset from mapping API
      fetchAssignedDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, asset?.id]);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDevices({ pageSize: 100 });
      setDevices(response.data.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedDevices = async () => {
    if (!asset?.id) return;
    
    // TODO: Call mapping API to get devices assigned to this asset
    // For now, using mock data
    setAssignedDevices([]);
  };

  const handleAssignDevice = async (device: Device) => {
    if (!asset) return;

    // TODO: Call mapping API to assign device to asset
    console.log('Assigning device', device.id, 'to asset', asset.id);
    
    // Optimistically update UI
    setAssignedDevices(prev => [...prev, device]);
  };

  const handleUnassignDevice = async (device: Device) => {
    if (!asset) return;

    // TODO: Call mapping API to unassign device from asset
    console.log('Unassigning device', device.id, 'from asset', asset.id);
    
    // Optimistically update UI
    setAssignedDevices(prev => prev.filter(d => d.id !== device.id));
  };

  const isDeviceAssigned = (deviceId: string) => {
    return assignedDevices.some(d => d.id === deviceId);
  };

  // Filter devices based on search query
  const filteredDevices = devices.filter(device => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      device.name.toLowerCase().includes(query) ||
      device.deviceId.toLowerCase().includes(query) ||
      device.serialNumber?.toLowerCase().includes(query) ||
      device.deviceTypeName?.toLowerCase().includes(query)
    );
  });

  // Separate assigned and unassigned devices
  const unassignedDevices = filteredDevices.filter(d => !isDeviceAssigned(d.id));
  const filteredAssignedDevices = assignedDevices.filter(device => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      device.name.toLowerCase().includes(query) ||
      device.deviceId.toLowerCase().includes(query) ||
      device.serialNumber?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Tray */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-[400px] bg-background border-l shadow-lg z-50',
          'transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">Assign Devices</h3>
              {asset && (
                <p className="text-sm text-muted-foreground truncate">
                  {asset.name}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-destructive">{error}</div>
            ) : (
              <div className="p-4 space-y-6">
                {/* Assigned Devices Section */}
                {filteredAssignedDevices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-semibold">Assigned Devices</h4>
                      <Badge variant="secondary" className="text-xs">
                        {filteredAssignedDevices.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {filteredAssignedDevices.map((device) => (
                        <DeviceCard
                          key={device.id}
                          device={device}
                          isAssigned={true}
                          onUnassign={() => handleUnassignDevice(device)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredAssignedDevices.length > 0 && unassignedDevices.length > 0 && (
                  <Separator />
                )}

                {/* Available Devices Section */}
                {unassignedDevices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-semibold">Available Devices</h4>
                      <Badge variant="outline" className="text-xs">
                        {unassignedDevices.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {unassignedDevices.map((device) => (
                        <DeviceCard
                          key={device.id}
                          device={device}
                          isAssigned={false}
                          onAssign={() => handleAssignDevice(device)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredDevices.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? 'No devices found' : 'No devices available'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

interface DeviceCardProps {
  device: Device;
  isAssigned: boolean;
  onAssign?: () => void;
  onUnassign?: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isAssigned,
  onAssign,
  onUnassign,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-400';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="p-3 border rounded-lg hover:border-primary/50 transition-colors bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
            <h5 className="font-medium text-sm truncate">{device.name}</h5>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {device.deviceId}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className={cn('h-2 w-2 rounded-full', getStatusColor(device.status))} />
          {isAssigned ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onUnassign}
              title="Unassign device"
            >
              <Unlink className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onAssign}
              title="Assign device"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {device.deviceTypeName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span className="truncate">{device.deviceTypeName}</span>
          </div>
        )}
        {device.serialNumber && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="truncate">S/N: {device.serialNumber}</span>
          </div>
        )}
        {device.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">
              {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {device.status && (
        <Badge variant="outline" className="text-xs mt-2">
          {device.status}
        </Badge>
      )}
    </div>
  );
};
