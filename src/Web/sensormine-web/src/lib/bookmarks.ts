/**
 * Bookmarks and Navigation History Service
 * 
 * Manages user bookmarks and recently visited pages using localStorage
 */

export interface BookmarkItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  addedAt: string;
}

export interface RecentPage {
  id: string;
  title: string;
  href: string;
  icon?: string;
  visitedAt: string;
}

const BOOKMARKS_KEY = 'sensormine_bookmarks';
const RECENT_PAGES_KEY = 'sensormine_recent_pages';
const MAX_RECENT_PAGES = 10;

/**
 * Get all bookmarks from localStorage
 */
export function getBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return [];
  }
}

/**
 * Add a bookmark
 */
export function addBookmark(bookmark: Omit<BookmarkItem, 'id' | 'addedAt'>): BookmarkItem {
  const bookmarks = getBookmarks();
  
  // Check if already bookmarked
  const existing = bookmarks.find(b => b.href === bookmark.href);
  if (existing) return existing;
  
  const newBookmark: BookmarkItem = {
    ...bookmark,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
  };
  
  bookmarks.push(newBookmark);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  
  return newBookmark;
}

/**
 * Remove a bookmark
 */
export function removeBookmark(href: string): void {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter(b => b.href !== href);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

/**
 * Check if a page is bookmarked
 */
export function isBookmarked(href: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.href === href);
}

/**
 * Toggle bookmark status
 */
export function toggleBookmark(bookmark: Omit<BookmarkItem, 'id' | 'addedAt'>): boolean {
  if (isBookmarked(bookmark.href)) {
    removeBookmark(bookmark.href);
    return false;
  } else {
    addBookmark(bookmark);
    return true;
  }
}

/**
 * Get recent pages from localStorage
 */
export function getRecentPages(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(RECENT_PAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading recent pages:', error);
    return [];
  }
}

/**
 * Add a page to recent history
 */
export function addRecentPage(page: Omit<RecentPage, 'id' | 'visitedAt'>): void {
  let recentPages = getRecentPages();
  
  // Remove if already in list
  recentPages = recentPages.filter(p => p.href !== page.href);
  
  // Add to beginning
  const newPage: RecentPage = {
    ...page,
    id: crypto.randomUUID(),
    visitedAt: new Date().toISOString(),
  };
  
  recentPages.unshift(newPage);
  
  // Keep only MAX_RECENT_PAGES
  if (recentPages.length > MAX_RECENT_PAGES) {
    recentPages = recentPages.slice(0, MAX_RECENT_PAGES);
  }
  
  localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(recentPages));
}

/**
 * Clear all recent pages
 */
export function clearRecentPages(): void {
  localStorage.removeItem(RECENT_PAGES_KEY);
}

/**
 * Get page metadata (title and icon) based on pathname
 */
export function getPageMetadata(pathname: string): { title: string; icon: string } {
  const pageMap: Record<string, { title: string; icon: string }> = {
    '/dashboard': { title: 'Dashboard', icon: 'LayoutDashboard' },
    '/devices': { title: 'Devices', icon: 'Cpu' },
    '/alerts': { title: 'Alerts', icon: 'Bell' },
    '/charts': { title: 'Charts', icon: 'LineChart' },
    '/settings/device-types': { title: 'Device Types', icon: 'Settings' },
    '/settings/schemas': { title: 'Schemas', icon: 'Settings' },
    '/settings/digital-twin': { title: 'Digital Twin', icon: 'Settings' },
    '/settings/alert-rules': { title: 'Alert Rules', icon: 'Settings' },
    '/settings/nexus-configuration': { title: 'Nexus Configuration', icon: 'Settings' },
    '/settings/users': { title: 'Users', icon: 'Settings' },
    '/settings': { title: 'Settings', icon: 'Settings' },
  };
  
  return pageMap[pathname] || { title: pathname, icon: 'File' };
}
