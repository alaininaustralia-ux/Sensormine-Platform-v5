/**
 * useNavigationTracking Hook
 * 
 * Automatically tracks page visits to build navigation history
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { addRecentPage, getPageMetadata } from '@/lib/bookmarks';

// Pages to exclude from tracking
const EXCLUDED_PATHS = ['/', '/login', '/register', '/forgot-password'];

/**
 * Hook to automatically track navigation and update recent pages
 */
export function useNavigationTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || EXCLUDED_PATHS.includes(pathname)) {
      return;
    }

    // Add to recent pages
    const metadata = getPageMetadata(pathname);
    addRecentPage({
      title: metadata.title,
      href: pathname,
      icon: metadata.icon,
    });
  }, [pathname]);
}
