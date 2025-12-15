/**
 * Widget Data API Client
 * 
 * Client for querying time-series data for dashboard widgets
 * Supports KPI, aggregated, categorical, and realtime data queries
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';
import type {
  ApiResponse,
  AggregatedWidgetDataResponse,
  KpiDataResponse,
  CategoricalDataResponse,
  WidgetDataResponse,
} from './types';

// Create Query API-specific client
export const queryApiClient = new ApiClient(serviceUrls.query, apiConfig.timeout);

/**
 * Query parameters for realtime widget data
 */
export interface RealtimeQueryParams {
  fields?: string;
  deviceIds?: string;
  limit?: number;
}

/**
 * Query parameters for historical widget data
 */
export interface HistoricalQueryParams {
  fields: string;
  startTime: string;
  endTime: string;
  deviceIds?: string;
  limit?: number;
}

/**
 * Query parameters for aggregated widget data
 */
export interface AggregatedQueryParams {
  fields: string;
  startTime: string;
  endTime: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'first' | 'last' | 'median' | 'p50' | 'p90' | 'p95' | 'p99';
  interval?: string;
  deviceIds?: string;
}

/**
 * Query parameters for KPI widget data with trend
 */
export interface KpiQueryParams {
  field: string;
  aggregation?: 'current' | 'avg' | 'sum' | 'min' | 'max' | 'count';
  periodHours?: number;
  includeTrend?: boolean;
  comparisonType?: 'previous' | 'historical';
  deviceIds?: string;
}

/**
 * Query parameters for categorical widget data
 */
export interface CategoricalQueryParams {
  groupBy: string;
  valueField?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  startTime?: string;
  endTime?: string;
  deviceIds?: string;
  limit?: number;
}

/**
 * Get realtime data (latest values) for widgets
 */
export async function getRealtimeWidgetData(
  params: RealtimeQueryParams
): Promise<ApiResponse<WidgetDataResponse>> {
  const searchParams = new URLSearchParams();
  if (params.fields) searchParams.append('fields', params.fields);
  if (params.deviceIds) searchParams.append('deviceIds', params.deviceIds);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  return queryApiClient.get<WidgetDataResponse>(
    `/api/widgetdata/realtime?${searchParams.toString()}`
  );
}

/**
 * Get historical time-series data for widgets
 */
export async function getHistoricalWidgetData(
  params: HistoricalQueryParams
): Promise<ApiResponse<WidgetDataResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.append('fields', params.fields);
  searchParams.append('startTime', params.startTime);
  searchParams.append('endTime', params.endTime);
  if (params.deviceIds) searchParams.append('deviceIds', params.deviceIds);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  return queryApiClient.get<WidgetDataResponse>(
    `/api/widgetdata/historical?${searchParams.toString()}`
  );
}

/**
 * Get aggregated data with time bucketing for widgets
 * Supports multiple fields in single request
 */
export async function getAggregatedWidgetData(
  params: AggregatedQueryParams
): Promise<ApiResponse<AggregatedWidgetDataResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.append('fields', params.fields);
  searchParams.append('startTime', params.startTime);
  searchParams.append('endTime', params.endTime);
  if (params.aggregation) searchParams.append('aggregation', params.aggregation);
  if (params.interval) searchParams.append('interval', params.interval);
  if (params.deviceIds) searchParams.append('deviceIds', params.deviceIds);

  return queryApiClient.get<AggregatedWidgetDataResponse>(
    `/api/widgetdata/aggregated?${searchParams.toString()}`
  );
}

/**
 * Get KPI data with trend comparison
 * Compares current period to previous period and calculates change/percentage
 */
export async function getKpiData(
  params: KpiQueryParams
): Promise<ApiResponse<KpiDataResponse>> {
  console.log('[getKpiData] Request params:', params);
  
  const searchParams = new URLSearchParams();
  searchParams.append('field', params.field);
  if (params.aggregation) searchParams.append('aggregation', params.aggregation);
  if (params.periodHours !== undefined) searchParams.append('periodHours', params.periodHours.toString());
  if (params.includeTrend !== undefined) searchParams.append('includeTrend', params.includeTrend.toString());
  if (params.comparisonType) searchParams.append('comparisonType', params.comparisonType);
  if (params.deviceIds) searchParams.append('deviceIds', params.deviceIds);

  const url = `/api/kpidata?${searchParams.toString()}`;
  console.log('[getKpiData] Request URL:', url);

  try {
    const response = await queryApiClient.get<KpiDataResponse>(url);
    console.log('[getKpiData] Response:', response);
    return response;
  } catch (error) {
    console.error('[getKpiData] Error:', error);
    throw error;
  }
}

