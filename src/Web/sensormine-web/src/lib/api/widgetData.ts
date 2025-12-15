/**
 * Widget Data API Client
 * Fetches data for dashboard widgets from Query.API
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';

// Create dedicated client for Query.API
export const queryApiClient = new ApiClient(serviceUrls.query, apiConfig.timeout);

// Set default tenant ID
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
queryApiClient.setTenantId(DEFAULT_TENANT_ID);

// ============================================
// Device List Widget API
// ============================================

export interface DeviceListRequest {
  deviceTypeId?: string;
  assetId?: string;
  fields?: string[];
  includeStatus?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DeviceListItem {
  id: string;
  deviceId: string;
  name: string;
  serialNumber?: string;
  status?: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
  latestTelemetry?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
}

export interface DeviceListResponse {
  devices: DeviceListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Get devices with their latest telemetry for device list widgets
 */
export async function getDevicesForWidget(params: DeviceListRequest): Promise<DeviceListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.deviceTypeId) queryParams.append('deviceTypeId', params.deviceTypeId);
  if (params.assetId) queryParams.append('assetId', params.assetId);
  if (params.includeStatus !== undefined) queryParams.append('includeStatus', params.includeStatus.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  
  const response = await queryApiClient.get<DeviceListResponse>(
    `/api/widgetdata/device-list?${queryParams.toString()}`
  );
  
  return response.data;
}

// ============================================
// Time-Series Chart Widget API
// ============================================

export interface TimeSeriesDataRequest {
  deviceTypeId?: string;
  assetId?: string;
  deviceIds?: string[]; // Specific devices
  fields: string[]; // Field names to retrieve
  timeRange?: 'last-1h' | 'last-6h' | 'last-24h' | 'last-7d' | 'last-30d' | 'custom';
  startTime?: string; // ISO 8601 format
  endTime?: string;   // ISO 8601 format
  aggregation?: 'none' | 'avg' | 'sum' | 'min' | 'max' | 'count';
  aggregationInterval?: string; // e.g., '1m', '5m', '15m', '1h'
  limit?: number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  deviceId: string;
  values: Record<string, number | string | null>;
}

export interface TimeSeriesSeries {
  field: string;
  deviceId: string;
  deviceName?: string;
  dataPoints: {
    timestamp: string;
    value: number | string | null;
  }[];
}

export interface TimeSeriesDataResponse {
  series: TimeSeriesSeries[];
  totalPoints: number;
  timeRange: {
    start: string;
    end: string;
  };
  aggregation?: {
    function: string;
    interval: string;
  };
}

/**
 * Get time-series data for chart widgets
 */
export async function getTimeSeriesForWidget(params: TimeSeriesDataRequest): Promise<TimeSeriesDataResponse> {
  const response = await queryApiClient.post<TimeSeriesDataResponse>(
    '/api/widgetdata/timeseries',
    params
  );
  
  return response.data;
}

/**
 * Get realtime (latest) data for widgets that need current values
 */
export async function getRealtimeData(params: {
  deviceIds?: string[];
  fields?: string[];
  limit?: number;
}): Promise<TimeSeriesDataPoint[]> {
  const queryParams = new URLSearchParams();
  
  if (params.deviceIds?.length) queryParams.append('deviceIds', params.deviceIds.join(','));
  if (params.fields?.length) queryParams.append('fields', params.fields.join(','));
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  const response = await queryApiClient.get<{ dataPoints: TimeSeriesDataPoint[] }>(
    `/api/widgetdata/realtime?${queryParams.toString()}`
  );
  
  return response.data.dataPoints || [];
}

// ============================================
// KPI Widget API
// ============================================

export interface KpiDataRequest {
  deviceTypeId?: string;
  assetId?: string;
  field: string;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'last';
  timeRange?: 'last-1h' | 'last-6h' | 'last-24h' | 'last-7d' | 'last-30d';
  compareWith?: 'previous-period' | 'previous-week' | 'previous-month';
}

export interface KpiDataResponse {
  value: number | string;
  unit?: string;
  change?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
  };
  timestamp: string;
}

/**
 * Get aggregated KPI value for KPI widgets
 */
export async function getKpiData(params: KpiDataRequest): Promise<KpiDataResponse> {
  const response = await queryApiClient.post<KpiDataResponse>(
    '/api/widgetdata/kpi',
    params
  );
  
  return response.data;
}

// ============================================
// Asset-Based Queries
// ============================================

/**
 * Get all devices under an asset (including child assets)
 */
export async function getDevicesByAsset(assetId: string): Promise<string[]> {
  const response = await queryApiClient.get<{ deviceIds: string[] }>(
    `/api/widgetdata/assets/${assetId}/devices`
  );
  
  return response.data.deviceIds || [];
}

/**
 * Get aggregated telemetry for an asset (rolls up data from all child devices)
 */
export async function getAssetAggregatedData(params: {
  assetId: string;
  fields: string[];
  aggregation: 'avg' | 'sum' | 'min' | 'max';
  timeRange: string;
}): Promise<TimeSeriesDataResponse> {
  const response = await queryApiClient.post<TimeSeriesDataResponse>(
    `/api/widgetdata/assets/${params.assetId}/aggregated`,
    params
  );
  
  return response.data;
}
