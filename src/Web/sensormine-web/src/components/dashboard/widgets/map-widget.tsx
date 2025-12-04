/**
 * Map Widget (Placeholder)
 * 
 * Placeholder for GIS map widget.
 * Full implementation in Story 4.6.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { Map } from 'lucide-react';

type MapWidgetProps = Omit<BaseWidgetProps, 'children'>;

export function MapWidget(baseProps: MapWidgetProps) {
  return (
    <BaseWidget {...baseProps}>
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Map className="h-12 w-12 mb-4" />
        <p className="text-sm font-medium">GIS Map Widget</p>
        <p className="text-xs mt-1">
          Interactive map with device markers will be available in Story 4.6
        </p>
      </div>
    </BaseWidget>
  );
}
