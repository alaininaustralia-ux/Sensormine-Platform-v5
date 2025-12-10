/**
 * BookmarkButton Component
 * 
 * Toggle button for bookmarking the current page
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { isBookmarked, toggleBookmark, getPageMetadata } from '@/lib/bookmarks';
import { cn } from '@/lib/utils';

export function BookmarkButton() {
  const pathname = usePathname();
  const [, setRefreshKey] = useState(0);
  
  // Compute bookmarked state (refreshKey forces re-render on toggle)
  const bookmarked = pathname ? isBookmarked(pathname) : false;
  
  const handleToggle = () => {
    if (!pathname) return;
    
    const metadata = getPageMetadata(pathname);
    toggleBookmark({
      title: metadata.title,
      href: pathname,
      icon: metadata.icon,
    });
    
    // Force re-render to update bookmark state
    setRefreshKey(prev => prev + 1);
  };
  
  // Don't show on home page or login pages
  if (!pathname || pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative"
      onClick={handleToggle}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark 
        className={cn(
          'h-5 w-5 transition-colors',
          bookmarked && 'fill-yellow-500 text-yellow-500'
        )} 
      />
    </Button>
  );
}
