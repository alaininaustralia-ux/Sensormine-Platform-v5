/**
 * Map Widget Configuration
 * 
 * Configuration panel for map widget-specific options including
 * map provider, markers, overlays, and interaction settings.
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WidgetConfigComponentProps } from './types';

export interface MapWidgetConfigType {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  showDeviceMarkers?: boolean;
  showAlertMarkers?: boolean;
  enableClustering?: boolean;
  mapStyle?: 'default' | 'satellite' | 'terrain';
}

export function MapWidgetConfig({
  config,
  onChange,
}: WidgetConfigComponentProps<MapWidgetConfigType>) {
  const updateConfig = (updates: Partial<MapWidgetConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Map Center</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="center-lat">Latitude</Label>
              <Input
                id="center-lat"
                type="number"
                step="0.000001"
                value={config.centerLat ?? 0}
                onChange={(e) => updateConfig({ centerLat: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 37.7749"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="center-lng">Longitude</Label>
              <Input
                id="center-lng"
                type="number"
                step="0.000001"
                value={config.centerLng ?? 0}
                onChange={(e) => updateConfig({ centerLng: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., -122.4194"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoom">Zoom Level</Label>
            <Input
              id="zoom"
              type="number"
              min="1"
              max="20"
              value={config.zoom ?? 10}
              onChange={(e) => updateConfig({ zoom: parseInt(e.target.value) || 10 })}
            />
            <div className="text-xs text-muted-foreground">
              1 = World view, 20 = Street level
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Map Style</h3>
        <Select
          value={config.mapStyle || 'default'}
          onValueChange={(value) => updateConfig({ mapStyle: value as MapWidgetConfigType['mapStyle'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="satellite">Satellite</SelectItem>
            <SelectItem value="terrain">Terrain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Markers</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-device-markers">Show Device Markers</Label>
              <div className="text-xs text-muted-foreground">
                Display markers for all devices
              </div>
            </div>
            <Switch
              id="show-device-markers"
              checked={config.showDeviceMarkers ?? true}
              onCheckedChange={(checked) => updateConfig({ showDeviceMarkers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-alert-markers">Show Alert Markers</Label>
              <div className="text-xs text-muted-foreground">
                Display markers for active alerts
              </div>
            </div>
            <Switch
              id="show-alert-markers"
              checked={config.showAlertMarkers ?? true}
              onCheckedChange={(checked) => updateConfig({ showAlertMarkers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-clustering">Enable Clustering</Label>
              <div className="text-xs text-muted-foreground">
                Group nearby markers into clusters
              </div>
            </div>
            <Switch
              id="enable-clustering"
              checked={config.enableClustering ?? true}
              onCheckedChange={(checked) => updateConfig({ enableClustering: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
