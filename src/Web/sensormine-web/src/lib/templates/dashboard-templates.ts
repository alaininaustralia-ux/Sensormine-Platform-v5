/**
 * Dashboard Templates (Story 4.8)
 * 
 * Pre-built dashboard templates for common monitoring scenarios.
 * Includes industry-specific templates with export/import functionality.
 */

import type { DashboardTemplate, Dashboard, Widget } from '../types/dashboard';

/**
 * 1. Operations Overview Template
 * Monitor KPIs, device status, and active alerts
 */
export const operationsOverviewTemplate: DashboardTemplate = {
  id: 'template-operations-overview',
  name: 'Operations Overview',
  description: 'Monitor system KPIs, device status, and active alerts for operational awareness',
  category: 'operations',
  icon: 'Activity',
  widgets: [
    {
      type: 'kpi',
      title: 'Total Devices',
      description: 'Total active devices in system',
      config: { metric: 'device.count', showTrend: true },
    },
    {
      type: 'kpi',
      title: 'Active Alerts',
      description: 'Current system alerts',
      config: { metric: 'alerts.active', showTrend: true, thresholdWarning: 5, thresholdCritical: 10 },
    },
    {
      type: 'kpi',
      title: 'System Uptime',
      description: 'Overall system uptime percentage',
      config: { metric: 'system.uptime', format: 'percentage' },
    },
    {
      type: 'gauge',
      title: 'System Health',
      description: 'Overall system health score',
      config: { min: 0, max: 100, thresholds: [0, 50, 75, 90, 100] },
    },
    {
      type: 'device-list',
      title: 'Device Status',
      description: 'Real-time device status overview',
      config: { showStatus: true, sortBy: 'status' },
    },
    {
      type: 'table',
      title: 'Recent Alerts',
      description: 'Latest system alerts and warnings',
      config: { columns: ['timestamp', 'device', 'severity', 'message'], pageSize: 10 },
    },
  ],
  layout: [
    { x: 0, y: 0, w: 3, h: 2 }, // Total Devices KPI
    { x: 3, y: 0, w: 3, h: 2 }, // Active Alerts KPI
    { x: 6, y: 0, w: 3, h: 2 }, // System Uptime KPI
    { x: 9, y: 0, w: 3, h: 2 }, // System Health Gauge
    { x: 0, y: 2, w: 6, h: 4 }, // Device Status List
    { x: 6, y: 2, w: 6, h: 4 }, // Recent Alerts Table
  ],
};

/**
 * 2. Real-Time Monitoring Template
 * Live charts, gauges, and maps for real-time data visualization
 */
export const realtimeMonitoringTemplate: DashboardTemplate = {
  id: 'template-realtime-monitoring',
  name: 'Real-Time Monitoring',
  description: 'Live charts, gauges, and device maps with real-time data updates',
  category: 'operations',
  icon: 'Radio',
  widgets: [
    {
      type: 'chart',
      title: 'Live Sensor Data',
      description: 'Real-time sensor readings',
      config: { 
        chartType: 'line', 
        timeRange: { value: 1, unit: 'hours' },
        refreshInterval: 5,
        showLegend: true,
      },
    },
    {
      type: 'gauge',
      title: 'Temperature',
      description: 'Current temperature reading',
      config: { min: 0, max: 100, unit: '°C', thresholds: [0, 20, 40, 60, 80, 100] },
    },
    {
      type: 'gauge',
      title: 'Pressure',
      description: 'Current pressure reading',
      config: { min: 0, max: 150, unit: 'PSI', thresholds: [0, 30, 60, 90, 120, 150] },
    },
    {
      type: 'gauge',
      title: 'Flow Rate',
      description: 'Current flow rate',
      config: { min: 0, max: 500, unit: 'L/min', thresholds: [0, 100, 200, 300, 400, 500] },
    },
    {
      type: 'map',
      title: 'Device Locations',
      description: 'Real-time device positions',
      config: { showDeviceMarkers: true, zoom: 12, clusterMarkers: true },
    },
    {
      type: 'chart',
      title: 'Network Throughput',
      description: 'Real-time network data rates',
      config: { chartType: 'area', timeRange: { value: 30, unit: 'minutes' }, refreshInterval: 10 },
    },
  ],
  layout: [
    { x: 0, y: 0, w: 8, h: 4 }, // Live Sensor Data Chart
    { x: 8, y: 0, w: 2, h: 2 }, // Temperature Gauge
    { x: 10, y: 0, w: 2, h: 2 }, // Pressure Gauge
    { x: 8, y: 2, w: 2, h: 2 }, // Flow Rate Gauge
    { x: 10, y: 2, w: 2, h: 2 }, // (Reserved for future gauge)
    { x: 0, y: 4, w: 6, h: 4 }, // Device Map
    { x: 6, y: 4, w: 6, h: 4 }, // Network Throughput Chart
  ],
};

/**
 * 3. Analytics Dashboard Template
 * Historical trends, comparisons, and data analysis
 */
