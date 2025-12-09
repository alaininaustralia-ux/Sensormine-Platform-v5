/**
 * KPI Widget with Asset Configuration
 */

'use client';

import { AssetConfigSection, type AssetConfigData } from './AssetConfigSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface KPIWithAssetConfig extends AssetConfigData {
  comparisonPeriodHours?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  higherIsBetter?: boolean;
  showSparkline?: boolean;
  sparklinePoints?: number;
  formatAsPercentage?: boolean;
}

interface KPIWithAssetConfigProps {
  config: KPIWithAssetConfig;
  onChange: (config: KPIWithAssetConfig) => void;
}

export function KPIWithAssetConfig({ config, onChange }: KPIWithAssetConfigProps) {
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

      {/* KPI-specific options */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium">KPI Options</h4>

        <div className="space-y-2">
          <Label htmlFor="comparison-period">Comparison Period (hours)</Label>
          <Input
            id="comparison-period"
            type="number"
            min="1"
            step="1"
            value={config.comparisonPeriodHours || 24}
            onChange={(e) =>
              onChange({ ...config, comparisonPeriodHours: Number(e.target.value) })
            }
            placeholder="24"
          />
          <p className="text-xs text-muted-foreground">
            Compare current value to this many hours ago for trend calculation
          </p>
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="higher-is-better"
            checked={config.higherIsBetter ?? true}
            onChange={(e) => onChange({ ...config, higherIsBetter: e.target.checked })}
            className="rounded border-input"
          />
          <Label htmlFor="higher-is-better">Higher values are better (affects trend color)</Label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-sparkline"
            checked={config.showSparkline ?? false}
            onChange={(e) => onChange({ ...config, showSparkline: e.target.checked })}
            className="rounded border-input"
          />
          <Label htmlFor="show-sparkline">Show sparkline trend</Label>
        </div>

        {config.showSparkline && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="sparkline-points">Sparkline Data Points</Label>
            <Input
              id="sparkline-points"
              type="number"
              min="5"
              max="100"
              step="5"
              value={config.sparklinePoints || 20}
              onChange={(e) =>
                onChange({ ...config, sparklinePoints: Number(e.target.value) })
              }
              placeholder="20"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="format-percentage"
            checked={config.formatAsPercentage ?? false}
            onChange={(e) => onChange({ ...config, formatAsPercentage: e.target.checked })}
            className="rounded border-input"
          />
          <Label htmlFor="format-percentage">Format as percentage (%)</Label>
        </div>
      </div>
    </div>
  );
}
