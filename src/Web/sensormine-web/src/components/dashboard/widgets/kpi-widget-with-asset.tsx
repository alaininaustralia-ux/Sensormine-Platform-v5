/**
 * KPI Widget with Asset Filtering
 * 
 * Story 5: KPI Widget with Asset-Based Filtering
 * Displays a single aggregated KPI value from devices under an asset with trend indicators
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { ArrowDown, ArrowUp, Minus, RefreshCw } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { getAggregatedTelemetryByAsset, type AggregatedTelemetryQuery } from '@/lib/api/assets';
import { Button } from '@/components/ui/button';

interface KPIWidgetWithAssetConfig {
  /** Asset ID to filter devices */
  assetId?: string;
  /** Include devices from descendant assets */
  includeDescendants?: boolean;
  /** Field to display */
  field?: string;
  /** Aggregation method */
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
  /** Comparison period in hours for trend calculation */
  comparisonPeriodHours?: number;
  /** Warning threshold */
  warningThreshold?: number;
  /** Critical threshold */
  criticalThreshold?: number;
  /** Whether higher values are better (affects color coding) */
  higherIsBetter?: boolean;
  /** Show sparkline history */
  showSparkline?: boolean;
  /** Number of sparkline points */
  sparklinePoints?: number;
  /** Auto-refresh interval in seconds (0 = disabled) */
  refreshInterval?: number;
  /** Format as percentage */
  formatAsPercentage?: boolean;
  /** Number format options */
  numberFormat?: Intl.NumberFormatOptions;
}

interface KPIWidgetWithAssetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Widget configuration */
  config: KPIWidgetWithAssetConfig;
}

interface KPIData {
  currentValue: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'neutral';
  trendPercentage: number;
  sparklineData: Array<{ timestamp: number; value: number }>;
  unit?: string;
}

export function KPIWidgetWithAsset({
  config,
  ...baseProps
}: KPIWidgetWithAssetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch KPI data
  const fetchData = useCallback(async () => {
    if (!config.assetId || !config.field) {
      setError('Asset and field must be configured');
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      const now = new Date();
      const comparisonHours = config.comparisonPeriodHours || 24;
      const sparklinePoints = config.showSparkline ? (config.sparklinePoints || 24) : 2;
      
      // Fetch data for current period + comparison period
      const totalHours = comparisonHours * 2;
      const startTime = new Date(now.getTime() - totalHours * 60 * 60 * 1000);

      const query: AggregatedTelemetryQuery = {
        assetId: config.assetId,
        includeDescendants: config.includeDescendants ?? true,
        fields: [config.field],
        startTime,
        endTime: now,
        aggregation: config.aggregation || 'avg',
        interval: sparklinePoints > 10 ? '1h' : '15m',
        limit: sparklinePoints * 2,
      };

      const response = await getAggregatedTelemetryByAsset(query);
      
      if (response.series.length === 0) {
        setError('No data available');
        return;
      }

      // Aggregate across all devices and fields
      const allDataPoints = response.series.flatMap(s => 
        s.data.map(d => ({
          timestamp: new Date(d.timestamp).getTime(),
          value: d.value,
        }))
      );

      if (allDataPoints.length === 0) {
        setError('No data points available');
        return;
      }

      // Sort by timestamp
      allDataPoints.sort((a, b) => a.timestamp - b.timestamp);

      // Get current value (most recent point)
      const currentValue = allDataPoints[allDataPoints.length - 1].value;

      // Calculate comparison period boundary
      const comparisonBoundary = now.getTime() - comparisonHours * 60 * 60 * 1000;
      
      // Get previous value (closest point to comparison boundary)
      const previousPoints = allDataPoints.filter(p => p.timestamp <= comparisonBoundary);
      const previousValue = previousPoints.length > 0 
        ? previousPoints[previousPoints.length - 1].value 
        : undefined;

      // Calculate trend
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      let trendPercentage = 0;

      if (previousValue !== undefined && previousValue !== 0) {
        const change = currentValue - previousValue;
        trendPercentage = (change / previousValue) * 100;
        
        if (Math.abs(trendPercentage) > 0.1) {
          trend = change > 0 ? 'up' : 'down';
        }
      }

      // Get sparkline data (last N points)
      const sparklineData = config.showSparkline
        ? allDataPoints.slice(-sparklinePoints)
        : allDataPoints.slice(-2);

      // Get unit from first series
      const unit = response.series[0]?.unit;

      setKpiData({
        currentValue,
        previousValue,
        trend,
        trendPercentage,
        sparklineData,
        unit,
      });
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load KPI data');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!config.refreshInterval || config.refreshInterval <= 0) return;

    refreshIntervalRef.current = setInterval(() => {
      fetchData();
    }, config.refreshInterval * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config.refreshInterval, fetchData]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchData();
  };

  // Format value
  const formatValue = (value: number): string => {
    if (config.formatAsPercentage) {
      return `${value.toFixed(1)}%`;
    }
    
    if (config.numberFormat) {
      return new Intl.NumberFormat(undefined, config.numberFormat).format(value);
    }
    
    return value.toFixed(2);
  };

  // Determine status color based on thresholds
  const getStatusColor = (value: number): string => {
    if (config.criticalThreshold !== undefined && 
        ((config.higherIsBetter && value < config.criticalThreshold) ||
         (!config.higherIsBetter && value > config.criticalThreshold))) {
      return 'text-red-600';
    }
    
    if (config.warningThreshold !== undefined &&
        ((config.higherIsBetter && value < config.warningThreshold) ||
         (!config.higherIsBetter && value > config.warningThreshold))) {
      return 'text-yellow-600';
    }
    
    return 'text-green-600';
  };

  // Get trend color
  const getTrendColor = (): string => {
    if (!kpiData || kpiData.trend === 'neutral') return 'text-muted-foreground';
    
    const isPositive = config.higherIsBetter 
      ? kpiData.trend === 'up' 
      : kpiData.trend === 'down';
    
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <BaseWidget {...baseProps} isLoading={isLoading} error={error}>
      {kpiData ? (
        <div className="flex flex-col h-full">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              {config.field}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Main value */}
          <div className="flex-1 flex flex-col justify-center">
            <div className={`text-4xl font-bold ${getStatusColor(kpiData.currentValue)}`}>
              {formatValue(kpiData.currentValue)}
              {kpiData.unit && <span className="text-2xl ml-1">{kpiData.unit}</span>}
            </div>

            {/* Trend indicator */}
            {kpiData.trend !== 'neutral' && (
              <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                {kpiData.trend === 'up' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : kpiData.trend === 'down' ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(kpiData.trendPercentage).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs {config.comparisonPeriodHours || 24}h ago
                </span>
              </div>
            )}

            {/* Threshold labels */}
            {(config.warningThreshold !== undefined || config.criticalThreshold !== undefined) && (
              <div className="mt-2 text-xs text-muted-foreground">
                {config.criticalThreshold !== undefined && (
                  <div>Critical: {formatValue(config.criticalThreshold)}</div>
                )}
                {config.warningThreshold !== undefined && (
                  <div>Warning: {formatValue(config.warningThreshold)}</div>
                )}
              </div>
            )}
          </div>

          {/* Sparkline */}
          {config.showSparkline && kpiData.sparklineData.length > 1 && (
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData.sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                    className={getStatusColor(kpiData.currentValue)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data available
        </div>
      )}
    </BaseWidget>
  );
}
