/**
 * Widget Library
 * Consolidated widget registry - single source of truth for all widgets
 * 
 * This file re-exports WIDGET_REGISTRY and provides backward compatibility
 * with the old WIDGET_LIBRARY format.
 */

import type { WidgetLibraryItem, DashboardTemplate } from './types';
import { WIDGET_REGISTRY, type WidgetDefinition } from '../stores/widget-registry';

/**
 * Convert WidgetDefinition (new format) to WidgetLibraryItem (old format)
 * for backward compatibility
 */
function widgetDefinitionToLibraryItem(widget: WidgetDefinition): WidgetLibraryItem {
  return {
    type: widget.type,
    name: widget.name,
    description: widget.description,
    icon: widget.icon,
    defaultConfig: {
      type: widget.type,
      config: getDefaultConfig(widget.type),
    },
    defaultSize: { 
      width: widget.defaultSize.w, 
      height: widget.defaultSize.h 
    },
  };
}

/**
 * Get default widget configuration by type
 */
function getDefaultConfig(type: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    chart: {
      type: 'line',
      showLegend: true,
      aggregationInterval: '1m',
    },
    table: {
      columns: [],
      pageSize: 10,
    },
    map: {
      zoom: 10,
      showDeviceMarkers: true,
    },
    video: {
      autoplay: false,
      showTimeline: true,
    },
    gauge: {
      min: 0,
      max: 100,
      thresholds: [
        { value: 25, color: 'green' },
        { value: 50, color: 'yellow' },
        { value: 75, color: 'orange' },
        { value: 100, color: 'red' },
      ],
    },
    kpi: {
      showTrend: true,
      comparisonPeriod: 'day',
    },
    'device-list': {
      deviceList: {
        showStatusFilter: true,
        showTypeFilter: true,
        maxDevices: 50,
      },
    },
  };
  return defaults[type] || {};
}

/**
 * Widget library - converted from WIDGET_REGISTRY
 * @deprecated Use WIDGET_REGISTRY from widget-registry.ts instead
 */
export const WIDGET_LIBRARY: WidgetLibraryItem[] = WIDGET_REGISTRY
  .filter(w => w.available)
  .map(widgetDefinitionToLibraryItem);

/**
 * Export WIDGET_REGISTRY as the primary API
 */
export { WIDGET_REGISTRY } from '../stores/widget-registry';

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
