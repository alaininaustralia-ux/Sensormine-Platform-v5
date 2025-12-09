'use client';

import React, { useState } from 'react';
import {
  Building2,
  Boxes,
  Box,
  MapPin,
  Layers,
  Cpu,
  Component as ComponentIcon,
  Settings2,
  Gauge,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Activity,
  Radio,
  Wifi,
  Server,
  Database,
  HardDrive,
  Factory,
  Warehouse,
  Home,
  Building,
  Castle,
  Church,
  Store,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const AVAILABLE_ICONS: Record<string, LucideIcon> = {
  // Buildings & Structures
  building2: Building2,
  building: Building,
  factory: Factory,
  warehouse: Warehouse,
  home: Home,
  castle: Castle,
  church: Church,
  store: Store,
  
  // Equipment & Components
  boxes: Boxes,
  box: Box,
  cpu: Cpu,
  component: ComponentIcon,
  settings2: Settings2,
  server: Server,
  database: Database,
  hardDrive: HardDrive,
  
  // Sensors & Monitoring
  gauge: Gauge,
  thermometer: Thermometer,
  droplets: Droplets,
  wind: Wind,
  zap: Zap,
  activity: Activity,
  
  // Connectivity
  radio: Radio,
  wifi: Wifi,
  
  // Location & Organization
  mapPin: MapPin,
  layers: Layers,
};

export interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
  label?: string;
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = 'Icon',
  className,
}) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filteredIcons = Object.entries(AVAILABLE_ICONS).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon = value ? AVAILABLE_ICONS[value] : Box;

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            type="button"
          >
            <SelectedIcon className="h-4 w-4 mr-2" />
            {value || 'Select icon'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto">
              {filteredIcons.map(([name, Icon]) => (
                <Button
                  key={name}
                  variant={value === name ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10"
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  title={name}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No icons found
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
