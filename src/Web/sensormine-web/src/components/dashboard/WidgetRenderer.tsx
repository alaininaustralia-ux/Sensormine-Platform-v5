/**
 * Widget Renderer
 * 
 * Renders actual widget components with data fetching and binding
 */

'use client';

import { useEffect, useState } from 'react';
import type { DashboardWidget } from '@/lib/dashboard/types';
import { ChartWidget } from './widgets/chart-widget';
import { TableWidget } from './widgets/table-widget';
import { MapWidget } from './widgets/map-widget';
import { GaugeWidget } from './widgets/gauge-widget';
import { KPIWidget } from './widgets/kpi-widget';
import { Loader2 } from 'lucide-react';
import type { ChartConfiguration } from '@/lib/types/chart-types';
import type { MapWidgetConfig } from '@/lib/types/map';

interface WidgetRendererProps {
  widget: DashboardWidget;
}

// API Response types
interface WidgetDataPoint {
  deviceId: string;
  timestamp: string;
  values: Record<string, number | string>;
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
  timestamp: string;
  dataPoints?: WidgetDataPoint[];
  series?: AggregatedSeries[];
  count: number;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  const [data, setData] = useState<WidgetDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!widget.dataConfig || !widget.dataConfig.dataSource) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { dataSource, filters } = widget.dataConfig;
        
        // Build query based on data source configuration
        const queryParams = new URLSearchParams();
        
        // Add fields - extract field paths from configured fields
        if (dataSource.fields && dataSource.fields.length > 0) {
          const fieldPaths = dataSource.fields.map(f => f.fieldPath);
          queryParams.append('fields', fieldPaths.join(','));
          
          // Add device type IDs
          const deviceTypeIds = [...new Set(dataSource.fields.map(f => f.deviceTypeId))];
          if (deviceTypeIds.length > 0) {
            queryParams.append('deviceTypeIds', deviceTypeIds.join(','));
          }
        }

        // Add time range
        if (dataSource.timeRange) {
          const now = new Date();
          const { value, unit } = dataSource.timeRange;
          const startTime = new Date(now);
          
          switch (unit) {
            case 'minutes':
              startTime.setMinutes(now.getMinutes() - value);
              break;
            case 'hours':
              startTime.setHours(now.getHours() - value);
              break;
            case 'days':
              startTime.setDate(now.getDate() - value);
              break;
            case 'weeks':
              startTime.setDate(now.getDate() - (value * 7));
              break;
          }
          
          queryParams.append('startTime', startTime.toISOString());
          queryParams.append('endTime', now.toISOString());
        }

        // Add aggregation
        if (dataSource.aggregation) {
          queryParams.append('aggregation', dataSource.aggregation);
        }

        // Add filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            queryParams.append(key, String(value));
          });
        }

        // Determine API endpoint based on data source type
        let endpoint = '/api/widgetdata/realtime';
        if (dataSource.type === 'historical') {
          endpoint = '/api/widgetdata/historical';
        } else if (dataSource.type === 'aggregated') {
          endpoint = '/api/widgetdata/aggregated';
        }

        // Fetch data from Widget Data API
        const response = await fetch(`${endpoint}?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching widget data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up refresh interval if configured
    const refreshInterval = widget.dataConfig?.dataSource?.refreshInterval;
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(intervalId);
    }
  }, [widget.dataConfig]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
        <p className="text-sm font-medium">Failed to load data</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  // Render widget based on type with data transformations
  switch (widget.type) {
    case 'chart': {
      // Transform API response to chart time series format
      const series: Array<{ name: string; data: Array<{ timestamp: string; value: number }> }> = [];
      
      if (data?.series) {
        // Aggregated data with series
        data.series.forEach((s: AggregatedSeries) => {
          series.push({
            name: s.field,
            data: (s.dataPoints || []).map((dp: AggregatedDataPoint) => ({
              timestamp: dp.timestamp,
              value: Number(dp.value || 0)
            }))
          });
        });
      } else if (data?.dataPoints) {
        // Raw data points - group by field
        const fieldData: Record<string, Array<{ timestamp: string; value: number }>> = {};
        
        data.dataPoints.forEach((dp: WidgetDataPoint) => {
          Object.entries(dp.values || {}).forEach(([field, value]) => {
            if (!fieldData[field]) {
              fieldData[field] = [];
            }
            fieldData[field].push({
              timestamp: dp.timestamp,
              value: Number(value)
            });
          });
        });
        
        Object.entries(fieldData).forEach(([field, dataPoints]) => {
          series.push({
            name: field,
            data: dataPoints
          });
        });
      }

      const chartConfig: ChartConfiguration = {
        title: widget.title,
        chartType: 'line',
        series: series.map(s => ({
          name: s.name,
          data: s.data.map(d => d.value),
          timestamps: s.data.map(d => d.timestamp)
        })) as unknown as ChartConfiguration['series'],
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

    case 'table': {
      // Transform data points to table rows
      const columns = widget.dataConfig?.dataSource?.fields?.map(field => ({
        key: field.fieldPath,
        label: field.fieldName,
        sortable: true,
      })) || [];

      // Flatten data points into table rows
      const tableData = (data?.dataPoints || []).map((dp: WidgetDataPoint) => {
        const row: Record<string, unknown> = {
          deviceId: dp.deviceId,
          timestamp: new Date(dp.timestamp).toLocaleString(),
        };
        
        // Add each field value as a column
        Object.entries(dp.values || {}).forEach(([key, value]) => {
          row[key] = value;
        });
        
        return row;
      });

      return (
        <TableWidget
          id={widget.id}
          title={widget.title}
          columns={[
            { key: 'deviceId', label: 'Device', sortable: true },
            { key: 'timestamp', label: 'Time', sortable: true },
            ...columns
          ]}
          data={tableData}
        />
      );
    }

    case 'map': {
      // Map widget typically uses live device locations, not time-series data
      // Use default configuration
      const mapConfig: MapWidgetConfig = {
        center: [39.8283, -98.5795],
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

    case 'gauge': {
      // Get latest value from data
      let value = 0;
      
      if (data?.dataPoints && data.dataPoints.length > 0) {
        const latestPoint = data.dataPoints[data.dataPoints.length - 1];
        const firstField = Object.values(latestPoint.values || {})[0];
        value = Number(firstField || 0);
      } else if (data?.series && data.series.length > 0) {
        const latestSeries = data.series[0];
        if (latestSeries.dataPoints && latestSeries.dataPoints.length > 0) {
          value = Number(latestSeries.dataPoints[latestSeries.dataPoints.length - 1].value || 0);
        }
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

    case 'kpi': {
      // Get current and previous value for trend calculation
      let value = 0;
      let previousValue: number | undefined;
      
      if (data?.dataPoints && data.dataPoints.length > 0) {
        const latestPoint = data.dataPoints[data.dataPoints.length - 1];
        const firstField = Object.values(latestPoint.values || {})[0];
        value = Number(firstField || 0);
        
        // Get previous value if available
        if (data.dataPoints.length > 1) {
          const prevPoint = data.dataPoints[data.dataPoints.length - 2];
          const prevField = Object.values(prevPoint.values || {})[0];
          previousValue = Number(prevField || 0);
        }
      } else if (data?.series && data.series.length > 0) {
        const series = data.series[0];
        if (series.dataPoints && series.dataPoints.length > 0) {
          value = Number(series.dataPoints[series.dataPoints.length - 1].value || 0);
          
          if (series.dataPoints.length > 1) {
            previousValue = Number(series.dataPoints[series.dataPoints.length - 2].value || 0);
          }
        }
      }
      
      const trendValue = previousValue !== undefined 
        ? ((value - previousValue) / previousValue) * 100 
        : undefined;
      const trendDirection = trendValue !== undefined 
        ? (trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral') 
        : undefined;

      return (
        <KPIWidget
          id={widget.id}
          title={widget.title}
          value={value}
          unit=""
          trend={trendDirection}
        />
      );
    }

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Widget type &quot;{widget.type}&quot; not supported</p>
        </div>
      );
  }
}
