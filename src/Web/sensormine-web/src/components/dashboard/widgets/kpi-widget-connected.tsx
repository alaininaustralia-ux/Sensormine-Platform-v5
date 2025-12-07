/**
 * Connected KPI Widget
 * 
 * KPI widget that fetches data from the Query API with trend comparison.
 */

'use client';

import { useEffect, useState } from 'react';
import { KPIWidget } from './kpi-widget';
import type { BaseWidgetProps } from './base-widget';
import { getKpiWithTrend } from '@/lib/api/widget-data';
import type { KpiDataResponse } from '@/lib/api/types';

interface ConnectedKPIWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Field name to query */
  field: string;
  /** Aggregation function */
  aggregation?: 'current' | 'avg' | 'sum' | 'min' | 'max' | 'count';
  /** Time period in hours */
  periodHours?: number;
  /** Device IDs to filter (comma-separated) */
  deviceIds?: string;
  /** Unit of measurement */
  unit?: string;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether trend increase is positive (green) or negative (red) */
  trendIsPositive?: boolean;
  /** Number format options */
  numberFormat?: Intl.NumberFormatOptions;
}

export function ConnectedKPIWidget({
  field,
  aggregation = 'avg',
  periodHours = 24,
  deviceIds,
  unit = '',
  refreshInterval = 30000,
  trendIsPositive = true,
  numberFormat,
  ...baseProps
}: ConnectedKPIWidgetProps) {
  const [data, setData] = useState<KpiDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await getKpiWithTrend(field, periodHours, aggregation, deviceIds);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [field, aggregation, periodHours, deviceIds, refreshInterval]);

  const handleRefresh = async () => {
    try {
      setError(null);
      const response = await getKpiWithTrend(field, periodHours, aggregation, deviceIds);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Format the value
  const formatValue = (value: number): string => {
    if (numberFormat) {
      return new Intl.NumberFormat('en-US', numberFormat).format(value);
    }
    return value.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <p className="text-sm font-medium">Error loading KPI</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <KPIWidget
      {...baseProps}
      value={formatValue(data.currentValue)}
      previousValue={data.previousValue || undefined}
      unit={unit}
      trendPercentage={data.percentChange || undefined}
      trendLabel={`vs previous ${periodHours}h`}
      trendIsPositive={trendIsPositive}
      config={{
        showRefreshButton: true,
        autoRefresh: refreshInterval > 0,
        refreshInterval,
        numberFormat,
      }}
      onRefresh={handleRefresh}
    />
  );
}
