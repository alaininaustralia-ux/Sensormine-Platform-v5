/**
 * Dashboard Toolbar
 * 
 * Toolbar with actions for the dashboard builder (save, cancel, etc.).
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X, Eye } from 'lucide-react';

export interface DashboardToolbarProps {
  /** Dashboard name */
  dashboardName: string;
  /** Callback when dashboard name changes */
  onNameChange: (name: string) => void;
  /** Whether the dashboard is in edit mode */
  isEditMode: boolean;
  /** Callback to toggle edit mode */
  onToggleEditMode: () => void;
  /** Callback when save is clicked */
  onSave: () => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Whether save is disabled */
  isSaveDisabled?: boolean;
}

export function DashboardToolbar({
  dashboardName,
  onNameChange,
  isEditMode,
  onToggleEditMode,
  onSave,
  onCancel,
  isSaveDisabled = false,
}: DashboardToolbarProps) {
  return (
    <div className="h-14 border-b bg-background flex items-center px-4 gap-4">
      <div className="flex-1 flex items-center gap-4">
        <Input
          value={dashboardName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Dashboard name"
          className="max-w-md"
          disabled={!isEditMode}
        />
        
        {isEditMode && (
          <span className="text-xs text-muted-foreground">
            Editing mode - drag and resize widgets
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {isEditMode ? (
          <>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={onSave} size="sm" disabled={isSaveDisabled}>
              <Save className="mr-2 h-4 w-4" />
              Save Dashboard
            </Button>
          </>
        ) : (
          <Button onClick={onToggleEditMode} size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Edit Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
