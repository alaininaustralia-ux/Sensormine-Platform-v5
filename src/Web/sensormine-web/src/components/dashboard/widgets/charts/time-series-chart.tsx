/**
 * TimeSeriesChart Component
 * 
 * A comprehensive time-series chart component supporting multiple chart types.
 * Story 4.2 - Time-Series Charts
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  AreaChart as RechartsAreaChart,
  ScatterChart as RechartsScatterChart,
  Line,
  Bar,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import type { TimeSeriesChartProps, TimeRangePreset } from '@/lib/types/chart-types';
import { Button } from '@/components/ui/button';

/**
 * Format timestamp for X-axis display
 */
function formatTimestamp(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format value for tooltip display
 */
function formatValue(value: number, unit?: string): string {
  return unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);
}

/**
 * Transform data for Recharts format
 */
function transformData(config: TimeSeriesChartProps['config']) {
  if (!config.series || config.series.length === 0) {
    return [];
  }

  // Create a map of all timestamps
  const timestampMap = new Map<number, Record<string, number>>();

  config.series.forEach((series) => {
    series.data.forEach((point) => {
      const timestamp = typeof point.timestamp === 'number' 
        ? point.timestamp 
        : point.timestamp.getTime();
      
      if (!timestampMap.has(timestamp)) {
        timestampMap.set(timestamp, { timestamp });
      }
      
      const dataPoint = timestampMap.get(timestamp)!;
      dataPoint[series.seriesName] = point.value;
    });
  });

  // Convert to array and sort by timestamp
  return Array.from(timestampMap.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get default colors for series
 */
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function TimeSeriesChart({
  config,
  isLoading = false,
  error,
  className,
}: TimeSeriesChartProps) {
  // Time range selection state
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangePreset | null>(null);

  // Quick select time range
  const handleTimeRangeSelect = (preset: TimeRangePreset) => {
    setSelectedTimeRange(preset);
    // Implementation will filter data based on preset
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-center text-destructive">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!config.series || config.series.length === 0 || config.series.every(s => s.data.length === 0)) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-center text-muted-foreground">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = transformData(config);

  // Assign colors to series
  const seriesWithColors = config.series.map((series, index) => ({
    ...series,
    color: series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  // Chart dimensions
  const height = config.height || 400;
  const width = config.width;

  // Common chart props
  const commonProps = {
    data: chartData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (config.chartType) {
      case 'line':
      case 'step':
        return (
          <RechartsLineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis 
              label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip 
              labelFormatter={formatTimestamp}
              formatter={(value: number, name: string) => {
                const series = seriesWithColors.find(s => s.seriesName === name);
                return formatValue(value, series?.unit);
              }}
            />
            {config.showLegend !== false && <Legend />}
            {seriesWithColors.map((series) => (
              <Line
                key={series.seriesName}
                type={config.chartType === 'step' ? 'stepAfter' : 'monotone'}
                dataKey={series.seriesName}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {config.enableZoom && <Brush dataKey="timestamp" height={30} stroke="#8884d8" />}
          </RechartsLineChart>
        );

      case 'bar':
        return (
          <RechartsBarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis 
              label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip 
              labelFormatter={formatTimestamp}
              formatter={(value: number, name: string) => {
                const series = seriesWithColors.find(s => s.seriesName === name);
                return formatValue(value, series?.unit);
              }}
            />
            {config.showLegend !== false && <Legend />}
            {seriesWithColors.map((series) => (
              <Bar
                key={series.seriesName}
                dataKey={series.seriesName}
                fill={series.color}
              />
            ))}
          </RechartsBarChart>
        );

      case 'area':
        return (
          <RechartsAreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis 
              label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip 
              labelFormatter={formatTimestamp}
              formatter={(value: number, name: string) => {
                const series = seriesWithColors.find(s => s.seriesName === name);
                return formatValue(value, series?.unit);
              }}
            />
            {config.showLegend !== false && <Legend />}
            {seriesWithColors.map((series) => (
              <Area
                key={series.seriesName}
                type="monotone"
                dataKey={series.seriesName}
                stroke={series.color}
                fill={series.color}
                fillOpacity={0.6}
              />
            ))}
          </RechartsAreaChart>
        );

      case 'scatter':
        return (
          <RechartsScatterChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTimestamp}
              label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis 
              label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip 
              labelFormatter={formatTimestamp}
              formatter={(value: number, name: string) => {
                const series = seriesWithColors.find(s => s.seriesName === name);
                return formatValue(value, series?.unit);
              }}
            />
            {config.showLegend !== false && <Legend />}
            {seriesWithColors.map((series) => (
              <Scatter
                key={series.seriesName}
                name={series.seriesName}
                data={series.data.map(d => ({
                  timestamp: typeof d.timestamp === 'number' ? d.timestamp : d.timestamp.getTime(),
                  value: d.value,
                }))}
                fill={series.color}
              />
            ))}
          </RechartsScatterChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`flex flex-col ${className || ''}`}>
      {/* Chart Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{config.title}</h3>
          {config.subtitle && (
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          )}
        </div>
        {/* Time Range Quick Select */}
        <div className="flex gap-1">
          {(['1H', '6H', '1D', '7D', '30D', 'All'] as TimeRangePreset[]).map((preset) => (
            <Button
              key={preset}
              variant={selectedTimeRange === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeSelect(preset)}
              className="h-7 px-2 text-xs"
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width={width || '100%'} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
