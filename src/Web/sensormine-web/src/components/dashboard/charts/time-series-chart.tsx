/**
 * Time-Series Chart Component
 * 
 * Story 4.2: Time-Series Charts
 * Renders line, bar, area, scatter, and step charts using Recharts.
 */

'use client';

import { useMemo, useCallback, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  Scatter,
  ReferenceArea,
  Brush,
  TooltipProps,
} from 'recharts';
import { format as formatDate } from 'date-fns';
import type {
  ChartConfig,
  ChartType,
  ChartSeries,
  TimeSeriesDataPoint,
} from '@/lib/types/chart';
import { DEFAULT_CHART_CONFIG, getSeriesColor } from '@/lib/types/chart';

/** Minimum duration in milliseconds for zoom selection to be valid */
const MIN_ZOOM_DURATION_MS = 1000;

export interface TimeSeriesChartProps {
  /** Chart configuration */
  config: ChartConfig;
  /** Chart height in pixels (defaults to 100% container) */
  height?: number | string;
  /** CSS class name */
  className?: string;
  /** Callback when time range changes via zoom/brush */
  onTimeRangeChange?: (start: Date, end: Date) => void;
  /** Callback when a data point is clicked */
  onDataPointClick?: (series: string, point: TimeSeriesDataPoint) => void;
}

/**
 * Normalize data for Recharts consumption
 * Merges multiple series into a single dataset with timestamp as key
 */
function normalizeChartData(series: ChartSeries[]): Array<Record<string, unknown>> {
  const dataMap = new Map<number, Record<string, unknown>>();
  
  series.forEach(s => {
    s.data.forEach(point => {
      const timestamp = point.timestamp instanceof Date 
        ? point.timestamp.getTime()
        : typeof point.timestamp === 'string'
          ? new Date(point.timestamp).getTime()
          : point.timestamp;
      
      const existing = dataMap.get(timestamp) || { timestamp };
      existing[s.id] = point.value;
      dataMap.set(timestamp, existing);
    });
  });
  
  return Array.from(dataMap.values()).sort(
    (a, b) => (a.timestamp as number) - (b.timestamp as number)
  );
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number, formatStr: string = 'MMM dd, HH:mm'): string {
  try {
    return formatDate(new Date(timestamp), formatStr);
  } catch {
    return String(timestamp);
  }
}

/**
 * Custom tooltip component
 */
