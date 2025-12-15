/**
 * Device Context Banner
 * 
 * Displays the current device context when viewing a device-specific subpage.
 * Shows device name and provides navigation back to the parent dashboard.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface DeviceContextBannerProps {
  /** Device ID */
  deviceId: string;
  /** Device name */
  deviceName: string;
  /** Device type (optional) */
  deviceType?: string;
  /** Parent dashboard ID to navigate back to */
  parentDashboardId?: string;
  /** Callback when close/clear context is clicked */
  onClear?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function DeviceContextBanner({
  deviceId,
  deviceName,
  deviceType,
  parentDashboardId,
  onClear,
  className,
}: DeviceContextBannerProps) {
  const router = useRouter();

  const handleBack = () => {
    if (parentDashboardId) {
      router.push(`/dashboard/${parentDashboardId}`);
    } else {
      router.back();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-2 bg-primary/5 border-b border-primary/10',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="shrink-0"
          title="Back to overview"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-muted-foreground shrink-0">
            Viewing device:
          </span>
          <span className="text-sm font-semibold truncate">{deviceName}</span>
          {deviceType && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {deviceType}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground truncate">
            ({deviceId})
          </span>
        </div>
      </div>

      {onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0"
          title="Clear device filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
