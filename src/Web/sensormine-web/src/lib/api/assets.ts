/**
 * Asset API Client
 * Handles communication with DigitalTwin.API for asset hierarchy operations
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';

// Create dedicated client for DigitalTwin.API
export const digitalTwinApiClient = new ApiClient(serviceUrls.digitalTwin, apiConfig.timeout);

// Set default tenant ID for development/testing
// In production, this should be set by AuthProvider after login
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
digitalTwinApiClient.setTenantId(DEFAULT_TENANT_ID);

const DIGITAL_TWIN_API_URL = serviceUrls.digitalTwin;

export interface Asset {
  id: string;
  parentId: string | null;
  name: string;
  description?: string;
  assetType: AssetType;
  category: AssetCategory;
  path: string;
  level: number;
  metadata?: Record<string, unknown>;
  primaryImageUrl?: string;
  imageUrls?: string[];
  documents?: Record<string, string>;
  icon?: string;
  location?: GeoLocation;
  geographicData?: GeographicData;
  cadDrawingUrl?: string;
  status: AssetStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeographicData {
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  timezone?: string;
}

export enum AssetType {
  Site = 0,
  Building = 1,
  Floor = 2,
  Area = 3,
  Zone = 4,
  Equipment = 5,
  Subsystem = 6,
  Component = 7,
  Subcomponent = 8,
  Sensor = 9,
}

export enum AssetCategory {
  Facility = 0,
  Equipment = 1,
  Geography = 2,
}

export enum AssetStatus {
  Active = 0,
  Inactive = 1,
  Maintenance = 2,
  Decommissioned = 3,
}

export interface AssetWithChildren extends Asset {
  children?: AssetWithChildren[];
  deviceCount?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Get all root assets (assets without parents)
 */
export async function getRootAssets(): Promise<Asset[]> {
  const response = await digitalTwinApiClient.get<Asset[]>('/api/assets/roots');
  return response.data;
}

/**
 * Get all assets (flat list)
 */
export async function getAllAssets(): Promise<Asset[]> {
  const response = await digitalTwinApiClient.get<Asset[]>('/api/assets');
  return response.data;
}

/**
 * Get asset by ID
 */
export async function getAssetById(id: string): Promise<Asset> {
  const response = await digitalTwinApiClient.get<Asset>(`/api/assets/${id}`);
  return response.data;
}

/**
 * Get children of an asset
 */
export async function getAssetChildren(parentId: string): Promise<Asset[]> {
  const response = await digitalTwinApiClient.get<Asset[]>(`/api/assets/${parentId}/children`);
  return response.data;
}

/**
 * Get child assets (alias for getAssetChildren for backwards compatibility)
 */
export const getChildAssets = getAssetChildren;

/**
 * Get asset hierarchy tree
 */
export async function getAssetTree(): Promise<AssetWithChildren[]> {
  const response = await digitalTwinApiClient.get<AssetWithChildren[]>('/api/assets/tree');
  return response.data;
}

/**
 * Get all descendants of an asset
 */
export async function getAssetDescendants(assetId: string): Promise<Asset[]> {
  const response = await digitalTwinApiClient.get<Asset[]>(`/api/assets/${assetId}/descendants`);
  return response.data;
}

/**
 * Get human-readable path (names) for an asset
 */
export async function getAssetPathNames(assetId: string): Promise<string> {
  const response = await digitalTwinApiClient.get<{ path: string }>(`/api/assets/${assetId}/path-names`);
  return response.data.path;
}

/**
 * Get device count for an asset (including descendants)
 */
export async function getAssetDeviceCount(assetId: string, includeDescendants: boolean = true): Promise<number> {
  const params = includeDescendants ? '?includeDescendants=true' : '';
  const response = await digitalTwinApiClient.get<number | { count: number }>(`/api/assets/${assetId}/device-count${params}`);
  return typeof response.data === 'number' ? response.data : response.data.count || 0;
}

/**
 * Search assets by name or path
 */
export async function searchAssets(query: string): Promise<Asset[]> {
  const response = await digitalTwinApiClient.get<Asset[]>(`/api/assets/search?query=${encodeURIComponent(query)}`);
  return response.data;
}

/**
 * Get asset type label
 */
export function getAssetTypeLabel(type: AssetType): string {
  const labels: Record<AssetType, string> = {
    [AssetType.Site]: 'Site',
    [AssetType.Building]: 'Building',
    [AssetType.Floor]: 'Floor',
    [AssetType.Area]: 'Area',
    [AssetType.Zone]: 'Zone',
    [AssetType.Equipment]: 'Equipment',
    [AssetType.Subsystem]: 'Subsystem',
    [AssetType.Component]: 'Component',
    [AssetType.Subcomponent]: 'Subcomponent',
    [AssetType.Sensor]: 'Sensor',
  };
  return labels[type] || 'Unknown';
}

