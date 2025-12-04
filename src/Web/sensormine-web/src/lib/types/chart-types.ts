/**
 * Time-Series Chart Types
 * 
 * Type definitions for time-series chart components.
 * Story 4.2 - Time-Series Charts
 */

/**
 * Supported chart types
 */
export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'step';

/**
 * Aggregation interval options
 */
export type AggregationInterval = '1min' | '5min' | '15min' | '1hr' | '6hr' | '1day';

/**
 * Aggregation function types
 */
export type AggregationFunction = 'avg' | 'sum' | 'min' | 'max' | 'count';

/**
 * Time range quick select options
 */
export type TimeRangePreset = '1H' | '6H' | '1D' | '7D' | '30D' | 'All';

/**
 * Single data point in a time series
 */
export interface TimeSeriesDataPoint {
  /** Timestamp as Unix timestamp (ms) or Date object */
  timestamp: number | Date;
  /** Numeric value */
  value: number;
  /** Optional series identifier for grouping */
  seriesId?: string;
}

/**
 * A complete time series with metadata
 */
export interface TimeSeriesData {
  /** Display name for the series */
  seriesName: string;
  /** Array of data points */
  data: TimeSeriesDataPoint[];
  /** Hex color for the series (e.g., '#3b82f6') */
  color?: string;
  /** Unit of measurement (e.g., '°C', 'psi', '%') */
  unit?: string;
}

/**
 * Time range configuration
 */
export interface TimeRange {
  /** Start date/time */
  start: Date;
  /** End date/time */
  end: Date;
}

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  /** Time interval for aggregation */
  interval: AggregationInterval;
  /** Aggregation function to apply */
  function: AggregationFunction;
}

/**
 * Chart export options
 */
export interface ExportOptions {
  /** Export format */
  format: 'png' | 'svg' | 'csv';
  /** Filename (without extension) */
  filename?: string;
  /** Include timestamp in filename */
  includeTimestamp?: boolean;
}

/**
 * Complete chart configuration
 */
export interface ChartConfiguration {
  /** Chart title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Chart type */
  chartType: ChartType;
  /** Array of time series to display */
  series: TimeSeriesData[];
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Show legend */
  showLegend?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Enable zoom/brush */
  enableZoom?: boolean;
  /** Aggregation settings */
  aggregation?: AggregationConfig;
  /** Time range filter */
  timeRange?: TimeRange;
  /** Height in pixels (default: responsive) */
  height?: number;
  /** Width in pixels (default: responsive) */
  width?: number;
}

/**
 * Props for TimeSeriesChart component
 */
export interface TimeSeriesChartProps {
  /** Chart configuration */
  config: ChartConfiguration;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Callback when aggregation changes */
  onAggregationChange?: (aggregation: AggregationConfig) => void;
  /** Callback when export is triggered */
  onExport?: (options: ExportOptions) => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Props for ChartWidget (dashboard integration)
 */
export interface ChartWidgetConfig {
  /** Widget instance ID */
  id: string;
  /** Chart configuration */
  chartConfig: ChartConfiguration;
  /** Data source URL or configuration */
  dataSource?: {
    type: 'api' | 'mock' | 'static';
    url?: string;
    refreshInterval?: number; // seconds
  };
  /** Enable configuration panel */
  showConfigPanel?: boolean;
}
