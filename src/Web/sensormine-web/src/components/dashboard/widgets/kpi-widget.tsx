/**
 * KPI Widget
 * 
 * Displays a key performance indicator with value, trend, and sparkline.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

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
}

export function KPIWidget({
  value,
  previousValue,
  unit = '',
  trend,
  trendPercentage,
  trendLabel = 'vs previous period',
  trendIsPositive = true,
  ...baseProps
}: KPIWidgetProps) {
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
  
  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };
  
  const getTrendColor = () => {
    if (calculatedTrend === 'neutral') return 'text-muted-foreground';
    
    const isUp = calculatedTrend === 'up';
    const isGood = trendIsPositive ? isUp : !isUp;
    
    return isGood ? 'text-green-600' : 'text-red-600';
  };
  
  return (
    <BaseWidget {...baseProps}>
      <div className="flex flex-col justify-center h-full space-y-2">
        <div className="text-3xl font-bold tracking-tight">
          {value}{unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
        </div>
        
        {calculatedTrend && calculatedTrendPercentage !== undefined && (
          <div className={`flex items-center text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1 font-medium">
              {calculatedTrendPercentage.toFixed(1)}%
            </span>
            <span className="ml-2 text-muted-foreground text-xs">
              {trendLabel}
            </span>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
