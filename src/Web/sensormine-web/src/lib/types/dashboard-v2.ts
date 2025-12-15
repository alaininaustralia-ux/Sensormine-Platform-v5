// Dashboard V2 Type Definitions
// Complete redesign with mode-based editing, digital twin integration, and advanced widget system

export type DashboardMode = 'view' | 'design';

export type DashboardState = 'draft' | 'published';

export type WidgetType =
  | 'timeseries-chart'
  | 'kpi-card'
  | 'gauge'
  | 'device-list'
  | 'data-table'
  | 'map'
  | 'digital-twin-tree'
  | 'cad-3d-viewer'
  | 'video-player'
  | 'custom';

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'step';

export type GaugeType = 'circular' | 'linear' | 'bullet';

export type AggregationFunction = 'raw' | 'avg' | 'sum' | 'min' | 'max' | 'count' | 'last';

export type TimeRangeType = 'relative' | 'absolute' | 'rolling';

export type TimeInterval = '1s' | '10s' | '1m' | '5m' | '15m' | '1h' | '1d';

export type RelativeTimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export type ThresholdLevel = 'normal' | 'warning' | 'critical';

export type RefreshInterval = '10s' | '30s' | '1m' | '5m' | '10m' | '30m' | 'never';

export type PermissionLevel = 'view' | 'edit' | 'publish' | 'admin';

export type UserRole = 'viewer' | 'designer' | 'publisher' | 'admin';

export type WidgetEventType = 'device:selected' | 'asset:selected' | 'timeRange:changed' | 'filter:applied';

export type LinkType = 'master-detail' | 'cross-filter' | 'drill-down';

export type SubDashboardParameterType = 'deviceId' | 'assetId';

// Core Dashboard Types

export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  tags: string[];
  state: DashboardState;
  version: number;  // Incremented on each update for optimistic locking
  lastModifiedBy?: string;  // User ID who last modified
  widgets: Widget[];
  layout: LayoutConfig;
  filters: DashboardFilters;
  settings?: DashboardSettings;
  permissions: DashboardPermissions;
  metadata: DashboardMetadata;
  subDashboards?: SubDashboard[];  // Sub-dashboards for drill-through
  parentDashboardId?: string;  // If this is a sub-dashboard
  parameterType?: SubDashboardParameterType;  // If this is a sub-dashboard
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SubDashboard {
  id: string;
  name: string;
  description?: string;
  parameterType: SubDashboardParameterType;
  dashboardId: string;  // Reference to the actual dashboard
  sourceWidgetId: string;  // Widget that created this sub-dashboard
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  dataSource: DataSourceConfig;
  appearance: AppearanceConfig;
  behavior: BehaviorConfig;
  position: WidgetPosition;
}

export interface LayoutConfig {
  breakpoints: { lg: number; md: number; sm: number; xs: number };
  cols: { lg: number; md: number; sm: number; xs: number };
  layouts: {
    lg: WidgetPosition[];
    md: WidgetPosition[];
    sm: WidgetPosition[];
    xs: WidgetPosition[];
  };
}

