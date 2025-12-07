/**
 * Dashboard Type Definitions
 * 
 * Defines the data models for the dashboard builder system.
 * These types align with react-grid-layout and our dashboard requirements.
 */

/**
 * Widget types available in the dashboard builder
 */
export type WidgetType = 
  | 'chart' 
  | 'table' 
  | 'map' 
  | 'video' 
  | 'gauge' 
  | 'kpi'
  | 'device-list';

/**
 * Grid layout item (compatible with react-grid-layout)
 */
export interface LayoutItem {
  /** Widget ID (must match widget.id) */
  i: string;
  /** Grid column position (0-based) */
  x: number;
  /** Grid row position (0-based) */
  y: number;
  /** Width in grid units */
  w: number;
  /** Height in grid units */
  h: number;
  /** Minimum width in grid units */
  minW?: number;
  /** Minimum height in grid units */
  minH?: number;
  /** Maximum width in grid units */
  maxW?: number;
  /** Maximum height in grid units */
  maxH?: number;
  /** Whether the widget can be moved */
  static?: boolean;
  /** Whether the widget can be dragged */
  isDraggable?: boolean;
  /** Whether the widget can be resized */
  isResizable?: boolean;
}

/**
 * Data source configuration for widgets
 */
export interface DataSourceConfig {
  type: 'realtime' | 'historical' | 'aggregated';
  fields: Array<{
    deviceTypeId: string;
    deviceTypeName: string;
    fieldPath: string;
    fieldName: string;
    fieldType: string;
  }>;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  timeRange?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  refreshInterval?: number;
}

/**
 * Widget configuration - extensible for different widget types
 */
export interface WidgetConfig {
  /** Data source configuration */
  dataSource?: DataSourceConfig;
  /** Filter criteria */
  filters?: Record<string, unknown>;
  /** Visual styling options */
  styling?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    [key: string]: string | number | boolean | undefined;
  };
  /** Auto-refresh interval in seconds (0 = no refresh) */
  refreshInterval?: number;
  /** Widget-specific configuration */
  [key: string]: unknown;
}

/**
 * Widget instance in a dashboard
 */
export interface Widget {
  /** Unique widget ID (UUID) */
  id: string;
  /** Widget type */
  type: WidgetType;
  /** Widget display title */
  title: string;
  /** Widget subtitle/description */
  description?: string;
  /** Widget configuration */
  config: WidgetConfig;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Dashboard type enum matching backend
 */
export enum DashboardType {
  Root = 0,
  DeviceDetail = 1,
  DeviceTypeList = 2,
  Custom = 3,
}

/**
 * Summary info for subpages
 */
export interface SubPageSummary {
  id: string;
  name: string;
  description?: string;
  dashboardType: DashboardType;
  displayOrder: number;
  widgetCount: number;
}

/**
 * Complete dashboard definition
 */
export interface Dashboard {
  /** Unique dashboard ID (UUID) */
  id: string;
  /** Dashboard name */
  name: string;
  /** Dashboard description */
  description?: string;
  /** Grid layout configuration */
  layout: LayoutItem[];
  /** Widgets in this dashboard */
  widgets: Widget[];
  /** Whether this is a template dashboard */
  isTemplate: boolean;
  /** Template category (if isTemplate = true) */
  templateCategory?: 'operations' | 'maintenance' | 'security' | 'custom';
  /** Creator user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Users/teams this dashboard is shared with */
  sharedWith?: string[];
  /** Dashboard tags for organization */
  tags?: string[];
  /** Parent dashboard ID for hierarchy */
  parentDashboardId?: string;
  /** Parent dashboard name */
  parentDashboardName?: string;
  /** Child dashboards/subpages */
  subPages?: SubPageSummary[];
  /** Display order within parent */
  displayOrder: number;
  /** Dashboard type */
  dashboardType: DashboardType;
}

/**
 * Widget definition in the widget library (catalog)
 */
export interface WidgetDefinition {
  /** Widget type identifier */
  type: WidgetType;
  /** Display name */
  name: string;
  /** Description for widget library */
  description: string;
  /** Icon name (from lucide-react) */
  icon: string;
  /** Default size in grid units */
  defaultSize: {
    w: number;
    h: number;
  };
  /** Minimum size constraints */
  minSize?: {
    w: number;
    h: number;
  };
  /** Category for organization in widget library */
  category: 'data-visualization' | 'monitoring' | 'media' | 'other';
  /** Whether this widget type is currently available */
  available: boolean;
}

/**
 * Dashboard grid configuration
 */
export interface DashboardGridConfig {
  /** Number of columns in the grid */
  cols: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Spacing between grid items [x, y] in pixels */
  margin: [number, number];
  /** Container padding [x, y] in pixels */
  containerPadding: [number, number];
  /** Breakpoints for responsive design */
  breakpoints?: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
  /** Columns per breakpoint */
  breakpointCols?: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
}

/**
 * Dashboard template definition
 */
export interface DashboardTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template category */
  category: 'operations' | 'maintenance' | 'security' | 'custom';
  /** Template icon */
  icon: string;
  /** Pre-configured widgets */
  widgets: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>[];
  /** Pre-configured layout */
  layout: Omit<LayoutItem, 'i'>[];
  /** Preview image URL */
  previewImage?: string;
}

/**
 * Dashboard filter/search criteria
 */
export interface DashboardFilters {
  /** Search query (name, description) */
  search?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by creator */
  createdBy?: string;
  /** Filter by template status */
  isTemplate?: boolean;
  /** Filter by category (for templates) */
  category?: string;
  /** Sort field */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Dashboard operation result
 */
export interface DashboardOperationResult {
  success: boolean;
  message?: string;
  dashboard?: Dashboard;
  error?: string;
}
