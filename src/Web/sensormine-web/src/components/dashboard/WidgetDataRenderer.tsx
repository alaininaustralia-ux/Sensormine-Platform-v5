/**
 * WidgetDataRenderer
 * 
 * Component that handles data fetching and rendering for configured widgets
 * Uses useWidgetData hook to fetch data and transforms it for specific widget types
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useWidgetData } from '@/hooks/useWidgetData';
import type { DashboardWidget } from '@/lib/dashboard/types';

// Import widget components
import { ChartWidget } from './widgets/chart-widget';
import { TableWidget } from './widgets/table-widget';
import { GaugeWidget } from './widgets/gauge-widget';
import { KPIWidget } from './widgets/kpi-widget';
import { MapWidget } from './widgets/map-widget';
import { DeviceListWidget } from './widgets/device-list-widget';

// Re-use types from useWidgetData hook
interface WidgetDataPoint {
  deviceId: string;
  timestamp: string;
  values: Record<string, number | string | boolean>;
}

interface AggregatedDataPoint {
  timestamp: string;
  value: number;
  count: number;
}

interface AggregatedSeries {
  field: string;
  dataPoints: AggregatedDataPoint[];
}

interface WidgetDataResponse {
  dataPoints?: WidgetDataPoint[];
  series?: AggregatedSeries[];
}

interface WidgetDataRendererProps {
  widget: DashboardWidget;
  /** Device ID from URL context for filtering data */
  deviceId?: string | null;
}

export function WidgetDataRenderer({ widget, deviceId }: WidgetDataRendererProps) {
  const { data, isLoading, error } = useWidgetData(widget, { deviceId });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
        <p className="text-sm font-medium">Failed to load data</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  // Render widget based on type with transformed data
  switch (widget.type) {
    case 'chart':
      return renderChart(widget, data);
    case 'table':
      return renderTable(widget, data);
    case 'gauge':
      return renderGauge(widget, data);
    case 'kpi':
      return renderKPI(widget, data);
    case 'map':
      return renderMap(widget);
    case 'device-list':
      return (
        <DeviceListWidget 
          id={widget.id}
          title={widget.title}
          dashboardId=""
          config={(widget.config as any)?.widgetSpecific || {}}
        />
      );
    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Unsupported widget type: {widget.type}</p>
        </div>
      );
  }
}

// Transform and render chart widget
function renderChart(widget: DashboardWidget, data: { series?: AggregatedSeries[]; dataPoints?: WidgetDataPoint[] }) {
  const series: Array<{
    seriesName: string;
    data: Array<{ timestamp: number | Date; value: number }>;
  }> = [];

  if (data?.series) {
    // Aggregated data with series
    data.series.forEach((s: any) => {
      series.push({
        seriesName: s.field,
        data: (s.dataPoints || []).map((dp: any) => ({
          timestamp: new Date(dp.timestamp),
          value: dp.value,
        })),
      });
    });
  } else if (data?.dataPoints) {
    // Raw data points - group by field
    const fieldData: Record<string, Array<{ timestamp: Date; value: number }>> = {};
    
    data.dataPoints.forEach((dp) => {
      Object.entries(dp.values || {}).forEach(([field, value]) => {
        if (!fieldData[field]) {
          fieldData[field] = [];
        }
        fieldData[field].push({
          timestamp: new Date(dp.timestamp),
          value: typeof value === 'number' ? value : parseFloat(String(value)),
        });
      });
    });

    // Convert to series format
    Object.entries(fieldData).forEach(([field, points]) => {
      series.push({
        seriesName: field,
        data: points,
      });
    });
  }

  const chartConfig = {
    title: widget.title,
    chartType: 'line' as const,
    series,
    showLegend: true,
    showGrid: true,
  };

  return (
    <ChartWidget
      id={widget.id}
      title={widget.title}
      config={chartConfig}
    />
  );
}

