/**
 * DeviceListConfig Component
 * 
 * Configuration panel for Device List widgets
 * Tabs: Data, Appearance, Behavior
 * 
 * Features:
 * - Device type selection with metadata
 * - Digital twin/asset filtering
 * - Multi-select field mappings with friendly names
 * - Status and custom field display options
 * - Pagination and display settings
 * - Row click behavior and drill-down navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info, X } from 'lucide-react';
import { DeviceTypeSelector } from './DeviceTypeSelector';
import { FieldMappingSelector } from './FieldMappingSelector';
import { AssetTreeSelector } from './AssetTreeSelector';
import { getDeviceTypeById } from '@/lib/api/deviceTypes';
import { getAssetById } from '@/lib/api/assets';
import type { Widget } from '@/lib/types/dashboard-v2';
import type { DeviceType } from '@/lib/api/types';
import type { Asset } from '@/lib/api/assets';

interface DeviceListConfigProps {
  widget: Widget;
  onChange: (config: Partial<Widget['config']>) => void;
}

interface DeviceListWidgetConfig {
  // Data
  deviceTypeId?: string;
  assetId?: string;
  includeDescendants?: boolean; // Include devices from child assets
  fields: string[];
  includeStatus: boolean;
  includeLocation: boolean;
  includeLastSeen: boolean;
  includeCustomFields: string[];
  
  // Appearance
  showHeader: boolean;
  showPagination: boolean;
  showSearch: boolean;
  rowsPerPage: number;
  compactMode: boolean;
  emptyMessage?: string;
  
  // Behavior
  enableSelection: boolean;
  onRowClick: 'select' | 'navigate' | 'none';
  drillDownDashboardId?: string;
}

export function DeviceListConfig({ widget, onChange }: DeviceListConfigProps) {
  const config = (widget.config || {}) as unknown as DeviceListWidgetConfig;
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loadingDeviceType, setLoadingDeviceType] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  // Load selected device type details
  useEffect(() => {
    if (config.deviceTypeId) {
      loadDeviceType(config.deviceTypeId);
    } else {
      setSelectedDeviceType(null);
    }
  }, [config.deviceTypeId]);

  // Load selected asset details
  useEffect(() => {
    if (config.assetId) {
      loadAsset(config.assetId);
    } else {
      setSelectedAsset(null);
    }
  }, [config.assetId]);

  async function loadDeviceType(deviceTypeId: string) {
    try {
      setLoadingDeviceType(true);
      const deviceType = await getDeviceTypeById(deviceTypeId);
      setSelectedDeviceType(deviceType);
    } catch (err) {
      console.error('Failed to load device type:', err);
      setSelectedDeviceType(null);
    } finally {
      setLoadingDeviceType(false);
    }
  }

  async function loadAsset(assetId: string) {
    try {
      setLoadingAsset(true);
      const asset = await getAssetById(assetId);
      setSelectedAsset(asset);
    } catch (err) {
      console.error('Failed to load asset:', err);
      setSelectedAsset(null);
    } finally {
      setLoadingAsset(false);
    }
  }

  function updateConfig(updates: Partial<DeviceListWidgetConfig>) {
    onChange({ ...config, ...updates });
  }

  function clearAssetFilter() {
    updateConfig({ assetId: undefined, includeDescendants: false });
  }

  const hasDataSource = config.deviceTypeId || config.assetId;

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="data">Data</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
      </TabsList>

      {/* Data Tab */}
      <TabsContent value="data" className="space-y-6 mt-4">
        {/* Info Banner */}
        {!hasDataSource && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Select a device type or asset</p>
              <p className="text-xs text-blue-700 mt-1">
                Choose a device type to display all devices of that type, or select an asset to show only devices assigned to that location.
              </p>
            </div>
          </div>
        )}

        {/* Device Type Selection */}
        <div className="space-y-3">
          <div>
            <Label className="font-semibold">Device Type</Label>
          </div>
          <DeviceTypeSelector
            value={config.deviceTypeId}
            onChange={(deviceTypeId) => updateConfig({ deviceTypeId, fields: [] })}
          />
          {selectedDeviceType?.description && (
            <p className="text-xs text-muted-foreground">
              {selectedDeviceType.description}
            </p>
          )}
          {!config.deviceTypeId && (
            <p className="text-xs text-muted-foreground">
              Select the type of devices to display in the list
            </p>
          )}
        </div>

        {/* Asset Location Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Filter by Asset Location (Optional)</Label>
            {config.assetId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearAssetFilter}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <AssetTreeSelector
            value={config.assetId}
            onChange={(assetId) => updateConfig({ assetId })}
          />
          {selectedAsset && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{selectedAsset.assetType}</Badge>
              <span>{selectedAsset.name}</span>
            </div>
          )}
          
          {/* Include descendants option */}
          {config.assetId && (
            <div className="flex items-center space-x-2 pl-4 border-l-2 border-muted">
              <Checkbox
                id="includeDescendants"
                checked={config.includeDescendants ?? false}
                onCheckedChange={(checked) =>
                  updateConfig({ includeDescendants: checked as boolean })
                }
              />
              <Label htmlFor="includeDescendants" className="cursor-pointer text-xs font-normal">
                Include devices from child assets (recursive)
              </Label>
            </div>
          )}
        </div>

        {/* Field Selection */}
        {config.deviceTypeId && (
          <div className="space-y-3">
            <Label className="font-semibold">Data Fields to Display</Label>
            <FieldMappingSelector
              deviceTypeId={config.deviceTypeId}
              selectedFields={config.fields || []}
              onChange={(fields) => updateConfig({ fields })}
              multiSelect={true}
            />
            {(!config.fields || config.fields.length === 0) && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Select at least one field to display device data
              </p>
            )}
            {config.fields && config.fields.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {config.fields.length} {config.fields.length === 1 ? 'field' : 'fields'} selected
              </p>
            )}
          </div>
        )}

        {/* Standard Columns */}
        <div className="space-y-3">
          <Label className="font-semibold">Standard Columns</Label>
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeStatus"
                checked={config.includeStatus ?? true}
                onCheckedChange={(checked) =>
                  updateConfig({ includeStatus: checked as boolean })
                }
              />
              <Label htmlFor="includeStatus" className="cursor-pointer text-sm font-normal">
                Device status indicator
                <span className="text-xs text-muted-foreground ml-2">(online/offline/alarm)</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeLocation"
                checked={config.includeLocation ?? false}
                onCheckedChange={(checked) =>
                  updateConfig({ includeLocation: checked as boolean })
                }
              />
              <Label htmlFor="includeLocation" className="cursor-pointer text-sm font-normal">
                Location/Asset path
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeLastSeen"
                checked={config.includeLastSeen ?? true}
                onCheckedChange={(checked) =>
                  updateConfig({ includeLastSeen: checked as boolean })
                }
              />
              <Label htmlFor="includeLastSeen" className="cursor-pointer text-sm font-normal">
                Last seen timestamp
              </Label>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Appearance Tab */}
      <TabsContent value="appearance" className="space-y-6 mt-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showSearch"
              checked={config.showSearch ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ showSearch: checked as boolean })
              }
            />
            <Label htmlFor="showSearch" className="cursor-pointer">
              Show search/filter bar
            </Label>
          </div>

          {/* Table Header */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showHeader"
              checked={config.showHeader ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ showHeader: checked as boolean })
              }
            />
            <Label htmlFor="showHeader" className="cursor-pointer">
              Show table header
            </Label>
          </div>

          {/* Pagination */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showPagination"
              checked={config.showPagination ?? true}
              onCheckedChange={(checked) =>
                updateConfig({ showPagination: checked as boolean })
              }
            />
            <Label htmlFor="showPagination" className="cursor-pointer">
              Show pagination controls
            </Label>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="compactMode"
              checked={config.compactMode ?? false}
              onCheckedChange={(checked) =>
                updateConfig({ compactMode: checked as boolean })
              }
            />
            <Label htmlFor="compactMode" className="cursor-pointer">
              Compact mode (smaller row height)
            </Label>
          </div>

          {/* Rows per page */}
          {config.showPagination && (
            <div className="space-y-2">
              <Label>Rows per page: {config.rowsPerPage ?? 10}</Label>
              <Slider
                value={[config.rowsPerPage ?? 10]}
                onValueChange={([value]) => updateConfig({ rowsPerPage: value })}
                min={5}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Number of devices to display per page
              </p>
            </div>
          )}

          {/* Empty Message */}
          <div className="space-y-2">
            <Label htmlFor="emptyMessage">Empty State Message (Optional)</Label>
            <Input
              id="emptyMessage"
              placeholder="No devices found"
              value={config.emptyMessage || ''}
              onChange={(e) => updateConfig({ emptyMessage: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Message to display when no devices match the filter
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Behavior Tab */}
      <TabsContent value="behavior" className="space-y-6 mt-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableSelection"
              checked={config.enableSelection ?? false}
              onCheckedChange={(checked) =>
                updateConfig({ enableSelection: checked as boolean })
              }
            />
            <Label htmlFor="enableSelection" className="cursor-pointer">
              Enable row selection (master-detail pattern)
            </Label>
          </div>

          {/* On Row Click */}
          <div className="space-y-2">
            <Label>On Row Click</Label>
            <Select
              value={config.onRowClick ?? 'none'}
              onValueChange={(value) =>
                updateConfig({ onRowClick: value as DeviceListWidgetConfig['onRowClick'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Do nothing</SelectItem>
                <SelectItem value="select">Select device</SelectItem>
                <SelectItem value="navigate">Navigate to dashboard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drill-down Dashboard (if navigate) */}
          {config.onRowClick === 'navigate' && (
            <div className="space-y-2">
              <Label>Target Dashboard</Label>
              <Select
                value={config.drillDownDashboardId}
                onValueChange={(value) => updateConfig({ drillDownDashboardId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dashboard..." />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Load dashboards from API */}
                  <SelectItem value="placeholder">Device Details Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
