/**
 * API Configuration
 * 
 * Centralized configuration for API client
 * Supports microservices architecture with service-specific URLs
 */

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

/**
 * Service-specific base URLs for microservices architecture
 * Each service can have its own URL in local development
 */
export const serviceUrls = {
  device: process.env.NEXT_PUBLIC_DEVICE_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5293',
  schema: process.env.NEXT_PUBLIC_SCHEMA_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5021',
  query: process.env.NEXT_PUBLIC_QUERY_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5297',
  alerts: process.env.NEXT_PUBLIC_ALERTS_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5295',
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
} as const;
