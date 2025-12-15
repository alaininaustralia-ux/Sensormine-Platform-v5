/**
 * Widget manifest structure
 */
export interface WidgetManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: {
    name?: string;
    email?: string;
    organization?: string;
  };
  category?: string;
  tags?: string[];
  icon?: string;
  entryPoint: string;
  permissions: {
    apis: string[];
  };
  config: {
    inputs: WidgetConfigInput[];
  };
  size: {
    minWidth: number;
    minHeight: number;
    defaultWidth: number;
    defaultHeight: number;
  };
}

/**
 * Widget configuration input definition
 */
export interface WidgetConfigInput {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'devicePicker' | 'fieldPicker' | 'color';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

/**
 * Widget configuration values provided by user
 */
export type WidgetConfig = Record<string, any>;

/**
 * Widget context provided by the platform
 */
export interface WidgetContext {
  widgetId: string;
  instanceId: string;
  tenantId: string;
  userId?: string;
  dashboardId?: string;
  config: WidgetConfig;
  size: {
    width: number;
    height: number;
  };
}

/**
 * Telemetry data point
 */
export interface TelemetryDataPoint {
  time: string;
  deviceId: string;
  data: Record<string, any>;
}

/**
 * Query request for telemetry data
 */
export interface TelemetryQueryRequest {
  deviceIds: string[];
  fields: string[];
  startTime: string;
  endTime: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
}

/**
 * Query response
 */
export interface TelemetryQueryResponse {
  data: TelemetryDataPoint[];
  total: number;
}

/**
 * Device information
 */
export interface Device {
  id: string;
  name: string;
  deviceTypeId: string;
  serialNumber?: string;
  location?: Record<string, any>;
  metadata?: Record<string, any>;
  lastSeenAt?: string;
}

/**
 * Device list response
 */
export interface DeviceListResponse {
  devices: Device[];
  total: number;
}

/**
 * API methods available to widgets
 */
export interface WidgetAPI {
  /**
   * Query telemetry data
   */
  queryTelemetry(request: TelemetryQueryRequest): Promise<TelemetryQueryResponse>;
  
  /**
   * Get device by ID
   */
  getDevice(deviceId: string): Promise<Device>;
  
  /**
   * List devices
   */
  listDevices(filters?: { deviceTypeId?: string }): Promise<DeviceListResponse>;
  
  /**
   * Subscribe to real-time telemetry updates
   */
  subscribeTelemetry(deviceIds: string[], callback: (data: TelemetryDataPoint) => void): () => void;
}

/**
 * Message types for postMessage communication
 */
export type WidgetMessage =
  | { type: 'widget:ready' }
  | { type: 'widget:error'; error: string }
  | { type: 'widget:resize'; width: number; height: number }
  | { type: 'api:request'; id: string; method: string; params: any[] }
  | { type: 'api:response'; id: string; result: any }
  | { type: 'api:error'; id: string; error: string }
  | { type: 'config:updated'; config: WidgetConfig };

/**
 * Widget lifecycle hooks
 */
export interface WidgetLifecycle {
  /**
   * Called when widget is mounted
   */
  onMount?(context: WidgetContext): void | Promise<void>;
  
  /**
   * Called when configuration changes
   */
  onConfigChange?(config: WidgetConfig): void | Promise<void>;
  
  /**
   * Called when widget is resized
   */
  onResize?(size: { width: number; height: number }): void | Promise<void>;
  
  /**
   * Called before widget is unmounted
   */
  onUnmount?(): void | Promise<void>;
}