/**
 * Get asset type icon name
 */
export function getAssetTypeIcon(type: AssetType): string {
  const icons: Record<AssetType, string> = {
    [AssetType.Site]: 'building-2',
    [AssetType.Building]: 'building',
    [AssetType.Floor]: 'layers',
    [AssetType.Area]: 'grid',
    [AssetType.Zone]: 'box',
    [AssetType.Equipment]: 'cpu',
    [AssetType.Subsystem]: 'component',
    [AssetType.Component]: 'plug',
    [AssetType.Subcomponent]: 'circle-dot',
    [AssetType.Sensor]: 'activity',
  };
  return icons[type] || 'circle';
}

/**
 * Get asset status color
 */
export function getAssetStatusColor(status: AssetStatus): string {
  const colors: Record<AssetStatus, string> = {
    [AssetStatus.Active]: 'text-green-600',
    [AssetStatus.Inactive]: 'text-gray-500',
    [AssetStatus.Maintenance]: 'text-yellow-600',
    [AssetStatus.Decommissioned]: 'text-red-600',
  };
  return colors[status] || 'text-gray-500';
}

// ==================== Asset Telemetry Functions ====================

const QUERY_API_URL = serviceUrls.query;

export interface DeviceWithLatestTelemetry {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  latestTelemetry: LatestTelemetryData[];
  lastSeen?: string;
}

export interface LatestTelemetryData {
  field: string;
  value: number | string;
  unit?: string;
  timestamp: string;
  quality?: string;
}

export interface AssetTelemetryQuery {
  assetId: string;
  includeDescendants?: boolean;
  fields?: string[];
  limit?: number;
}

/**
 * Get devices under an asset with their latest telemetry values
 */
export async function getDevicesWithTelemetryByAsset(
  query: AssetTelemetryQuery
): Promise<DeviceWithLatestTelemetry[]> {
  const params = new URLSearchParams();
  params.append('assetId', query.assetId);
  
  if (query.includeDescendants !== undefined) {
    params.append('includeDescendants', String(query.includeDescendants));
  }
  
  if (query.fields && query.fields.length > 0) {
    params.append('fields', query.fields.join(','));
  }
  
  if (query.limit) {
    params.append('limit', String(query.limit));
  }

  const response = await fetch(
    `${QUERY_API_URL}/api/AssetTelemetry/devices-with-telemetry/by-asset?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch devices with telemetry: ${response.statusText}`);
  }

  const data = await response.json();
  return data.devices || [];
}

export interface AggregatedTelemetryQuery {
  assetId: string;
  includeDescendants?: boolean;
  fields?: string[];
  startTime?: Date;
  endTime?: Date;
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
  limit?: number;
}

export interface TelemetrySeries {
  field: string;
  deviceId: string;
  deviceName: string;
  unit?: string;
  data: AggregatedDataPoint[];
}

export interface AggregatedDataPoint {
  timestamp: string;
  value: number;
  count: number;
}

export interface AggregatedTelemetryResponse {
  assetId: string;
  assetName: string;
  deviceCount: number;
  series: TelemetrySeries[];
}

/**
 * Get aggregated time-series telemetry for devices under an asset
 */
export async function getAggregatedTelemetryByAsset(
  query: AggregatedTelemetryQuery
): Promise<AggregatedTelemetryResponse> {
  const params = new URLSearchParams();
  params.append('assetId', query.assetId);
  
  if (query.includeDescendants !== undefined) {
    params.append('includeDescendants', String(query.includeDescendants));
  }
  
  if (query.fields && query.fields.length > 0) {
    params.append('fields', query.fields.join(','));
  }
  
  if (query.startTime) {
    params.append('startTime', query.startTime.toISOString());
  }
  
  if (query.endTime) {
    params.append('endTime', query.endTime.toISOString());
  }
  
  if (query.aggregation) {
    params.append('aggregation', query.aggregation);
  }
  
  if (query.interval) {
    params.append('interval', query.interval);
  }
  
  if (query.limit) {
    params.append('limit', String(query.limit));
  }

  const response = await fetch(
    `${QUERY_API_URL}/api/AssetTelemetry/by-asset?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch aggregated telemetry: ${response.statusText}`);
  }

  return await response.json();
}
