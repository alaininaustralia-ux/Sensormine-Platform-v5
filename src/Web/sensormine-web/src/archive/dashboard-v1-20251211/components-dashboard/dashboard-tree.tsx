/**
 * Dashboard Hierarchy Tree
 * 
 * Displays dashboard hierarchy as an expandable tree structure
 * Supports navigation and subpage management
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Plus, LayoutDashboard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/lib/types/dashboard';
import type { SubPageSummary } from '@/lib/api/dashboards';

interface DashboardTreeProps {
  dashboards: Dashboard[];
  currentDashboardId?: string;
  onCreateSubPage?: (parentId: string) => void;
  className?: string;
}

export function DashboardTree({ 
  dashboards, 
  currentDashboardId, 
  onCreateSubPage,
  className 
}: DashboardTreeProps) {
  // Filter to only root dashboards
  const rootDashboards = dashboards.filter(d => !d.parentDashboardId);

  return (
    <div className={cn('space-y-1', className)}>
      {rootDashboards.map(dashboard => (
        <DashboardTreeNode
          key={dashboard.id}
          dashboard={dashboard}
          currentDashboardId={currentDashboardId}
          onCreateSubPage={onCreateSubPage}
          level={0}
        />
      ))}
    </div>
  );
}

interface DashboardTreeNodeProps {
  dashboard: Dashboard;
  currentDashboardId?: string;
  onCreateSubPage?: (parentId: string) => void;
  level: number;
}

function DashboardTreeNode({ 
  dashboard, 
  currentDashboardId, 
  onCreateSubPage,
  level 
}: DashboardTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(
    dashboard.id === currentDashboardId || 
    dashboard.subPages?.some(sp => sp.id === currentDashboardId)
  );
  
  const hasSubPages = dashboard.subPages && dashboard.subPages.length > 0;
  const isCurrent = dashboard.id === currentDashboardId;
  const indent = level * 16;

  return (
    <div>
      {/* Dashboard node */}
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-md group hover:bg-accent',
          isCurrent && 'bg-accent font-medium'
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand/collapse button */}
        {hasSubPages ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-accent-foreground/10 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Dashboard icon */}
        <LayoutDashboard className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Dashboard link */}
        <Link
          href={`/dashboard/${dashboard.id}`}
          className={cn(
            'flex-1 text-sm truncate hover:text-foreground transition-colors',
            isCurrent ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {dashboard.name}
        </Link>

        {/* Add subpage button (visible on hover) */}
        {onCreateSubPage && (
          <button
            onClick={() => onCreateSubPage(dashboard.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent-foreground/10 rounded transition-opacity"
            title="Add subpage"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Subpages */}
      {isExpanded && hasSubPages && (
        <div className="space-y-0.5">
          {dashboard.subPages!
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(subPage => (
              <SubPageNode
                key={subPage.id}
                subPage={subPage}
                currentDashboardId={currentDashboardId}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface SubPageNodeProps {
  subPage: SubPageSummary;
  currentDashboardId?: string;
  level: number;
}

function SubPageNode({ subPage, currentDashboardId, level }: SubPageNodeProps) {
  const isCurrent = subPage.id === currentDashboardId;
  const indent = level * 16;

  return (
    <Link
      href={`/dashboard/${subPage.id}`}
      className={cn(
        'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent transition-colors',
        isCurrent && 'bg-accent font-medium'
      )}
      style={{ paddingLeft: `${indent + 8}px` }}
    >
      <div className="w-5" /> {/* Spacer for alignment */}
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className={cn(
        'flex-1 text-sm truncate',
        isCurrent ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {subPage.name}
      </span>
      {subPage.widgetCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {subPage.widgetCount}
        </span>
      )}
    </Link>
  );
}

/**
 * Simplified list view (alternative to tree)
 */
interface DashboardListProps {
  dashboards: Dashboard[];
  currentDashboardId?: string;
  onSelect?: (dashboardId: string) => void;
  className?: string;
}

export function DashboardList({ 
  dashboards, 
  currentDashboardId, 
  onSelect,
  className 
}: DashboardListProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {dashboards.map(dashboard => {
        const isCurrent = dashboard.id === currentDashboardId;
        
        return (
          <button
            key={dashboard.id}
            onClick={() => onSelect?.(dashboard.id)}
            className={cn(
              'w-full flex items-center gap-2 py-2 px-3 rounded-md text-left hover:bg-accent transition-colors',
              isCurrent && 'bg-accent'
            )}
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className={cn(
                'text-sm truncate',
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}>
                {dashboard.name}
              </div>
              {dashboard.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {dashboard.description}
                </div>
              )}
            </div>
            {dashboard.subPages && dashboard.subPages.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {dashboard.subPages.length} subpages
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
