/**
 * Widget Configuration Panel
 * Panel for configuring selected widget properties (Story 4.1)
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import type { DashboardWidget, WidgetConfig, WidgetDataConfig as WidgetDataConfigType } from '@/lib/dashboard/types';
import { WidgetDataConfig } from './builder/widget-data-config';
import { cn } from '@/lib/utils';

interface WidgetConfigPanelProps {
  className?: string;
}

export function WidgetConfigPanel({ className }: WidgetConfigPanelProps) {
  const { dashboard, selectedWidgetId, updateWidget, updateWidgetConfig, selectWidget } = useDashboardStore();

  const selectedWidget = dashboard?.widgets.find((w) => w.id === selectedWidgetId);

  if (!selectedWidget) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Widget Configuration</CardTitle>
          <CardDescription>Select a widget to configure</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click on a widget in the dashboard to configure its properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateWidget(selectedWidget.id, { title: e.target.value });
  };

  const handleClose = () => {
    selectWidget(null);
  };

  const handleDataConfigChange = (dataConfig: WidgetDataConfigType) => {
    updateWidget(selectedWidget.id, { dataConfig });
  };

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader className="py-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">Widget Configuration</CardTitle>
          <CardDescription>Configure {selectedWidget.type} widget</CardDescription>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleClose} aria-label="Close configuration panel">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Basic Properties */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Basic Properties</h4>
          <div className="space-y-2">
            <Label htmlFor="widget-title">Title</Label>
            <Input
              id="widget-title"
              value={selectedWidget.title}
              onChange={handleTitleChange}
              placeholder="Widget title"
            />
          </div>
        </div>

        {/* Data Configuration */}
        {['chart', 'gauge', 'kpi', 'table', 'map'].includes(selectedWidget.type) && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Data Configuration</h4>
            <WidgetDataConfig
              config={selectedWidget.dataConfig || {
                dataSource: {
                  type: 'realtime',
                  fields: [],
                  refreshInterval: 5,
                },
              }}
              onChange={handleDataConfigChange}
              widgetType={selectedWidget.type as 'chart' | 'gauge' | 'kpi' | 'table' | 'map' | 'video'}
            />
          </div>
        )}

        {/* Type-specific configuration */}
        <WidgetTypeConfig widget={selectedWidget} onConfigChange={updateWidgetConfig} />

        {/* Position & Size */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Position & Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="widget-x">Column</Label>
              <Input
                id="widget-x"
                type="number"
                value={selectedWidget.position.x}
                min={0}
                max={7}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widget-y">Row</Label>
              <Input
                id="widget-y"
                type="number"
                value={selectedWidget.position.y}
                min={0}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widget-width">Width</Label>
              <Input
                id="widget-width"
                type="number"
                value={selectedWidget.position.width}
                min={1}
                max={8}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widget-height">Height</Label>
              <Input
                id="widget-height"
                type="number"
                value={selectedWidget.position.height}
                min={1}
                max={6}
                disabled
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface WidgetTypeConfigProps {
  widget: DashboardWidget;
  onConfigChange: (widgetId: string, config: WidgetConfig) => void;
}

function WidgetTypeConfig({ widget, onConfigChange }: WidgetTypeConfigProps) {
  const config = widget.config;

  switch (config.type) {
    case 'chart':
      return (
        <ChartConfig
          config={config.config}
          onChange={(newConfig) =>
            onConfigChange(widget.id, { type: 'chart', config: newConfig })
          }
        />
      );
    case 'kpi':
      return (
        <KpiConfig
          config={config.config}
          onChange={(newConfig) =>
            onConfigChange(widget.id, { type: 'kpi', config: newConfig })
          }
        />
      );
    case 'gauge':
      return (
        <GaugeConfig
          config={config.config}
          onChange={(newConfig) =>
            onConfigChange(widget.id, { type: 'gauge', config: newConfig })
          }
        />
      );
    default:
      return (
        <div className="text-sm text-muted-foreground">
          Configuration options for {config.type} widget coming soon.
        </div>
      );
  }
}

interface ChartConfigProps {
  config: {
    type: 'line' | 'bar' | 'area' | 'scatter' | 'step';
    xAxisLabel?: string;
    yAxisLabel?: string;
    showLegend?: boolean;
    aggregationInterval?: string;
  };
  onChange: (config: ChartConfigProps['config']) => void;
}

function ChartConfig({ config, onChange }: ChartConfigProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Chart Configuration</h4>
      <div className="space-y-2">
        <Label htmlFor="chart-type">Chart Type</Label>
        <select
          id="chart-type"
          value={config.type}
          onChange={(e) =>
            onChange({ ...config, type: e.target.value as ChartConfigProps['config']['type'] })
          }
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="line">Line</option>
          <option value="bar">Bar</option>
          <option value="area">Area</option>
          <option value="scatter">Scatter</option>
          <option value="step">Step</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="x-axis">X-Axis Label</Label>
        <Input
          id="x-axis"
          value={config.xAxisLabel || ''}
          onChange={(e) => onChange({ ...config, xAxisLabel: e.target.value })}
          placeholder="Time"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="y-axis">Y-Axis Label</Label>
        <Input
          id="y-axis"
          value={config.yAxisLabel || ''}
          onChange={(e) => onChange({ ...config, yAxisLabel: e.target.value })}
          placeholder="Value"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-legend"
          checked={config.showLegend ?? true}
          onChange={(e) => onChange({ ...config, showLegend: e.target.checked })}
          className="rounded border-input"
        />
        <Label htmlFor="show-legend">Show Legend</Label>
      </div>
    </div>
  );
}

