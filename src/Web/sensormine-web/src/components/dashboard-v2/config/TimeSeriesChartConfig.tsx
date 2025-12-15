/**
 * TimeSeriesChartConfig Component
 * 
 * Configuration panel for Time-Series Chart widgets
 * Simplified: Device selection + Field selection
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DeviceSelector } from './DeviceSelector';
import { DeviceFieldSelector } from './DeviceFieldSelector';
import { SubDashboardParameterFilter } from './SubDashboardParameterFilter';
import type { Widget } from '@/lib/types/dashboard-v2';
import type { Device } from '@/lib/api/devices';

interface TimeSeriesChartConfigProps {
  widget: Widget;
  onChange: (config: Partial<Widget['config']>) => void;
}

interface TimeSeriesChartWidgetConfig {
  // Data
  deviceId?: string; // Database UUID (passed to Query.API)
  deviceName?: string; // Friendly name for display
  fields: string[]; // Multiple fields = multiple series
  timeRange: 'last-1h' | 'last-6h' | 'last-24h' | 'last-7d' | 'last-30d' | 'custom';
  aggregation: 'none' | 'avg' | 'sum' | 'min' | 'max' | 'count';
  aggregationInterval?: string; // e.g., '1m', '5m', '15m', '1h'
  
  // Appearance
  chartType: 'line' | 'bar' | 'area' | 'scatter' | 'step';
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  
  // Behavior
  enableZoom: boolean;
  enablePan: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
}

export function TimeSeriesChartConfig({ widget, onChange }: TimeSeriesChartConfigProps) {
  const config = (widget.config || {}) as unknown as TimeSeriesChartWidgetConfig;

  console.log('[TimeSeriesChartConfig] Current config:', config);

  function updateConfig(updates: Partial<TimeSeriesChartWidgetConfig>) {
    const newConfig = { ...config, ...updates };
    console.log('[TimeSeriesChartConfig] Updating config:', newConfig);
    onChange(newConfig);
  }

  const handleDeviceChange = (deviceId: string | undefined, device?: Device) => {
    console.log('[TimeSeriesChartConfig] Device changed:', deviceId, device?.name);
    updateConfig({ 
      deviceId, // Store database UUID
      deviceName: device?.name, // Store friendly name for display
      fields: [] // Reset fields when device changes
    });
  };

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="data">Data</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
      </TabsList>

      {/* Data Tab */}
      <TabsContent value="data" className="space-y-6 mt-4">
        {/* Sub-Dashboard Parameter Filter */}
        <SubDashboardParameterFilter
          enabled={widget.dataSource?.useSubDashboardParameter ?? false}
          supportedTypes={['deviceId']}
          onChange={(enabled) => {
            // Update dataSource.useSubDashboardParameter
            const currentWidget = widget as any;
            onChange({
              ...config,
              useSubDashboardParameter: enabled,
            });
          }}
          description="Show telemetry data only for the selected device from parent dashboard"
        />

        {/* Device Selector */}
        <div className="space-y-2">
          <Label>Device</Label>
          <DeviceSelector
            value={config.deviceId}
            onChange={handleDeviceChange}
          />
          {config.deviceName && (
            <p className="text-xs text-muted-foreground">Selected: {config.deviceName}</p>
          )}
        </div>

        {/* Field Selection (Series) */}
        {config.deviceId && (
          <div className="space-y-2">
            <Label>Data Series (Fields)</Label>
            <DeviceFieldSelector
              deviceId={config.deviceId}
              selectedFields={config.fields || []}
              onChange={(fields) => updateConfig({ fields })}
            />
          </div>
        )}

        {/* Time Range */}
        <div className="space-y-2">
          <Label>Time Range</Label>
          <Select
            value={config.timeRange ?? 'last-24h'}
            onValueChange={(value) =>
              updateConfig({ timeRange: value as TimeSeriesChartWidgetConfig['timeRange'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-1h">Last 1 Hour</SelectItem>
              <SelectItem value="last-6h">Last 6 Hours</SelectItem>
              <SelectItem value="last-24h">Last 24 Hours</SelectItem>
              <SelectItem value="last-7d">Last 7 Days</SelectItem>
              <SelectItem value="last-30d">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Aggregation */}
        <div className="space-y-2">
          <Label>Aggregation</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={config.aggregation ?? 'none'}
              onValueChange={(value) =>
                updateConfig({ aggregation: value as TimeSeriesChartWidgetConfig['aggregation'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Raw Data)</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="count">Count</SelectItem>
              </SelectContent>
            </Select>

            {config.aggregation && config.aggregation !== 'none' && (
              <Select
                value={config.aggregationInterval ?? '5m'}
                onValueChange={(value) => updateConfig({ aggregationInterval: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 minute</SelectItem>
                  <SelectItem value="5m">5 minutes</SelectItem>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Appearance Tab */}
      <TabsContent value="appearance" className="space-y-6 mt-4">
        {/* Chart Type */}
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select
            value={config.chartType ?? 'line'}
            onValueChange={(value) =>
              updateConfig({ chartType: value as TimeSeriesChartWidgetConfig['chartType'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="scatter">Scatter Plot</SelectItem>
              <SelectItem value="step">Step Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visual Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showLegend"
              checked={config.showLegend ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ showLegend: checked as boolean })
              }
            />
            <Label htmlFor="showLegend" className="cursor-pointer">
              Show legend
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showGrid"
              checked={config.showGrid ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ showGrid: checked as boolean })
              }
            />
            <Label htmlFor="showGrid" className="cursor-pointer">
              Show grid lines
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showTooltip"
              checked={config.showTooltip ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ showTooltip: checked as boolean })
              }
            />
            <Label htmlFor="showTooltip" className="cursor-pointer">
              Show tooltip on hover
            </Label>
          </div>
        </div>
      </TabsContent>

      {/* Behavior Tab */}
      <TabsContent value="behavior" className="space-y-6 mt-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableZoom"
              checked={config.enableZoom ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ enableZoom: checked as boolean })
              }
            />
            <Label htmlFor="enableZoom" className="cursor-pointer">
              Enable zoom (scroll to zoom)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enablePan"
              checked={config.enablePan ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ enablePan: checked as boolean })
              }
            />
            <Label htmlFor="enablePan" className="cursor-pointer">
              Enable pan (drag to pan)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoRefresh"
              checked={config.autoRefresh ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ autoRefresh: checked as boolean })
              }
            />
            <Label htmlFor="autoRefresh" className="cursor-pointer">
              Auto-refresh data
            </Label>
          </div>

          {/* Refresh Interval */}
          {config.autoRefresh && (
            <div className="space-y-2">
              <Label>Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={config.refreshInterval ?? 30}
                onChange={(e) =>
                  updateConfig({ refreshInterval: parseInt(e.target.value) || 30 })
                }
                min={5}
                max={300}
              />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
