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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your platform configuration and preferences
        </p>
      </div>
      {children}
    </div>
  );
}
