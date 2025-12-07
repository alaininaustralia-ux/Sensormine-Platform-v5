/**
 * Widget Library Sidebar
 * 
 * Displays available widgets that can be added to the dashboard.
 */

'use client';

import { Card } from '@/components/ui/card';
import { getAvailableWidgets, WIDGET_CATEGORIES } from '@/lib/stores/widget-registry';
import * as Icons from 'lucide-react';
import type { WidgetType } from '@/lib/types/dashboard';

export interface WidgetLibrarySidebarProps {
  /** Callback when a widget is selected for adding */
  onAddWidget: (type: WidgetType) => void;
}

export function WidgetLibrarySidebar({ onAddWidget }: WidgetLibrarySidebarProps) {
  const availableWidgets = getAvailableWidgets();
  
  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Widget Library</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Click to add widgets to your dashboard
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {WIDGET_CATEGORIES.map((category) => {
            const categoryWidgets = availableWidgets.filter(
              (w) => w.category === category.id
            );
            
            if (categoryWidgets.length === 0) return null;
            
            const CategoryIcon = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
            
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{category.name}</h3>
                </div>
                
                <div className="space-y-2">
                  {categoryWidgets.map((widget) => {
                    const WidgetIcon = Icons[widget.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                    
                    return (
                      <Card
                        key={widget.type}
                        className="p-3 cursor-pointer hover:bg-accent hover:border-primary transition-colors"
                        onClick={() => onAddWidget(widget.type)}
                      >
                        <div className="flex items-start gap-2">
                          <WidgetIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{widget.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {widget.description}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {availableWidgets.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No widgets available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
