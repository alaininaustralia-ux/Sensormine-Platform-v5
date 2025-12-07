/**
 * Device List Widget Configuration
 * 
 * Configuration panel for device list widget-specific options including
 * filtering, columns, and navigation settings.
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { WidgetConfigComponentProps } from './types';

export interface DeviceListWidgetConfigType {
  showSearch?: boolean;
  showFilters?: boolean;
  showStatus?: boolean;
  showLocation?: boolean;
  showLastSeen?: boolean;
  enableDrillDown?: boolean;
  detailSubPageId?: string;
  maxRows?: number;
}

export function DeviceListWidgetConfig({
  config,
  onChange,
}: WidgetConfigComponentProps<DeviceListWidgetConfigType>) {
  const updateConfig = (updates: Partial<DeviceListWidgetConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Display Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-search">Show Search</Label>
            <Switch
              id="show-search"
              checked={config.showSearch ?? true}
              onCheckedChange={(checked) => updateConfig({ showSearch: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-filters">Show Filters</Label>
            <Switch
              id="show-filters"
              checked={config.showFilters ?? true}
              onCheckedChange={(checked) => updateConfig({ showFilters: checked })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Column Visibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-status">Show Status Column</Label>
            <Switch
              id="show-status"
              checked={config.showStatus ?? true}
              onCheckedChange={(checked) => updateConfig({ showStatus: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-location">Show Location Column</Label>
            <Switch
              id="show-location"
              checked={config.showLocation ?? true}
              onCheckedChange={(checked) => updateConfig({ showLocation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-last-seen">Show Last Seen Column</Label>
            <Switch
              id="show-last-seen"
              checked={config.showLastSeen ?? true}
              onCheckedChange={(checked) => updateConfig({ showLastSeen: checked })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Navigation</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-drill-down">Enable Drill-Down</Label>
              <div className="text-xs text-muted-foreground">
                Allow navigation to device detail pages
              </div>
            </div>
            <Switch
              id="enable-drill-down"
              checked={config.enableDrillDown ?? true}
              onCheckedChange={(checked) => updateConfig({ enableDrillDown: checked })}
            />
          </div>

          {config.enableDrillDown && (
            <div className="space-y-2">
              <Label htmlFor="detail-subpage-id">Detail Page ID</Label>
              <Input
                id="detail-subpage-id"
                value={config.detailSubPageId || ''}
                onChange={(e) => updateConfig({ detailSubPageId: e.target.value })}
                placeholder="Optional sub-page ID"
              />
              <div className="text-xs text-muted-foreground">
                Link to a specific sub-page when clicking a device
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Display Limits</h3>
        <div className="space-y-2">
          <Label htmlFor="max-rows">Maximum Rows</Label>
          <Input
            id="max-rows"
            type="number"
            min="5"
            max="100"
            value={config.maxRows ?? 20}
            onChange={(e) => updateConfig({ maxRows: parseInt(e.target.value) || 20 })}
          />
          <div className="text-xs text-muted-foreground">
            Limit the number of devices displayed
          </div>
        </div>
      </div>
    </div>
  );
}
