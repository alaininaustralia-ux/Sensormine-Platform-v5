'use client';

import { Widget } from '@/lib/types/dashboard-v2';
import { WidgetHeader } from '../WidgetHeader';
import { WidgetRenderer } from '../WidgetRenderer';

interface GridWidgetProps {
  widget: Widget;
  mode: 'design' | 'view';
  onConfigure?: () => void;
  onDelete?: () => void;
  onElementSelected?: (elementId: string, elementName: string) => void;
}

/**
 * GridWidget - Renders a single widget within a grid layout
 * Responsibility: Widget container styling and header/content layout
 */
export function GridWidget({ widget, mode, onConfigure, onDelete, onElementSelected }: GridWidgetProps) {
  return (
    <div className="h-full w-full bg-background rounded-lg shadow-md border flex flex-col overflow-hidden">
      {/* Widget Header */}
      {mode === 'design' ? (
        <WidgetHeader
          widget={widget}
          mode={mode}
          onConfigure={onConfigure || (() => {})}
          onDelete={onDelete || (() => {})}
        />
      ) : (
        widget.config.showTitle !== false && (
          <div className="px-4 py-2 border-b bg-muted/30 flex-shrink-0">
            <span className="text-sm font-medium">{widget.title}</span>
          </div>
        )
      )}

      {/* Widget Content */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full w-full">
          <WidgetRenderer 
            key={`${widget.id}-${JSON.stringify(widget.config)}`} 
            widget={widget} 
            mode={mode}
            onElementSelected={onElementSelected}
          />
        </div>
      </div>
    </div>
  );
}
