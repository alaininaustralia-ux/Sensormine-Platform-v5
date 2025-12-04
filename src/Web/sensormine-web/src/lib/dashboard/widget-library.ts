/**
 * Widget Library
 * Defines available widgets and their default configurations (Story 4.1)
 */

import type { WidgetLibraryItem, DashboardTemplate } from './types';

/**
 * Available widgets in the widget library
 */
export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
  {
    type: 'chart',
    name: 'Chart',
    description: 'Time-series line, bar, area, and scatter charts',
    icon: 'LineChart',
    defaultConfig: {
      type: 'chart',
      config: {
        type: 'line',
        showLegend: true,
        aggregationInterval: '1m',
      },
    },
    defaultSize: { width: 4, height: 3 },
  },
  {
    type: 'table',
    name: 'Table',
    description: 'Data table with sorting and pagination',
    icon: 'Table',
    defaultConfig: {
      type: 'table',
      config: {
        columns: [],
        pageSize: 10,
      },
    },
    defaultSize: { width: 4, height: 3 },
  },
  {
    type: 'map',
    name: 'Map',
    description: 'Geographic map with device locations',
    icon: 'Map',
    defaultConfig: {
      type: 'map',
      config: {
        zoom: 10,
        showDeviceMarkers: true,
      },
    },
    defaultSize: { width: 4, height: 4 },
  },
  {
    type: 'video',
    name: 'Video Feed',
    description: 'Live video feed from connected cameras',
    icon: 'Video',
    defaultConfig: {
      type: 'video',
      config: {
        autoplay: false,
        showTimeline: true,
      },
    },
    defaultSize: { width: 4, height: 3 },
  },
  {
    type: 'gauge',
    name: 'Gauge',
    description: 'Circular gauge for single value display',
    icon: 'Gauge',
    defaultConfig: {
      type: 'gauge',
      config: {
        min: 0,
        max: 100,
        thresholds: [
          { value: 25, color: 'green' },
          { value: 50, color: 'yellow' },
          { value: 75, color: 'orange' },
          { value: 100, color: 'red' },
        ],
      },
    },
    defaultSize: { width: 2, height: 2 },
  },
  {
    type: 'kpi',
    name: 'KPI Card',
    description: 'Key performance indicator with trend',
    icon: 'TrendingUp',
    defaultConfig: {
      type: 'kpi',
      config: {
        showTrend: true,
        comparisonPeriod: 'day',
      },
    },
    defaultSize: { width: 2, height: 2 },
  },
  {
    type: 'text',
    name: 'Text',
    description: 'Static text or markdown content',
    icon: 'Type',
    defaultConfig: {
      type: 'text',
      config: {
        content: 'Enter your text here...',
        fontSize: 'md',
        alignment: 'left',
      },
    },
    defaultSize: { width: 2, height: 1 },
  },
];

/**
 * Default dashboard templates
 */
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Dashboard',
    description: 'Start from scratch with an empty dashboard',
    category: 'Basic',
    widgets: [],
    layoutType: 'grid',
  },
  {
    id: 'device-overview',
    name: 'Device Overview',
    description: 'Monitor all your devices at a glance',
    category: 'Operations',
    widgets: [
      {
        title: 'Total Devices',
        type: 'kpi',
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: { type: 'kpi', config: { showTrend: true, comparisonPeriod: 'day' } },
      },
      {
        title: 'Active Alerts',
        type: 'kpi',
        position: { x: 2, y: 0, width: 2, height: 2 },
        config: { type: 'kpi', config: { showTrend: true, comparisonPeriod: 'day' } },
      },
      {
        title: 'Device Map',
        type: 'map',
        position: { x: 4, y: 0, width: 4, height: 4 },
        config: { type: 'map', config: { zoom: 10, showDeviceMarkers: true } },
      },
      {
        title: 'Recent Activity',
        type: 'table',
        position: { x: 0, y: 2, width: 4, height: 3 },
        config: { type: 'table', config: { columns: ['device', 'event', 'timestamp'], pageSize: 10 } },
      },
    ],
    layoutType: 'grid',
  },
  {
    id: 'sensor-analytics',
    name: 'Sensor Analytics',
    description: 'Analyze sensor data with charts and trends',
    category: 'Analytics',
    widgets: [
      {
        title: 'Temperature Trend',
        type: 'chart',
        position: { x: 0, y: 0, width: 6, height: 3 },
        config: { type: 'chart', config: { type: 'line', showLegend: true, aggregationInterval: '5m' } },
      },
      {
        title: 'Current Temperature',
        type: 'gauge',
        position: { x: 6, y: 0, width: 2, height: 2 },
        config: { type: 'gauge', config: { min: 0, max: 100, unit: '°C' } },
      },
      {
        title: 'Humidity Trend',
        type: 'chart',
        position: { x: 0, y: 3, width: 6, height: 3 },
        config: { type: 'chart', config: { type: 'area', showLegend: true, aggregationInterval: '5m' } },
      },
      {
        title: 'Current Humidity',
        type: 'gauge',
        position: { x: 6, y: 2, width: 2, height: 2 },
        config: { type: 'gauge', config: { min: 0, max: 100, unit: '%' } },
      },
    ],
    layoutType: 'grid',
  },
  {
    id: 'security-monitor',
    name: 'Security Monitor',
    description: 'Monitor video feeds and security events',
    category: 'Security',
    widgets: [
      {
        title: 'Camera 1',
        type: 'video',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: { type: 'video', config: { autoplay: false, showTimeline: true } },
      },
      {
        title: 'Camera 2',
        type: 'video',
        position: { x: 4, y: 0, width: 4, height: 3 },
        config: { type: 'video', config: { autoplay: false, showTimeline: true } },
      },
      {
        title: 'Security Events',
        type: 'table',
        position: { x: 0, y: 3, width: 8, height: 3 },
        config: { type: 'table', config: { columns: ['camera', 'event', 'severity', 'timestamp'], pageSize: 10 } },
      },
    ],
    layoutType: 'grid',
  },
];

/**
 * Grid configuration constants
 */
export const GRID_CONFIG = {
  columns: 8,
  rowHeight: 100,
  gap: 16,
  minWidgetWidth: 2,
  minWidgetHeight: 1,
  maxWidgetWidth: 8,
  maxWidgetHeight: 6,
};

/**
 * Get widget library item by type
 */
export function getWidgetByType(type: string): WidgetLibraryItem | undefined {
  return WIDGET_LIBRARY.find((w) => w.type === type);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id);
}