/**
 * Get categorical aggregation for pie/bar charts
 * Groups data by categorical field and aggregates values
 */
export async function getCategoricalData(
  params: CategoricalQueryParams
): Promise<ApiResponse<CategoricalDataResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.append('groupBy', params.groupBy);
  if (params.valueField) searchParams.append('valueField', params.valueField);
  if (params.aggregation) searchParams.append('aggregation', params.aggregation);
  if (params.startTime) searchParams.append('startTime', params.startTime);
  if (params.endTime) searchParams.append('endTime', params.endTime);
  if (params.deviceIds) searchParams.append('deviceIds', params.deviceIds);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  return queryApiClient.get<CategoricalDataResponse>(
    `/api/widgetdata/categorical?${searchParams.toString()}`
  );
}

/**
 * Helper to build aggregated query for multi-series charts
 */
export async function getMultiSeriesData(
  fields: string[],
  startTime: string,
  endTime: string,
  aggregation: AggregatedQueryParams['aggregation'] = 'avg',
  interval: string = '5m',
  deviceIds?: string
): Promise<ApiResponse<AggregatedWidgetDataResponse>> {
  return getAggregatedWidgetData({
    fields: fields.join(','),
    startTime,
    endTime,
    aggregation,
    interval,
    deviceIds,
  });
}

/**
 * Helper to build KPI query with trend for KPI cards
 */
export async function getKpiWithTrend(
  field: string,
  periodHours: number = 24,
  aggregation: KpiQueryParams['aggregation'] = 'avg',
  deviceIds?: string
): Promise<ApiResponse<KpiDataResponse>> {
  return getKpiData({
    field,
    aggregation,
    periodHours,
    includeTrend: true,
    deviceIds,
  });
}

// =============================================================================
// Asset-Based Query Functions
// =============================================================================

export interface AssetRollupQueryParams {
  assetId: string;
  fields: string;
  startTime: string;
  endTime: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'first' | 'last';
  interval?: string;
  includeChildren?: boolean; // Rollup data from child assets
  groupByAsset?: boolean; // Return data grouped by asset
}

/**
 * Query data rolled up by asset hierarchy
 * Aggregates data from devices mapped to an asset and optionally its children
 */
export async function getAssetRollupData(
  params: AssetRollupQueryParams
): Promise<ApiResponse<AggregatedWidgetDataResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.append('assetId', params.assetId);
  searchParams.append('fields', params.fields);
  searchParams.append('startTime', params.startTime);
  searchParams.append('endTime', params.endTime);
  if (params.aggregation) searchParams.append('aggregation', params.aggregation);
  if (params.interval) searchParams.append('interval', params.interval);
  if (params.includeChildren !== undefined) searchParams.append('includeChildren', params.includeChildren.toString());
  if (params.groupByAsset !== undefined) searchParams.append('groupByAsset', params.groupByAsset.toString());

  return queryApiClient.get<AggregatedWidgetDataResponse>(
    `/api/query/by-asset?${searchParams.toString()}`
  );
}

export interface AssetDevicesQueryParams {
  assetId: string;
  includeChildren?: boolean;
}

/**
 * Get all devices mapped to an asset (and optionally its children)
 * Used to determine which devices to query for asset-based widgets
 */
export async function getDevicesByAsset(
  params: AssetDevicesQueryParams
): Promise<ApiResponse<string[]>> {
  const searchParams = new URLSearchParams();
  searchParams.append('assetId', params.assetId);
  if (params.includeChildren !== undefined) {
    searchParams.append('includeChildren', params.includeChildren.toString());
  }

  return queryApiClient.get<string[]>(
    `/api/query/asset-devices?${searchParams.toString()}`
  );
}
