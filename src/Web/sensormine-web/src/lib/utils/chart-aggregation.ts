/**
 * Chart Data Aggregation Utility
 * 
 * Functions for aggregating time-series data into time buckets.
 * Story 4.2 - Time-Series Charts
 */

import type {
  TimeSeriesData,
  TimeSeriesDataPoint,
  AggregationInterval,
  AggregationFunction,
} from '@/lib/types/chart-types';

/**
 * Get time bucket size in milliseconds
 */
function getBucketSize(interval: AggregationInterval): number {
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  switch (interval) {
    case '1min':
      return MINUTE;
    case '5min':
      return 5 * MINUTE;
    case '15min':
      return 15 * MINUTE;
    case '1hr':
      return HOUR;
    case '6hr':
      return 6 * HOUR;
    case '1day':
      return DAY;
    default:
      return HOUR;
  }
}

/**
 * Aggregate values using specified function
 */
function aggregateValues(values: number[], fn: AggregationFunction): number {
  if (values.length === 0) return 0;

  switch (fn) {
    case 'avg':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0);
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    default:
      return values[0];
  }
}

/**
 * Aggregate time-series data into time buckets
 */
export function aggregateTimeSeries(
  data: TimeSeriesDataPoint[],
  interval: AggregationInterval,
  fn: AggregationFunction
): TimeSeriesDataPoint[] {
  if (data.length === 0) return [];

  const bucketSize = getBucketSize(interval);
  const buckets = new Map<number, number[]>();

  // Group data points into buckets
  data.forEach((point) => {
    const timestamp =
      typeof point.timestamp === 'number'
        ? point.timestamp
        : point.timestamp.getTime();
    const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(point.value);
  });

  // Aggregate each bucket
  const aggregated: TimeSeriesDataPoint[] = [];
  buckets.forEach((values, timestamp) => {
    aggregated.push({
      timestamp,
      value: aggregateValues(values, fn),
    });
  });

  // Sort by timestamp
  return aggregated.sort((a, b) => {
    const aTime =
      typeof a.timestamp === 'number' ? a.timestamp : a.timestamp.getTime();
    const bTime =
      typeof b.timestamp === 'number' ? b.timestamp : b.timestamp.getTime();
    return aTime - bTime;
  });
}

/**
 * Aggregate multiple time series
 */
export function aggregateMultipleSeries(
  series: TimeSeriesData[],
  interval: AggregationInterval,
  fn: AggregationFunction
): TimeSeriesData[] {
  return series.map((s) => ({
    ...s,
    data: aggregateTimeSeries(s.data, interval, fn),
  }));
}

/**
 * Filter data by time range
 */
export function filterByTimeRange(
  data: TimeSeriesDataPoint[],
  startTime: number,
  endTime: number
): TimeSeriesDataPoint[] {
  return data.filter((point) => {
    const timestamp =
      typeof point.timestamp === 'number'
        ? point.timestamp
        : point.timestamp.getTime();
    return timestamp >= startTime && timestamp <= endTime;
  });
}

/**
 * Get time range for preset
 */
export function getTimeRangeForPreset(preset: string): {
  start: number;
  end: number;
} {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  switch (preset) {
    case '1H':
      return { start: now - HOUR, end: now };
    case '6H':
      return { start: now - 6 * HOUR, end: now };
    case '1D':
      return { start: now - DAY, end: now };
    case '7D':
      return { start: now - 7 * DAY, end: now };
    case '30D':
      return { start: now - 30 * DAY, end: now };
    case 'All':
      return { start: 0, end: now };
    default:
      return { start: now - DAY, end: now };
  }
}
