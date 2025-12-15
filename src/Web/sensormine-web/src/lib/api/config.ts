/**
 * API Configuration
 * 
 * Centralized configuration for API client
 * Supports microservices architecture with service-specific URLs
 */

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5134',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

/**
 * Service-specific base URLs - ALL DEFAULT TO API GATEWAY
 * The API Gateway (port 5134) routes requests to backend services
 * 
 * IMPORTANT: In production, all services go through the gateway (single entry point)
 * For local development debugging, you can override individual services via env vars:
 * - NEXT_PUBLIC_DEVICE_API_URL=http://localhost:5293 (bypass gateway for Device.API)
 * - NEXT_PUBLIC_ALERTS_API_URL=http://localhost:5295 (bypass gateway for Alerts.API)
 * 
 * By default, everything uses the gateway for centralized port management
 */
const gatewayUrl = apiConfig.baseUrl;

export const serviceUrls = {
  device: process.env.NEXT_PUBLIC_DEVICE_API_URL || gatewayUrl,
  schema: process.env.NEXT_PUBLIC_SCHEMA_API_URL || gatewayUrl,
  query: process.env.NEXT_PUBLIC_QUERY_API_URL || gatewayUrl,
  alerts: process.env.NEXT_PUBLIC_ALERTS_API_URL || gatewayUrl,
  preferences: process.env.NEXT_PUBLIC_PREFERENCES_API_URL || gatewayUrl,
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_API_URL || gatewayUrl,
  digitalTwin: process.env.NEXT_PUBLIC_DIGITAL_TWIN_API_URL || gatewayUrl,
  simulation: process.env.NEXT_PUBLIC_SIMULATION_API_URL || gatewayUrl,
  identity: process.env.NEXT_PUBLIC_IDENTITY_API_URL || gatewayUrl,
} as const;

export const endpoints = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
  },
  
  // Devices
  devices: {
    list: '/api/devices',
    get: (id: string) => `/api/devices/${id}`,
    create: '/api/devices',
    update: (id: string) => `/api/devices/${id}`,
    delete: (id: string) => `/api/devices/${id}`,
  },
  
  // Time-series data
  timeSeries: {
    query: '/api/query',
    latest: '/api/query/latest',
  },
  
  // Dashboards
  dashboards: {
    list: '/api/dashboards',
    get: (id: string) => `/api/dashboards/${id}`,
    create: '/api/dashboards',
    update: (id: string) => `/api/dashboards/${id}`,
    delete: (id: string) => `/api/dashboards/${id}`,
  },
  
  // Alerts
  alerts: {
    list: '/api/alerts',
    get: (id: string) => `/api/alerts/${id}`,
    create: '/api/alerts',
    update: (id: string) => `/api/alerts/${id}`,
    delete: (id: string) => `/api/alerts/${id}`,
  },
  
  // User Preferences
  userPreferences: {
    get: '/api/UserPreferences',
    upsert: '/api/UserPreferences',
    delete: '/api/UserPreferences',
  },
  
  // Site Configuration
  siteConfiguration: {
    get: '/api/SiteConfiguration',
    upsert: '/api/SiteConfiguration',
  },
} as const;
