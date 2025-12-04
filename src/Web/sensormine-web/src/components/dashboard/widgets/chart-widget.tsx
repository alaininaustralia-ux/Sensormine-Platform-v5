/**
 * Chart Widget
 * 
 * Story 4.2: Time-Series Charts
 * Dashboard widget for displaying time-series charts with
 * line, bar, area, scatter, and step chart types.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { TimeSeriesChart } from '../charts/time-series-chart';
import { ChartToolbar } from '../charts/chart-toolbar';
import { exportChart } from '../charts/chart-export';
import type { 
  ChartConfig, 
  ChartType, 
  ChartSeries, 
  TimeRange, 
  AggregationInterval,
  TimeSeriesDataPoint 
} from '@/lib/types/chart';

/** Simulated refresh delay for mock data in milliseconds */
const MOCK_REFRESH_DELAY_MS = 500;

export interface ChartWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Chart type */
  chartType?: ChartType;
  /** Data series to display */
  series?: ChartSeries[];
  /** Chart configuration */
  config?: Partial<ChartConfig>;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether auto-refresh is enabled */
  autoRefresh?: boolean;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Callback when aggregation changes */
  onAggregationChange?: (aggregation: AggregationInterval) => void;
  /** Callback when a data point is clicked */
  onDataPointClick?: (series: string, point: TimeSeriesDataPoint) => void;
}

/**
 * Generate mock time-series data for demonstration
 */
function generateMockData(chartType: ChartType): ChartSeries[] {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const points = 24;
  
  const generateSeries = (id: string, name: string, baseValue: number, variance: number): ChartSeries => ({
    id,
    name,
    unit: chartType === 'bar' ? 'count' : '°C',
    data: Array.from({ length: points }, (_, i) => ({
      timestamp: now - (points - 1 - i) * hourMs,
      value: baseValue + Math.random() * variance - variance / 2 + Math.sin(i / 4) * (variance / 2),
    })),
  });
  
  return [
    generateSeries('sensor1', 'Sensor A', 25, 10),
    generateSeries('sensor2', 'Sensor B', 22, 8),
  ];
}

/**
 * Chart Widget Component
 */
export function ChartWidget({
  chartType = 'line',
  series,
  config,
  showToolbar = true,
  autoRefresh = false,
  refreshInterval = 30,
  onTimeRangeChange,
  onAggregationChange,
  onDataPointClick,
  ...baseProps
}: ChartWidgetProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange | undefined>();
  const [aggregation, setAggregation] = useState<AggregationInterval>('raw');
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);
  
  // Use provided series or generate mock data
  const chartSeries = series ?? generateMockData(chartType);
  
  // Full chart configuration
  const chartConfig: ChartConfig = {
    chartType,
    series: chartSeries,
    timeRange,
    aggregation,
    ...config,
  };
  
  // Handle time range change from toolbar
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  }, [onTimeRangeChange]);
  
  // Handle time range change from chart zoom
  const handleChartZoom = useCallback((start: Date, end: Date) => {
    const range = { start, end };
    setTimeRange(range);
    onTimeRangeChange?.(range);
  }, [onTimeRangeChange]);
  
  // Handle aggregation change
  const handleAggregationChange = useCallback((agg: AggregationInterval) => {
    setAggregation(agg);
    onAggregationChange?.(agg);
  }, [onAggregationChange]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => setIsLoading(false), MOCK_REFRESH_DELAY_MS);
  }, []);
  
  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = useCallback((enabled: boolean) => {
    setIsAutoRefresh(enabled);
  }, []);
  
  // Handle zoom reset
  const handleZoomOut = useCallback(() => {
    setTimeRange(undefined);
  }, []);
  
  // Handle export
  const handleExport = useCallback(async (format: 'png' | 'svg' | 'csv' | 'json') => {
    if (!chartRef.current) return;
    
    try {
      const chartElement = chartRef.current.querySelector('[data-testid="time-series-chart"]');
      if (chartElement) {
        await exportChart(
          chartElement as HTMLElement,
          chartSeries,
          format,
          { filename: `${baseProps.title || 'chart'}-${new Date().toISOString().split('T')[0]}` }
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [chartSeries, baseProps.title]);
  
  return (
    <BaseWidget {...baseProps} isLoading={isLoading}>
      <div ref={chartRef} className="flex flex-col h-full">
        {showToolbar && (
          <ChartToolbar
            timeRange={timeRange}
            aggregation={aggregation}
            autoRefresh={isAutoRefresh}
            refreshInterval={refreshInterval}
            isLoading={isLoading}
            onTimeRangeChange={handleTimeRangeChange}
            onAggregationChange={handleAggregationChange}
            onRefresh={handleRefresh}
            onAutoRefreshToggle={handleAutoRefreshToggle}
            onZoomOut={timeRange ? handleZoomOut : undefined}
            onExport={handleExport}
            className="mb-2"
          />
        )}
        <div className="flex-1 min-h-0">
          <TimeSeriesChart
            config={chartConfig}
            onTimeRangeChange={handleChartZoom}
            onDataPointClick={onDataPointClick}
          />
        </div>
      </div>
    </BaseWidget>
  );
}
