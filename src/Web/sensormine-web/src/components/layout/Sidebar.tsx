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
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Cpu },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Charts', href: '/charts', icon: LineChart },
];

const settingsNavigation = [
  { name: 'Device Types', href: '/settings/device-types' },
  { name: 'Schemas', href: '/settings/schemas' },
  { name: 'Users', href: '/settings/users' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(
    pathname?.startsWith('/settings') ?? false
  );

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
          'fixed left-0 top-0 z-40 h-screen w-64 bg-linear-to-b from-[#001F3F] via-[#002F5F] to-[#003F7F] text-white transition-transform',
          collapsed && 'lg:w-20',
          'max-lg:translate-x-0',
          collapsed && 'max-lg:-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#0066CC] to-[#00AAFF] shadow-lg">
                  <span className="text-xl font-bold">S</span>
                </div>
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
