/**
 * Widget Factory
 * 
 * Dynamically renders the appropriate widget component based on widget type.
 */

'use client';

import type { Widget } from '@/lib/types/dashboard';
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
    onRefresh: async () => {},
  }),
  gauge: () => ({
    value: Math.floor(Math.random() * 100),
    min: 0,
    max: 100,
    unit: '%',
    warningThreshold: 70,
    criticalThreshold: 90,
    onRefresh: async () => {},
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
    onRefresh: async () => {},
  }),
  chart: () => ({
    config: {
      title: 'Sample Chart',
      chartType: 'line' as const,
      series: [{
        seriesName: 'Sample Data',
        data: Array.from({ length: 10 }, (_, i) => ({
          timestamp: Date.now() - (9 - i) * 3600000,
          value: Math.floor(Math.random() * 100)
        }))
      }]
    },
    onRefresh: async () => {},
  }),
  map: () => ({
    onRefresh: async () => {},
  }),
  video: () => ({
    onRefresh: async () => {},
  }),
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
  
  // Get mock data based on widget type
  const mockData = mockDataGenerators[widget.type]();
  
  switch (widget.type) {
    case 'kpi':
      return <KPIWidget {...baseProps} {...(mockData as ReturnType<typeof mockDataGenerators.kpi>)} />;
    
    case 'gauge':
      return <GaugeWidget {...baseProps} {...(mockData as ReturnType<typeof mockDataGenerators.gauge>)} />;
    
    case 'table':
      return <TableWidget {...baseProps} {...(mockData as ReturnType<typeof mockDataGenerators.table>)} />;
    
    case 'chart':
      return <ChartWidget {...baseProps} {...(mockData as ReturnType<typeof mockDataGenerators.chart>)} />;
    
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
