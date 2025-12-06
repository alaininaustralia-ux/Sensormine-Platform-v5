/**
 * Preferences Provider
 * 
 * Initializes user preferences and site configuration on mount
 * Loads preferences from backend API and syncs changes
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { useSiteConfigStore } from '@/lib/stores/site-config-store';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const initializePreferences = usePreferencesStore((state) => state.initializePreferences);
  const initializeConfig = useSiteConfigStore((state) => state.initializeConfig);

  useEffect(() => {
    // Initialize site configuration (once on app load)
    initializeConfig();
  }, [initializeConfig]);

  useEffect(() => {
    // Initialize user preferences when authenticated
    if (isAuthenticated && user?.id) {
      initializePreferences(user.id);
    }
  }, [isAuthenticated, user?.id, initializePreferences]);

  return <>{children}</>;
}
