/**
 * DeviceTypeSelector Component
 * 
 * Dropdown/Combobox for selecting a device type
 * Displays device type name, description, and device count
 */

'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { getAllDeviceTypes } from '@/lib/api/deviceTypes';
import type { DeviceType } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface DeviceTypeSelectorProps {
  value?: string;
  onChange: (deviceTypeId: string | undefined) => void;
  placeholder?: string;
}

export function DeviceTypeSelector({
  value,
  onChange,
  placeholder = 'Select device type...',
}: DeviceTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load device types on mount
  useEffect(() => {
    loadDeviceTypes();
  }, []);

  async function loadDeviceTypes() {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllDeviceTypes();
      setDeviceTypes(response.items);
    } catch (err) {
      console.error('Failed to load device types:', err);
      setError('Failed to load device types');
    } finally {
      setLoading(false);
    }
  }

  const selectedDeviceType = deviceTypes.find((dt) => dt.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : selectedDeviceType ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedDeviceType.name}</span>
              {(selectedDeviceType as any).deviceCount !== undefined && (
                <Badge variant="secondary" className="ml-auto">
                  {(selectedDeviceType as any).deviceCount}
                </Badge>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search device types..." />
          <CommandEmpty>
            {error ? (
              <div className="text-sm text-destructive p-4">
                {error}
                <Button
                  variant="link"
                  size="sm"
                  onClick={loadDeviceTypes}
                  className="ml-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              'No device types found.'
            )}
          </CommandEmpty>
          <CommandGroup>
            {deviceTypes.map((deviceType) => (
              <CommandItem
                key={deviceType.id}
                value={deviceType.name}
                onSelect={() => {
                  onChange(deviceType.id === value ? undefined : deviceType.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === deviceType.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{deviceType.name}</span>
                    {deviceType.deviceCount !== undefined && (
                      <Badge variant="secondary" className="ml-auto">
                        {deviceType.deviceCount} devices
                      </Badge>
                    )}
                  </div>
                  {deviceType.description && (
                    <span className="text-sm text-muted-foreground">
                      {deviceType.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
