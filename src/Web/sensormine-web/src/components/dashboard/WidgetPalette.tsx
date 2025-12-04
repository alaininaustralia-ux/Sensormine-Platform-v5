/**
 * Widget Palette Component
 * Displays available widgets that can be dragged onto the dashboard (Story 4.1)
 */

'use client';

import React from 'react';
import {
  LineChart,
  Table,
  Map,
  Video,
  Gauge,
  TrendingUp,
  Type,
  GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WIDGET_LIBRARY } from '@/lib/dashboard/widget-library';
import type { WidgetLibraryItem, WidgetDragData } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  LineChart,
  Table,
  Map,
  Video,
  Gauge,
  TrendingUp,
  Type,
};

interface WidgetPaletteItemProps {
  item: WidgetLibraryItem;
  onDragStart: (data: WidgetDragData) => void;
}

function WidgetPaletteItem({ item, onDragStart }: WidgetPaletteItemProps) {
  const Icon = iconMap[item.icon] || Type;

  const handleDragStart = (e: React.DragEvent) => {
    const dragData: WidgetDragData = {
      type: 'new',
      widgetType: item.type,
      libraryItem: item,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(dragData);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-grab',
        'hover:bg-accent hover:border-accent-foreground/20',
        'active:cursor-grabbing transition-colors'
      )}
      role="button"
      tabIndex={0}
      aria-label={`Drag ${item.name} widget`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
      </div>
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

interface WidgetPaletteProps {
  className?: string;
  onWidgetDragStart?: (data: WidgetDragData) => void;
}

export function WidgetPalette({ className, onWidgetDragStart }: WidgetPaletteProps) {
  const handleDragStart = (data: WidgetDragData) => {
    onWidgetDragStart?.(data);
  };

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader className="py-4">
        <CardTitle className="text-lg">Widgets</CardTitle>
        <CardDescription>
          Drag widgets to add them to your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="space-y-2">
          {WIDGET_LIBRARY.map((item) => (
            <WidgetPaletteItem
              key={item.type}
              item={item}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
