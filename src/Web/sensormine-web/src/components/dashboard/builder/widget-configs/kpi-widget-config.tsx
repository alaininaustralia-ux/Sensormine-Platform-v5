/**
 * KPI Widget Configuration
 * 
 * Configuration panel for KPI widget-specific options including
 * trend settings, thresholds, and display preferences.
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WidgetConfigComponentProps } from './types';

export interface KpiWidgetConfigType {
  showTrend?: boolean;
  showSparkline?: boolean;
  trendPeriod?: 'hour' | 'day' | 'week' | 'month';
  warningThreshold?: number;
  criticalThreshold?: number;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export function KpiWidgetConfig({
  config,
  onChange,
}: WidgetConfigComponentProps<KpiWidgetConfigType>) {
  const updateConfig = (updates: Partial<KpiWidgetConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-trend">Show Trend</Label>
              <div className="text-xs text-muted-foreground">
                Display trend indicator with percentage change
              </div>
            </div>
            <Switch
              id="show-trend"
              checked={config.showTrend ?? true}
              onCheckedChange={(checked) => updateConfig({ showTrend: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-sparkline">Show Sparkline</Label>
              <div className="text-xs text-muted-foreground">
                Display mini trend chart below KPI value
              </div>
            </div>
            <Switch
              id="show-sparkline"
              checked={config.showSparkline ?? false}
              onCheckedChange={(checked) => updateConfig({ showSparkline: checked })}
            />
          </div>

          {config.showTrend && (
            <div className="space-y-2">
              <Label htmlFor="trend-period">Trend Period</Label>
              <Select
                value={config.trendPeriod || 'day'}
                onValueChange={(value) =>
                  updateConfig({ trendPeriod: value as KpiWidgetConfigType['trendPeriod'] })
                }
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
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Value Formatting</h3>
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
                placeholder="e.g., %, units"
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

      <div>
        <h3 className="text-sm font-medium mb-4">Thresholds</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warning-threshold">Warning Threshold</Label>
            <Input
              id="warning-threshold"
              type="number"
              value={config.warningThreshold || ''}
              onChange={(e) => updateConfig({ warningThreshold: parseFloat(e.target.value) || undefined })}
              placeholder="Optional warning level"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="critical-threshold">Critical Threshold</Label>
            <Input
              id="critical-threshold"
              type="number"
              value={config.criticalThreshold || ''}
              onChange={(e) => updateConfig({ criticalThreshold: parseFloat(e.target.value) || undefined })}
              placeholder="Optional critical level"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
