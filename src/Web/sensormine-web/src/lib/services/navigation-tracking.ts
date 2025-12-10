/**
 * Navigation Tracking Service
 * 
 * Tracks page visits, manages bookmarks, and provides navigation history
 */

import { userPreferencesApi } from '@/lib/api/preferences';
import type { BookmarkItem, PageVisit, UserPreferences } from '@/lib/types/preferences';

const MAX_HISTORY_ITEMS = 50;
const MAX_BOOKMARKS = 100;

// Page title mapping for common routes
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/devices': 'Devices',
  '/device-types': 'Device Types',
  '/analytics': 'Analytics',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
  '/settings/digital-twin': 'Digital Twin',
  '/settings/schemas': 'Schemas',
  '/settings/device-types': 'Device Types',
  '/settings/nexus-configuration': 'Nexus Configuration',
  '/settings/users': 'Users & Permissions',
  '/settings/security': 'Security',
  '/settings/notifications': 'Notifications',
  '/settings/appearance': 'Appearance',
  '/settings/preferences': 'Preferences',
  '/admin': 'Administration',
  '/profile': 'User Profile',
};

// Icon mapping for routes
const PAGE_ICONS: Record<string, string> = {
  '/dashboard': 'LayoutDashboard',
  '/devices': 'Cpu',
  '/device-types': 'Box',
  '/analytics': 'BarChart3',
  '/alerts': 'Bell',
  '/settings': 'Settings',
  '/settings/digital-twin': 'Network',
  '/settings/schemas': 'Database',
  '/settings/device-types': 'Cpu',
  '/settings/nexus-configuration': 'Settings2',
};

/**
 * Get page title from path
 */
export function getPageTitle(path: string): string {
  // Check exact match first
  if (PAGE_TITLES[path]) {
    return PAGE_TITLES[path];
  }
  
  // Try to infer from path segments
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return 'Page';
}

/**
 * Get page icon from path
 */
export function getPageIcon(path: string): string | undefined {
  // Check for exact match
  if (PAGE_ICONS[path]) {
    return PAGE_ICONS[path];
  }
  
  // Check for prefix match (for nested routes)
  const prefixMatch = Object.keys(PAGE_ICONS).find(key => path.startsWith(key));
  return prefixMatch ? PAGE_ICONS[prefixMatch] : undefined;
}

/**
 * Track page visit
 */
export async function trackPageVisit(
  userId: string,
  path: string,
  tenantId?: string,
  duration?: number
): Promise<void> {
  try {
    // Get current preferences
    const preferences = await userPreferencesApi.get(userId, tenantId);
    if (!preferences) {
      console.warn('No preferences found for user, skipping page visit tracking');
      return;
    }

    const title = getPageTitle(path);
    const visit: PageVisit = {
      path,
      title,
      visitedAt: new Date().toISOString(),
      duration,
    };

    // Remove duplicate entries (same path)
    const filteredHistory = preferences.pageHistory.filter(v => v.path !== path);
    
    // Add new visit at the beginning
    const updatedHistory = [visit, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    // Update preferences
    await userPreferencesApi.upsert({
      ...preferences,
      pageHistory: updatedHistory,
    }, tenantId);
  } catch (error) {
    console.error('Error tracking page visit:', error);
  }
}

/**
 * Add bookmark
 */
export async function addBookmark(
  userId: string,
  path: string,
  title?: string,
  category?: string,
  tenantId?: string
): Promise<BookmarkItem | null> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    if (!preferences) {
      throw new Error('No preferences found for user');
    }

    // Check if already bookmarked
    if (preferences.bookmarks.some(b => b.path === path)) {
      throw new Error('Page is already bookmarked');
    }

    // Check bookmark limit
    if (preferences.bookmarks.length >= MAX_BOOKMARKS) {
      throw new Error(`Maximum of ${MAX_BOOKMARKS} bookmarks reached`);
    }

    const bookmark: BookmarkItem = {
      id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || getPageTitle(path),
      path,
      icon: getPageIcon(path),
      category,
      createdAt: new Date().toISOString(),
    };

    const updatedBookmarks = [...preferences.bookmarks, bookmark];

    await userPreferencesApi.upsert({
      ...preferences,
      bookmarks: updatedBookmarks,
    }, tenantId);

    return bookmark;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return null;
  }
}

/**
 * Remove bookmark
 */
export async function removeBookmark(
  userId: string,
  bookmarkId: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    if (!preferences) {
      return false;
    }

    const updatedBookmarks = preferences.bookmarks.filter(b => b.id !== bookmarkId);

    await userPreferencesApi.upsert({
      ...preferences,
      bookmarks: updatedBookmarks,
    }, tenantId);

    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
}

/**
 * Get bookmarks
 */
export async function getBookmarks(
  userId: string,
  tenantId?: string
): Promise<BookmarkItem[]> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    return preferences?.bookmarks || [];
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
}

/**
 * Get page history
 */
export async function getPageHistory(
  userId: string,
  tenantId?: string,
  limit?: number
): Promise<PageVisit[]> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    const history = preferences?.pageHistory || [];
    return limit ? history.slice(0, limit) : history;
  } catch (error) {
    console.error('Error getting page history:', error);
    return [];
  }
}

/**
 * Check if page is bookmarked
 */
export async function isBookmarked(
  userId: string,
  path: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    return preferences?.bookmarks.some(b => b.path === path) || false;
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

/**
 * Update bookmark
 */
export async function updateBookmark(
  userId: string,
  bookmarkId: string,
  updates: Partial<Omit<BookmarkItem, 'id' | 'createdAt'>>,
  tenantId?: string
): Promise<boolean> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    if (!preferences) {
      return false;
    }

    const updatedBookmarks = preferences.bookmarks.map(b =>
      b.id === bookmarkId ? { ...b, ...updates } : b
    );

    await userPreferencesApi.upsert({
      ...preferences,
      bookmarks: updatedBookmarks,
    }, tenantId);

    return true;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return false;
  }
}

/**
 * Clear page history
 */
export async function clearPageHistory(
  userId: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const preferences = await userPreferencesApi.get(userId, tenantId);
    if (!preferences) {
      return false;
    }

    await userPreferencesApi.upsert({
      ...preferences,
      pageHistory: [],
    }, tenantId);

    return true;
  } catch (error) {
    console.error('Error clearing page history:', error);
    return false;
  }
}
