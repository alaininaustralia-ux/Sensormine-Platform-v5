/**
 * User Preferences and Site Configuration Types
 */

// Theme options
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

// Notification preferences
export interface NotificationPreferences {
  enableDesktop: boolean;
  enableSound: boolean;
  enableEmail: boolean;
  alertSeverities: ('critical' | 'warning' | 'info')[];
}

// Display preferences
export interface DisplayPreferences {
  theme: ThemeMode;
  themeColor: ThemeColor;
  compactMode: boolean;
  showGridLines: boolean;
  animationsEnabled: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

// Dashboard preferences
export interface DashboardPreferences {
  defaultDashboardId?: string;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  defaultTimeRange: '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
  showLegends: boolean;
  showGridLines: boolean;
}

// Data preferences
export interface DataPreferences {
  defaultPageSize: number;
  showRawData: boolean;
  decimalPlaces: number;
  useMetricUnits: boolean;
}

// User preferences (stored per user)
export interface UserPreferences {
  userId: string;
  display: DisplayPreferences;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  data: DataPreferences;
  favorites: {
    dashboards: string[];
    devices: string[];
    deviceTypes: string[];
  };
  recentlyViewed: {
    dashboards: string[];
    devices: string[];
    schemas: string[];
  };
  updatedAt: string;
}

// Site configuration (global settings, admin-managed)
export interface SiteConfiguration {
  site: {
    name: string;
    logo?: string;
    favicon?: string;
    defaultTheme: ThemeMode;
    allowThemeChange: boolean;
  };
  features: {
    enableDashboards: boolean;
    enableAlerts: boolean;
    enableVideoStreaming: boolean;
    enableSimulation: boolean;
    enableAIFeatures: boolean;
    enableExport: boolean;
  };
  limits: {
    maxDashboards: number;
    maxWidgetsPerDashboard: number;
    maxDevices: number;
    maxDataRetentionDays: number;
  };
  defaults: {
    refreshInterval: number;
    timeRange: string;
    timezone: string;
    language: string;
  };
  integrations: {
    enableMQTT: boolean;
    enableHTTP: boolean;
    enableWebSocket: boolean;
    enableModbus: boolean;
    enableOPCUA: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

// Default values
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'userId' | 'updatedAt'> = {
  display: {
    theme: 'system',
    themeColor: 'blue',
    compactMode: false,
    showGridLines: true,
    animationsEnabled: true,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
  },
  notifications: {
    enableDesktop: true,
    enableSound: true,
    enableEmail: false,
    alertSeverities: ['critical', 'warning'],
  },
  dashboard: {
    autoRefresh: true,
    refreshInterval: 30,
    defaultTimeRange: '1h',
    showLegends: true,
    showGridLines: true,
  },
  data: {
    defaultPageSize: 25,
    showRawData: false,
    decimalPlaces: 2,
    useMetricUnits: true,
  },
  favorites: {
    dashboards: [],
    devices: [],
    deviceTypes: [],
  },
  recentlyViewed: {
    dashboards: [],
    devices: [],
    schemas: [],
  },
};

export const DEFAULT_SITE_CONFIGURATION: Omit<SiteConfiguration, 'updatedAt' | 'updatedBy'> = {
  site: {
    name: 'Sensormine Platform',
    defaultTheme: 'system',
    allowThemeChange: true,
  },
  features: {
    enableDashboards: true,
    enableAlerts: true,
    enableVideoStreaming: true,
    enableSimulation: true,
    enableAIFeatures: true,
    enableExport: true,
  },
  limits: {
    maxDashboards: 50,
    maxWidgetsPerDashboard: 20,
    maxDevices: 1000,
    maxDataRetentionDays: 90,
  },
  defaults: {
    refreshInterval: 30,
    timeRange: '1h',
    timezone: 'UTC',
    language: 'en',
  },
  integrations: {
    enableMQTT: true,
    enableHTTP: true,
    enableWebSocket: true,
    enableModbus: true,
    enableOPCUA: true,
  },
};
