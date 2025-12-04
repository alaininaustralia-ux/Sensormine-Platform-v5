/**
 * Gauge Widget
 * 
 * Displays a circular gauge with current value and min/max thresholds.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';

interface GaugeWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Current value */
  value: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Unit of measurement */
  unit?: string;
  /** Warning threshold (yellow) */
  warningThreshold?: number;
  /** Critical threshold (red) */
  criticalThreshold?: number;
}

export function GaugeWidget({
  value,
  min = 0,
  max = 100,
  unit = '',
  warningThreshold,
  criticalThreshold,
  ...baseProps
}: GaugeWidgetProps) {
  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine color based on thresholds
  const getColor = () => {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return 'text-red-600';
    }
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };
  
  const getStrokeColor = () => {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return '#dc2626'; // red-600
    }
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return '#ca8a04'; // yellow-600
    }
    return '#16a34a'; // green-600
  };
  
  // SVG circle parameters
  const size = 120;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;
  
  return (
    <BaseWidget {...baseProps}>
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        <div className="text-center">
          <div className={`text-3xl font-bold ${getColor()}`}>
            {value.toFixed(1)}
            {unit && <span className="text-base ml-1">{unit}</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {min} - {max} {unit}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
