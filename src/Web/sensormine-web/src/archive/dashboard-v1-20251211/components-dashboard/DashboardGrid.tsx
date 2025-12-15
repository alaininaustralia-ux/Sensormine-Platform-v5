/**
 * Dashboard Grid Component
 * Grid layout for dashboard widgets with drag-and-drop support (Story 4.1)
 */

'use client';

import React, { useCallback, useState } from 'react';
import { DashboardWidgetComponent } from './DashboardWidget';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { GRID_CONFIG } from '@/lib/dashboard/widget-library';
import type { WidgetDragData, WidgetPosition } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  className?: string;
  deviceId?: string | null;
  onWidgetConfigure?: (widgetId: string) => void;
}

export function DashboardGrid({ className, deviceId, onWidgetConfigure }: DashboardGridProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);

  const {
    currentDashboard: dashboard,
    isEditMode: isEditing,
    selectedWidgetId,
    addWidget,
    removeWidget,
    selectWidget,
    moveWidget,
    resizeWidget,
  } = useDashboardStore();

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isEditing) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);

      // Calculate grid position from mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_CONFIG.columns));
      const y = Math.floor((e.clientY - rect.top) / GRID_CONFIG.rowHeight);
      setDropPosition({ x: Math.max(0, Math.min(x, GRID_CONFIG.columns - 1)), y: Math.max(0, y) });
    },
    [isEditing]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setDropPosition(null);

      if (!isEditing || !dashboard) return;

      try {
        const data: WidgetDragData = JSON.parse(e.dataTransfer.getData('application/json'));

        // Calculate drop position in grid
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_CONFIG.columns));
        const y = Math.floor((e.clientY - rect.top) / GRID_CONFIG.rowHeight);

        if (data.type === 'new' && data.widgetType && data.libraryItem) {
          // Create widget with proper default config from library
          const widgetData = {
            type: data.widgetType,
            title: data.libraryItem.name,
            config: data.libraryItem.defaultConfig.config || {},
            dataConfig: {
              dataSource: {
                type: 'realtime' as const,
                fields: [],
                refreshInterval: 5,
              },
            },
            position: {
              x,
              y,
              width: data.libraryItem.defaultSize.width,
              height: data.libraryItem.defaultSize.height,
            },
          };

          const layoutData = {
            x,
            y,
            w: data.libraryItem.defaultSize.width,
            h: data.libraryItem.defaultSize.height,
          };

          // Add new widget from palette with proper initialization
          addWidget(dashboard.id, widgetData, layoutData, 'current-user'); // TODO: Get actual user ID
        } else if (data.type === 'move' && data.widgetId) {
          // Move existing widget
          moveWidget(data.widgetId, { x, y });
        }
      } catch (error) {
        console.error('Failed to parse drag data:', error);
      }
    },
    [isEditing, dashboard, addWidget, moveWidget]
  );

  const handleWidgetSelect = useCallback(
    (widgetId: string) => {
      selectWidget(widgetId);
    },
    [selectWidget]
  );

  const handleWidgetRemove = useCallback(
    (widgetId: string) => {
      removeWidget(widgetId);
    },
    [removeWidget]
  );

  const handleWidgetConfigure = useCallback(
    (widgetId: string) => {
      onWidgetConfigure?.(widgetId);
    },
    [onWidgetConfigure]
  );

  const handleWidgetMove = useCallback(
    (widgetId: string, position: Partial<WidgetPosition>) => {
      moveWidget(widgetId, position);
    },
    [moveWidget]
  );

  const handleWidgetResize = useCallback(
    (widgetId: string, size: { width: number; height: number }) => {
      resizeWidget(widgetId, size);
    },
    [resizeWidget]
  );

  // Click on empty space deselects widget
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectWidget(null);
      }
    },
    [selectWidget]
  );

  if (!dashboard) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full text-muted-foreground',
          className
        )}
      >
        No dashboard loaded
      </div>
    );
  }

  // Calculate max rows needed
  const maxRow = dashboard.widgets.reduce(
    (max, w) => {
      if (!w.position) return max;
      return Math.max(max, w.position.y + w.position.height);
    },
    4 // Minimum 4 rows
  );

  return (
    <div
      className={cn(
        'relative w-full min-h-[400px] p-4 overflow-auto',
        isDragOver && 'bg-accent/20',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleGridClick}
      data-testid="dashboard-grid"
    >
      {/* Grid background */}
      {isEditing && (
        <div
          className="absolute inset-4 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `calc((100% - ${GRID_CONFIG.gap * (GRID_CONFIG.columns - 1)}px) / ${GRID_CONFIG.columns} + ${GRID_CONFIG.gap}px) ${GRID_CONFIG.rowHeight}px`,
          }}
        />
      )}

      {/* Drop indicator */}
      {isDragOver && dropPosition && (
        <div
          className="absolute pointer-events-none bg-primary/20 border-2 border-dashed border-primary rounded-lg transition-all"
          style={{
            left: `calc(${(dropPosition.x * 100) / GRID_CONFIG.columns}% + 1rem)`,
            top: `calc(${dropPosition.y * GRID_CONFIG.rowHeight}px + 1rem)`,
            width: `calc(${(2 * 100) / GRID_CONFIG.columns}% - ${GRID_CONFIG.gap}px)`,
            height: `${2 * GRID_CONFIG.rowHeight - GRID_CONFIG.gap}px`,
          }}
        />
      )}

      {/* Widgets grid */}
      <div
        className="grid gap-4 relative z-10"
        style={{
          gridTemplateColumns: `repeat(${GRID_CONFIG.columns}, 1fr)`,
          gridAutoRows: `${GRID_CONFIG.rowHeight}px`,
          minHeight: `${maxRow * GRID_CONFIG.rowHeight}px`,
        }}
      >
        {dashboard.widgets.map((widget) => (
          <DashboardWidgetComponent
            key={widget.id}
            widget={widget}
            deviceId={deviceId}
            dashboardId={dashboard.id}
            isSelected={selectedWidgetId === widget.id}
            isEditing={isEditing}
            onSelect={() => handleWidgetSelect(widget.id)}
            onRemove={() => handleWidgetRemove(widget.id)}
            onConfigure={() => handleWidgetConfigure(widget.id)}
            onMove={(pos) => handleWidgetMove(widget.id, pos)}
            onResize={(size) => handleWidgetResize(widget.id, size)}
          />
        ))}
      </div>

      {/* Empty state */}
      {dashboard.widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No widgets yet</p>
            <p className="text-sm">
              {isEditing
                ? 'Drag widgets from the palette to get started'
                : 'Edit the dashboard to add widgets'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
