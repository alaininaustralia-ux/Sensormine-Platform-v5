/**
 * KPI Widget
 * 
 * Displays a key performance indicator with value, trend, sparkline, and thresholds.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { ArrowDown, ArrowUp, Minus, RefreshCw } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface HistoryDataPoint {
  timestamp: string;
  value: number;
}

interface KPIWidgetConfig {
  comparisonMode?: 'previous' | 'target' | 'average';
  targetValue?: number;
  averageValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  thresholdLabel?: string;
  showSparkline?: boolean;
  historyData?: HistoryDataPoint[];
  sparklinePoints?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showRefreshButton?: boolean;
  formatAsPercentage?: boolean;
  numberFormat?: Intl.NumberFormatOptions;
}

interface KPIWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Current KPI value */
  value: number | string;
  /** Previous value for trend calculation */
  previousValue?: number;
  /** Unit of measurement */
  unit?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend percentage */
  trendPercentage?: number;
  /** Trend label */
  trendLabel?: string;
  /** Whether the trend is positive (green) or negative (red) */
  trendIsPositive?: boolean;
  /** Widget configuration */
  config?: KPIWidgetConfig;
  /** Refresh callback */
  onRefresh?: () => Promise<void>;
}

export function KPIWidget({
  value,
  previousValue,
  unit = '',
  trend,
  trendPercentage,
  trendLabel = 'vs previous period',
  trendIsPositive = true,
  config = {},
  onRefresh,
  ...baseProps
}: KPIWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    comparisonMode = 'previous',
    targetValue,
    averageValue,
    warningThreshold,
    criticalThreshold,
    thresholdLabel,
    showSparkline = false,
    historyData = [],
    sparklinePoints = 10,
    autoRefresh = false,
    refreshInterval = 5000,
    showRefreshButton = false,
    formatAsPercentage = false,
    numberFormat,
  } = config;
  
  // Auto-calculate trend if previousValue is provided
  let calculatedTrend = trend;
  let calculatedTrendPercentage = trendPercentage;
  
  if (previousValue !== undefined && typeof value === 'number') {
    const change = value - previousValue;
    calculatedTrendPercentage = previousValue !== 0 
      ? Math.abs((change / previousValue) * 100)
      : 0;
    
    if (change > 0) calculatedTrend = 'up';
    else if (change < 0) calculatedTrend = 'down';
    else calculatedTrend = 'neutral';
  }
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    
    const doRefresh = async () => {
      setIsRefreshing(true);
      setError(null);
      try {
        await onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Refresh error');
      } finally {
        setIsRefreshing(false);
      }
    };
    
    refreshIntervalRef.current = setInterval(doRefresh, refreshInterval);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, onRefresh]);
  
  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    try {
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh error');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getTrendIcon = () => {
    const iconProps = { 'data-testid': `trend-${calculatedTrend}-icon` };
    switch (calculatedTrend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" {...iconProps} />;
      case 'down':
        return <ArrowDown className="h-4 w-4" {...iconProps} />;
      default:
        return <Minus className="h-4 w-4" {...iconProps} />;
    }
  };
  
  const getTrendColor = () => {
    if (calculatedTrend === 'neutral') return 'text-muted-foreground';
    
    const isUp = calculatedTrend === 'up';
    const isGood = trendIsPositive ? isUp : !isUp;
    
    return isGood ? 'text-green-600' : 'text-red-600';
  };
  
  const getThresholdBadge = () => {
    if (typeof value !== 'number') return null;
    
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return <div data-testid="threshold-badge" className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs">{thresholdLabel || 'Critical'}</div>;
    }
    
    if (warningThreshold !== undefined && value < warningThreshold) {
      return <div data-testid="threshold-badge" className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">{thresholdLabel || 'Warning'}</div>;
    }
    
    if (targetValue !== undefined && value >= targetValue) {
      return <div data-testid="threshold-badge" className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Target Met</div>;
    }
    
    return null;
  };
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    if (formatAsPercentage) {
      return `${(val * 100).toFixed(1)}%`;
    }
    
    if (numberFormat) {
      return new Intl.NumberFormat('en-US', numberFormat).format(val);
    }
    
    // Default formatting with commas
    if (val >= 1000) {
      return new Intl.NumberFormat('en-US').format(val);
    }
    
    return val.toFixed(1);
  };
  
  const getComparisonLabel = () => {
    switch (comparisonMode) {
      case 'target':
        return `vs target (${targetValue})`;
      case 'average':
        return 'vs average';
      default:
        return trendLabel;
    }
  };
  
  // Prepare sparkline data
  const sparklineData = showSparkline && historyData.length > 0
    ? historyData.slice(-sparklinePoints)
    : [];
  
  return (
    <BaseWidget {...baseProps}>
      <div className="flex flex-col justify-center h-full space-y-2" role="region" aria-label={baseProps.title}>
        {/* Loading indicator */}
        {isRefreshing && (
          <div data-testid="loading-indicator" className="absolute top-2 right-2">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Refresh button */}
        {showRefreshButton && onRefresh && (
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        
        {/* Error message */}
        {error && (
          <div className="text-xs text-red-600">Error: {error}</div>
        )}
        
        {/* Value and threshold */}
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold tracking-tight">
            {formatValue(value)}
            {unit && !formatAsPercentage && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
          </div>
          {getThresholdBadge()}
        </div>
        
        {/* Trend information */}
        {calculatedTrend && calculatedTrendPercentage !== undefined && (
          <div className={`flex items-center text-sm ${getTrendColor()}`} role="status">
            {getTrendIcon()}
            <span className="ml-1 font-medium">
              {calculatedTrendPercentage.toFixed(1)}%
            </span>
            <span className="ml-2 text-muted-foreground text-xs">
              {getComparisonLabel()}
            </span>
          </div>
        )}
        
        {/* Sparkline */}
        {showSparkline && sparklineData.length > 0 && (
          <div data-testid="sparkline" className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {sparklineData.map((point, index) => (
              <span key={index} data-testid="sparkline-point" className="hidden">
                {point.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

