/**
 * Header Component
 * 
 * Top bar with user menu - works with sidebar navigation
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { Bell, Search } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#0066CC] to-[#00AAFF]">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-[#0066CC] to-[#00AAFF] bg-clip-text text-transparent">
              SensorMine
            </span>
          </Link>
          <Link href="/login">
            <Button className="bg-linear-to-r from-[#0066CC] to-[#0088FF] hover:from-[#0055BB] hover:to-[#0077EE]">
              Log in
            </Button>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">
        {/* Left side - Page title will go here, managed by pages */}
        <div className="flex-1">
          {/* Spacer */}
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <Button variant="ghost" size="icon" className="relative">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-linear-to-br from-[#0066CC] to-[#00AAFF] text-white">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
