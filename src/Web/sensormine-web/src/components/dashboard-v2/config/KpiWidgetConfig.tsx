/**
 * KpiWidgetConfig Component
 * 
 * Configuration panel for KPI widgets with support for:
 * - Aggregations (avg, sum, count)
 * - Device or Device Type selection
 * - Digital Twin (Asset) filtering
 * - Display options (thresholds, formatting, trends)
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceSelector } from './DeviceSelector';
import { DeviceTypeSelector } from './DeviceTypeSelector';
import { DeviceFieldSelector } from './DeviceFieldSelector';
import { FieldMappingSelector } from './FieldMappingSelector';
import { AssetTreeSelector } from './AssetTreeSelector';
import type { Widget } from '@/lib/types/dashboard-v2';
import type { Device } from '@/lib/api/devices';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KpiWidgetConfigProps {
  widget: Widget;
  onChange: (config: Partial<Widget['config']>) => void;
}

export interface KpiWidgetConfig {
  // Data Source
  sourceType: 'device' | 'deviceType'; // Single device or all devices of a type
  deviceId?: string; // For sourceType = 'device'
  deviceName?: string; // Display name
  deviceTypeId?: string; // For sourceType = 'deviceType'
  deviceTypeName?: string; // Display name
  
  // Field Selection
  fieldName: string; // The field to aggregate
  fieldFriendlyName?: string; // Display name for the field
  
  // Asset Filtering (Digital Twin)
  assetId?: string; // Filter by asset location (optional)
  assetPath?: string; // Display path for asset
  
  // Aggregation
  aggregation: 'avg' | 'sum' | 'count' | 'min' | 'max' | 'last';
  timeRange: 'last-1h' | 'last-6h' | 'last-24h' | 'last-7d' | 'last-30d' | 'current';
  
  // Display Options
  title?: string; // Custom title (defaults to field name + aggregation)
  prefix?: string; // e.g., '$', '£'
  suffix?: string; // e.g., '%', 'units', '°C'
  decimalPlaces: number; // Default: 1
  
  // Trend Display
  showTrend: boolean; // Show percentage change
  trendPeriod: 'hour' | 'day' | 'week' | 'month'; // Compare to this period ago
  showSparkline: boolean; // Show mini chart
  
  // Thresholds (for color coding)
  warningThreshold?: number;
  criticalThreshold?: number;
  thresholdDirection: 'above' | 'below'; // Warning/critical if value is above or below threshold
  
  // Behavior
  autoRefresh: boolean;
  refreshInterval: number; // seconds
}

export function KpiWidgetConfig({ widget, onChange }: KpiWidgetConfigProps) {
  const config = (widget.config || {
    sourceType: 'device',
    fieldName: '',
    aggregation: 'avg',
    timeRange: 'last-24h',
    decimalPlaces: 1,
    showTrend: true,
    trendPeriod: 'day',
    showSparkline: false,
    thresholdDirection: 'above',
    autoRefresh: true,
    refreshInterval: 60,
  }) as unknown as KpiWidgetConfig;

  console.log('[KpiWidgetConfig] Current config:', config);

  function updateConfig(updates: Partial<KpiWidgetConfig>) {
    const newConfig = { ...config, ...updates };
    console.log('[KpiWidgetConfig] Updating config:', newConfig);
    onChange(newConfig);
  }

  const handleDeviceChange = (deviceId: string | undefined, device?: Device) => {
    console.log('[KpiWidgetConfig] Device changed:', deviceId, device?.name);
    updateConfig({ 
      deviceId,
      deviceName: device?.name,
      fieldName: '', // Reset field when device changes
      fieldFriendlyName: undefined,
    });
  };

  const handleDeviceTypeChange = (deviceTypeId: string | undefined) => {
    console.log('[KpiWidgetConfig] Device type changed:', deviceTypeId);
    updateConfig({ 
      deviceTypeId,
      fieldName: '', // Reset field when device type changes
      fieldFriendlyName: undefined,
    });
  };

  const handleFieldChange = (fieldName: string, friendlyName?: string) => {
    console.log('[KpiWidgetConfig] Field changed:', fieldName, friendlyName);
    updateConfig({ 
      fieldName,
      fieldFriendlyName: friendlyName || fieldName,
    });
  };

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="data">Data</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
      </TabsList>

      {/* Data Tab */}
      <TabsContent value="data" className="space-y-6 mt-4">
        {/* Source Type Selection */}
        <div className="space-y-2">
          <Label>Data Source</Label>
          <Select
            value={config.sourceType}
            onValueChange={(value: string) => updateConfig({ 
              sourceType: value as 'device' | 'deviceType',
              deviceId: undefined,
              deviceName: undefined,
              deviceTypeId: undefined,
              deviceTypeName: undefined,
              fieldName: '',
              fieldFriendlyName: undefined,
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="device">Single Device</SelectItem>
              <SelectItem value="deviceType">Device Type (aggregate across all devices)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Selector (if sourceType = 'device') */}
        {config.sourceType === 'device' && (
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
        )}

        {/* Device Type Selector (if sourceType = 'deviceType') */}
        {config.sourceType === 'deviceType' && (
          <div className="space-y-2">
            <Label>Device Type</Label>
            <DeviceTypeSelector
              value={config.deviceTypeId}
              onChange={handleDeviceTypeChange}
            />
            <p className="text-xs text-muted-foreground">
              KPI will aggregate data from all devices of this type
            </p>
          </div>
        )}

        {/* Asset Filter (Digital Twin) */}
        <div className="space-y-2">
          <Label>Filter by Asset Location (Optional)</Label>
          <AssetTreeSelector
            value={config.assetId}
            onChange={(assetId) => updateConfig({ assetId })}
            placeholder="All locations..."
          />
          {config.assetId && config.assetPath && (
            <p className="text-xs text-muted-foreground">Location: {config.assetPath}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Only include devices under this asset in the digital twin hierarchy
          </p>
        </div>

        {/* Field Selection */}
        {config.sourceType === 'device' && config.deviceId && (
          <div className="space-y-2">
            <Label>Field to Measure</Label>
            <DeviceFieldSelector
              deviceId={config.deviceId}
              selectedFields={config.fieldName ? [config.fieldName] : []}
              onChange={(fields) => {
                const field = fields[0];
                if (field) {
                  handleFieldChange(field);
                } else {
                  updateConfig({ fieldName: '', fieldFriendlyName: undefined });
                }
              }}
            />
          </div>
        )}

        {config.sourceType === 'deviceType' && config.deviceTypeId && (
          <div className="space-y-2">
            <Label>Field to Measure</Label>
            <FieldMappingSelector
              deviceTypeId={config.deviceTypeId}
              selectedFields={config.fieldName ? [config.fieldName] : []}
              onChange={(fieldNames) => {
                const fieldName = fieldNames[0];
                if (fieldName) {
                  handleFieldChange(fieldName);
                } else {
                  updateConfig({ fieldName: '', fieldFriendlyName: undefined });
                }
              }}
              multiSelect={false}
            />
          </div>
        )}

        {/* Aggregation Type */}
        {config.fieldName && (
          <>
            <div className="space-y-2">
              <Label>Aggregation</Label>
              <Select
                value={config.aggregation}
                onValueChange={(value) => updateConfig({ aggregation: value as KpiWidgetConfig['aggregation'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                  <SelectItem value="last">Last Value</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How to calculate the KPI value from the data
              </p>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select
                value={config.timeRange}
                onValueChange={(value) => updateConfig({ timeRange: value as KpiWidgetConfig['timeRange'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Value</SelectItem>
                  <SelectItem value="last-1h">Last Hour</SelectItem>
                  <SelectItem value="last-6h">Last 6 Hours</SelectItem>
                  <SelectItem value="last-24h">Last 24 Hours</SelectItem>
                  <SelectItem value="last-7d">Last 7 Days</SelectItem>
                  <SelectItem value="last-30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Validation Warning */}
        {!config.fieldName && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a {config.sourceType === 'device' ? 'device' : 'device type'} and field to configure the KPI
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      {/* Display Tab */}
      <TabsContent value="display" className="space-y-6 mt-4">
        {/* Custom Title */}
        <div className="space-y-2">
          <Label htmlFor="custom-title">Custom Title (Optional)</Label>
          <Input
            id="custom-title"
            value={config.title || ''}
            onChange={(e) => updateConfig({ title: e.target.value })}
            placeholder={`${config.aggregation || 'Avg'} ${config.fieldFriendlyName || 'Value'}`}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to auto-generate from field name and aggregation
          </p>
        </div>

        {/* Value Formatting */}
        <div>
          <h3 className="text-sm font-medium mb-3">Value Formatting</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  value={config.prefix || ''}
                  onChange={(e) => updateConfig({ prefix: e.target.value })}
                  placeholder="e.g., $, £"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={config.suffix || ''}
                  onChange={(e) => updateConfig({ suffix: e.target.value })}
                  placeholder="e.g., %, °C, units"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimal-places">Decimal Places</Label>
              <Input
                id="decimal-places"
                type="number"
                min="0"
                max="4"
                value={config.decimalPlaces ?? 1}
                onChange={(e) => updateConfig({ decimalPlaces: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Trend Display */}
        <div>
          <h3 className="text-sm font-medium mb-3">Trend Display</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-trend">Show Trend</Label>
                <div className="text-xs text-muted-foreground">
                  Display percentage change indicator
                </div>
              </div>
              <Switch
                id="show-trend"
                checked={config.showTrend}
                onCheckedChange={(checked) => updateConfig({ showTrend: checked })}
              />
            </div>

            {config.showTrend && (
              <div className="space-y-2">
                <Label htmlFor="trend-period">Trend Period</Label>
                <Select
                  value={config.trendPeriod}
                  onValueChange={(value) => updateConfig({ trendPeriod: value as KpiWidgetConfig['trendPeriod'] })}
                >
                  <SelectTrigger id="trend-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Last Hour</SelectItem>
                    <SelectItem value="day">Last Day</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Compare current value to this period ago
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-sparkline">Show Sparkline</Label>
                <div className="text-xs text-muted-foreground">
                  Display mini trend chart below value
                </div>
              </div>
              <Switch
                id="show-sparkline"
                checked={config.showSparkline}
                onCheckedChange={(checked) => updateConfig({ showSparkline: checked })}
              />
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div>
          <h3 className="text-sm font-medium mb-3">Thresholds (Color Coding)</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threshold-direction">Threshold Direction</Label>
              <Select
                value={config.thresholdDirection}
                onValueChange={(value) => updateConfig({ thresholdDirection: value as 'above' | 'below' })}
              >
                <SelectTrigger id="threshold-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Warning/Critical when above threshold</SelectItem>
                  <SelectItem value="below">Warning/Critical when below threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warning-threshold">Warning Threshold</Label>
              <Input
                id="warning-threshold"
                type="number"
                step="any"
                value={config.warningThreshold ?? ''}
                onChange={(e) => updateConfig({ 
                  warningThreshold: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="critical-threshold">Critical Threshold</Label>
              <Input
                id="critical-threshold"
                type="number"
                step="any"
                value={config.criticalThreshold ?? ''}
                onChange={(e) => updateConfig({ 
                  criticalThreshold: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Behavior Tab */}
      <TabsContent value="behavior" className="space-y-6 mt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <div className="text-xs text-muted-foreground">
              Automatically update KPI value
            </div>
          </div>
          <Switch
            id="auto-refresh"
            checked={config.autoRefresh}
            onCheckedChange={(checked) => updateConfig({ autoRefresh: checked })}
          />
        </div>

        {config.autoRefresh && (
          <div className="space-y-2">
            <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
            <Input
              id="refresh-interval"
              type="number"
              min="10"
              max="3600"
              value={config.refreshInterval}
              onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) || 60 })}
            />
            <p className="text-xs text-muted-foreground">
              How often to refresh the data (10-3600 seconds)
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
