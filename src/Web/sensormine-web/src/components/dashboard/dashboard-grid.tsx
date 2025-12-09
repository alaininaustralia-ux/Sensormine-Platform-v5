/**
 * Dashboard Grid Component
 * 
 * Main dashboard grid layout using react-grid-layout.
 * Supports drag-and-drop, resize, and responsive breakpoints.
 */

'use client';

import GridLayout, { type Layout } from 'react-grid-layout';
import type { Dashboard, LayoutItem } from '@/lib/types/dashboard';
import { WidgetFactory } from './widgets/widget-factory';

export interface DashboardGridProps {
  /** Dashboard configuration */
  dashboard: Dashboard | null;
  /** Whether the dashboard is in edit mode */
  isEditMode?: boolean;
  /** Callback when layout changes (drag/resize) */
  onLayoutChange?: (layout: LayoutItem[]) => void;
  /** Callback when configure widget is clicked */
  onConfigureWidget?: (widgetId: string) => void;
  /** Callback when delete widget is clicked */
  onDeleteWidget?: (widgetId: string) => void;
  /** Grid columns */
  cols?: number;
  /** Row height in pixels */
  rowHeight?: number;
  /** Margin between items [x, y] */
  margin?: [number, number];
}

export function DashboardGrid({
  dashboard,
  isEditMode = false,
  onLayoutChange,
  onConfigureWidget,
  onDeleteWidget,
  cols = 12,
  rowHeight = 60,
  margin = [16, 16],
}: DashboardGridProps) {
  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!onLayoutChange) return;
    
    // Convert react-grid-layout Layout to our LayoutItem type
    const updatedLayout: LayoutItem[] = newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
      static: item.static,
      isDraggable: item.isDraggable,
      isResizable: item.isResizable,
    }));
    
    onLayoutChange(updatedLayout);
  };
  
  if (!dashboard || !dashboard.widgets || dashboard.widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-lg font-medium">No widgets yet</p>
        <p className="text-sm mt-2">
          {isEditMode
            ? 'Add widgets from the library to get started'
            : 'This dashboard is empty'}
        </p>
      </div>
    );
  }
  
  // Ensure layout has valid items for all widgets
  const validLayout = (dashboard.layout || []).filter(item => 
    item && typeof item.w === 'number' && typeof item.h === 'number'
  );

  // If layout is incomplete, show loading state
  if (dashboard.widgets.length > 0 && validLayout.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <GridLayout
        className="layout"
        layout={validLayout}
        cols={cols}
        rowHeight={rowHeight}
        width={1200}
        margin={margin}
        containerPadding={[16, 16]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
      >
        {dashboard.widgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            {isEditMode && (
              <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 cursor-move bg-primary/5 hover:bg-primary/10 transition-colors z-10 rounded-t-lg" />
            )}
            <WidgetFactory
              widget={widget}
              dashboardId={dashboard.id}
              isEditMode={isEditMode}
              onConfigure={onConfigureWidget}
              onDelete={onDeleteWidget}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
