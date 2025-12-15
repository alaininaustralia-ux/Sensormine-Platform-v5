'use client';

import { Widget } from '@/lib/stores/dashboard-v2-store';
import { GridWidget } from './GridWidget';

interface DashboardCanvasProps {
  widgets: Widget[];
  layouts: { [key: string]: any[] };
  mode?: 'view';
}

/**
 * DashboardCanvas - Renders widgets with absolute positioning (view mode only)
 * Responsibility: Calculate and apply absolute positioning from layout data
 */
export function DashboardCanvas({ widgets, layouts, mode = 'view' }: DashboardCanvasProps) {
  const ROW_HEIGHT = 80;
  const MARGIN = 16;
  const COLS = 12;
  const MIN_WIDTH = 2;   // Minimum 2 columns
  const MIN_HEIGHT = 3;  // Minimum 3 rows

  console.log('[DashboardCanvas] Rendering with:', {
    widgetCount: widgets.length,
    layoutsKeys: Object.keys(layouts),
    lgLayoutCount: layouts.lg?.length,
    widgets: widgets.map(w => ({ id: w.id, title: w.title, positionI: w.position.i })),
  });

  return (
    <div className="relative w-full" style={{ minHeight: '100vh' }}>
      {widgets.map((widget) => {
        const layoutItem = layouts.lg?.find((l: any) => l.i === widget.position.i);
        
        if (!layoutItem) {
          console.warn('[DashboardCanvas] No layout item found for widget:', widget.id, 'position.i:', widget.position.i);
          return null;
        }

        // Enforce minimum sizes (same as DashboardGrid)
        const w = Math.max(layoutItem.w, MIN_WIDTH);
        const h = Math.max(layoutItem.h, MIN_HEIGHT);

        const left = (layoutItem.x / COLS) * 100;
        const width = (w / COLS) * 100;
        const top = layoutItem.y * (ROW_HEIGHT + MARGIN);
        const height = h * ROW_HEIGHT + (h - 1) * MARGIN;

        console.log('[DashboardCanvas] Positioning widget:', {
          widgetId: widget.id,
          layoutItem,
          calculated: { left: `${left}%`, width: `calc(${width}% - ${MARGIN}px)`, top: `${top}px`, height: `${height}px` }
        });

        return (
          <div
            key={widget.id}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}px`,
              width: `calc(${width}% - ${MARGIN}px)`,
              height: `${height}px`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <GridWidget widget={widget} mode={mode} />
          </div>
        );
      })}
    </div>
  );
}
