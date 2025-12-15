/**
 * Connected Pie Chart Widget
 * 
 * Pie chart widget that fetches categorical data from the Query API.
 */

'use client';

import { useEffect, useState } from 'react';
import { PieChartWidget } from './pie-chart-widget';
import type { BaseWidgetProps } from './base-widget';
import { getCategoricalData } from '@/lib/api/widget-data';
import type { CategoricalDataResponse } from '@/lib/api/types';

interface ConnectedPieChartWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Field to group by */
  groupBy: string;
  /** Field to aggregate */
  valueField?: string;
  /** Aggregation function */
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  /** Hours to look back */
  lookbackHours?: number;
  /** Device IDs to filter (comma-separated) */
  deviceIds?: string;
  /** Maximum number of categories */
  limit?: number;
  /** Show as donut chart */
  donut?: boolean;
  /** Chart colors */
  colors?: string[];
  /** Show legend */
  showLegend?: boolean;
  /** Show percentages */
  showPercentages?: boolean;
  /** Chart height */
  height?: number;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

export function ConnectedPieChartWidget({
  groupBy,
  valueField = 'value',
  aggregation = 'count',
  lookbackHours = 24 * 7, // 7 days default
  deviceIds,
  limit = 10,
  donut = false,
  colors,
  showLegend = true,
  showPercentages = true,
  height = 300,
  refreshInterval = 60000,
  ...baseProps
}: ConnectedPieChartWidgetProps) {
  const [data, setData] = useState<CategoricalDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const now = new Date();
        const startTime = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
        
        const response = await getCategoricalData({
          groupBy,
          valueField,
          aggregation,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          deviceIds,
          limit,
        });
        
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
  }, [groupBy, valueField, aggregation, lookbackHours, deviceIds, limit, refreshInterval]);

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

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const chartData = data.categories.map(cat => ({
    name: cat.name,
    value: cat.value,
    percentage: cat.percentage,
  }));

  return (
    <PieChartWidget
      {...baseProps}
      data={chartData}
      donut={donut}
      colors={colors}
      showLegend={showLegend}
      showPercentages={showPercentages}
      height={height}
    />
  );
}
