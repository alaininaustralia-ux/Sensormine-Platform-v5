/**
 * Navigation Settings Page
 * 
 * Allows users to customize their sidebar navigation by adding custom links
 * to dashboards, devices, assets, and external URLs.
 */

'use client';

import { CustomNavigationManager } from '@/components/settings/CustomNavigationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function NavigationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Navigation Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your sidebar navigation with quick links to frequently accessed pages.
        </p>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <CardTitle className="text-blue-900 dark:text-blue-100">About Custom Navigation</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Custom navigation links appear in the sidebar under "Quick Links". They provide fast access to your
                most frequently used pages without navigating through menus.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>All default navigation items (Dashboards, Devices, Alerts, AI Agent, Settings) remain unchanged</li>
            <li>Custom links support dashboards, devices, assets, and external URLs</li>
            <li>Drag and drop to reorder your custom links</li>
            <li>Changes sync automatically to your user preferences</li>
            <li>Your custom navigation is unique to you and won't affect other users</li>
          </ul>
        </CardContent>
      </Card>

      <CustomNavigationManager />
    </div>
  );
}
