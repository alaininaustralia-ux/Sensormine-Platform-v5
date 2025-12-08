/**
 * Widget Configuration Panel
 * 
 * Side panel for configuring widget settings including field binding,
 * data sources, and widget-specific options.
 */

'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WidgetDataConfig } from './widget-data-config';
import type { WidgetDataConfig as WidgetDataConfigType, DataSourceConfig } from './widget-data-config';
import type { Widget, WidgetType } from '@/lib/types/dashboard';
import { Save, X } from 'lucide-react';
import {
  KpiWidgetConfig,
  ChartWidgetConfig,
  GaugeWidgetConfig,
  TableWidgetConfig,
  MapWidgetConfig,
  DeviceListWidgetConfig,
  DeviceDataTableWidgetConfig,
} from './widget-configs';
import {
  KpiFieldSelection,
  ChartFieldSelection,
  GaugeFieldSelection,
  TableFieldSelection,
  MapFieldSelection,
  type KpiFieldConfig,
  type ChartFieldConfig,
  type GaugeFieldConfig,
  type TableFieldConfig,
  type MapFieldConfig,
} from './widget-configs/field-selection-config';

// Helper function to determine default data source type based on widget type
const getDefaultDataSourceType = (type: WidgetType): DataSourceConfig['type'] => {
  switch (type) {
    case 'chart':
      return 'historical';
    case 'gauge':
    case 'kpi':
      return 'realtime';
    default:
      return 'realtime';
  }
};

// Helper function to get default field config based on widget type
const getDefaultFieldConfig = (
  type?: WidgetType
): KpiFieldConfig | ChartFieldConfig | GaugeFieldConfig | TableFieldConfig | MapFieldConfig | Record<string, unknown> => {
  switch (type) {
    case 'kpi':
      return {
        aggregation: 'avg',
        enableTrend: true,
        trendComparisonPeriod: 'previous',
      } as KpiFieldConfig;
    case 'chart':
      return {
        fields: [],
        aggregation: 'avg',
        timeBucket: 'auto',
        timeRange: { value: 24, unit: 'hours' },
      } as ChartFieldConfig;
    case 'gauge':
      return {
        aggregation: 'current',
        minValue: 0,
        maxValue: 100,
      } as GaugeFieldConfig;
    case 'table':
      return {
        fields: [],
        enableGrouping: false,
      } as TableFieldConfig;
    case 'map':
      return {
        tooltipFields: [],
        enableClustering: false,
        enableHeatmap: false,
      } as MapFieldConfig;
    default:
      return {};
  }
};

export interface WidgetConfigDialogProps {
  /** Widget to configure */
  widget: Widget | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when configuration is saved */
  onSave: (widgetId: string, updates: Partial<Widget>) => void;
}

export function WidgetConfigDialog({
  widget,
  open,
  onOpenChange,
  onSave,
}: WidgetConfigDialogProps) {
  if (!widget) return null;

  return (
    <WidgetConfigFormInternal
      key={widget.id} // Remount when widget changes
      widget={widget}
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

function WidgetConfigFormInternal({
  widget,
  open,
  onOpenChange,
  onSave,
}: WidgetConfigDialogProps) {
  // Initialize state from widget props - runs once per widget due to key
  const getInitialDataConfig = (): WidgetDataConfigType => {
    const existingDataSource = widget?.config?.dataSource;
    if (existingDataSource) {
      return {
        dataSource: existingDataSource,
        filters: widget?.config?.filters,
      };
    }
    return {
      dataSource: {
        type: getDefaultDataSourceType(widget?.type || 'kpi'),
        fields: [],
      },
    };
  };

  const [title, setTitle] = useState(widget?.title || '');
  const [description, setDescription] = useState(widget?.description || '');
  const [dataConfig, setDataConfig] = useState<WidgetDataConfigType>(getInitialDataConfig);
  const [widgetSpecificConfig, setWidgetSpecificConfig] = useState(widget?.config?.widgetSpecific || {});
  const [fieldConfig, setFieldConfig] = useState(widget?.config?.fieldConfig || getDefaultFieldConfig(widget?.type));

  const handleSave = () => {
    if (!widget) return;

    onSave(widget.id, {
      title,
      description,
      config: {
        ...widget.config,
        widgetSpecific: widgetSpecificConfig,
        fieldConfig: fieldConfig,
      },
      dataConfig: dataConfig,
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!widget) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure Widget</SheetTitle>
          <SheetDescription>
            Configure widget settings, data sources, and field bindings
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="data">Data & Fields</TabsTrigger>
            <TabsTrigger value="display">Display Options</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter widget title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-description">Description</Label>
              <Textarea
                id="widget-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional widget description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Widget Type</Label>
              <div className="text-sm text-muted-foreground capitalize bg-muted px-3 py-2 rounded-md">
                {widget.type}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-4">
            {widget.type === 'kpi' && (
              <KpiFieldSelection
                config={fieldConfig as KpiFieldConfig}
                onChange={setFieldConfig}
              />
            )}

            {widget.type === 'chart' && (
              <ChartFieldSelection
                config={fieldConfig as ChartFieldConfig}
                onChange={setFieldConfig}
              />
            )}

            {widget.type === 'gauge' && (
              <GaugeFieldSelection
                config={fieldConfig as GaugeFieldConfig}
                onChange={setFieldConfig}
              />
            )}

            {widget.type === 'table' && (
              <TableFieldSelection
                config={fieldConfig as TableFieldConfig}
                onChange={setFieldConfig}
              />
            )}

            {widget.type === 'map' && (
              <MapFieldSelection
                config={fieldConfig as MapFieldConfig}
                onChange={setFieldConfig}
              />
            )}

            {widget.type === 'device-list' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Data Pattern: Device Records</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Device list automatically fetches all devices from the Device API
                  </p>
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                  ℹ️ Core fields (name, type, status, location, last seen) are automatically included.
                  Additional custom fields can be configured in the Display Options tab.
                </div>
              </div>
            )}

            {widget.type === 'device-data-table' && (
              <DeviceDataTableWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
                mode="data"
              />
            )}

            {!['kpi', 'chart', 'gauge', 'table', 'map', 'device-list', 'device-data-table'].includes(widget.type) && (
              <WidgetDataConfig
                config={dataConfig}
                onChange={setDataConfig}
                widgetType={widget.type}
              />
            )}
          </TabsContent>

          <TabsContent value="display" className="space-y-4 mt-4">
            {widget.type === 'kpi' && (
              <KpiWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
              />
            )}

            {widget.type === 'chart' && (
              <ChartWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
              />
            )}

            {widget.type === 'gauge' && (
              <GaugeWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
              />
            )}

            {widget.type === 'table' && (
              <TableWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
              />
            )}

            {widget.type === 'map' && (
              <MapWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
              />
            )}

            {widget.type === 'device-list' && (
              <DeviceListWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
              />
            )}

            {widget.type === 'device-data-table' && (
              <DeviceDataTableWidgetConfig
                config={widgetSpecificConfig}
                onChange={setWidgetSpecificConfig}
                mode="display"
              />
            )}

            {!['kpi', 'chart', 'gauge', 'table', 'map', 'device-list', 'device-data-table'].includes(widget.type) && (
              <div className="text-sm text-muted-foreground">
                Widget-specific display options coming soon.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
