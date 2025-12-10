/**
 * AppLayout Component
 * 
 * Main layout wrapper that handles sidebar and header positioning
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '@/lib/auth';
import { HelpPanel } from '@/components/help/HelpPanel';
import { useNavigationTracking } from '@/hooks/useNavigationTracking';

// Pages that don't use the sidebar layout (only when not authenticated)
const PUBLIC_PAGES = ['/login', '/register', '/forgot-password'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isPublicPage = PUBLIC_PAGES.includes(pathname || '');
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Track navigation for authenticated users
  useNavigationTracking();

  // Public pages when not authenticated - full width, no sidebar
  if (!isAuthenticated && (isPublicPage || pathname === '/')) {
    return (
      <>
        <div className="flex min-h-screen flex-col">
          <Header onHelpClick={() => setHelpOpen(true)} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
      </>
    );
  }

  // Authenticated pages - sidebar layout
  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col lg:pl-64">
          <Header onHelpClick={() => setHelpOpen(true)} />
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
