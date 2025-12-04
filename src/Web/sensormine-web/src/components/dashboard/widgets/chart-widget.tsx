/**
 * Chart Widget
 * 
 * Dashboard widget wrapper for time-series charts.
 * Story 4.2 - Time-Series Charts
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { TimeSeriesChart } from './charts/time-series-chart';
import type { ChartConfiguration } from '@/lib/types/chart-types';

interface ChartWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Chart configuration */
  config: ChartConfiguration;
}

export function ChartWidget({
  config,
  ...baseProps
}: ChartWidgetProps) {
  return (
    <BaseWidget {...baseProps}>
      <div className="h-full p-4">
        <TimeSeriesChart config={config} />
      </div>
    </BaseWidget>
  );
}
