/**
 * Dashboard Types
 * Defines types and interfaces for the dashboard builder (Story 4.1)
 */

/**
 * Available widget types in the dashboard
 */
export type WidgetType =
  | 'chart'
  | 'table'
  | 'map'
  | 'video'
  | 'gauge'
  | 'kpi'
  | 'text'
  | 'device-list';

/**
 * Dashboard layout type
 */
export type DashboardLayoutType = 'grid' | 'freeform';

/**
 * Widget position and size in the dashboard grid
 */
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Chart configuration for chart widgets
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'scatter' | 'step';
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  aggregationInterval?: string;
}

/**
 * Table configuration for table widgets
 */
export interface TableConfig {
  columns: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

/**
 * Map configuration for map widgets
 */
export interface MapConfig {
  center?: { lat: number; lng: number };
  zoom?: number;
  showDeviceMarkers?: boolean;
}

/**
 * Video configuration for video widgets
 */
export interface VideoConfig {
  deviceId?: string;
  autoplay?: boolean;
  showTimeline?: boolean;
}

/**
 * Gauge configuration for gauge widgets
 */
export interface GaugeConfig {
  min: number;
  max: number;
  thresholds?: { value: number; color: string; label?: string }[];
  unit?: string;
}

/**
 * KPI configuration for KPI widgets
 */
export interface KpiConfig {
  format?: string;
  comparisonPeriod?: 'day' | 'week' | 'month' | 'year';
  showTrend?: boolean;
  unit?: string;
}

/**
 * Text configuration for text widgets
 */
export interface TextConfig {
  content: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Widget configuration union type
 */
export type WidgetConfig =
  | { type: 'chart'; config: ChartConfig }
  | { type: 'table'; config: TableConfig }
  | { type: 'map'; config: MapConfig }
  | { type: 'video'; config: VideoConfig }
  | { type: 'gauge'; config: GaugeConfig }
  | { type: 'kpi'; config: KpiConfig }
  | { type: 'text'; config: TextConfig };

/**
 * Data source configuration for widgets
 */
export interface DataSource {
  type: 'device' | 'query' | 'static';
  deviceId?: string;
  queryId?: string;
  metric?: string;
  filters?: Record<string, string | number | boolean>;
  refreshInterval?: number; // milliseconds
}

/**
 * Widget styling options
 */
export interface WidgetStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  headerVisible?: boolean;
  titleColor?: string;
}

/**
 * Widget data configuration from widget-data-config component
 */
export interface WidgetDataConfig {
  dataSource: {
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
  };
  filters?: Record<string, unknown>;
}

/**
 * Dashboard widget definition
 */
export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  position: WidgetPosition;
  dataSource?: DataSource;
  dataConfig?: WidgetDataConfig;
  config: WidgetConfig;
  styling?: WidgetStyling;
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
 * Summary DTO for subpages in dashboard list
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
 * Dashboard definition
 */
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layoutType: DashboardLayoutType;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isShared: boolean;
  sharedWith?: string[];
  tags?: string[];
  templateId?: string;
  parentDashboardId?: string;
  parentDashboardName?: string;
  subPages?: SubPageSummary[];
  displayOrder: number;
  dashboardType: DashboardType;
}

/**
 * Dashboard template definition
 */
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  widgets: Omit<DashboardWidget, 'id'>[];
  layoutType: DashboardLayoutType;
}

/**
 * Dashboard builder state
 */
export interface DashboardBuilderState {
  dashboard: Dashboard | null;
  selectedWidgetId: string | null;
  isEditing: boolean;
  isDirty: boolean;
  history: Dashboard[];
  historyIndex: number;
}

/**
 * Widget library item for the widget palette
 */
export interface WidgetLibraryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: WidgetConfig;
  defaultSize: { width: number; height: number };
}

/**
 * Drag data for widget dragging
 */
export interface WidgetDragData {
  type: 'new' | 'move';
  widgetType?: WidgetType;
  widgetId?: string;
  libraryItem?: WidgetLibraryItem;
}
