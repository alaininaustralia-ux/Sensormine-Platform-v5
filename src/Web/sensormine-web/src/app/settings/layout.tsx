/**
 * Settings Layout
 * 
 * Layout for settings pages with breadcrumb navigation
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Sensormine',
  description: 'Manage platform settings and configuration',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Settings</span>
      </div>
      {children}
    </div>
  );
}
