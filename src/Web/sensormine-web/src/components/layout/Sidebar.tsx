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
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Cpu },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Charts', href: '/charts', icon: LineChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          <nav className="flex-1 space-y-1 px-3 py-4">
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
                      ? 'bg-gradient-to-r from-[#0066CC] to-[#0088FF] text-white shadow-lg shadow-blue-500/50'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', !collapsed && 'mr-3')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
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
