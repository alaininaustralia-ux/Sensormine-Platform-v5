/**
 * Chart Widget Configuration
 * 
 * Configuration panel for chart widget-specific options including
 * chart type, colors, axes, and visualization settings.
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WidgetConfigComponentProps } from './types';

export interface ChartWidgetConfigType {
  chartType?: 'line' | 'bar' | 'area';
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  enableZoom?: boolean;
  colorScheme?: 'default' | 'blue' | 'green' | 'red' | 'purple';
  yAxisLabel?: string;
  xAxisLabel?: string;
  minY?: number;
  maxY?: number;
}

export function ChartWidgetConfig({
  config,
  onChange,
}: WidgetConfigComponentProps<ChartWidgetConfigType>) {
  const updateConfig = (updates: Partial<ChartWidgetConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Chart Type</h3>
        <Select
          value={config.chartType || 'line'}
          onValueChange={(value) =>
            updateConfig({ chartType: value as ChartWidgetConfigType['chartType'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="area">Area Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-legend">Show Legend</Label>
            <Switch
              id="show-legend"
              checked={config.showLegend ?? true}
              onCheckedChange={(checked) => updateConfig({ showLegend: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-grid">Show Grid</Label>
            <Switch
              id="show-grid"
              checked={config.showGrid ?? true}
              onCheckedChange={(checked) => updateConfig({ showGrid: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-tooltip">Show Tooltip</Label>
            <Switch
              id="show-tooltip"
              checked={config.showTooltip ?? true}
              onCheckedChange={(checked) => updateConfig({ showTooltip: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enable-zoom">Enable Zoom</Label>
            <Switch
              id="enable-zoom"
              checked={config.enableZoom ?? false}
              onCheckedChange={(checked) => updateConfig({ enableZoom: checked })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Color Scheme</h3>
        <Select
          value={config.colorScheme || 'default'}
          onValueChange={(value) =>
            updateConfig({ colorScheme: value as ChartWidgetConfigType['colorScheme'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="red">Red</SelectItem>
            <SelectItem value="purple">Purple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Axes Labels</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="x-axis-label">X-Axis Label</Label>
            <Input
              id="x-axis-label"
              value={config.xAxisLabel || ''}
              onChange={(e) => updateConfig({ xAxisLabel: e.target.value })}
              placeholder="e.g., Time"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="y-axis-label">Y-Axis Label</Label>
            <Input
              id="y-axis-label"
              value={config.yAxisLabel || ''}
              onChange={(e) => updateConfig({ yAxisLabel: e.target.value })}
              placeholder="e.g., Value"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Y-Axis Range</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-y">Min Value</Label>
              <Input
                id="min-y"
                type="number"
                value={config.minY ?? ''}
                onChange={(e) => updateConfig({ minY: parseFloat(e.target.value) || undefined })}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-y">Max Value</Label>
              <Input
                id="max-y"
                type="number"
                value={config.maxY ?? ''}
                onChange={(e) => updateConfig({ maxY: parseFloat(e.target.value) || undefined })}
                placeholder="Auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
