/**
 * Common API Types
 * 
 * TypeScript types for API requests and responses
 */

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Device types
export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  lastSeen?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Time-series types
export interface TimeSeriesQuery {
  deviceId?: string;
  startTime: string;
  endTime: string;
  metrics?: string[];
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  interval?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  metric: string;
  deviceId: string;
}

// Dashboard types
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'map' | 'gauge' | 'video' | 'table';
  title: string;
  config: unknown;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Alert types
export interface Alert {
  id: string;
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
}

// Device Type types
export type DeviceProtocol = 'MQTT' | 'HTTP' | 'WebSocket' | 'OPC_UA' | 'Modbus_TCP' | 'Modbus_RTU' | 'BACnet' | 'EtherNetIP';

export type CustomFieldType = 'Text' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 'Select' | 'MultiSelect' | 'Email' | 'URL';

export type AlertSeverity = 'Info' | 'Warning' | 'Error' | 'Critical';

export interface MqttConfig {
  broker: string;
  topic: string;
  qos: number;
  username?: string;
  password?: string;
  clientId?: string;
}

export interface HttpConfig {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  authType?: string;
  authToken?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface ModbusConfig {
  host: string;
  port: number;
  unitId: number;
  registers?: Array<{ address: number; length: number; type: string }>;
}

export interface OpcuaConfig {
  endpoint: string;
  securityMode?: string;
  securityPolicy?: string;
  nodeIds?: string[];
}

export interface ProtocolConfig {
  mqtt?: MqttConfig;
  http?: HttpConfig;
  webSocket?: WebSocketConfig;
  modbus?: ModbusConfig;
  opcua?: OpcuaConfig;
}

export interface CustomFieldDefinition {
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: string;
  description?: string;
}

export interface AlertRuleTemplate {
  name: string;
  description?: string;
  condition: string;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes?: number;
  escalationRules?: Array<{
    delayMinutes: number;
    notificationChannels: string[];
  }>;
}

export interface DeviceType {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  protocol: DeviceProtocol;
  protocolConfig: ProtocolConfig;
  schemaId?: string;
  customFields: CustomFieldDefinition[];
  alertTemplates: AlertRuleTemplate[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DeviceTypeRequest {
  name: string;
  description?: string;
  protocol: DeviceProtocol;
  protocolConfig: ProtocolConfig;
  schemaId?: string;
  customFields: CustomFieldDefinition[];
  alertTemplates: AlertRuleTemplate[];
  tags: string[];
  isActive?: boolean;
}

export interface DeviceTypeListResponse {
  items: DeviceType[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchDeviceTypesRequest {
  searchTerm?: string;
  tags?: string[];
  protocol?: DeviceProtocol;
  page?: number;
  pageSize?: number;
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// Widget Data Query types
export interface TimeRangeInfo {
  start: string;
  end: string;
}

export interface WidgetDataPoint {
  deviceId: string;
  timestamp: string;
  values: Record<string, unknown>;
}

export interface WidgetDataResponse {
  timestamp: string;
  dataPoints: WidgetDataPoint[];
  count: number;
  timeRange?: TimeRangeInfo;
}

export interface AggregatedDataPoint {
  timestamp: string;
  value: number;
  count: number;
}

export interface AggregatedSeries {
  field: string;
  dataPoints: AggregatedDataPoint[];
}

export interface AggregatedWidgetDataResponse {
  timestamp: string;
  aggregation: string;
  interval: string;
  series: AggregatedSeries[];
  timeRange?: TimeRangeInfo;
}

export interface KpiDataResponse {
  field: string;
  aggregation: string;
  currentValue: number;
  currentCount: number;
  currentPeriod: TimeRangeInfo;
  previousValue?: number;
  previousCount?: number;
  previousPeriod?: TimeRangeInfo;
  change?: number;
  percentChange?: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  count: number;
  percentage?: number;
}

export interface CategoricalDataResponse {
  groupByField: string;
  valueField: string;
  aggregation: string;
  categories: CategoryDataPoint[];
  timeRange?: TimeRangeInfo;
}
