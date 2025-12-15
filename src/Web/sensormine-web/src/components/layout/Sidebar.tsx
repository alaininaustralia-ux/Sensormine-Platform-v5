/**
 * Sidebar Component
 * 
 * Left navigation sidebar matching Sensormine.io branding
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cpu, 
  Bell, 
  LineChart, 
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bookmark,
  File,
  Sparkles,
  MapPin,
  Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getBookmarks, type BookmarkItem } from '@/lib/bookmarks';
import { CircuitAnimation } from './CircuitAnimation';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import type { CustomNavigationItem } from '@/lib/types/preferences';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navigation = [
  { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Cpu },
  { name: 'Map', href: '/map', icon: MapPin },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'AI Agent', href: '/ai-agent', icon: Sparkles },
];

const settingsNavigation = [
  { name: 'Navigation', href: '/settings/navigation' },
  { name: 'Device Types', href: '/settings/device-types' },
  { name: 'Schemas', href: '/settings/schemas' },
  { name: 'Digital Twin', href: '/settings/digital-twin' },
  { name: 'Video Analytics', href: '/settings/video-analytics' },
  { name: 'Alert Rules', href: '/settings/alert-rules' },
  { name: 'Solution Kits', href: '/settings/solution-kits' },
  { name: 'Nexus Configuration', href: '/settings/nexus-configuration' },
  { name: 'Users', href: '/settings/users' },
];

// Icon mapping for bookmarks
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Cpu,
  Bell,
  LineChart,
  Settings,
  File,
  Sparkles,
  Package,
};

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(
    pathname?.startsWith('/settings') ?? false
  );
  const [bookmarksExpanded, setBookmarksExpanded] = useState(true);
  const [customNavExpanded, setCustomNavExpanded] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Get custom navigation items from preferences store
  const getCustomNavItems = usePreferencesStore((state) => state.getCustomNavItems);
  const customNavItems = isClient ? getCustomNavItems() : [];
  
  // Notify parent of collapsed state changes
  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);
  
  // Mark as client-side after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Load bookmarks on client side only to avoid hydration mismatch
  useEffect(() => {
    // Intentionally syncing with external localStorage - this is correct usage
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(getBookmarks());
  }, [pathname]); // Refresh bookmarks when navigation changes
  
  // Helper function to generate URL from custom nav item
  const getNavItemUrl = (item: CustomNavigationItem): string => {
    if (item.url) return item.url;
    switch (item.targetType) {
      case 'dashboard':
        return item.targetId ? `/dashboards/${item.targetId}` : '/dashboards';
      case 'device':
        return item.targetId ? `/devices/${item.targetId}` : '/devices';
      case 'asset':
        return item.targetId ? `/assets/${item.targetId}` : '/assets';
      case 'form':
        return item.targetId ? `/forms/${item.targetId}` : '/forms';
      default:
        return '/';
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-linear-to-br from-[#0066CC] to-[#004C99] p-2 text-white shadow-lg"
      >
        {collapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-linear-to-b from-[#001F3F] via-[#002F5F] to-[#003F7F] text-white transition-transform overflow-hidden',
          collapsed && 'lg:w-20',
          'max-lg:translate-x-0',
          collapsed && 'max-lg:-translate-x-full'
        )}
      >
        {/* Circuit Animation Background */}
        <CircuitAnimation />
        
        <div className="flex h-full flex-col relative z-10">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-white/10 px-6">
            <Link href="/" className="flex items-center space-x-2">
              {!collapsed ? (
                <Image 
                  src="/Big Logo.png" 
                  alt="SensorMine" 
                  width={200}
                  height={40}
                  className="h-auto w-full max-h-10 object-contain"
                  priority
                />
              ) : (
                <Image 
                  src="/small logo.png" 
                  alt="SensorMine" 
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-linear-to-r from-[#0066CC] to-[#0088FF] text-white shadow-lg shadow-blue-500/50'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', !collapsed && 'mr-3')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
            {/* Custom Navigation Items (at top, no section header) */}
            {!collapsed && customNavItems.length > 0 && (
              <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
                {customNavItems.map((item) => {
                  const itemUrl = getNavItemUrl(item);
                  const isActive = pathname === itemUrl;
                  const Icon = item.icon ? iconMap[item.icon] || File : File;
                  
                  return (
                    <Link
                      key={item.id}
                      href={itemUrl}
                      className={cn(
                        'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-linear-to-r from-[#0066CC] to-[#0088FF] text-white shadow-lg shadow-blue-500/50'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0 mr-3" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            {/* Settings Section with Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={cn(
                  'group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  pathname?.startsWith('/settings')
                    ? 'bg-linear-to-r from-[#0066CC] to-[#0088FF] text-white shadow-lg shadow-blue-500/50'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center'
                )}
              >
                <Settings className={cn('h-5 w-5 shrink-0', !collapsed && 'mr-3')} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Settings</span>
                    {settingsExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </>
                )}
              </button>

              {/* Settings Submenu */}
              {!collapsed && settingsExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-white/10 pl-2">
                  {settingsNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm transition-all',
                          isActive
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-blue-100 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>



            {/* Bookmarks Section */}
            {!collapsed && bookmarks.length > 0 && (
              <div className="mt-6 space-y-1 border-t border-white/10 pt-4">
                <button
                  onClick={() => setBookmarksExpanded(!bookmarksExpanded)}
                  className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition-all hover:bg-white/10 hover:text-white"
                >
                  <Bookmark className="h-5 w-5 shrink-0 mr-3" />
                  <span className="flex-1 text-left">Bookmarks</span>
                  {bookmarksExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Bookmarks List */}
                {bookmarksExpanded && (
                  <div className="ml-4 space-y-1 border-l-2 border-white/10 pl-2">
                    {bookmarks.map((bookmark) => {
                      const isActive = pathname === bookmark.href;
                      const Icon = bookmark.icon ? iconMap[bookmark.icon] || File : File;
                      
                      return (
                        <Link
                          key={bookmark.id}
                          href={bookmark.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                            isActive
                              ? 'bg-white/10 text-white font-medium'
                              : 'text-blue-100 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{bookmark.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Collapse button (desktop only) */}
          <div className="hidden border-t border-white/10 p-3 lg:block">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
