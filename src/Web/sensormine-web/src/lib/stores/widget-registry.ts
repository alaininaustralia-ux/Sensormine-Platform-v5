/**
 * Widget Registry
 * 
 * Catalog of all available widget types in the dashboard builder.
 * Each widget definition includes metadata for the widget library UI.
 */

import type { WidgetDefinition } from '../types/dashboard';

/**
 * Widget registry - all available widget types
 */
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    type: 'kpi',
    name: 'KPI Card',
    description: 'Display key performance indicators with trend indicators',
    icon: 'Activity',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    category: 'monitoring',
    available: true,
  },
  {
    type: 'chart',
    name: 'Time-Series Chart',
    description: 'Line, bar, area, scatter, and step charts for time-series data visualization',
    icon: 'LineChart',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 3 },
    category: 'data-visualization',
    available: true, // Implemented in Story 4.2
  },
  {
    type: 'table',
    name: 'Data Table',
    description: 'Tabular data display with sorting and filtering',
    icon: 'Table',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 3 },
    category: 'data-visualization',
    available: true,
  },
  {
    type: 'map',
    name: 'GIS Map',
    description: 'Geographic map with device markers and overlays',
    icon: 'Map',
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    category: 'monitoring',
    available: false, // Will be implemented in Story 4.6
  },
  {
    type: 'video-player',
    name: 'Video Player',
    description: 'Live or recorded video stream from cameras and video sources',
    icon: 'Video',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    category: 'media',
    available: true,
  },
  {
    type: 'gauge',
    name: 'Gauge',
    description: 'Circular or linear gauge for single metric display',
    icon: 'Gauge',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'monitoring',
    available: true,
  },
  {
    type: 'device-list',
    name: 'Device List',
    description: 'Searchable list of devices with drill-down navigation',
    icon: 'List',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    category: 'monitoring',
    available: true,
  },
  {
    type: 'device-data-table',
    name: 'Device Data Table',
    description: 'Filtered device list by type with custom fields and detail navigation',
    icon: 'Database',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    category: 'data-visualization',
    available: true,
  },
];

/**
 * Get widget definition by type
 */
export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find(w => w.type === type);
}

/**
 * Get all available widget definitions
 */
export function getAvailableWidgets(): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter(w => w.available);
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: WidgetDefinition['category']): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter(w => w.category === category && w.available);
}

/**
 * Check if a widget type is available
 */
export function isWidgetAvailable(type: string): boolean {
  const widget = getWidgetDefinition(type);
  return widget?.available ?? false;
}

/**
 * Widget categories for organization
 */
export const WIDGET_CATEGORIES = [
  { id: 'data-visualization', name: 'Data Visualization', icon: 'BarChart3' },
  { id: 'monitoring', name: 'Monitoring', icon: 'Activity' },
  { id: 'media', name: 'Media', icon: 'Film' },
  { id: 'other', name: 'Other', icon: 'Blocks' },
] as const;
