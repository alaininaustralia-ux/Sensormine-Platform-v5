/**
 * Breadcrumbs Component
 * 
 * Displays navigation breadcrumbs based on the current route
 * Shows human-readable names for dynamic IDs (dashboards, devices, etc.)
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { useBreadcrumb } from '@/lib/contexts/breadcrumb-context';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  devices: 'Devices',
  'device-types': 'Device Types',
  analytics: 'Analytics',
  alerts: 'Alerts',
  settings: 'Settings',
  'digital-twin': 'Digital Twin',
  schemas: 'Schemas',
  users: 'Users',
  security: 'Security',
  notifications: 'Notifications',
  preferences: 'Preferences',
  'nexus-configuration': 'Nexus Configuration',
  admin: 'Administration',
  profile: 'Profile',
  edit: 'Edit',
  create: 'Create',
  new: 'New',
};

// Check if a string looks like a GUID
function isGuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { getName } = useBreadcrumb();

  // Don't show breadcrumbs on home/root or public pages
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Split pathname into segments and filter empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    
    // Check if this segment is a GUID
    let label: string;
    if (isGuid(segment)) {
      // Try to get human-readable name from context
      const name = getName(segment);
      label = name || `Item ${segment.substring(0, 8)}...`;
    } else {
      // Use predefined label or capitalize
      label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    return { label, href };
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link 
        href="/dashboards" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <Fragment key={crumb.href}>
            <ChevronRight className="h-4 w-4 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
