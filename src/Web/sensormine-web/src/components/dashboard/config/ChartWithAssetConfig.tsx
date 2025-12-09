/**
 * Chart Widget with Asset Configuration
 */

'use client';

import { AssetConfigSection, type AssetConfigData } from './AssetConfigSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface ChartWithAssetConfig extends AssetConfigData {
  chartType?: 'line' | 'bar' | 'area';
  showToolbar?: boolean;
  limit?: number;
}

interface ChartWithAssetConfigProps {
  config: ChartWithAssetConfig;
  onChange: (config: ChartWithAssetConfig) => void;
}

export function ChartWithAssetConfig({ config, onChange }: ChartWithAssetConfigProps) {
  return (
    <div className="space-y-6">
      {/* Asset-based configuration */}
      <AssetConfigSection
        config={config}
        onChange={(assetConfig) => onChange({ ...config, ...assetConfig })}
        multipleFields
        showAggregation
        showInterval
        showTimeRange
        showRefreshInterval
      />

      {/* Chart-specific options */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium">Chart Options</h4>

        <div className="space-y-2">
          <Label htmlFor="chart-type">Chart Type</Label>
          <select
            id="chart-type"
            value={config.chartType || 'line'}
            onChange={(e) =>
              onChange({ ...config, chartType: e.target.value as ChartWithAssetConfig['chartType'] })
            }
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="area">Area</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-toolbar"
            checked={config.showToolbar ?? true}
            onChange={(e) => onChange({ ...config, showToolbar: e.target.checked })}
            className="rounded border-input"
          />
          <Label htmlFor="show-toolbar">Show Toolbar (zoom, pan, export)</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit">Data Point Limit</Label>
          <Input
            id="limit"
            type="number"
            min="10"
            step="10"
            value={config.limit || 1000}
            onChange={(e) => onChange({ ...config, limit: Number(e.target.value) })}
            placeholder="1000"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of data points to display
          </p>
        </div>
      </div>
    </div>
  );
}