interface KpiConfigProps {
  config: {
    format?: string;
    comparisonPeriod?: 'day' | 'week' | 'month' | 'year';
    showTrend?: boolean;
    unit?: string;
  };
  onChange: (config: KpiConfigProps['config']) => void;
}

function KpiConfig({ config, onChange }: KpiConfigProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">KPI Configuration</h4>
      <div className="space-y-2">
        <Label htmlFor="kpi-unit">Unit</Label>
        <Input
          id="kpi-unit"
          value={config.unit || ''}
          onChange={(e) => onChange({ ...config, unit: e.target.value })}
          placeholder="e.g., %, °C, kWh"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="comparison-period">Comparison Period</Label>
        <select
          id="comparison-period"
          value={config.comparisonPeriod || 'day'}
          onChange={(e) =>
            onChange({
              ...config,
              comparisonPeriod: e.target.value as KpiConfigProps['config']['comparisonPeriod'],
            })
          }
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-trend"
          checked={config.showTrend ?? true}
          onChange={(e) => onChange({ ...config, showTrend: e.target.checked })}
          className="rounded border-input"
        />
        <Label htmlFor="show-trend">Show Trend</Label>
      </div>
    </div>
  );
}

interface GaugeConfigProps {
  config: {
    min: number;
    max: number;
    thresholds?: { value: number; color: string; label?: string }[];
    unit?: string;
  };
  onChange: (config: GaugeConfigProps['config']) => void;
}

function GaugeConfig({ config, onChange }: GaugeConfigProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Gauge Configuration</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gauge-min">Min Value</Label>
          <Input
            id="gauge-min"
            type="number"
            value={config.min}
            onChange={(e) => onChange({ ...config, min: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gauge-max">Max Value</Label>
          <Input
            id="gauge-max"
            type="number"
            value={config.max}
            onChange={(e) => onChange({ ...config, max: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="gauge-unit">Unit</Label>
        <Input
          id="gauge-unit"
          value={config.unit || ''}
          onChange={(e) => onChange({ ...config, unit: e.target.value })}
          placeholder="e.g., %, °C"
        />
      </div>
    </div>
  );
}
