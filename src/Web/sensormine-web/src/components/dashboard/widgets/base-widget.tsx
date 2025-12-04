/**
 * Base Widget Component
 * 
 * Wrapper component for all dashboard widgets.
 * Provides common UI elements like header, actions, and error boundaries.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, RefreshCw, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BaseWidgetProps {
  /** Widget ID */
  id: string;
  /** Widget title */
  title: string;
  /** Widget description/subtitle */
  description?: string;
  /** Widget content */
  children: React.ReactNode;
  /** Whether the widget is in edit mode */
  isEditMode?: boolean;
  /** Callback when configure is clicked */
  onConfigure?: () => void;
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message if widget failed to load */
  error?: string;
  /** Additional class names */
  className?: string;
}

export function BaseWidget({
  title,
  description,
  children,
  isEditMode = false,
  onConfigure,
  onRefresh,
  onDelete,
  isLoading = false,
  error,
  className,
}: BaseWidgetProps) {
  return (
    <Card className={`h-full flex flex-col ${className || ''}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-medium truncate">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs truncate">{description}</CardDescription>
          )}
        </div>
        
        {(isEditMode || onRefresh || onConfigure) && (
          <div className="flex items-center gap-1 ml-2">
            {onRefresh && !isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                aria-label="Refresh widget"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {isEditMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Widget actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onConfigure && (
                    <DropdownMenuItem onClick={onConfigure}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-destructive font-medium">Error loading widget</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
