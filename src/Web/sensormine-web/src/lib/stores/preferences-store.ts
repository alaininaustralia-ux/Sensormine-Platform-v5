/**
 * User Preferences Store
 * 
 * Zustand store for managing user preferences with LocalStorage persistence.
 * Preferences are stored per-user and include display, notification, dashboard,
 * and data preferences, as well as favorites and recently viewed items.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserPreferences,
  DisplayPreferences,
  NotificationPreferences,
  DashboardPreferences,
  DataPreferences,
} from '../types/preferences';
import { DEFAULT_USER_PREFERENCES } from '../types/preferences';
import { userPreferencesApi } from '../api/preferences';

interface PreferencesState {
  // State
  preferences: UserPreferences | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastError: string | null;
  
  // Initialization
  initializePreferences: (userId: string) => Promise<void>;
  loadFromServer: (userId: string) => Promise<void>;
  syncToServer: () => Promise<void>;
  
  // Display preferences
  updateDisplayPreferences: (updates: Partial<DisplayPreferences>) => void;
  setTheme: (theme: DisplayPreferences['theme']) => void;
  setThemeColor: (color: DisplayPreferences['themeColor']) => void;
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  
  // Notification preferences
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  toggleDesktopNotifications: () => void;
  toggleSoundNotifications: () => void;
  
  // Dashboard preferences
  updateDashboardPreferences: (updates: Partial<DashboardPreferences>) => void;
  setDefaultDashboard: (dashboardId: string | undefined) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Data preferences
  updateDataPreferences: (updates: Partial<DataPreferences>) => void;
  setDefaultPageSize: (size: number) => void;
  
  // Favorites
  addFavoriteDashboard: (dashboardId: string) => void;
  removeFavoriteDashboard: (dashboardId: string) => void;
  addFavoriteDevice: (deviceId: string) => void;
  removeFavoriteDevice: (deviceId: string) => void;
  addFavoriteDeviceType: (deviceTypeId: string) => void;
  removeFavoriteDeviceType: (deviceTypeId: string) => void;
  isFavoriteDashboard: (dashboardId: string) => boolean;
  isFavoriteDevice: (deviceId: string) => boolean;
  isFavoriteDeviceType: (deviceTypeId: string) => boolean;
  
  // Recently viewed
  addRecentlyViewedDashboard: (dashboardId: string) => void;
  addRecentlyViewedDevice: (deviceId: string) => void;
  addRecentlyViewedSchema: (schemaId: string) => void;
  clearRecentlyViewed: () => void;
  
  // Utility
  resetToDefaults: () => void;
  exportPreferences: () => string;
  importPreferences: (json: string) => boolean;
}

const MAX_RECENT_ITEMS = 10;

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: null,
      isLoading: false,
      isSyncing: false,
      lastError: null,
      
      // Initialize preferences for a user
      initializePreferences: async (userId: string) => {
        const existing = get().preferences;
        
        // If already initialized for this user, try to load from server
        if (existing && existing.userId === userId) {
          await get().loadFromServer(userId);
          return;
        }
        
        // Load from server
        set({ isLoading: true, lastError: null });
        
        try {
          const serverPreferences = await userPreferencesApi.get(userId);
          
          if (serverPreferences) {
            set({ preferences: serverPreferences, isLoading: false });
          } else {
            // Create new preferences
            const newPreferences: UserPreferences = {
              userId,
              ...DEFAULT_USER_PREFERENCES,
              updatedAt: new Date().toISOString(),
            };
            
            // Save to server
            const saved = await userPreferencesApi.upsert(newPreferences);
            set({ preferences: saved, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to initialize preferences:', error);
          
          // Fallback to local defaults
          const newPreferences: UserPreferences = {
            userId,
            ...DEFAULT_USER_PREFERENCES,
            updatedAt: new Date().toISOString(),
          };
          
          set({ 
            preferences: newPreferences, 
            isLoading: false,
            lastError: error instanceof Error ? error.message : 'Failed to load preferences'
          });
        }
      },
      
      // Load preferences from server
      loadFromServer: async (userId: string) => {
        set({ isLoading: true, lastError: null });
        
        try {
          const serverPreferences = await userPreferencesApi.get(userId);
          
          if (serverPreferences) {
            set({ preferences: serverPreferences, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load preferences from server:', error);
          set({ 
            isLoading: false,
            lastError: error instanceof Error ? error.message : 'Failed to load preferences'
          });
        }
      },
      
      // Sync preferences to server
      syncToServer: async () => {
        const { preferences } = get();
        if (!preferences) return;
        
        set({ isSyncing: true, lastError: null });
        
        try {
          const saved = await userPreferencesApi.upsert(preferences);
          set({ preferences: saved, isSyncing: false });
        } catch (error) {
          console.error('Failed to sync preferences to server:', error);
          set({ 
            isSyncing: false,
            lastError: error instanceof Error ? error.message : 'Failed to sync preferences'
          });
        }
      },
      
      // Display preferences
      updateDisplayPreferences: (updates) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          display: { ...preferences.display, ...updates },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        
        // Sync to server asynchronously (fire and forget)
        userPreferencesApi.upsert(updated).catch(error => {
          console.error('Failed to sync display preferences:', error);
          set({ lastError: error instanceof Error ? error.message : 'Sync failed' });
        });
      },
      
      setTheme: (theme) => {
        get().updateDisplayPreferences({ theme });
      },
      
      setThemeColor: (themeColor) => {
        get().updateDisplayPreferences({ themeColor });
      },
      
      setLanguage: (language) => {
        get().updateDisplayPreferences({ language });
      },
      
      setTimezone: (timezone) => {
        get().updateDisplayPreferences({ timezone });
      },
      
      // Notification preferences
      updateNotificationPreferences: (updates) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          notifications: { ...preferences.notifications, ...updates },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        
        userPreferencesApi.upsert(updated).catch(error => {
          console.error('Failed to sync notification preferences:', error);
          set({ lastError: error instanceof Error ? error.message : 'Sync failed' });
        });
      },
      
      toggleDesktopNotifications: () => {
        const { preferences } = get();
        if (!preferences) return;
        
        get().updateNotificationPreferences({
          enableDesktop: !preferences.notifications.enableDesktop,
        });
      },
      
      toggleSoundNotifications: () => {
        const { preferences } = get();
        if (!preferences) return;
        
        get().updateNotificationPreferences({
          enableSound: !preferences.notifications.enableSound,
        });
      },
      
      // Dashboard preferences
      updateDashboardPreferences: (updates) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          dashboard: { ...preferences.dashboard, ...updates },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        
        userPreferencesApi.upsert(updated).catch(error => {
          console.error('Failed to sync dashboard preferences:', error);
          set({ lastError: error instanceof Error ? error.message : 'Sync failed' });
        });
      },
      
      setDefaultDashboard: (dashboardId) => {
        get().updateDashboardPreferences({ defaultDashboardId: dashboardId });
      },
      
      setAutoRefresh: (enabled) => {
        get().updateDashboardPreferences({ autoRefresh: enabled });
      },
      
      setRefreshInterval: (interval) => {
        get().updateDashboardPreferences({ refreshInterval: interval });
      },
      
      // Data preferences
      updateDataPreferences: (updates) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          data: { ...preferences.data, ...updates },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        
        userPreferencesApi.upsert(updated).catch(error => {
          console.error('Failed to sync data preferences:', error);
          set({ lastError: error instanceof Error ? error.message : 'Sync failed' });
        });
      },
      
      setDefaultPageSize: (size) => {
        get().updateDataPreferences({ defaultPageSize: size });
      },
      
      // Favorites
      addFavoriteDashboard: (dashboardId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const favorites = new Set(preferences.favorites.dashboards);
        favorites.add(dashboardId);
        
        const updated = {
          ...preferences,
          favorites: {
            ...preferences.favorites,
            dashboards: Array.from(favorites),
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      removeFavoriteDashboard: (dashboardId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          favorites: {
            ...preferences.favorites,
            dashboards: preferences.favorites.dashboards.filter(id => id !== dashboardId),
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      addFavoriteDevice: (deviceId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const favorites = new Set(preferences.favorites.devices);
        favorites.add(deviceId);
        
        const updated = {
          ...preferences,
          favorites: {
            ...preferences.favorites,
            devices: Array.from(favorites),
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      removeFavoriteDevice: (deviceId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          favorites: {
            ...preferences.favorites,
            devices: preferences.favorites.devices.filter(id => id !== deviceId),
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      addFavoriteDeviceType: (deviceTypeId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const favorites = new Set(preferences.favorites.deviceTypes);
        favorites.add(deviceTypeId);
        
        const updated = {
          ...preferences,
          favorites: {
            ...preferences.favorites,
            deviceTypes: Array.from(favorites),
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      removeFavoriteDeviceType: (deviceTypeId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          favorites: {
            ...preferences.favorites,
            deviceTypes: preferences.favorites.deviceTypes.filter(id => id !== deviceTypeId),
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      isFavoriteDashboard: (dashboardId) => {
        const { preferences } = get();
        return preferences?.favorites.dashboards.includes(dashboardId) ?? false;
      },
      
      isFavoriteDevice: (deviceId) => {
        const { preferences } = get();
        return preferences?.favorites.devices.includes(deviceId) ?? false;
      },
      
      isFavoriteDeviceType: (deviceTypeId) => {
        const { preferences } = get();
        return preferences?.favorites.deviceTypes.includes(deviceTypeId) ?? false;
      },
      
      // Recently viewed
      addRecentlyViewedDashboard: (dashboardId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const recent = [
          dashboardId,
          ...preferences.recentlyViewed.dashboards.filter(id => id !== dashboardId),
        ].slice(0, MAX_RECENT_ITEMS);
        
        const updated = {
          ...preferences,
          recentlyViewed: {
            ...preferences.recentlyViewed,
            dashboards: recent,
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      addRecentlyViewedDevice: (deviceId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const recent = [
          deviceId,
          ...preferences.recentlyViewed.devices.filter(id => id !== deviceId),
        ].slice(0, MAX_RECENT_ITEMS);
        
        const updated = {
          ...preferences,
          recentlyViewed: {
            ...preferences.recentlyViewed,
            devices: recent,
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      addRecentlyViewedSchema: (schemaId) => {
        const { preferences } = get();
        if (!preferences) return;
        
        const recent = [
          schemaId,
          ...preferences.recentlyViewed.schemas.filter(id => id !== schemaId),
        ].slice(0, MAX_RECENT_ITEMS);
        
        const updated = {
          ...preferences,
          recentlyViewed: {
            ...preferences.recentlyViewed,
            schemas: recent,
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      clearRecentlyViewed: () => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          ...preferences,
          recentlyViewed: {
            dashboards: [],
            devices: [],
            schemas: [],
          },
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      // Utility
      resetToDefaults: () => {
        const { preferences } = get();
        if (!preferences) return;
        
        const updated = {
          userId: preferences.userId,
          ...DEFAULT_USER_PREFERENCES,
          updatedAt: new Date().toISOString(),
        };
        
        set({ preferences: updated });
        userPreferencesApi.upsert(updated).catch(error => console.error('Sync failed:', error));
      },
      
      exportPreferences: () => {
        const { preferences } = get();
        return JSON.stringify(preferences, null, 2);
      },
      
      importPreferences: (json: string) => {
        try {
          const imported = JSON.parse(json) as UserPreferences;
          
          // Validate basic structure
          if (!imported.userId || !imported.display || !imported.notifications) {
            return false;
          }
          
          set({
            preferences: {
              ...imported,
              updatedAt: new Date().toISOString(),
            },
          });
          
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'sensormine-preferences',
      version: 1,
    }
  )
);