export const analyticsTemplate: DashboardTemplate = {
  id: 'template-analytics',
  name: 'Analytics Dashboard',
  description: 'Historical trends, performance comparisons, and data analysis',
  category: 'analytics',
  icon: 'TrendingUp',
  widgets: [
    {
      type: 'chart',
      title: 'Historical Trends',
      description: '30-day historical data trends',
      config: { 
        chartType: 'line', 
        timeRange: { value: 30, unit: 'days' },
        aggregation: 'avg',
        showLegend: true,
      },
    },
    {
      type: 'chart',
      title: 'Performance Comparison',
      description: 'Compare device performance metrics',
      config: { chartType: 'bar', groupBy: 'device', aggregation: 'avg' },
    },
    {
      type: 'kpi',
      title: 'Average Efficiency',
      description: '7-day average efficiency',
      config: { metric: 'efficiency.avg', showTrend: true, trendPeriod: 'week' },
    },
    {
      type: 'kpi',
      title: 'Peak Usage',
      description: 'Highest usage this month',
      config: { metric: 'usage.peak', format: 'number' },
    },
    {
      type: 'chart',
      title: 'Hourly Patterns',
      description: 'Usage patterns by hour of day',
      config: { chartType: 'bar', groupBy: 'hour', aggregation: 'sum' },
    },
    {
      type: 'table',
      title: 'Top Performers',
      description: 'Best performing devices',
      config: { columns: ['device', 'uptime', 'efficiency', 'alerts'], sortBy: 'efficiency', sortOrder: 'desc' },
    },
  ],
  layout: [
    { x: 0, y: 0, w: 8, h: 4 }, // Historical Trends
    { x: 8, y: 0, w: 4, h: 4 }, // Performance Comparison
    { x: 0, y: 4, w: 3, h: 2 }, // Average Efficiency KPI
    { x: 3, y: 4, w: 3, h: 2 }, // Peak Usage KPI
    { x: 6, y: 4, w: 6, h: 4 }, // Hourly Patterns
    { x: 0, y: 6, w: 6, h: 3 }, // Top Performers Table
  ],
};

/**
 * 4. Maintenance Dashboard Template
 * Device health, alerts, and diagnostic information
 */
export const maintenanceTemplate: DashboardTemplate = {
  id: 'template-maintenance',
  name: 'Maintenance Dashboard',
  description: 'Track device health, maintenance schedules, alerts, and diagnostics',
  category: 'maintenance',
  icon: 'Wrench',
  widgets: [
    {
      type: 'kpi',
      title: 'Devices Needing Maintenance',
      description: 'Devices requiring immediate attention',
      config: { metric: 'maintenance.required', thresholdWarning: 3, thresholdCritical: 5 },
    },
    {
      type: 'kpi',
      title: 'Overdue Maintenance',
      description: 'Maintenance tasks past due date',
      config: { metric: 'maintenance.overdue', thresholdCritical: 1 },
    },
    {
      type: 'gauge',
      title: 'Fleet Health Score',
      description: 'Overall fleet health rating',
      config: { min: 0, max: 100, unit: '%', thresholds: [0, 50, 75, 90, 100] },
    },
    {
      type: 'gauge',
      title: 'Average Battery Level',
      description: 'Fleet-wide battery status',
      config: { min: 0, max: 100, unit: '%', thresholds: [0, 20, 40, 60, 80, 100] },
    },
    {
      type: 'table',
      title: 'Maintenance Schedule',
      description: 'Upcoming and overdue maintenance tasks',
      config: { 
        columns: ['device', 'task', 'dueDate', 'status', 'priority'],
        sortBy: 'dueDate',
        pageSize: 15,
      },
    },
    {
      type: 'table',
      title: 'Device Diagnostics',
      description: 'Latest diagnostic information and error codes',
      config: { 
        columns: ['device', 'lastCheck', 'status', 'errorCode', 'message'],
        sortBy: 'lastCheck',
        sortOrder: 'desc',
      },
    },
    {
      type: 'chart',
      title: 'Maintenance History',
      description: 'Maintenance tasks completed over time',
      config: { chartType: 'bar', timeRange: { value: 90, unit: 'days' }, groupBy: 'week' },
    },
  ],
  layout: [
    { x: 0, y: 0, w: 3, h: 2 }, // Devices Needing Maintenance
    { x: 3, y: 0, w: 3, h: 2 }, // Overdue Maintenance
    { x: 6, y: 0, w: 3, h: 2 }, // Fleet Health Gauge
    { x: 9, y: 0, w: 3, h: 2 }, // Battery Level Gauge
    { x: 0, y: 2, w: 6, h: 4 }, // Maintenance Schedule
    { x: 6, y: 2, w: 6, h: 4 }, // Device Diagnostics
    { x: 0, y: 6, w: 12, h: 3 }, // Maintenance History Chart
  ],
};

/**
 * 5. Executive Summary Template
 * High-level KPIs, trends, and business metrics
 */
