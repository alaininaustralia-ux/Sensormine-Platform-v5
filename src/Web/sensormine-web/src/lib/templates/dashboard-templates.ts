/**
 * Dashboard Templates
 * 
 * Pre-built dashboard templates for common use cases.
 */

import type { DashboardTemplate } from '../types/dashboard';

/**
 * Operations Dashboard Template
 * For monitoring overall system operations
 */
export const operationsTemplate: DashboardTemplate = {
  id: 'template-operations',
  name: 'Operations Dashboard',
  description: 'Monitor system health, device status, and key performance metrics',
  category: 'operations',
  icon: 'Activity',
  widgets: [
    {
      type: 'kpi',
      title: 'Total Devices',
      description: 'Active devices in system',
      config: {},
    },
    {
      type: 'kpi',
      title: 'Active Alerts',
      description: 'Current system alerts',
      config: {},
    },
    {
      type: 'gauge',
      title: 'System Health',
      description: 'Overall system status',
      config: {},
    },
    {
      type: 'table',
      title: 'Device Status',
      description: 'Real-time device information',
      config: {},
    },
  ],
  layout: [
    { x: 0, y: 0, w: 3, h: 2 },
    { x: 3, y: 0, w: 3, h: 2 },
    { x: 6, y: 0, w: 3, h: 2 },
    { x: 0, y: 2, w: 12, h: 4 },
  ],
};

/**
 * Maintenance Dashboard Template
 * For tracking device maintenance and diagnostics
 */
export const maintenanceTemplate: DashboardTemplate = {
  id: 'template-maintenance',
  name: 'Maintenance Dashboard',
  description: 'Track device diagnostics, battery levels, and maintenance schedules',
  category: 'maintenance',
  icon: 'Wrench',
  widgets: [
    {
      type: 'gauge',
      title: 'Average Battery Level',
      description: 'Fleet-wide battery status',
      config: {},
    },
    {
      type: 'kpi',
      title: 'Devices Needing Maintenance',
      description: 'Devices requiring attention',
      config: {},
    },
    {
      type: 'table',
      title: 'Maintenance Schedule',
      description: 'Upcoming and overdue maintenance',
      config: {},
    },
    {
      type: 'table',
      title: 'Device Diagnostics',
      description: 'Latest diagnostic information',
      config: {},
    },
  ],
  layout: [
    { x: 0, y: 0, w: 4, h: 3 },
    { x: 4, y: 0, w: 4, h: 3 },
    { x: 0, y: 3, w: 6, h: 4 },
    { x: 6, y: 3, w: 6, h: 4 },
  ],
};

/**
 * Security Monitoring Dashboard Template
 * For security and surveillance operations
 */
export const securityTemplate: DashboardTemplate = {
  id: 'template-security',
  name: 'Security Monitoring',
  description: 'Monitor video feeds, alerts, and security events',
  category: 'security',
  icon: 'Shield',
  widgets: [
    {
      type: 'kpi',
      title: 'Active Cameras',
      description: 'Online camera count',
      config: {},
    },
    {
      type: 'kpi',
      title: 'Security Events',
      description: 'Events in last 24 hours',
      config: {},
    },
    {
      type: 'table',
      title: 'Recent Events',
      description: 'Latest security events',
      config: {},
    },
  ],
  layout: [
    { x: 0, y: 0, w: 3, h: 2 },
    { x: 3, y: 0, w: 3, h: 2 },
    { x: 0, y: 2, w: 12, h: 4 },
  ],
};

/**
 * All available dashboard templates
 */
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  operationsTemplate,
  maintenanceTemplate,
  securityTemplate,
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): DashboardTemplate[] {
  return DASHBOARD_TEMPLATES.filter(t => t.category === category);
}