// Transform and render table widget
function renderTable(widget: DashboardWidget, data: { dataPoints?: WidgetDataPoint[] }) {
  const columns = widget.dataConfig?.dataSource?.fields?.map(field => ({
    key: field.fieldPath,
    label: field.fieldName,
    sortable: true,
  })) || [];

  // Flatten data points into table rows
  const tableData = (data?.dataPoints || []).map((dp) => {
    const row: Record<string, unknown> = {
      deviceId: dp.deviceId,
      timestamp: new Date(dp.timestamp).toLocaleString(),
    };
    
    // Add each field value as a column (excluding deviceId and timestamp to avoid overwriting)
    Object.entries(dp.values || {}).forEach(([key, value]) => {
      if (key !== 'deviceId' && key !== 'timestamp') {
        row[key] = value;
      }
    });
    
    return row;
  });

  // Build columns array without duplicates
  const allColumns = [
    { key: 'deviceId', label: 'Device', sortable: true },
    { key: 'timestamp', label: 'Time', sortable: true },
    ...columns
  ];
  
  // Remove duplicate columns (keep first occurrence)
  const uniqueColumns = allColumns.filter((col, index, self) => 
    index === self.findIndex(c => c.key === col.key)
  );

  return (
    <TableWidget
      id={widget.id}
      title={widget.title}
      columns={uniqueColumns}
      data={tableData}
    />
  );
}

// Transform and render gauge widget
function renderGauge(widget: DashboardWidget, data: { series?: AggregatedSeries[]; dataPoints?: WidgetDataPoint[] }) {
  let value = 0;

  if (data?.series && data.series.length > 0) {
    // Get latest value from first series
    const series = data.series[0];
    if (series.dataPoints && series.dataPoints.length > 0) {
      value = series.dataPoints[series.dataPoints.length - 1].value;
    }
  } else if (data?.dataPoints && data.dataPoints.length > 0) {
    // Get value from latest data point
    const dp = data.dataPoints[0];
    const firstValue = Object.values(dp.values || {})[0];
    value = typeof firstValue === 'number' ? firstValue : parseFloat(String(firstValue));
  }

  return (
    <GaugeWidget
      id={widget.id}
      title={widget.title}
      value={value}
      min={0}
      max={100}
      unit=""
    />
  );
}

// Transform and render KPI widget
function renderKPI(widget: DashboardWidget, data: { series?: AggregatedSeries[]; dataPoints?: WidgetDataPoint[] }) {
  let value = 0;
  let previousValue = 0;

  if (data?.series && data.series.length > 0) {
    const series = data.series[0];
    if (series.dataPoints && series.dataPoints.length > 0) {
      // Current value is the latest
      value = series.dataPoints[series.dataPoints.length - 1].value;
      // Previous value is second to last (for trend calculation)
      if (series.dataPoints.length > 1) {
        previousValue = series.dataPoints[series.dataPoints.length - 2].value;
      }
    }
  } else if (data?.dataPoints && data.dataPoints.length > 0) {
    // Get value from latest data point
    const dp = data.dataPoints[0];
    const firstValue = Object.values(dp.values || {})[0];
    value = typeof firstValue === 'number' ? firstValue : parseFloat(String(firstValue));
    
    // Use previous data point if available
    if (data.dataPoints.length > 1) {
      const prevDp = data.dataPoints[1];
      const prevFirstValue = Object.values(prevDp.values || {})[0];
      previousValue = typeof prevFirstValue === 'number' ? prevFirstValue : parseFloat(String(prevFirstValue));
    }
  }

  return (
    <KPIWidget
      id={widget.id}
      title={widget.title}
      value={value}
      previousValue={previousValue}
      unit=""
    />
  );
}

// Transform and render map widget
function renderMap(widget: DashboardWidget) {
  // Map widgets typically need location data
  // For now, use default configuration
  const mapConfig = {
    center: [39.8283, -98.5795] as [number, number],
    zoom: 4,
    enableClustering: true,
    showGeofences: false,
    autoFitBounds: true,
    deviceTypes: [],
    deviceStatuses: [],
  };

  return (
    <MapWidget
      id={widget.id}
      title={widget.title}
      config={mapConfig}
    />
  );
}