function ChartTooltip({ 
  active, 
  payload, 
  label,
  dateFormat = 'MMM dd, yyyy HH:mm',
  series,
}: TooltipProps<number, string> & { dateFormat?: string; series: ChartSeries[] }) {
  if (!active || !payload || !payload.length) {
    return null;
  }
  
  return (
    <div className="bg-background border rounded-md shadow-lg p-3 min-w-[200px]">
      <p className="text-sm font-medium text-foreground mb-2">
        {formatTimestamp(label as number, dateFormat)}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => {
          const seriesConfig = series.find(s => s.id === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-sm text-muted-foreground">
                  {seriesConfig?.name || entry.dataKey}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                {seriesConfig?.unit && ` ${seriesConfig.unit}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Render the chart body based on chart type
 */
function renderChartContent(
  chartType: ChartType,
  series: ChartSeries[],
  animate: boolean,
  animationDuration: number,
  onDataPointClick?: (series: string, point: TimeSeriesDataPoint) => void
) {
  return series.map((s, index) => {
    const color = s.color || getSeriesColor(index);
    const strokeWidth = s.strokeWidth || 2;
    const showDots = s.showDataPoints ?? (chartType === 'scatter');
    
    const handleClick = (data: Record<string, unknown>) => {
      if (onDataPointClick && data) {
        const point: TimeSeriesDataPoint = {
          timestamp: data.timestamp as number,
          value: data[s.id] as number,
        };
        onDataPointClick(s.id, point);
      }
    };
    
    switch (chartType) {
      case 'line':
        return (
          <Line
            key={s.id}
            type="monotone"
            dataKey={s.id}
            name={s.name}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={showDots ? { r: 4 } : false}
            activeDot={{ r: 6, onClick: handleClick }}
            yAxisId={s.yAxisId || 'primary'}
            isAnimationActive={animate}
            animationDuration={animationDuration}
          />
        );
      
      case 'bar':
        return (
          <Bar
            key={s.id}
            dataKey={s.id}
            name={s.name}
            fill={color}
            yAxisId={s.yAxisId || 'primary'}
            isAnimationActive={animate}
            animationDuration={animationDuration}
            onClick={handleClick}
          />
        );
      
      case 'area':
        return (
          <Area
            key={s.id}
            type="monotone"
            dataKey={s.id}
            name={s.name}
            stroke={color}
            fill={color}
            fillOpacity={s.fillOpacity ?? 0.3}
            strokeWidth={strokeWidth}
            dot={showDots}
            activeDot={{ r: 6, onClick: handleClick }}
            yAxisId={s.yAxisId || 'primary'}
            isAnimationActive={animate}
            animationDuration={animationDuration}
          />
        );
      
      case 'scatter':
        return (
          <Scatter
            key={s.id}
            dataKey={s.id}
            name={s.name}
            fill={color}
            yAxisId={s.yAxisId || 'primary'}
            isAnimationActive={animate}
            animationDuration={animationDuration}
            onClick={handleClick}
          />
        );
      
      case 'step':
        return (
          <Line
            key={s.id}
            type="stepAfter"
            dataKey={s.id}
            name={s.name}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={showDots ? { r: 4 } : false}
            activeDot={{ r: 6, onClick: handleClick }}
            yAxisId={s.yAxisId || 'primary'}
            isAnimationActive={animate}
            animationDuration={animationDuration}
          />
        );
      
      default:
        return null;
    }
  });
}

/**
 * Time-Series Chart Component
 */
export function TimeSeriesChart({
  config,
  height = '100%',
  className,
  onTimeRangeChange,
  onDataPointClick,
}: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Merge default config with provided config
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CHART_CONFIG,
    ...config,
    legend: { ...DEFAULT_CHART_CONFIG.legend, ...config.legend },
    tooltip: { ...DEFAULT_CHART_CONFIG.tooltip, ...config.tooltip },
    zoom: { ...DEFAULT_CHART_CONFIG.zoom, ...config.zoom },
  } as ChartConfig), [config]);
  
  // Normalize data for Recharts
  const chartData = useMemo(
    () => normalizeChartData(mergedConfig.series),
    [mergedConfig.series]
  );
  
  // Handle zoom selection
  const handleMouseDown = useCallback((e: { activeLabel?: number }) => {
    if (mergedConfig.zoom?.enabled && e?.activeLabel) {
      setRefAreaLeft(e.activeLabel);
      setIsSelecting(true);
    }
  }, [mergedConfig.zoom?.enabled]);
  
  const handleMouseMove = useCallback((e: { activeLabel?: number }) => {
    if (isSelecting && e?.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  }, [isSelecting]);
  
  const handleMouseUp = useCallback(() => {
    if (isSelecting && refAreaLeft && refAreaRight) {
      const start = Math.min(refAreaLeft, refAreaRight);
      const end = Math.max(refAreaLeft, refAreaRight);
      
      if (end - start > MIN_ZOOM_DURATION_MS && onTimeRangeChange) {
        onTimeRangeChange(new Date(start), new Date(end));
      }
    }
    
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setIsSelecting(false);
  }, [isSelecting, refAreaLeft, refAreaRight, onTimeRangeChange]);
  
  // X-Axis configuration
  const xAxisProps = {
    dataKey: 'timestamp',
    type: 'number' as const,
    domain: ['dataMin', 'dataMax'] as [string, string],
    tickFormatter: (value: number) => 
      formatTimestamp(value, mergedConfig.xAxis?.tickFormat || 'HH:mm'),
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    label: mergedConfig.xAxis?.label 
      ? { value: mergedConfig.xAxis.label, position: 'insideBottom', offset: -5 }
      : undefined,
  };
  
  // Y-Axis configuration
  const yAxisProps = {
    yAxisId: 'primary',
    type: 'number' as const,
    domain: [
      mergedConfig.yAxis?.min ?? 'auto',
      mergedConfig.yAxis?.max ?? 'auto',
    ] as [number | string, number | string],
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    tickCount: mergedConfig.yAxis?.tickCount,
    label: mergedConfig.yAxis?.label 
      ? { 
          value: `${mergedConfig.yAxis.label}${mergedConfig.yAxis.unit ? ` (${mergedConfig.yAxis.unit})` : ''}`, 
          angle: -90, 
          position: 'insideLeft' 
        }
      : undefined,
  };
  
  // Secondary Y-Axis configuration
  const yAxisSecondaryProps = mergedConfig.yAxisSecondary ? {
    yAxisId: 'secondary',
    orientation: 'right' as const,
    type: 'number' as const,
    domain: [
      mergedConfig.yAxisSecondary.min ?? 'auto',
      mergedConfig.yAxisSecondary.max ?? 'auto',
    ] as [number | string, number | string],
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    tickCount: mergedConfig.yAxisSecondary.tickCount,
    label: mergedConfig.yAxisSecondary.label 
      ? { 
          value: `${mergedConfig.yAxisSecondary.label}${mergedConfig.yAxisSecondary.unit ? ` (${mergedConfig.yAxisSecondary.unit})` : ''}`, 
          angle: 90, 
          position: 'insideRight' 
        }
      : undefined,
  } : null;
  
  // Legend configuration
  const legendProps = mergedConfig.legend?.visible ? {
    verticalAlign: (mergedConfig.legend.position === 'top' || mergedConfig.legend.position === 'bottom' 
      ? mergedConfig.legend.position 
      : 'bottom') as 'top' | 'bottom',
    align: mergedConfig.legend.align || 'center',
    wrapperStyle: { fontSize: 12 },
  } : undefined;
  
  // Tooltip configuration
  const tooltipContent = mergedConfig.tooltip?.enabled ? (
    <Tooltip
      content={(props) => (
        <ChartTooltip 
          {...props} 
          dateFormat={mergedConfig.tooltip?.dateFormat} 
          series={mergedConfig.series}
        />
      )}
    />
  ) : null;
  
  // Common chart props
  const chartProps = {
    data: chartData,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    margin: { top: 10, right: 30, left: 10, bottom: 10 },
  };
  
  // Grid configuration
  const gridElement = (
    <CartesianGrid 
      strokeDasharray="3 3" 
      stroke="hsl(var(--border))" 
      vertical={false}
    />
  );
  
  // Reference area for zoom selection
  const referenceArea = refAreaLeft && refAreaRight ? (
    <ReferenceArea
      yAxisId="primary"
      x1={refAreaLeft}
      x2={refAreaRight}
      strokeOpacity={0.3}
      fill="hsl(var(--primary))"
      fillOpacity={0.1}
    />
  ) : null;
  
  // Brush for range selection
  const brushElement = mergedConfig.zoom?.panEnabled ? (
    <Brush
      dataKey="timestamp"
      height={30}
      stroke="hsl(var(--primary))"
      tickFormatter={(value: number) => formatTimestamp(value, 'MM/dd')}
    />
  ) : null;
  
  // Render chart based on type
  const renderChart = () => {
    const content = renderChartContent(
      mergedConfig.chartType,
      mergedConfig.series,
      mergedConfig.animate ?? true,
      mergedConfig.animationDuration ?? 300,
      onDataPointClick
    );
    
    switch (mergedConfig.chartType) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            {gridElement}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {yAxisSecondaryProps && <YAxis {...yAxisSecondaryProps} />}
            {tooltipContent}
            {legendProps && <Legend {...legendProps} />}
            {content}
            {referenceArea}
            {brushElement}
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart {...chartProps}>
            {gridElement}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {yAxisSecondaryProps && <YAxis {...yAxisSecondaryProps} />}
            {tooltipContent}
            {legendProps && <Legend {...legendProps} />}
            {content}
            {referenceArea}
            {brushElement}
          </AreaChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart {...chartProps}>
            {gridElement}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {yAxisSecondaryProps && <YAxis {...yAxisSecondaryProps} />}
            {tooltipContent}
            {legendProps && <Legend {...legendProps} />}
            {content}
            {referenceArea}
          </ScatterChart>
        );
      
      case 'line':
      case 'step':
      default:
        return (
          <LineChart {...chartProps}>
            {gridElement}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {yAxisSecondaryProps && <YAxis {...yAxisSecondaryProps} />}
            {tooltipContent}
            {legendProps && <Legend {...legendProps} />}
            {content}
            {referenceArea}
            {brushElement}
          </LineChart>
        );
    }
  };
  
  return (
    <div 
      ref={chartRef} 
      className={`w-full ${className || ''}`} 
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      data-testid="time-series-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