export const executiveSummaryTemplate: DashboardTemplate = {
  id: 'template-executive-summary',
  name: 'Executive Summary',
  description: 'High-level KPIs, business metrics, and performance trends for leadership',
  category: 'custom',
  icon: 'PieChart',
  widgets: [
    {
      type: 'kpi',
      title: 'Total Revenue',
      description: 'Monthly revenue',
      config: { metric: 'revenue.total', format: 'currency', showTrend: true },
    },
    {
      type: 'kpi',
      title: 'Customer Satisfaction',
      description: 'Average CSAT score',
      config: { metric: 'csat.avg', format: 'percentage', showTrend: true },
    },
    {
      type: 'kpi',
      title: 'System Uptime',
      description: 'Monthly uptime percentage',
      config: { metric: 'uptime.monthly', format: 'percentage', target: 99.9 },
    },
    {
      type: 'kpi',
      title: 'Active Users',
      description: 'Monthly active users',
      config: { metric: 'users.active', showTrend: true },
    },
    {
      type: 'chart',
      title: 'Revenue Trend',
      description: '12-month revenue trend',
      config: { 
        chartType: 'area', 
        timeRange: { value: 12, unit: 'months' },
        aggregation: 'sum',
      },
    },
    {
      type: 'chart',
      title: 'Device Growth',
      description: 'Device deployment over time',
      config: { 
        chartType: 'line', 
        timeRange: { value: 6, unit: 'months' },
        showLegend: false,
      },
    },
    {
      type: 'table',
      title: 'Key Metrics Summary',
      description: 'Overview of critical business metrics',
      config: { 
        columns: ['metric', 'current', 'target', 'variance', 'trend'],
        pageSize: 10,
      },
    },
  ],
  layout: [
    { x: 0, y: 0, w: 3, h: 2 }, // Total Revenue
    { x: 3, y: 0, w: 3, h: 2 }, // Customer Satisfaction
    { x: 6, y: 0, w: 3, h: 2 }, // System Uptime
    { x: 9, y: 0, w: 3, h: 2 }, // Active Users
    { x: 0, y: 2, w: 6, h: 4 }, // Revenue Trend
    { x: 6, y: 2, w: 6, h: 4 }, // Device Growth
    { x: 0, y: 6, w: 12, h: 4 }, // Key Metrics Summary
  ],
};

/**
 * All available dashboard templates
 */
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  operationsOverviewTemplate,
  realtimeMonitoringTemplate,
  analyticsTemplate,
  maintenanceTemplate,
  executiveSummaryTemplate,
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
  if (category === 'all') {
    return DASHBOARD_TEMPLATES;
  }
  return DASHBOARD_TEMPLATES.filter(t => t.category === category);
}

/**
 * Create dashboard from template
 */
export function createDashboardFromTemplate(
  templateId: string,
  name: string,
  userId: string,
  description?: string
): Dashboard | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  const now = new Date();
  
  // Generate unique IDs for widgets
  const widgets: Widget[] = template.widgets.map((widget) => ({
    ...widget,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }));

  // Map layout items to widget IDs
  const layout = template.layout.map((layoutItem, index) => ({
    ...layoutItem,
    i: widgets[index].id,
  }));

  return {
    id: crypto.randomUUID(),
    name,
    description: description || template.description,
    layout,
    widgets,
    isTemplate: false,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    displayOrder: 0,
    dashboardType: 3, // Custom dashboard
  };
}

/**
 * Export template as JSON
 */
export function exportTemplate(template: DashboardTemplate): string {
  const exportData = {
    ...template,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import template from JSON
 */
export function importTemplate(jsonString: string): DashboardTemplate {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.id || !data.name || !data.category || !data.widgets || !data.layout) {
      throw new Error('Invalid template structure: missing required fields');
    }

    const template: DashboardTemplate = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      category: data.category,
      icon: data.icon || 'FileText',
      widgets: data.widgets,
      layout: data.layout,
      previewImage: data.previewImage,
    };

    // Validate template
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    return template;
  } catch (error) {
    throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate template structure
 */
export function validateTemplate(template: DashboardTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!template.id) errors.push('Template ID is required');
  if (!template.name) errors.push('Template name is required');
  if (!template.description) errors.push('Template description is required');
  if (!template.category) errors.push('Template category is required');
  if (!template.icon) errors.push('Template icon is required');
  if (!Array.isArray(template.widgets)) errors.push('Template widgets must be an array');
  if (!Array.isArray(template.layout)) errors.push('Template layout must be an array');

  // Check widget/layout count match
  if (template.widgets && template.layout) {
    if (template.widgets.length !== template.layout.length) {
      errors.push('Widget count must match layout count');
    }
  }

  // Validate each widget
  template.widgets?.forEach((widget, index) => {
    if (!widget.type) errors.push(`Widget ${index}: type is required`);
    if (!widget.title) errors.push(`Widget ${index}: title is required`);
  });

  // Validate each layout item
  template.layout?.forEach((item, index) => {
    if (item.x === undefined) errors.push(`Layout ${index}: x position is required`);
    if (item.y === undefined) errors.push(`Layout ${index}: y position is required`);
    if (item.w === undefined) errors.push(`Layout ${index}: width is required`);
    if (item.h === undefined) errors.push(`Layout ${index}: height is required`);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
