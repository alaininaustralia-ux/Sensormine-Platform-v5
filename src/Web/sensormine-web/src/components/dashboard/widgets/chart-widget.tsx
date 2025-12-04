/**
 * Chart Widget (Placeholder)
 * 
 * Placeholder for time-series charts.
 * Full implementation in Story 4.2.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { LineChart } from 'lucide-react';

interface ChartWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Chart type */
  chartType?: 'line' | 'bar' | 'area';
}

export function ChartWidget({
  chartType = 'line',
  ...baseProps
}: ChartWidgetProps) {
  return (
    <BaseWidget {...baseProps}>
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <LineChart className="h-12 w-12 mb-4" />
        <p className="text-sm font-medium">Chart Widget</p>
        <p className="text-xs mt-1">
          {chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart will be available in Story 4.2
        </p>
      </div>
    </BaseWidget>
  );
}
