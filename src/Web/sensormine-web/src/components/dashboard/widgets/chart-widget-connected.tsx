/**
 * Connected Time-Series Chart Widget
 * 
 * Chart widget that fetches aggregated time-series data from the Query API.
 * Supports multiple fields and advanced aggregations including percentiles.
 */

'use client';

import { useEffect, useState } from 'react';
import { ChartWidget } from './chart-widget';
import type { BaseWidgetProps } from './base-widget';
import { getMultiSeriesData } from '@/lib/api/widget-data';
import type { AggregatedWidgetDataResponse } from '@/lib/api/types';
import type { ChartConfiguration, TimeSeriesData } from '@/lib/types/chart-types';

interface SeriesConfigOverride {
  seriesName?: string;
  color?: string;
  unit?: string;
  yAxisId?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: boolean;
  fillOpacity?: number;
}

interface ConnectedChartWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Field names to query */
  fields: string[];
  /** Aggregation function */
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'first' | 'last' | 'median' | 'p50' | 'p90' | 'p95' | 'p99';
  /** Time bucket interval (e.g., "5m", "1h", "1d") */
  interval?: string;
  /** Hours to look back */
  lookbackHours?: number;
  /** Device IDs to filter (comma-separated) */
  deviceIds?: string;
  /** Chart type */
  chartType?: 'line' | 'area' | 'bar' | 'step';
  /** Series configuration overrides */
  seriesConfigs?: Record<string, SeriesConfigOverride>;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Chart height */
  height?: number;
  /** Show grid */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
}

export function ConnectedChartWidget({
  fields,
  aggregation = 'avg',
  interval = '1h',
  lookbackHours = 24,
  deviceIds,
  chartType = 'line',
  seriesConfigs = {},
  refreshInterval = 60000,
  height = 400,
  showGrid = true,
  showLegend = true,
  xAxisLabel,
  yAxisLabel,
  ...baseProps
}: ConnectedChartWidgetProps) {
  const [data, setData] = useState<AggregatedWidgetDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const now = new Date();
        const startTime = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
        
        const response = await getMultiSeriesData(
          fields,
          startTime.toISOString(),
          now.toISOString(),
          aggregation,
          interval,
          deviceIds
        );
        
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fields, aggregation, interval, lookbackHours, deviceIds, refreshInterval]);

  // Transform API response to chart configuration
  const getChartConfig = (): ChartConfiguration => {
    if (!data || !data.series) {
      return {
        title: baseProps.title || 'Chart',
        chartType,
        series: [],
        height,
        showGrid,
        showLegend,
        xAxisLabel,
        yAxisLabel,
      };
    }

    const series: TimeSeriesData[] = data.series.map((apiSeries) => {
      const fieldConfig = seriesConfigs[apiSeries.field] || {};
      
      const dataPoints = apiSeries.dataPoints.map(point => ({
        timestamp: new Date(point.timestamp),
        value: point.value,
      }));

      return {
        seriesName: fieldConfig.seriesName || apiSeries.field,
        data: dataPoints,
        color: fieldConfig.color,
        unit: fieldConfig.unit,
      };
    });

    return {
      title: baseProps.title || 'Chart',
      chartType,
      series,
      height,
      showGrid,
      showLegend,
      xAxisLabel,
      yAxisLabel,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <p className="text-sm font-medium">Error loading chart</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ChartWidget
      {...baseProps}
      config={getChartConfig()}
    />
  );
}
