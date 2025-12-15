// Widget Header Component
// Displays widget title, status, and action icons (configure, delete)

import { Settings, Trash2, GripVertical, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';

export interface WidgetHeaderProps {
  widget: Widget;
  mode: DashboardMode;
  status?: 'idle' | 'loading' | 'error' | 'success';
  onConfigure: () => void;
  onDelete: () => void;
  className?: string;
}

export function WidgetHeader({
  widget,
  mode,
  status = 'idle',
  onConfigure,
  onDelete,
  className = '',
}: WidgetHeaderProps) {
  const showActions = mode === 'design';

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b bg-card relative ${showActions ? 'drag-handle cursor-grab active:cursor-grabbing' : ''} ${className}`}>
      {/* Left: Drag handle (design mode only) */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showActions && (
          <div title="Drag to move widget">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Widget Title */}
        <h3 className="text-sm font-semibold truncate">{widget.title}</h3>
        
        {/* Status Indicator */}
        {status === 'loading' && (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        )}
        {status === 'error' && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Right: Action Icons */}
      {showActions && (
        <div className="flex items-center gap-1">
          {/* Configure Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfigure?.();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            title="Configure widget"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Delete Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                title="Delete widget"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Widget</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{widget.title}&rdquo;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