export interface WidgetPosition {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardFilters {
  digitalTwinNodeId?: string;
  deviceIds?: string[];
  deviceTypeIds?: string[];
  timeRange?: TimeRangeConfig;
  customFilters?: Record<string, unknown>;
}

export interface DashboardSettings {
  refreshInterval: RefreshInterval;
  autoRefresh: boolean;
  showToolbar: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface DashboardPermissions {
  owner: string;
  visibility: 'private' | 'team' | 'public';
  shares: PermissionShare[];
}

export interface PermissionShare {
  userId?: string;
  groupId?: string;
  level: PermissionLevel;
  grantedAt: string;
  grantedBy: string;
}

export interface DashboardMetadata {
  templateId?: string;
  category?: string;
  icon?: string;
  previewImage?: string;
  lastPublishedAt?: string;
  publishedBy?: string;
}

// Widget Configuration Types

export interface WidgetConfig {
  // Chart-specific
  chartType?: ChartType;
  series?: ChartSeries[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  
  // Gauge-specific
  gaugeType?: GaugeType;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  thresholds?: Threshold[];
  
  // Table-specific
  columns?: TableColumn[];
  pagination?: PaginationConfig;
  sorting?: SortConfig;
  
  // Map-specific
  mapType?: 'leaflet' | 'arcgis';
  layers?: MapLayer[];
  clustering?: boolean;
  heatMap?: HeatMapConfig;
  
  // Generic
  showTitle?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  [key: string]: unknown;
}

export interface ChartSeries {
  fieldName: string;
  friendlyName: string;
  color?: string;
  visible?: boolean;
  aggregation?: AggregationFunction;
}

export interface AxisConfig {
  label?: string;
  scale?: 'linear' | 'logarithmic' | 'time';
  min?: number;
  max?: number;
  format?: string;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
}

export interface Threshold {
  level: ThresholdLevel;
  min: number;
  max: number;
  color: string;
  label?: string;
}

export interface TableColumn {
  fieldName: string;
  friendlyName: string;
  dataType: string;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
  width?: number;
  format?: string;
}

export interface PaginationConfig {
  pageSize: number;
  pageSizeOptions: number[];
  showPageSizeSelector: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'marker' | 'heatmap' | 'geofence' | 'tile';
  visible: boolean;
  config: Record<string, unknown>;
}

export interface HeatMapConfig {
  enabled: boolean;
  radius: number;
  blur: number;
  gradient: Record<number, string>;
}

// Data Source Types

export interface DataSourceConfig {
  type: 'device-type' | 'device' | 'query' | 'api';
  deviceTypeId?: string;
  deviceIds?: string[];
  fieldMappings: FieldMapping[];
  aggregation: AggregationConfig;
  timeRange: TimeRangeConfig;
  filters?: DataFilter[];
  useSubDashboardParameter?: boolean;  // If true, filter by sub-dashboard deviceId/assetId
}

export interface FieldMapping {
  id: string;
  fieldName: string; // Schema field path
  friendlyName: string;
  dataType: 'number' | 'string' | 'boolean' | 'timestamp';
  unit?: string;
  aggregation?: AggregationFunction;
  visible: boolean;
  isQueryable: boolean;
}

export interface AggregationConfig {
  function: AggregationFunction;
  interval?: TimeInterval;
  groupBy?: string[];
}

export interface TimeRangeConfig {
  type: TimeRangeType;
  relative?: RelativeTimeRange;
  absolute?: {
    start: string;
    end: string;
  };
  rolling?: {
    duration: string;
  };
}

export interface DataFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
  value: unknown;
}

// Appearance Configuration

export interface AppearanceConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  borders?: {
    show?: boolean;
    width?: number;
    radius?: number;
    color?: string;
  };
  spacing?: {
    padding?: number;
    margin?: number;
  };
  typography?: {
    titleSize?: number;
    textSize?: number;
    fontFamily?: string;
  };
}

// Behavior Configuration

export interface BehaviorConfig {
  refreshInterval?: RefreshInterval;
  autoRefresh?: boolean;
  subscriptions?: WidgetSubscription[];
  links?: WidgetLink[];
  drillDown?: DrillDownConfig;
}

export interface WidgetSubscription {
  eventType: WidgetEventType;
  sourceWidgetId?: string; // If undefined, subscribes to all widgets
  enabled: boolean;
}

export interface WidgetLink {
  type: LinkType;
  targetWidgetId: string;
  field?: string;
  enabled: boolean;
}

export interface DrillDownConfig {
  enabled: boolean;
  targetDashboardId?: string;
  targetPath?: string;
  passContext: boolean;
  subDashboards?: SubDashboardConfig[];  // List of configured sub-dashboards
}

export interface SubDashboardConfig {
  id: string;
  name: string;
  parameterType: SubDashboardParameterType;
  dashboardId: string;
}

// Widget Event System

export interface WidgetEvent {
  id: string;
  type: WidgetEventType;
  sourceWidgetId: string;
  timestamp: string;
  payload: WidgetEventPayload;
}

export interface WidgetEventPayload {
  deviceId?: string;
  assetId?: string;
  timeRange?: TimeRangeConfig;
  filter?: DataFilter;
  [key: string]: unknown;
}

// Template System

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  previewImage?: string;
  author: string;
  createdAt: string;
  variables: TemplateVariable[];
  config: Omit<Dashboard, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'assetId' | 'deviceTypeId' | 'deviceId';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: unknown;
}

