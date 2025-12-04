/**
 * Dashboard Toolbar Component
 * Toolbar with actions for the dashboard builder (Story 4.1)
 */

'use client';

import React, { useState } from 'react';
import {
  Edit,
  Eye,
  Save,
  Undo,
  Redo,
  Share2,
  Download,
  Plus,
  LayoutGrid,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDashboardStore } from '@/lib/dashboard/store';
import { DASHBOARD_TEMPLATES } from '@/lib/dashboard/widget-library';
import { cn } from '@/lib/utils';

interface DashboardToolbarProps {
  className?: string;
  onCreateNew?: () => void;
  onOpenTemplates?: () => void;
}

export function DashboardToolbar({ className, onCreateNew, onOpenTemplates }: DashboardToolbarProps) {
  const {
    dashboard,
    isEditing,
    isDirty,
    setEditing,
    saveDashboard,
    updateDashboardName,
    undo,
    redo,
    canUndo,
    canRedo,
    setSharing,
  } = useDashboardStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleToggleEdit = () => {
    setEditing(!isEditing);
  };

  const handleSave = () => {
    saveDashboard();
  };

  const handleNameClick = () => {
    if (isEditing) {
      setNameInput(dashboard?.name || '');
      setIsEditingName(true);
    }
  };

  const handleNameSave = () => {
    if (nameInput.trim()) {
      updateDashboardName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleShare = () => {
    if (dashboard) {
      setSharing(!dashboard.isShared);
    }
  };

  const handleExport = () => {
    if (dashboard) {
      const json = JSON.stringify(dashboard, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize filename: replace spaces with dashes and remove invalid characters
      const safeName = dashboard.name
        .replace(/\s+/g, '-')
        .replace(/[/\\:*?"<>|]/g, '')
        .toLowerCase();
      a.download = `${safeName || 'dashboard'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-2 border-b bg-background',
        className
      )}
    >
      {/* Left side - Dashboard name and status */}
      <div className="flex items-center gap-4">
        {isEditingName ? (
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="h-8 w-48"
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameClick}
            className={cn(
              'text-lg font-semibold hover:underline',
              isEditing && 'cursor-text'
            )}
            disabled={!isEditing}
          >
            {dashboard?.name || 'Untitled Dashboard'}
          </button>
        )}
        {isDirty && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Center - Edit/View controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleEdit}
        >
          {isEditing ? (
            <>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </>
          )}
        </Button>

        {isEditing && (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={undo}
              disabled={!canUndo()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={redo}
              disabled={!canRedo()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {isEditing && (
          <Button variant="default" size="sm" onClick={handleSave} disabled={!isDirty}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateNew}>
              <LayoutGrid className="w-4 h-4 mr-2" />
              Blank Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Templates
            </div>
            {DASHBOARD_TEMPLATES.slice(1).map((template) => (
              <DropdownMenuItem key={template.id} onClick={() => onOpenTemplates?.()}>
                <Settings className="w-4 h-4 mr-2" />
                {template.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="icon-sm" onClick={handleShare} title="Share">
          <Share2 className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="icon-sm" onClick={handleExport} title="Export">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
