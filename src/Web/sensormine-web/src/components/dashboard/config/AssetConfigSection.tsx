/**
 * Asset Configuration Section
 * 
 * Shared configuration UI for asset-based widgets.
 * Includes asset selection, field selection, aggregation, and time range options.
 */

'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AssetHierarchySelector } from '@/components/digital-twin/AssetHierarchySelector';

export interface AssetConfigData {
  assetId?: string;
  includeDescendants?: boolean;
  field?: string;
  fields?: string[];
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
  defaultTimeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

interface AssetConfigSectionProps {
  config: AssetConfigData;
  onChange: (config: AssetConfigData) => void;
  multipleFields?: boolean;
  showAggregation?: boolean;
  showInterval?: boolean;
  showTimeRange?: boolean;
  showRefreshInterval?: boolean;
}

export function AssetConfigSection({
  config,
  onChange,
  multipleFields = false,
  showAggregation = true,
  showInterval = true,
  showTimeRange = true,
  showRefreshInterval = true,
}: AssetConfigSectionProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    config.assetId ? [config.assetId] : []
  );

  // Update config when asset selection changes
  useEffect(() => {
    if (selectedAssets.length > 0 && selectedAssets[0] !== config.assetId) {
      onChange({ ...config, assetId: selectedAssets[0] });
    }
  }, [selectedAssets, config, onChange]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Asset-Based Data Configuration</h4>

      {/* Asset Selection */}
      <div className="space-y-2">
        <Label>Select Asset</Label>
        <AssetHierarchySelector
          mode="single"
          selectedAssetIds={selectedAssets}
          onSelectionChange={setSelectedAssets}
          enableSearch
        />
      </div>

      {/* Include Descendants */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="include-descendants"
          checked={config.includeDescendants ?? true}
          onChange={(e) =>
            onChange({ ...config, includeDescendants: e.target.checked })
          }
          className="rounded border-input"
        />
        <Label htmlFor="include-descendants">
          Include descendant assets (aggregate data from child assets)
        </Label>
      </div>

      {/* Field Selection */}
      <div className="space-y-2">
        <Label htmlFor="field">
          {multipleFields ? 'Fields (comma-separated)' : 'Field Name'}
        </Label>
        <Input
          id="field"
          value={multipleFields ? (config.fields?.join(', ') || '') : (config.field || '')}
          onChange={(e) => {
            if (multipleFields) {
              const fields = e.target.value.split(',').map((f) => f.trim()).filter(Boolean);
              onChange({ ...config, fields });
            } else {
              onChange({ ...config, field: e.target.value });
            }
          }}
          placeholder={multipleFields ? 'e.g., temperature, humidity, pressure' : 'e.g., temperature'}
        />
        <p className="text-xs text-muted-foreground">
          Enter the telemetry field name to display (e.g., temperature, pressure, flow_rate)
        </p>
      </div>

      {/* Aggregation Method */}
      {showAggregation && (
        <div className="space-y-2">
          <Label htmlFor="aggregation">Aggregation Method</Label>
          <select
            id="aggregation"
            value={config.aggregation || 'avg'}
            onChange={(e) =>
              onChange({
                ...config,
                aggregation: e.target.value as AssetConfigData['aggregation'],
              })
            }
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="avg">Average</option>
            <option value="sum">Sum</option>
            <option value="min">Minimum</option>
            <option value="max">Maximum</option>
          </select>
          <p className="text-xs text-muted-foreground">
            How to aggregate values across multiple devices
          </p>
        </div>
      )}

      {/* Time Interval */}
      {showInterval && (
        <div className="space-y-2">
          <Label htmlFor="interval">Time Interval (Bucketing)</Label>
          <select
            id="interval"
            value={config.interval || '5m'}
            onChange={(e) =>
              onChange({
                ...config,
                interval: e.target.value as AssetConfigData['interval'],
              })
            }
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="1m">1 minute</option>
            <option value="5m">5 minutes</option>
            <option value="15m">15 minutes</option>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Time bucket size for data aggregation
          </p>
        </div>
      )}

      {/* Default Time Range */}
      {showTimeRange && (
        <div className="space-y-2">
          <Label htmlFor="time-range">Default Time Range</Label>
          <select
            id="time-range"
            value={config.defaultTimeRange || '24h'}
            onChange={(e) =>
              onChange({
                ...config,
                defaultTimeRange: e.target.value as AssetConfigData['defaultTimeRange'],
              })
            }
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Initial time range when widget loads
          </p>
        </div>
      )}

      {/* Refresh Interval */}
      {showRefreshInterval && (
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
      )}
    </div>
  );
}
