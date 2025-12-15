'use client';

// Gauge Widget

import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';

interface GaugeWidgetProps {
  widget: Widget;
  mode: DashboardMode;
}

export function GaugeWidget({ widget }: GaugeWidgetProps) {
  const value = 75;
  const min = widget.config.minValue || 0;
  const max = widget.config.maxValue || 100;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${(percentage / 100) * 339.292} 339.292`}
            className="text-primary"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground mt-4">{widget.title}</div>
    </div>
  );
}
