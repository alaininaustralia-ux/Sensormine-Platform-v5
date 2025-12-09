/**
 * Dashboard Widget Component
 * Base widget container with drag/resize capabilities (Story 4.1)
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  LineChart,
  Table,
  Map,
  Video,
  Gauge,
  TrendingUp,
  Type,
  Trash2,
  Settings,
  Move,
  Maximize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DashboardWidget, WidgetDragData, WidgetPosition } from '@/lib/dashboard/types';
import { GRID_CONFIG } from '@/lib/dashboard/widget-library';
import { cn } from '@/lib/utils';
import { WidgetDataRenderer } from './WidgetDataRenderer';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  chart: LineChart,
  table: Table,
  map: Map,
  video: Video,
  gauge: Gauge,
  kpi: TrendingUp,
  text: Type,
};

interface DashboardWidgetComponentProps {
  widget: DashboardWidget;
  deviceId?: string | null;
  dashboardId?: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onConfigure: () => void;
  onMove: (position: Partial<WidgetPosition>) => void;
  onResize: (size: { width: number; height: number }) => void;
}

export function DashboardWidgetComponent({
  widget,
  deviceId,
  dashboardId,
  isSelected,
  isEditing,
  onSelect,
  onRemove,
  onConfigure,
  onMove: _onMove, // Used via parent drag handling
  onResize,
}: DashboardWidgetComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const Icon = iconMap[widget.type] || Type;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!isEditing) return;

      const dragData: WidgetDragData = {
        type: 'move',
        widgetId: widget.id,
      };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'move';
      setIsDragging(true);
      onSelect();
    },
    [isEditing, widget.id, onSelect]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditing) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      onSelect();
    },
    [isEditing, onSelect]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !dragStart || !widget.position) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Calculate new size based on grid
      // Use rowHeight for both since we're working with a square-ish grid
      // The actual width will be determined by CSS grid columns
      const cellSize = GRID_CONFIG.rowHeight;

      const widthDelta = Math.round(deltaX / cellSize);
      const heightDelta = Math.round(deltaY / cellSize);

      if (widthDelta !== 0 || heightDelta !== 0) {
        const newWidth = Math.max(
          GRID_CONFIG.minWidgetWidth,
          Math.min(GRID_CONFIG.maxWidgetWidth, (widget.position.width || 6) + widthDelta)
        );
        const newHeight = Math.max(
          GRID_CONFIG.minWidgetHeight,
          Math.min(GRID_CONFIG.maxWidgetHeight, (widget.position.height || 4) + heightDelta)
        );

        if (newWidth !== widget.position.width || newHeight !== widget.position.height) {
          onResize({ width: newWidth, height: newHeight });
          setDragStart({ x: e.clientX, y: e.clientY });
        }
      }
    },
    [isResizing, dragStart, widget.position, onResize]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setDragStart(null);
  }, []);

  // Add event listeners for resize
  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Safety check: if position is missing, show loading state
  if (!widget.position) {
    return (
      <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Calculate grid position styles
  const gridStyles = {
    gridColumn: `${widget.position.x + 1} / span ${widget.position.width}`,
    gridRow: `${widget.position.y + 1} / span ${widget.position.height}`,
  };

  const renderWidgetContent = () => {
    // Device list and device data table widgets always render through WidgetDataRenderer (they fetch their own data)
    if (widget.type === 'device-list' || widget.type === 'device-data-table') {
      return <WidgetDataRenderer widget={widget} deviceId={deviceId} dashboardId={dashboardId} />;
    }

    // Check if widget has data configuration
    const hasDataConfig = widget.dataConfig && 
                           widget.dataConfig.dataSource && 
                           widget.dataConfig.dataSource.fields.length > 0;

    // If configured, use WidgetDataRenderer
    if (hasDataConfig) {
      return <WidgetDataRenderer widget={widget} deviceId={deviceId} dashboardId={dashboardId} />;
    }

    // Show configuration placeholder
    if (!widget.dataConfig || !widget.dataConfig.dataSource || widget.dataConfig.dataSource.fields.length === 0) {
      switch (widget.type) {
        case 'chart':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <LineChart className="w-12 h-12" />
              <span className="text-sm mt-2">Configure data source</span>
            </div>
          );
        case 'table':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Table className="w-12 h-12" />
              <span className="text-sm mt-2">Configure data source</span>
            </div>
          );
        case 'map':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/50 rounded">
              <Map className="w-12 h-12" />
              <span className="text-sm mt-2">Configure data source</span>
            </div>
          );
        case 'video':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-black/80 rounded">
              <Video className="w-12 h-12 text-white" />
              <span className="text-sm mt-2 text-white">Configure video source</span>
            </div>
          );
        case 'gauge':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Gauge className="w-16 h-16" />
              <span className="text-sm mt-2">Configure data source</span>
            </div>
          );
        case 'kpi':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <TrendingUp className="w-12 h-12" />
              <span className="text-sm mt-2">Configure data source</span>
            </div>
          );
        case 'text':
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Type className="w-8 h-8" />
              <span className="text-sm mt-2">Add text content</span>
            </div>
          );
        default:
          return null;
      }
    }

    // Fallback - should never reach here
    return null;
  };

  return (
    <Card
      style={gridStyles}
      className={cn(
        'relative overflow-hidden transition-all',
        isSelected && 'ring-2 ring-primary',
        isDragging && 'opacity-50',
        isEditing && 'cursor-move'
      )}
      draggable={isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      data-widget-id={widget.id}
      data-testid={`widget-${widget.id}`}
    >
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </div>
        {isEditing && isSelected && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              aria-label="Configure widget"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Remove widget"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 h-[calc(100%-3.5rem)]">
        {renderWidgetContent()}
      </CardContent>

      {/* Resize handle */}
      {isEditing && isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
          aria-label="Resize widget"
        >
          <Maximize2 className="w-3 h-3 text-muted-foreground rotate-90 translate-x-0.5 translate-y-0.5" />
        </div>
      )}

      {/* Move indicator */}
      {isEditing && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
          <Move className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  );
}
