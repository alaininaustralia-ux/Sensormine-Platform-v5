/**
 * Gauge Widget Configuration
 * 
 * Configuration panel for gauge widget-specific options including
 * gauge style, ranges, colors, and display preferences.
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WidgetConfigComponentProps } from './types';

export interface GaugeWidgetConfigType {
  gaugeType?: 'circular' | 'linear';
  min?: number;
  max?: number;
  unit?: string;
  showValue?: boolean;
  showMinMax?: boolean;
  colorRanges?: Array<{
    from: number;
    to: number;
    color: string;
  }>;
}

export function GaugeWidgetConfig({
  config,
  onChange,
}: WidgetConfigComponentProps<GaugeWidgetConfigType>) {
  const updateConfig = (updates: Partial<GaugeWidgetConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Gauge Style</h3>
        <Select
          value={config.gaugeType || 'circular'}
          onValueChange={(value) =>
            updateConfig({ gaugeType: value as GaugeWidgetConfigType['gaugeType'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circular">Circular Gauge</SelectItem>
            <SelectItem value="linear">Linear Gauge</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Range</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gauge-min">Minimum Value</Label>
              <Input
                id="gauge-min"
                type="number"
                value={config.min ?? 0}
                onChange={(e) => updateConfig({ min: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gauge-max">Maximum Value</Label>
              <Input
                id="gauge-max"
                type="number"
                value={config.max ?? 100}
                onChange={(e) => updateConfig({ max: parseFloat(e.target.value) || 100 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gauge-unit">Unit Label</Label>
            <Input
              id="gauge-unit"
              value={config.unit || ''}
              onChange={(e) => updateConfig({ unit: e.target.value })}
              placeholder="e.g., %, °C, PSI"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-value">Show Value</Label>
            <Switch
              id="show-value"
              checked={config.showValue ?? true}
              onCheckedChange={(checked) => updateConfig({ showValue: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-min-max">Show Min/Max Labels</Label>
            <Switch
              id="show-min-max"
              checked={config.showMinMax ?? true}
              onCheckedChange={(checked) => updateConfig({ showMinMax: checked })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Color Ranges</h3>
        <div className="text-xs text-muted-foreground mb-2">
          Define color ranges for different value zones (e.g., green for normal, yellow for warning, red for critical)
        </div>
        <div className="text-sm text-muted-foreground p-4 border rounded-md">
          Color range editor coming soon
        </div>
      </div>
    </div>
  );
}