export interface ApplyTemplateRequest {
  templateId: string;
  name: string;
  variables: Record<string, unknown>;
}

// API Request/Response Types

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  tags?: string[];
  templateId?: string;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  tags?: string[];
  widgets?: Widget[];
  layout?: LayoutConfig;
  filters?: DashboardFilters;
  settings?: DashboardSettings;
  expectedVersion?: number;  // For optimistic locking
}

export interface PublishDashboardRequest {
  notes?: string;
}

export interface ShareDashboardRequest {
  userId?: string;
  groupId?: string;
  level: PermissionLevel;
}

export interface DashboardListItem {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  state: DashboardState;
  version: number;
  widgetCount: number;
  previewImage?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DashboardVersion {
  version: number;
  publishedAt: string;
  publishedBy: string;
  notes?: string;
  snapshot: Dashboard;
}

// Widget Data Types

export interface WidgetData {
  widgetId: string;
  data: unknown;
  metadata: WidgetDataMetadata;
  error?: string;
}

export interface WidgetDataMetadata {
  queryTime: number;
  rowCount: number;
  lastUpdated: string;
  cacheHit: boolean;
}

// Digital Twin Integration

export interface DigitalTwinNode {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  level: number;
  path: string;
  icon?: string;
  deviceCount: number;
  metadata?: Record<string, unknown>;
  children?: DigitalTwinNode[];
}

// Device Type Integration

export interface DeviceType {
  id: string;
  name: string;
  description?: string;
  schemaId?: string;
  schemaVersion?: number;
  deviceCount: number;
  fieldMappings: FieldMapping[];
}

// Audit Log

export interface DashboardAuditEntry {
  id: string;
  dashboardId: string;
  action: 'created' | 'updated' | 'published' | 'deleted' | 'shared' | 'permission-changed';
  userId: string;
  timestamp: string;
  details: Record<string, unknown>;
}

// State Management (Zustand Store)

export interface DashboardStore {
  // Current dashboard
  currentDashboard: Dashboard | null;
  currentMode: DashboardMode;
  selectedWidgetId: string | null;
  selectedWidgetForConfig: string | null;
  
  // Dashboard list
  dashboards: DashboardListItem[];
  
  // Templates
  templates: DashboardTemplate[];
  
  // Digital twin filter
  digitalTwinFilter: DigitalTwinNode | null;
  
  // Widget events
  widgetEvents: WidgetEvent[];
  
  // UI state
  widgetPaletteVisible: boolean;
  
  // Loading states
  loading: boolean;
  saving: boolean;
  
  // Actions
  loadDashboards: () => Promise<void>;
  loadDashboard: (id: string) => Promise<void>;
  createDashboard: (request: CreateDashboardRequest) => Promise<Dashboard>;
  updateDashboard: (id: string, request: UpdateDashboardRequest) => Promise<Dashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  publishDashboard: (id: string, request: PublishDashboardRequest) => Promise<Dashboard>;
  
  setMode: (mode: DashboardMode) => void;
  selectWidget: (widgetId: string | null) => void;
  setSelectedWidgetForConfig: (widgetId: string | null) => void;
  setWidgetPaletteVisible: (visible: boolean) => void;
  toggleWidgetPalette: () => void;
  
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (widgetId: string) => void;
  
  updateLayout: (layouts: LayoutConfig['layouts']) => void;
  
  setDigitalTwinFilter: (node: DigitalTwinNode | null) => void;
  
  publishWidgetEvent: (event: Omit<WidgetEvent, 'id' | 'timestamp'>) => void;
  subscribeToEvent: (widgetId: string, eventType: WidgetEventType, handler: (event: WidgetEvent) => void) => void;
  
  loadTemplates: () => Promise<void>;
  applyTemplate: (request: ApplyTemplateRequest) => Promise<Dashboard>;
  
  reset: () => void;
}
