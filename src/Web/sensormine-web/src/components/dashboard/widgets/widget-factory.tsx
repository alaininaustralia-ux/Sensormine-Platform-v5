/**
 * Widget Factory
 * 
 * Dynamically renders the appropriate widget component based on widget type.
 */

'use client';

import type { Widget } from '@/lib/types/dashboard';
import type { ChartType } from '@/lib/types/chart';
import { KPIWidget } from './kpi-widget';
import { GaugeWidget } from './gauge-widget';
import { TableWidget } from './table-widget';
import { ChartWidget } from './chart-widget';
import { MapWidget } from './map-widget';
import { VideoWidget } from './video-widget';
import type { BaseWidgetProps } from './base-widget';

export interface WidgetFactoryProps {
  /** Widget configuration */
  widget: Widget;
  /** Whether the widget is in edit mode */
  isEditMode?: boolean;
  /** Callback when configure is clicked */
  onConfigure?: (widgetId: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (widgetId: string) => void;
}

/**
 * Mock data generators for each widget type
 */
const mockDataGenerators = {
  kpi: () => ({
    value: Math.floor(Math.random() * 1000),
    previousValue: Math.floor(Math.random() * 900),
    unit: 'devices',
  }),
  gauge: () => ({
    value: Math.floor(Math.random() * 100),
    min: 0,
    max: 100,
    unit: '%',
    warningThreshold: 70,
    criticalThreshold: 90,
  }),
  table: () => ({
    columns: [
      { key: 'device', label: 'Device', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'value', label: 'Value', sortable: true },
    ],
    data: Array.from({ length: 5 }, (_, i) => ({
      device: `Device ${i + 1}`,
      status: i % 2 === 0 ? 'Online' : 'Offline',
      value: Math.floor(Math.random() * 100),
    })),
  }),
  chart: (config?: Widget['config']) => ({
    chartType: (config?.chartType as ChartType) || 'line',
    showToolbar: config?.showToolbar !== false,
  }),
  map: () => ({}),
  video: () => ({}),
};

export function WidgetFactory({
  widget,
  isEditMode = false,
  onConfigure,
  onDelete,
}: WidgetFactoryProps) {
  const baseProps: BaseWidgetProps = {
    id: widget.id,
    title: widget.title,
    description: widget.description,
    children: null,
    isEditMode,
    onConfigure: onConfigure ? () => onConfigure(widget.id) : undefined,
    onDelete: onDelete ? () => onDelete(widget.id) : undefined,
  };
  
  switch (widget.type) {
    case 'kpi':
      return <KPIWidget {...baseProps} {...mockDataGenerators.kpi()} />;
    
    case 'gauge':
      return <GaugeWidget {...baseProps} {...mockDataGenerators.gauge()} />;
    
    case 'table':
      return <TableWidget {...baseProps} {...mockDataGenerators.table()} />;
    
    case 'chart':
      return <ChartWidget {...baseProps} {...mockDataGenerators.chart(widget.config)} />;
    
    case 'map':
      return <MapWidget {...baseProps} />;
    
    case 'video':
      return <VideoWidget {...baseProps} />;
    
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}
