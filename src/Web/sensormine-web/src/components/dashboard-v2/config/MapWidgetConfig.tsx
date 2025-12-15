'use client';

// Map Widget Configuration

import { useState, useEffect } from 'react';
import type { Widget, SubDashboardConfig } from '@/lib/types/dashboard-v2';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getAllDeviceTypes } from '@/lib/api/deviceTypes';
import { getDevicesByType } from '@/lib/api/devices';
import { SubDashboardManager } from './SubDashboardManager';
import { Loader2 } from 'lucide-react';

interface MapWidgetConfigProps {
  widget: Widget;
  onChange: (config: Partial<Widget['config']>) => void;
  onBehaviorChange?: (behavior: Partial<Widget['behavior']>) => void;
}

export function MapWidgetConfig({ widget, onChange, onBehaviorChange }: MapWidgetConfigProps) {
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [devices, setDevices] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingDeviceTypes, setLoadingDeviceTypes] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const handleSubDashboardsChange = (subDashboards: SubDashboardConfig[]) => {
    if (onBehaviorChange) {
      onBehaviorChange({
        ...widget.behavior,
        drillDown: {
          ...widget.behavior?.drillDown,
          enabled: subDashboards.length > 0,
          subDashboards,
        },
      });
    }
  };

  // Fetch device types on mount
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await getAllDeviceTypes(1, 100);
        setDeviceTypes(response.items.map(dt => ({ id: dt.id, name: dt.name })));
      } catch (error) {
        console.error('Failed to fetch device types:', error);
      } finally {
        setLoadingDeviceTypes(false);
      }
    };

    fetchDeviceTypes();
  }, []);

  // Fetch devices when device type changes
  useEffect(() => {
    const fetchDevices = async () => {
      if (!widget.dataSource.deviceTypeId) {
        setDevices([]);
        return;
      }

      try {
        setLoadingDevices(true);
        const response = await getDevicesByType(widget.dataSource.deviceTypeId!);
        
        // Filter devices that have location data
        const devicesWithLocation = response.data.filter(d => 
          d.location?.latitude != null && d.location?.longitude != null
        );
        
        setDevices(devicesWithLocation.map(d => ({ id: d.id, name: d.name })));
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, [widget.dataSource.deviceTypeId]);

  const handleDataSourceChange = (field: string, value: unknown) => {
    const currentWidget = widget as Widget;
    onChange({
      ...currentWidget.config,
      dataSource: {
        ...currentWidget.dataSource,
        [field]: value,
      },
    } as Partial<typeof widget.config>);
  };

  const handleBehaviorChange = (field: string, value: unknown) => {
    const currentWidget = widget as Widget;
    onChange({
      ...currentWidget.config,
      behavior: {
        ...currentWidget.behavior,
        [field]: value,
      },
    } as Partial<typeof widget.config>);
  };

  return (
    <div className="space-y-6">
      {/* Data Source Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Data Source</h4>
        
        {/* Device Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="deviceType">Device Type</Label>
          {loadingDeviceTypes ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading device types...
            </div>
          ) : (
            <Select
              value={widget.dataSource.deviceTypeId || 'all'}
              onValueChange={(value) => {
                handleDataSourceChange('deviceTypeId', value === 'all' ? undefined : value);
                handleDataSourceChange('deviceIds', []); // Clear specific devices when type changes
              }}
            >
              <SelectTrigger id="deviceType">
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Device Types</SelectItem>
                {deviceTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Show devices of a specific type or all devices with GPS coordinates
          </p>
        </div>

        {/* Specific Devices (Optional) */}
        {widget.dataSource.deviceTypeId && devices.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="specificDevices">Specific Devices (Optional)</Label>
            {loadingDevices ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading devices...
              </div>
            ) : (
              <>
                <Select
                  value={(widget.dataSource.deviceIds?.[0]) || 'all'}
                  onValueChange={(value) => {
                    handleDataSourceChange('deviceIds', value === 'all' ? [] : [value]);
                  }}
                >
                  <SelectTrigger id="specificDevices">
                    <SelectValue placeholder="All devices of type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All devices of type</SelectItem>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {devices.length} device{devices.length !== 1 ? 's' : ''} with GPS coordinates
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Auto-Refresh Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Refresh Settings</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="autoRefresh">Auto Refresh</Label>
            <p className="text-xs text-muted-foreground">
              Automatically refresh device locations
            </p>
          </div>
          <Switch
            id="autoRefresh"
            checked={widget.behavior?.autoRefresh || false}
            onCheckedChange={(checked) => handleBehaviorChange('autoRefresh', checked)}
          />
        </div>

        {widget.behavior?.autoRefresh && (
          <div className="space-y-2">
            <Label htmlFor="refreshInterval">Refresh Interval</Label>
            <Select
              value={widget.behavior?.refreshInterval || '1m'}
              onValueChange={(value) => handleBehaviorChange('refreshInterval', value)}
            >
              <SelectTrigger id="refreshInterval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10s">Every 10 seconds</SelectItem>
                <SelectItem value="30s">Every 30 seconds</SelectItem>
                <SelectItem value="1m">Every minute</SelectItem>
                <SelectItem value="5m">Every 5 minutes</SelectItem>
                <SelectItem value="10m">Every 10 minutes</SelectItem>
                <SelectItem value="30m">Every 30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Display Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Display Settings</h4>
        
        <div className="space-y-2">
          <Label htmlFor="mapStyle">Map Style</Label>
          <Select
            value={widget.config.mapStyle || 'default'}
            onValueChange={(value) => onChange({ ...widget.config, mapStyle: value })}
          >
            <SelectTrigger id="mapStyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (OpenStreetMap)</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Note: Satellite and terrain require additional configuration
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showPopups">Show Device Popups</Label>
            <p className="text-xs text-muted-foreground">
              Display device details on marker click
            </p>
          </div>
          <Switch
            id="showPopups"
            checked={widget.config.showPopups !== false}
            onCheckedChange={(checked) => onChange({ ...widget.config, showPopups: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showStatusColors">Color Code by Status</Label>
            <p className="text-xs text-muted-foreground">
              Green (online), yellow (warning), red (offline)
            </p>
          </div>
          <Switch
            id="showStatusColors"
            checked={widget.config.showStatusColors !== false}
            onCheckedChange={(checked) => onChange({ ...widget.config, showStatusColors: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Sub-Dashboards Configuration */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Drill-Through Sub-Dashboards</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Configure sub-dashboards that open when clicking on devices in the map
          </p>
        </div>

        <SubDashboardManager
          subDashboards={widget.behavior?.drillDown?.subDashboards || []}
          onChange={handleSubDashboardsChange}
          widgetType="map"
        />
      </div>
    </div>
  );
}
