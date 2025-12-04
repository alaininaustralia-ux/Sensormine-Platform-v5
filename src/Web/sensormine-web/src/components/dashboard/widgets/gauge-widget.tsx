/**
 * Gauge Widget
 * 
 * Displays gauges (circular, linear, bullet) with current value and thresholds.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { CircularGauge } from './gauges/circular-gauge';
import { LinearGauge } from './gauges/linear-gauge';
import { BulletGauge, type BulletRange } from './gauges/bullet-gauge';

interface GaugeWidgetConfig {
  gaugeType?: 'circular' | 'linear' | 'bullet';
  orientation?: 'horizontal' | 'vertical';
  target?: number;
  ranges?: BulletRange[];
  compact?: boolean;
}

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
  /** Gauge configuration */
  config?: GaugeWidgetConfig;
}

export function GaugeWidget({
  value,
  min = 0,
  max = 100,
  unit = '',
  warningThreshold,
  criticalThreshold,
  config = {},
  ...baseProps
}: GaugeWidgetProps) {
  const { gaugeType = 'circular', orientation = 'horizontal', target, ranges, compact } = config;
  
  const renderGauge = () => {
    const commonProps = {
      value,
      min,
      max,
      unit,
      warningThreshold,
      criticalThreshold,
    };
    
    switch (gaugeType) {
      case 'linear':
        return (
          <LinearGauge
            {...commonProps}
            orientation={orientation}
          />
        );
      
      case 'bullet':
        return (
          <BulletGauge
            {...commonProps}
            target={target}
            ranges={ranges}
            orientation={orientation}
            compact={compact}
          />
        );
      
      case 'circular':
      default:
        return (
          <CircularGauge
            {...commonProps}
          />
        );
    }
  };
  
  return (
    <BaseWidget {...baseProps}>
      <div className="flex items-center justify-center h-full p-4">
        {renderGauge()}
      </div>
    </BaseWidget>
  );
}
