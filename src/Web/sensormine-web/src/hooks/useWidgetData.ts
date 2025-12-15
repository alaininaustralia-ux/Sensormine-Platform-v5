/**
 * useWidgetData Hook
 * 
 * Custom React hook for fetching and managing widget data
 * Handles loading states, errors, auto-refresh, and data transformation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardWidget } from '@/lib/dashboard/types';

interface WidgetDataPoint {
  deviceId: string;
  timestamp: string;
  values: Record<string, any>;
}

interface AggregatedDataPoint {
  timestamp: string;
  value: number;
  count: number;
}

interface AggregatedSeries {
  field: string;
  aggregationFunction?: string;
  dataPoints: AggregatedDataPoint[];
}

interface WidgetDataResponse {
  dataPoints?: WidgetDataPoint[];
  series?: AggregatedSeries[];
  count?: number;
}

interface UseWidgetDataOptions {
  /** Device ID to filter data (from URL context) */
  deviceId?: string | null;
}

interface UseWidgetDataResult {
  data: WidgetDataResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage widget data
 * @param widget - Dashboard widget configuration
 * @param options - Optional filtering options (e.g., deviceId from context)
 * @returns Data, loading state, error, and refetch function
 */
export function useWidgetData(
  widget: DashboardWidget,
  options?: UseWidgetDataOptions
): UseWidgetDataResult {
  const [data, setData] = useState<WidgetDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    // Check if widget has data configuration
    if (!widget.dataConfig || !widget.dataConfig.dataSource) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const { dataSource } = widget.dataConfig;

    // Check if fields are configured
    if (!dataSource.fields || dataSource.fields.length === 0) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const fields = dataSource.fields.map(f => f.fieldPath).join(',');
      // Use device context if provided, otherwise query all devices
      const deviceIds = options?.deviceId || '';
      
      let url: string;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'; // API Gateway

      // Determine which endpoint to call based on data source type
      if (dataSource.type === 'aggregated' && dataSource.aggregation && dataSource.timeRange) {
        // Use aggregated endpoint for historical data with aggregation
        const { value, unit } = dataSource.timeRange;
        const now = new Date();
        const start = new Date(now);
        
        // Calculate start time based on unit
        switch (unit) {
          case 'minutes':
            start.setMinutes(start.getMinutes() - value);
            break;
          case 'hours':
            start.setHours(start.getHours() - value);
            break;
          case 'days':
            start.setDate(start.getDate() - value);
            break;
          case 'weeks':
            start.setDate(start.getDate() - (value * 7));
            break;
        }

        const params = new URLSearchParams({
          fields,
          startTime: start.toISOString(),
          endTime: now.toISOString(),
          aggregation: dataSource.aggregation,
          interval: '5m', // Default to 5-minute intervals
        });

        if (deviceIds) params.append('deviceIds', deviceIds);
        
        url = `${baseUrl}/api/widgetdata/aggregated?${params.toString()}`;
      } else if (dataSource.type === 'historical' && dataSource.timeRange) {
        // Use historical endpoint for time-series data
        const { value, unit } = dataSource.timeRange;
        const now = new Date();
        const start = new Date(now);
        
        // Calculate start time based on unit
        switch (unit) {
          case 'minutes':
            start.setMinutes(start.getMinutes() - value);
            break;
          case 'hours':
            start.setHours(start.getHours() - value);
            break;
          case 'days':
            start.setDate(start.getDate() - value);
            break;
          case 'weeks':
            start.setDate(start.getDate() - (value * 7));
            break;
        }

        const params = new URLSearchParams({
          fields,
          startTime: start.toISOString(),
          endTime: now.toISOString(),
          limit: '500',
        });

        if (deviceIds) params.append('deviceIds', deviceIds);
        
        url = `${baseUrl}/api/widgetdata/historical?${params.toString()}`;
      } else {
        // Use realtime endpoint for latest values
        const params = new URLSearchParams({
          limit: '100',
        });

        if (fields) params.append('fields', fields);
        if (deviceIds) params.append('deviceIds', deviceIds);
        
        url = `${baseUrl}/api/widgetdata/realtime?${params.toString()}`;
      }

      console.log('[useWidgetData] Fetching:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log('[useWidgetData] Response:', jsonData);

      setData(jsonData);
    } catch (err) {
      console.error('[useWidgetData] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [widget.dataConfig, options?.deviceId]);

  // Set up auto-refresh
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up refresh interval if configured
    const refreshInterval = widget.dataConfig?.dataSource?.refreshInterval;
    if (refreshInterval && refreshInterval > 0) {
      console.log(`[useWidgetData] Setting up auto-refresh every ${refreshInterval}s`);
      refreshIntervalRef.current = setInterval(fetchData, refreshInterval * 1000);
    }

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [fetchData, widget.dataConfig?.dataSource?.refreshInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
