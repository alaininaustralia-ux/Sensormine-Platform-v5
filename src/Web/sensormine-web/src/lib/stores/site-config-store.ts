/**
 * Site Configuration Store
 * 
 * Zustand store for managing global site configuration with LocalStorage persistence.
 * Site configuration is admin-managed and applies to all users. In production,
 * this would be fetched from a backend API and cached locally.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SiteConfiguration } from '../types/preferences';
import { DEFAULT_SITE_CONFIGURATION } from '../types/preferences';
import { siteConfigurationApi } from '../api/preferences';

interface SiteConfigState {
  // State
  config: SiteConfiguration | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastFetched: string | null;
  lastError: string | null;
  
  // Initialization
  initializeConfig: () => Promise<void>;
  loadConfigFromServer: () => Promise<void>;
  syncToServer: (updatedBy: string) => Promise<void>;
  
  // Site settings
  updateSiteSettings: (updates: Partial<SiteConfiguration['site']>) => void;
  setSiteName: (name: string) => void;
  setDefaultTheme: (theme: SiteConfiguration['site']['defaultTheme']) => void;
  
  // Feature flags
  updateFeatures: (updates: Partial<SiteConfiguration['features']>) => void;
  toggleFeature: (feature: keyof SiteConfiguration['features']) => void;
  isFeatureEnabled: (feature: keyof SiteConfiguration['features']) => boolean;
  
  // Limits
  updateLimits: (updates: Partial<SiteConfiguration['limits']>) => void;
  getLimit: (limit: keyof SiteConfiguration['limits']) => number;
  
  // Defaults
  updateDefaults: (updates: Partial<SiteConfiguration['defaults']>) => void;
  
  // Integrations
  updateIntegrations: (updates: Partial<SiteConfiguration['integrations']>) => void;
  toggleIntegration: (integration: keyof SiteConfiguration['integrations']) => void;
  isIntegrationEnabled: (integration: keyof SiteConfiguration['integrations']) => boolean;
  
  // Utility
  resetToDefaults: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useSiteConfigStore = create<SiteConfigState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      isLoading: false,
      isSyncing: false,
      lastFetched: null,
      lastError: null,
      
      // Initialize with defaults or load from server
      initializeConfig: async () => {
        const { config } = get();
        
        // If already initialized, try to refresh from server if cache is stale
        if (config) {
          await get().loadConfigFromServer();
          return;
        }
        
        // Load from server
        set({ isLoading: true, lastError: null });
        
        try {
          const serverConfig = await siteConfigurationApi.get();
          
          if (serverConfig) {
            set({ 
              config: serverConfig,
              lastFetched: new Date().toISOString(),
              isLoading: false,
            });
          } else {
            // Create default config
            const newConfig: SiteConfiguration = {
              ...DEFAULT_SITE_CONFIGURATION,
              updatedAt: new Date().toISOString(),
              updatedBy: 'system',
            };
            
            set({ 
              config: newConfig,
              lastFetched: new Date().toISOString(),
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to initialize site config:', error);
          
          // Fallback to defaults
          const newConfig: SiteConfiguration = {
            ...DEFAULT_SITE_CONFIGURATION,
            updatedAt: new Date().toISOString(),
            updatedBy: 'system',
          };
          
          set({ 
            config: newConfig,
            lastFetched: new Date().toISOString(),
            isLoading: false,
            lastError: error instanceof Error ? error.message : 'Failed to load config',
          });
        }
      },
      
      // Load config from server
      loadConfigFromServer: async () => {
        const { lastFetched } = get();
        
        // Check cache freshness
        if (lastFetched) {
          const age = Date.now() - new Date(lastFetched).getTime();
          if (age < CACHE_DURATION_MS) {
            return; // Cache still fresh
          }
        }
        
        set({ isLoading: true, lastError: null });
        
        try {
          const serverConfig = await siteConfigurationApi.get();
          
          if (serverConfig) {
            set({
              config: serverConfig,
              lastFetched: new Date().toISOString(),
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load site config:', error);
          set({ 
            isLoading: false,
            lastError: error instanceof Error ? error.message : 'Failed to load config',
          });
        }
      },
      
      // Sync config to server (admin only)
      syncToServer: async (updatedBy: string) => {
        const { config } = get();
        if (!config) return;
        
        set({ isSyncing: true, lastError: null });
        
        try {
          const saved = await siteConfigurationApi.upsert(config, updatedBy);
          set({ 
            config: saved,
            lastFetched: new Date().toISOString(),
            isSyncing: false,
          });
        } catch (error) {
          console.error('Failed to sync site config:', error);
          set({ 
            isSyncing: false,
            lastError: error instanceof Error ? error.message : 'Failed to sync config',
          });
        }
      },
      
      // Site settings
      updateSiteSettings: (updates) => {
        const { config } = get();
        if (!config) return;
        
        set({
          config: {
            ...config,
            site: { ...config.site, ...updates },
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      setSiteName: (name) => {
        get().updateSiteSettings({ name });
      },
      
      setDefaultTheme: (defaultTheme) => {
        get().updateSiteSettings({ defaultTheme });
      },
      
      // Feature flags
      updateFeatures: (updates) => {
        const { config } = get();
        if (!config) return;
        
        set({
          config: {
            ...config,
            features: { ...config.features, ...updates },
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      toggleFeature: (feature) => {
        const { config } = get();
        if (!config) return;
        
        get().updateFeatures({
          [feature]: !config.features[feature],
        });
      },
      
      isFeatureEnabled: (feature) => {
        const { config } = get();
        return config?.features[feature] ?? false;
      },
      
      // Limits
      updateLimits: (updates) => {
        const { config } = get();
        if (!config) return;
        
        set({
          config: {
            ...config,
            limits: { ...config.limits, ...updates },
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      getLimit: (limit) => {
        const { config } = get();
        return config?.limits[limit] ?? 0;
      },
      
      // Defaults
      updateDefaults: (updates) => {
        const { config } = get();
        if (!config) return;
        
        set({
          config: {
            ...config,
            defaults: { ...config.defaults, ...updates },
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      // Integrations
      updateIntegrations: (updates) => {
        const { config } = get();
        if (!config) return;
        
        set({
          config: {
            ...config,
            integrations: { ...config.integrations, ...updates },
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      toggleIntegration: (integration) => {
        const { config } = get();
        if (!config) return;
        
        get().updateIntegrations({
          [integration]: !config.integrations[integration],
        });
      },
      
      isIntegrationEnabled: (integration) => {
        const { config } = get();
        return config?.integrations[integration] ?? false;
      },
      
      // Utility
      resetToDefaults: () => {
        const newConfig: SiteConfiguration = {
          ...DEFAULT_SITE_CONFIGURATION,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system',
        };
        
        set({ 
          config: newConfig,
          lastFetched: new Date().toISOString(),
        });
      },
      
      exportConfig: () => {
        const { config } = get();
        return JSON.stringify(config, null, 2);
      },
      
      importConfig: (json: string) => {
        try {
          const imported = JSON.parse(json) as SiteConfiguration;
          
          // Validate basic structure
          if (!imported.site || !imported.features || !imported.limits) {
            return false;
          }
          
          set({
            config: {
              ...imported,
              updatedAt: new Date().toISOString(),
            },
            lastFetched: new Date().toISOString(),
          });
          
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'sensormine-site-config',
      version: 1,
    }
  )
);
