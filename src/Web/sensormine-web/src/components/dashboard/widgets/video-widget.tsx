/**
 * Video Widget (Placeholder)
 * 
 * Placeholder for video feed widget.
 * Full implementation in Story 4.3.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { Video } from 'lucide-react';

type VideoWidgetProps = Omit<BaseWidgetProps, 'children'>;

export function VideoWidget(baseProps: VideoWidgetProps) {
  return (
    <BaseWidget {...baseProps}>
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Video className="h-12 w-12 mb-4" />
        <p className="text-sm font-medium">Video Feed Widget</p>
        <p className="text-xs mt-1">
          Live and recorded video streams will be available in Story 4.3
        </p>
      </div>
    </BaseWidget>
  );
}
