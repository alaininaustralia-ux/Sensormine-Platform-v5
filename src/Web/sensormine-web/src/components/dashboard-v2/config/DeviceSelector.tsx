/**
 * DeviceSelector Component
 * 
 * Simple searchable device selector for widgets
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getDevices } from '@/lib/api/devices';
import type { Device } from '@/lib/api/devices';

interface DeviceSelectorProps {
  value?: string; // deviceId
  onChange: (deviceId: string | undefined, device?: Device) => void;
  placeholder?: string;
}

export function DeviceSelector({ value, onChange, placeholder = 'Select device...' }: DeviceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch devices on mount
  useEffect(() => {
    async function fetchDevices() {
      setLoading(true);
      try {
        console.log('[DeviceSelector] Fetching devices from API...');
        const response = await getDevices({ pageSize: 1000 });
        console.log('[DeviceSelector] API response received:', {
          status: response.status,
          deviceCount: response.data?.devices?.length || 0,
          data: response.data
        });
        
        if (response.data && response.data.devices) {
          console.log('[DeviceSelector] Successfully loaded devices:', response.data.devices.length);
          setDevices(response.data.devices);
        } else {
          console.error('[DeviceSelector] No devices in response');
        }
      } catch (error) {
        console.error('[DeviceSelector] Failed to fetch devices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  const selectedDevice = devices.find(d => d.id === value);

  // Filter devices by search query
  const filteredDevices = useMemo(() => {
    if (!searchQuery) return devices;
    const query = searchQuery.toLowerCase();
    return devices.filter(d => 
      d.name.toLowerCase().includes(query) ||
      d.deviceId.toLowerCase().includes(query) ||
      d.serialNumber?.toLowerCase().includes(query)
    );
  }, [devices, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading devices...
            </>
          ) : selectedDevice ? (
            <span className="truncate">{selectedDevice.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search devices..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading...' : 'No devices found.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredDevices.map((device) => (
                <CommandItem
                  key={device.id}
                  value={device.id}
                  onSelect={() => {
                    console.log('[DeviceSelector] Device selected:', device.id, device.name);
                    onChange(device.id === value ? undefined : device.id, device);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === device.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium">{device.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {device.deviceTypeName || 'Unknown Type'} • {device.serialNumber || device.deviceId}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
