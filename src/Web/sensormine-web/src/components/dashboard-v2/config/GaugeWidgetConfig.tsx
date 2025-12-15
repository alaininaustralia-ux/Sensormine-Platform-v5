/**
 * GaugeWidgetConfig Component
 * 
 * Configuration panel for Gauge widgets with support for:
 * - Device or Device Type selection
 * - Single field selection for gauge display
 * - Min/Max range configuration
 * - Warning and critical thresholds
 * - Color zones and display options
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceSelector } from './DeviceSelector';
import { DeviceTypeSelector } from './DeviceTypeSelector';
import { FieldMappingSelector } from './FieldMappingSelector';
import { AssetTreeSelector } from './AssetTreeSelector';
import type { Widget } from '@/lib/types/dashboard-v2';
import type { Device } from '@/lib/api/devices';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GaugeWidgetConfigProps {
  widget: Widget;
  onChange: (config: Partial<Widget['config']>) => void;
}

export interface GaugeWidgetConfig {
  // Data Source
  sourceType: 'device' | 'deviceType'; // Single device or device type
  deviceId?: string; // For sourceType = 'device'
  deviceName?: string; // Display name
  deviceTypeId?: string; // For sourceType = 'deviceType'
  deviceTypeName?: string; // Display name
  
  // Field Selection
  fieldName: string; // The field to display on gauge
  fieldFriendlyName?: string; // Display name for the field
  
  // Asset Filtering (Digital Twin)
  assetId?: string; // Filter by asset location (optional)
  assetPath?: string; // Display path for asset
  
  // Aggregation (for deviceType source or time-based values)
  aggregation: 'current' | 'avg' | 'min' | 'max' | 'last';
  timeRange: 'current' | 'last-1h' | 'last-6h' | 'last-24h';
  
  // Gauge Range
  minValue: number; // Gauge minimum
  maxValue: number; // Gauge maximum
  unit?: string; // Display unit (e.g., '°C', '%', 'PSI')
  
  // Thresholds
  warningThreshold?: number; // Yellow zone starts
  criticalThreshold?: number; // Red zone starts
  thresholdDirection: 'above' | 'below'; // Warning/critical if value is above or below
  
  // Display Options
  title?: string; // Custom title
  gaugeType: 'circular' | 'linear' | 'bullet'; // Gauge style
  showValue: boolean; // Show numeric value
  showMinMax: boolean; // Show min/max labels
  showLabel: boolean; // Show field label
  decimalPlaces: number; // Decimal precision
  
  // Color Zones (optional custom zones)
  colorZones?: Array<{
    from: number;
    to: number;
    color: string;
    label?: string;
  }>;
  
  // Behavior
  autoRefresh: boolean;
  refreshInterval: number; // seconds
}

export function GaugeWidgetConfig({ widget, onChange }: GaugeWidgetConfigProps) {
  const config = (widget.config || {
    sourceType: 'device',
    fieldName: '',
    aggregation: 'current',
    timeRange: 'current',
    minValue: 0,
    maxValue: 100,
    thresholdDirection: 'above',
    gaugeType: 'circular',
    showValue: true,
    showMinMax: true,
    showLabel: true,
    decimalPlaces: 1,
    autoRefresh: true,
    refreshInterval: 30,
  }) as unknown as GaugeWidgetConfig;

  console.log('[GaugeWidgetConfig] Current config:', config);

  function updateConfig(updates: Partial<GaugeWidgetConfig>) {
    const newConfig = { ...config, ...updates };
    console.log('[GaugeWidgetConfig] Updating config:', newConfig);
    onChange(newConfig);
  }

  const handleDeviceChange = (deviceId: string | undefined, device?: Device) => {
    console.log('[GaugeWidgetConfig] Device changed:', deviceId, device?.name);
    updateConfig({ 
      deviceId,
      deviceName: device?.name,
      fieldName: '', // Reset field when device changes
      fieldFriendlyName: undefined,
    });
  };

  const handleDeviceTypeChange = (deviceTypeId: string | undefined) => {
    console.log('[GaugeWidgetConfig] Device type changed:', deviceTypeId);
    updateConfig({ 
      deviceTypeId,
      fieldName: '', // Reset field when device type changes
      fieldFriendlyName: undefined,
    });
  };

  const handleFieldChange = (fieldNames: string[]) => {
    const fieldName = fieldNames[0]; // Gauge only uses first field (single select)
    console.log('[GaugeWidgetConfig] Field changed:', fieldName);
    
    // Find friendly name from field mappings if available
    updateConfig({ 
      fieldName: fieldName || '',
      fieldFriendlyName: fieldName, // Will be populated by data when rendered
    });
  };

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="data">Data</TabsTrigger>
        <TabsTrigger value="range">Range & Thresholds</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
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
              <SelectItem value="deviceType">Device Type (All Devices)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Selection (for sourceType = 'device') */}
        {config.sourceType === 'device' && (
          <div className="space-y-2">
            <Label>Select Device</Label>
            <DeviceSelector
              value={config.deviceId}
              onChange={handleDeviceChange}
              placeholder="Choose a device..."
            />
          </div>
        )}

        {/* Device Type Selection (for sourceType = 'deviceType') */}
        {config.sourceType === 'deviceType' && (
          <div className="space-y-2">
            <Label>Select Device Type</Label>
            <DeviceTypeSelector
              value={config.deviceTypeId}
              onChange={handleDeviceTypeChange}
              placeholder="Choose a device type..."
            />
          </div>
        )}

        {/* Field Selection - Only show if device type is selected */}
        {config.sourceType === 'deviceType' && config.deviceTypeId && (
          <div className="space-y-2">
            <Label>Select Field (Sensor)</Label>
            <FieldMappingSelector
              deviceTypeId={config.deviceTypeId}
              selectedFields={config.fieldName ? [config.fieldName] : []}
              onChange={handleFieldChange}
              multiSelect={false}
              showOnlyQueryable={true}
            />
            {!config.fieldName && (
              <p className="text-sm text-muted-foreground">
                Select a numeric field to display on the gauge
              </p>
            )}
          </div>
        )}

        {/* Field Selection for device - use DeviceFieldSelector */}
        {config.sourceType === 'device' && config.deviceId && (
          <div className="space-y-2">
            <Label>Select Field (Sensor)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Field selection for specific devices will be available when the device sends data.
              For now, configure the gauge with a device type to access field mappings.
            </p>
          </div>
        )}

        {/* Asset Filtering (Optional) */}
        <div className="space-y-2">
          <Label>Filter by Asset (Optional)</Label>
          <AssetTreeSelector
            value={config.assetId}
            onChange={(assetId) => updateConfig({ assetId })}
            placeholder="All assets"
          />
          <p className="text-sm text-muted-foreground">
            Optionally filter devices by asset location
          </p>
        </div>

        {/* Aggregation & Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Aggregation</Label>
            <Select
              value={config.aggregation}
              onValueChange={(value) => updateConfig({ 
                aggregation: value as GaugeWidgetConfig['aggregation'] 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Value</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="last">Last Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Range</Label>
            <Select
              value={config.timeRange}
              onValueChange={(value) => updateConfig({ 
                timeRange: value as GaugeWidgetConfig['timeRange'] 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="last-1h">Last Hour</SelectItem>
                <SelectItem value="last-6h">Last 6 Hours</SelectItem>
                <SelectItem value="last-24h">Last 24 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!config.fieldName && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a data source and field to configure the gauge.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      {/* Range & Thresholds Tab */}
      <TabsContent value="range" className="space-y-6 mt-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Gauge Range</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-value">Minimum Value</Label>
              <Input
                id="min-value"
                type="number"
                step="any"
                value={config.minValue}
                onChange={(e) => updateConfig({ minValue: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-value">Maximum Value</Label>
              <Input
                id="max-value"
                type="number"
                step="any"
                value={config.maxValue}
                onChange={(e) => updateConfig({ maxValue: parseFloat(e.target.value) || 100 })}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit of Measurement</Label>
            <Input
              id="unit"
              value={config.unit || ''}
              onChange={(e) => updateConfig({ unit: e.target.value })}
              placeholder="e.g., °C, %, PSI, kW"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Threshold Settings</h3>
          
          <div className="space-y-2">
            <Label>Threshold Direction</Label>
            <Select
              value={config.thresholdDirection}
              onValueChange={(value) => updateConfig({ 
                thresholdDirection: value as 'above' | 'below' 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Alert when ABOVE threshold</SelectItem>
                <SelectItem value="below">Alert when BELOW threshold</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determines when warning/critical colors are applied
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warning-threshold">Warning Threshold (Yellow)</Label>
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
              <Label htmlFor="critical-threshold">Critical Threshold (Red)</Label>
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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Example: Temperature Gauge (Above)</p>
                <p className="text-xs">Min: 0°C, Max: 100°C</p>
                <p className="text-xs">Warning: 70°C (turns yellow above 70)</p>
                <p className="text-xs">Critical: 85°C (turns red above 85)</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </TabsContent>

      {/* Display Tab */}
      <TabsContent value="display" className="space-y-6 mt-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Gauge Style</h3>
          
          <div className="space-y-2">
            <Label>Gauge Type</Label>
            <Select
              value={config.gaugeType}
              onValueChange={(value) => updateConfig({ 
                gaugeType: value as GaugeWidgetConfig['gaugeType'] 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular Gauge (Arc)</SelectItem>
                <SelectItem value="linear">Linear Gauge (Bar)</SelectItem>
                <SelectItem value="bullet">Bullet Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Custom Title</Label>
            <Input
              id="title"
              value={config.title || ''}
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder={config.fieldFriendlyName || config.fieldName || 'Gauge Title'}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use field name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimal-places">Decimal Places</Label>
            <Input
              id="decimal-places"
              type="number"
              min="0"
              max="5"
              value={config.decimalPlaces}
              onChange={(e) => updateConfig({ 
                decimalPlaces: parseInt(e.target.value) || 1 
              })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Display Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-value">Show Numeric Value</Label>
              <Switch
                id="show-value"
                checked={config.showValue}
                onCheckedChange={(checked) => updateConfig({ showValue: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-min-max">Show Min/Max Labels</Label>
              <Switch
                id="show-min-max"
                checked={config.showMinMax}
                onCheckedChange={(checked) => updateConfig({ showMinMax: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-label">Show Field Label</Label>
              <Switch
                id="show-label"
                checked={config.showLabel}
                onCheckedChange={(checked) => updateConfig({ showLabel: checked })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Auto Refresh</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-refresh">Enable Auto Refresh</Label>
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
                min="5"
                max="300"
                value={config.refreshInterval}
                onChange={(e) => updateConfig({ 
                  refreshInterval: parseInt(e.target.value) || 30 
                })}
              />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
