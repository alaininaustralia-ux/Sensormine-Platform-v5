/**
 * Pie Chart Widget
 * 
 * Displays categorical data distribution using a pie or donut chart.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  percentage?: number;
  [key: string]: string | number | undefined;
}

interface PieChartWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Chart data */
  data: PieChartData[];
  /** Chart colors */
  colors?: string[];
  /** Show as donut chart */
  donut?: boolean;
  /** Inner radius percentage (for donut) */
  innerRadius?: number;
  /** Outer radius percentage */
  outerRadius?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Show percentages in labels */
  showPercentages?: boolean;
  /** Chart height */
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function PieChartWidget({
  data,
  colors = DEFAULT_COLORS,
  donut = false,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
  showPercentages = true,
  height = 300,
  ...baseProps
}: PieChartWidgetProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (entry: any) => {
    if (showPercentages && entry.percentage !== undefined) {
      return `${entry.percentage.toFixed(1)}%`;
    }
    return '';
  };

  return (
    <BaseWidget {...baseProps}>
      <div className="h-full p-4">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={outerRadius}
              innerRadius={donut ? innerRadius || outerRadius * 0.6 : innerRadius}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: number, name: string, props: any) => {
                const percentage = props?.payload?.percentage;
                return [
                  `${value.toFixed(2)}${percentage ? ` (${percentage.toFixed(1)}%)` : ''}`,
                  name
                ];
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </BaseWidget>
  );
}
