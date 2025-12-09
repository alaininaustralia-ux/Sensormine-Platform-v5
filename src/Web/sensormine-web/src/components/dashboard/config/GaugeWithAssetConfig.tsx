/**
 * Gauge Widget with Asset Configuration
 */

'use client';

import { AssetConfigSection, type AssetConfigData } from './AssetConfigSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface GaugeWithAssetConfig extends AssetConfigData {
  gaugeType?: 'circular' | 'linear' | 'bullet';
  orientation?: 'horizontal' | 'vertical';
  min?: number;
  max?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  target?: number;
  compact?: boolean;
}

interface GaugeWithAssetConfigProps {
  config: GaugeWithAssetConfig;
  onChange: (config: GaugeWithAssetConfig) => void;
}

export function GaugeWithAssetConfig({ config, onChange }: GaugeWithAssetConfigProps) {
  return (
    <div className="space-y-6">
      {/* Asset-based configuration */}
      <AssetConfigSection
        config={config}
        onChange={(assetConfig) => onChange({ ...config, ...assetConfig })}
        multipleFields={false}
        showAggregation
        showInterval={false}
        showTimeRange={false}
        showRefreshInterval
      />

      {/* Gauge-specific options */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium">Gauge Options</h4>

        <div className="space-y-2">
          <Label htmlFor="gauge-type">Gauge Type</Label>
          <select
            id="gauge-type"
            value={config.gaugeType || 'circular'}
            onChange={(e) =>
              onChange({
                ...config,
                gaugeType: e.target.value as GaugeWithAssetConfig['gaugeType'],
              })
            }
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="circular">Circular</option>
            <option value="linear">Linear</option>
            <option value="bullet">Bullet</option>
          </select>
        </div>

        {config.gaugeType === 'linear' && (
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientation</Label>
            <select
              id="orientation"
              value={config.orientation || 'horizontal'}
              onChange={(e) =>
                onChange({
                  ...config,
                  orientation: e.target.value as GaugeWithAssetConfig['orientation'],
                })
              }
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min">Min Value</Label>
            <Input
              id="min"
              type="number"
              step="any"
              value={config.min ?? 0}
              onChange={(e) => onChange({ ...config, min: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max">Max Value</Label>
            <Input
              id="max"
              type="number"
              step="any"
              value={config.max ?? 100}
              onChange={(e) => onChange({ ...config, max: Number(e.target.value) })}
              placeholder="100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="warning-threshold">Warning Threshold</Label>
            <Input
              id="warning-threshold"
              type="number"
              step="any"
              value={config.warningThreshold ?? ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  warningThreshold: e.target.value ? Number(e.target.value) : undefined,
                })
              }
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
              onChange={(e) =>
                onChange({
                  ...config,
                  criticalThreshold: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Target Value</Label>
          <Input
            id="target"
            type="number"
            step="any"
            value={config.target ?? ''}
            onChange={(e) =>
              onChange({
                ...config,
                target: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Optional"
          />
          <p className="text-xs text-muted-foreground">
            Target line for bullet gauge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="compact"
            checked={config.compact ?? false}
            onChange={(e) => onChange({ ...config, compact: e.target.checked })}
            className="rounded border-input"
          />
          <Label htmlFor="compact">Compact mode (smaller size)</Label>
        </div>
      </div>
    </div>
  );
}
