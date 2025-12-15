/**
 * Device List Widget with Asset Configuration
 */

'use client';

import { AssetConfigSection, type AssetConfigData } from './AssetConfigSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface DeviceListWithAssetConfig extends AssetConfigData {
  showTelemetry?: boolean;
  telemetryFields?: string[];
}

interface DeviceListWithAssetConfigProps {
  config: DeviceListWithAssetConfig;
  onChange: (config: DeviceListWithAssetConfig) => void;
}

export function DeviceListWithAssetConfig({
  config,
  onChange,
}: DeviceListWithAssetConfigProps) {
  return (
    <div className="space-y-6">
      {/* Show telemetry toggle */}
      <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
        <input
          type="checkbox"
          id="show-telemetry"
          checked={config.showTelemetry ?? false}
          onChange={(e) => onChange({ ...config, showTelemetry: e.target.checked })}
          className="rounded border-input"
        />
        <Label htmlFor="show-telemetry" className="font-medium">
          Show telemetry data in device list
        </Label>
      </div>

      {/* Asset-based configuration (only show if telemetry enabled) */}
      {config.showTelemetry && (
        <AssetConfigSection
          config={config}
          onChange={(assetConfig) => onChange({ ...config, ...assetConfig })}
          multipleFields
          showAggregation={false}
          showInterval={false}
          showTimeRange={false}
          showRefreshInterval
        />
      )}

      {/* Device List specific options */}
      {!config.showTelemetry && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Device List Options</h4>
          <div className="space-y-2">
            <Label htmlFor="refresh-interval">Auto-Refresh Interval (seconds)</Label>
            <Input
              id="refresh-interval"
              type="number"
              min="0"
              step="5"
              value={config.refreshInterval || 30}
              onChange={(e) =>
                onChange({ ...config, refreshInterval: Number(e.target.value) })
              }
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">
              Set to 0 to disable auto-refresh
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
