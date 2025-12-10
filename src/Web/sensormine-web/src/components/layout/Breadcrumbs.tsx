/**
 * Breadcrumbs Component
 * 
 * Displays navigation breadcrumbs based on the current route
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

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
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on home/root or public pages
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Split pathname into segments and filter empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return { label, href };
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link 
        href="/dashboard" 
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
