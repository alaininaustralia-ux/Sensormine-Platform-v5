/**
 * Chart Widget with Asset Filtering
 * 
 * Story 4: Chart Widget with Asset Filtering
 * Enhanced chart widget that supports asset-based device filtering and aggregation
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { TimeSeriesChart } from '../charts/time-series-chart';
import { ChartToolbar } from '../charts/chart-toolbar';
import { exportChart } from '../charts/chart-export';
import { getAggregatedTelemetryByAsset, type AggregatedTelemetryQuery } from '@/lib/api/assets';
import type { 
  ChartConfig, 
  ChartType, 
  ChartSeries, 
  TimeRange, 
  AggregationInterval,
  TimeSeriesDataPoint 
} from '@/lib/types/chart';

export interface ChartWidgetWithAssetConfig {
  /** Chart type */
  chartType?: ChartType;
  /** Asset ID to filter devices */
  assetId?: string;
  /** Include devices from descendant assets */
  includeDescendants?: boolean;
  /** Fields to display */
  fields?: string[];
  /** Aggregation method */
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
  /** Time interval for data bucketing */
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
  /** Default time range */
  defaultTimeRange?: TimeRange;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Auto-refresh interval in seconds (0 = disabled) */
  refreshInterval?: number;
  /** Maximum number of data points */
  limit?: number;
}

export interface ChartWidgetWithAssetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Widget configuration */
  config: ChartWidgetWithAssetConfig;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Callback when aggregation changes */
  onAggregationChange?: (aggregation: AggregationInterval) => void;
  /** Callback when a data point is clicked */
  onDataPointClick?: (series: string, point: TimeSeriesDataPoint) => void;
}

/**
 * Chart Widget with Asset Filtering Component
 */
export function ChartWidgetWithAsset({
  config,
  onTimeRangeChange,
  onAggregationChange,
  onDataPointClick,
  ...baseProps
}: ChartWidgetWithAssetProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [chartSeries, setChartSeries] = useState<ChartSeries[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange | undefined>(config.defaultTimeRange);
  const [aggregation, setAggregation] = useState<AggregationInterval>(
    config.interval || '1h'
  );
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [assetName, setAssetName] = useState<string>('');

  // Fetch telemetry data
  const fetchData = useCallback(async () => {
    if (!config.assetId) {
      setError('No asset selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      // Calculate time range
      const now = new Date();
      const startTime = timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: last 24h
      const endTime = timeRange?.end || now;

      const query: AggregatedTelemetryQuery = {
        assetId: config.assetId,
        includeDescendants: config.includeDescendants ?? true,
        fields: config.fields,
        startTime,
        endTime,
        aggregation: config.aggregation || 'avg',
        interval: config.interval || '1h',
        limit: config.limit,
      };

      const response = await getAggregatedTelemetryByAsset(query);
      
      setAssetName(response.assetName);

      // Transform API response to ChartSeries format
      const series: ChartSeries[] = response.series.map((s) => ({
        id: `${s.deviceId}-${s.field}`,
        name: `${s.deviceName} - ${s.field}`,
        unit: s.unit,
        data: s.data.map((point) => ({
          timestamp: new Date(point.timestamp).getTime(),
          value: point.value,
        })),
      }));

      setChartSeries(series);
    } catch (err) {
      console.error('Error fetching telemetry data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load telemetry data');
    } finally {
      setIsLoading(false);
    }
  }, [config, timeRange]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefresh || !config.refreshInterval || config.refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, config.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, config.refreshInterval, fetchData]);

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
    fetchData();
  }, [fetchData]);
  
  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = useCallback((enabled: boolean) => {
    setIsAutoRefresh(enabled);
  }, []);
  
  // Handle zoom reset
  const handleZoomOut = useCallback(() => {
    setTimeRange(config.defaultTimeRange);
  }, [config.defaultTimeRange]);
  
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
          { filename: `${assetName || baseProps.title || 'chart'}-${new Date().toISOString().split('T')[0]}` }
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [chartSeries, baseProps.title, assetName]);

  // Full chart configuration
  const chartConfig: ChartConfig = {
    chartType: config.chartType || 'line',
    series: chartSeries,
    timeRange,
    aggregation,
  };

  return (
    <BaseWidget {...baseProps} isLoading={isLoading} error={error}>
      <div ref={chartRef} className="flex flex-col h-full">
        {config.showToolbar !== false && (
          <ChartToolbar
            timeRange={timeRange}
            aggregation={aggregation}
            autoRefresh={isAutoRefresh}
            refreshInterval={config.refreshInterval || 30}
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
        {chartSeries.length === 0 && !isLoading && !error ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground">
            No data available for the selected time range
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <TimeSeriesChart
              config={chartConfig}
              onTimeRangeChange={handleChartZoom}
              onDataPointClick={onDataPointClick}
            />
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
