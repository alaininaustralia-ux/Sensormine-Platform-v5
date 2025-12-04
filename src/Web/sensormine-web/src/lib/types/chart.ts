/**
 * Time-Series Chart Type Definitions
 * 
 * Story 4.2: Time-Series Charts
 * Types for line, bar, area, scatter, and step charts with time-series data.
 */

/**
 * Chart types supported by the chart widget
 */
export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'step';

/**
 * Time range preset options
 */
export type TimeRangePreset = 
  | '1h' 
  | '6h' 
  | '24h' 
  | '7d' 
  | '30d' 
  | '90d' 
  | 'custom';

/**
 * Aggregation interval options for time-series data
 */
export type AggregationInterval = 
  | '1m' 
  | '5m' 
  | '15m' 
  | '1h' 
  | '6h' 
  | '1d' 
  | 'raw';

/**
 * Individual data point in a time-series
 */
export interface TimeSeriesDataPoint {
  /** Timestamp of the data point */
  timestamp: Date | string | number;
  /** Value at this timestamp */
  value: number;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A single data series in a chart
 */
export interface ChartSeries {
  /** Unique identifier for the series */
  id: string;
  /** Display name for the legend */
  name: string;
  /** Data points in this series */
  data: TimeSeriesDataPoint[];
  /** Color for this series (hex or CSS color) */
  color?: string;
  /** Y-axis ID this series belongs to (for dual-axis charts) */
  yAxisId?: string;
  /** Whether to show data points */
  showDataPoints?: boolean;
  /** Line stroke width */
  strokeWidth?: number;
  /** Fill opacity (for area charts) */
  fillOpacity?: number;
  /** Unit of measurement */
  unit?: string;
}

/**
 * Axis configuration
 */
export interface AxisConfig {
  /** Axis label */
  label?: string;
  /** Unit of measurement */
  unit?: string;
  /** Minimum value (auto if not specified) */
  min?: number;
  /** Maximum value (auto if not specified) */
  max?: number;
  /** Number of ticks */
  tickCount?: number;
  /** Format function for tick values */
  tickFormat?: string;
  /** Whether to show grid lines */
  showGrid?: boolean;
}

/**
 * Time range selection
 */
export interface TimeRange {
  /** Start of the time range */
  start: Date;
  /** End of the time range */
  end: Date;
}

/**
 * Legend configuration
 */
export interface LegendConfig {
  /** Whether to show the legend */
  visible: boolean;
  /** Legend position */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Legend alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  /** Whether to show tooltips */
  enabled: boolean;
  /** Whether to share tooltip across series */
  shared?: boolean;
  /** Date format for tooltip */
  dateFormat?: string;
}

/**
 * Zoom and pan configuration
 */
export interface ZoomConfig {
  /** Whether zooming is enabled */
  enabled: boolean;
  /** Whether panning is enabled */
  panEnabled?: boolean;
  /** Zoom mode */
  mode?: 'x' | 'y' | 'xy';
}

/**
 * Export options
 */
export interface ExportConfig {
  /** Export filename (without extension) */
  filename?: string;
  /** Available export formats */
  formats?: ('png' | 'svg' | 'csv' | 'json')[];
}

/**
 * Complete chart configuration
 */
export interface ChartConfig {
  /** Chart type */
  chartType: ChartType;
  /** Data series */
  series: ChartSeries[];
  /** X-axis configuration */
  xAxis?: AxisConfig;
  /** Y-axis configuration (primary) */
  yAxis?: AxisConfig;
  /** Secondary Y-axis configuration */
  yAxisSecondary?: AxisConfig;
  /** Time range */
  timeRange?: TimeRange;
  /** Aggregation interval */
  aggregation?: AggregationInterval;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Zoom configuration */
  zoom?: ZoomConfig;
  /** Export configuration */
  export?: ExportConfig;
  /** Chart height in pixels */
  height?: number;
  /** Whether to animate transitions */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

/**
 * Default chart configuration values
 */
export const DEFAULT_CHART_CONFIG: Partial<ChartConfig> = {
  chartType: 'line',
  legend: {
    visible: true,
    position: 'bottom',
    align: 'center',
  },
  tooltip: {
    enabled: true,
    shared: true,
    dateFormat: 'MMM dd, HH:mm',
  },
  zoom: {
    enabled: true,
    panEnabled: true,
    mode: 'x',
  },
  animate: true,
  animationDuration: 300,
};

/**
 * Time range preset definitions
 */
export const TIME_RANGE_PRESETS: Record<TimeRangePreset, { label: string; hours?: number }> = {
  '1h': { label: 'Last 1 Hour', hours: 1 },
  '6h': { label: 'Last 6 Hours', hours: 6 },
  '24h': { label: 'Last 24 Hours', hours: 24 },
  '7d': { label: 'Last 7 Days', hours: 24 * 7 },
  '30d': { label: 'Last 30 Days', hours: 24 * 30 },
  '90d': { label: 'Last 90 Days', hours: 24 * 90 },
  'custom': { label: 'Custom Range' },
};

/**
 * Aggregation interval definitions
 */
export const AGGREGATION_INTERVALS: Record<AggregationInterval, { label: string; minutes: number }> = {
  'raw': { label: 'Raw Data', minutes: 0 },
  '1m': { label: '1 Minute', minutes: 1 },
  '5m': { label: '5 Minutes', minutes: 5 },
  '15m': { label: '15 Minutes', minutes: 15 },
  '1h': { label: '1 Hour', minutes: 60 },
  '6h': { label: '6 Hours', minutes: 360 },
  '1d': { label: '1 Day', minutes: 1440 },
};

/**
 * Default color palette for chart series
 */
export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
];

/**
 * Get color for a series index
 */
export function getSeriesColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
