/**
 * Dashboard Breadcrumb Navigation
 * 
 * Displays hierarchical breadcrumb navigation for dashboard pages
 * Allows users to navigate up the dashboard hierarchy
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  id: string;
  name: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  currentPage?: string;
  className?: string;
}

export function BreadcrumbNav({ items, currentPage, className }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      {/* Home/Root link */}
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link
            href={item.href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.name}
          </Link>
        </React.Fragment>
      ))}

      {/* Current page (not a link) */}
      {currentPage && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{currentPage}</span>
        </>
      )}
    </nav>
  );
}

/**
 * Compact breadcrumb for mobile/small spaces
 */
interface CompactBreadcrumbProps {
  parentName?: string;
  parentHref?: string;
  currentPage: string;
  className?: string;
}

export function CompactBreadcrumb({ parentName, parentHref, currentPage, className }: CompactBreadcrumbProps) {
  if (!parentName || !parentHref) {
    return (
      <div className={cn('flex items-center text-sm', className)}>
        <span className="font-medium text-foreground">{currentPage}</span>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      <Link
        href={parentHref}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {parentName}
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium text-foreground">{currentPage}</span>
    </nav>
  );
}
