/**
 * Preferences API Client
 * 
 * Client for interacting with the Preferences API microservice
 * Handles user preferences and site configuration
 */

import { serviceUrls, endpoints } from './config';
import { getCurrentTenantId } from './index';
import type { UserPreferences, SiteConfiguration } from '../types/preferences';

const PREFERENCES_API_BASE = serviceUrls.preferences;

/**
 * User Preferences API
 */
export const userPreferencesApi = {
  /**
   * Get user preferences
   */
  async get(userId: string, tenantId?: string): Promise<UserPreferences | null> {
    const effectiveTenantId = tenantId || getCurrentTenantId();
    try {
      const response = await fetch(`${PREFERENCES_API_BASE}${endpoints.userPreferences.get}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': effectiveTenantId,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user preferences: ${response.statusText}`);
      }

      const data = await response.json();
      return data as UserPreferences;
    } catch (error) {
      console.warn('Failed to fetch user preferences (service may not be available):', error);
      return null;
    }
  },

  /**
   * Create or update user preferences
   */
  async upsert(preferences: UserPreferences, tenantId?: string): Promise<UserPreferences> {
    const effectiveTenantId = tenantId || getCurrentTenantId();
    try {
      const response = await fetch(`${PREFERENCES_API_BASE}${endpoints.userPreferences.upsert}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': preferences.userId || 'demo-user',
          'X-Tenant-Id': effectiveTenantId,
        },
        body: JSON.stringify({
          userId: preferences.userId || 'demo-user',
          display: preferences.display,
          notifications: preferences.notifications,
          dashboard: preferences.dashboard,
          data: preferences.data,
          favorites: preferences.favorites,
          recentlyViewed: preferences.recentlyViewed,
          bookmarks: preferences.bookmarks || [],
          pageHistory: preferences.pageHistory || [],
          customNavigation: preferences.customNavigation || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save user preferences: ${response.statusText}`);
      }

      const data = await response.json();
      return data as UserPreferences;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  },

  /**
   * Delete user preferences
   */
  async delete(userId: string, tenantId?: string): Promise<void> {
    const effectiveTenantId = tenantId || getCurrentTenantId();
    try {
      const response = await fetch(`${PREFERENCES_API_BASE}${endpoints.userPreferences.delete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': effectiveTenantId,
        },
      });

      if (response.status === 404) {
        // Already deleted or doesn't exist
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to delete user preferences: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting user preferences:', error);
      throw error;
    }
  },
};

/**
 * Site Configuration API
 */
export const siteConfigurationApi = {
  /**
   * Get site configuration
   */
  async get(tenantId?: string): Promise<SiteConfiguration | null> {
    const effectiveTenantId = tenantId || getCurrentTenantId();
    try {
      const response = await fetch(`${PREFERENCES_API_BASE}${endpoints.siteConfiguration.get}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': effectiveTenantId,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch site configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data as SiteConfiguration;
    } catch (error) {
      console.warn('Failed to fetch site configuration (service may not be available):', error);
      return null;
    }
  },

  /**
   * Create or update site configuration
   */
  async upsert(config: SiteConfiguration, updatedBy: string, tenantId?: string): Promise<SiteConfiguration> {
    const effectiveTenantId = tenantId || getCurrentTenantId();
    try {
      const response = await fetch(`${PREFERENCES_API_BASE}${endpoints.siteConfiguration.upsert}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': updatedBy,
          'X-Tenant-Id': effectiveTenantId,
        },
        body: JSON.stringify({
          site: config.site,
          features: config.features,
          limits: config.limits,
          defaults: config.defaults,
          integrations: config.integrations,
          updatedBy,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save site configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data as SiteConfiguration;
    } catch (error) {
      console.error('Error saving site configuration:', error);
      throw error;
    }
  },
};
