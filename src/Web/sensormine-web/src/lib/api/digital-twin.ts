/**
 * Digital Twin API Client
 * 
 * API functions for managing digital twin assets, hierarchies, and mappings
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';
import type { ApiResponse, PaginationParams } from './types';

// Create dedicated client for DigitalTwin.API
export const digitalTwinApiClient = new ApiClient(serviceUrls.digitalTwin, apiConfig.timeout);

// Set default tenant ID for development/testing
// In production, this should be set by AuthProvider after login
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
digitalTwinApiClient.setTenantId(DEFAULT_TENANT_ID);

// =============================================================================
// Types & Interfaces
// =============================================================================

export enum AssetType {
  Site = 'Site',
  Building = 'Building',
  Floor = 'Floor',
  Area = 'Area',
  Zone = 'Zone',
  Equipment = 'Equipment',
  Subsystem = 'Subsystem',
  Component = 'Component',
  Subcomponent = 'Subcomponent',
  Sensor = 'Sensor'
}

export enum AssetStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Maintenance = 'Maintenance',
  Decommissioned = 'Decommissioned'
}

export enum AssetCategory {
  Facility = 'Facility',
  Equipment = 'Equipment',
  Geography = 'Geography'
}

export enum AlarmStatus {
  Normal = 'Normal',
  Warning = 'Warning',
  Critical = 'Critical'
}

export enum AggregationMethod {
  Last = 'Last',
  Average = 'Average',
  Sum = 'Sum',
  Min = 'Min',
  Max = 'Max',
  Count = 'Count'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeographicData {
  country?: string;
  state?: string;
  council?: string;
  city?: string;
  geofence?: GeofenceData;
}

export interface GeofenceData {
  type: string;
  coordinates: GeoLocation[];
  radius?: number;
}

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  type: AssetType;
  category: AssetCategory;
  description?: string;
  parentId?: string;
  path: string;
  level: number;
  metadata: Record<string, unknown>;
  location?: GeoLocation;
  geographicData?: GeographicData;
  cadDrawingUrl?: string;
  status: AssetStatus;
  tags: string[];
  icon?: string;
  primaryImageUrl?: string;
  imageUrls: string[];
  documents: Record<string, string>;
  childCount: number;
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetTreeNode extends Asset {
  children: AssetTreeNode[];
}

export interface AssetState {
  assetId: string;
  state: Record<string, unknown>;
  calculatedMetrics: Record<string, number>;
  alarmStatus: AlarmStatus;
  alarmCount: number;
  lastUpdated: string;
}

export interface DataPointMapping {
  id: string;
  tenantId: string;
  schemaId: string;
  assetId: string;
  jsonPath: string;
  label: string;
  description?: string;
  unit?: string;
  aggregationMethod: AggregationMethod;
  enableRollup: boolean;
  transformExpression?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetRequest {
  name: string;
  type: AssetType;
  category?: AssetCategory;
  description?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
  location?: GeoLocation;
  geographicData?: GeographicData;
  cadDrawingUrl?: string;
  status?: AssetStatus;
  tags?: string[];
  icon?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  documents?: Record<string, string>;
}

export interface UpdateAssetRequest {
  name?: string;
  type?: AssetType;
  category?: AssetCategory;
  description?: string;
  metadata?: Record<string, unknown>;
  location?: GeoLocation;
  geographicData?: GeographicData;
  cadDrawingUrl?: string;
  status?: AssetStatus;
  tags?: string[];
  icon?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  documents?: Record<string, string>;
}

export interface MoveAssetRequest {
  newParentId?: string;
}

export interface UpdateAssetStateRequest {
  state: Record<string, unknown>;
  calculatedMetrics?: Record<string, number>;
  alarmStatus?: AlarmStatus;
  alarmCount?: number;
}

export interface CreateMappingRequest {
  schemaId: string;
  assetId: string;
  jsonPath: string;
  label: string;
  description?: string;
  unit?: string;
  aggregationMethod?: AggregationMethod;
  enableRollup?: boolean;
  transformExpression?: string;
}

export interface UpdateMappingRequest {
  label?: string;
  description?: string;
  unit?: string;
  aggregationMethod?: AggregationMethod;
  enableRollup?: boolean;
  transformExpression?: string;
}

export interface AssetListResponse {
  assets: Asset[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MappingListResponse {
  mappings: DataPointMapping[];
  totalCount: number;
}

export interface BulkStateRequest {
  assetIds: string[];
}

export interface BulkStateResponse {
  states: Record<string, AssetState>;
}

export interface AssetRollupData {
  assetId: string;
  metricName: string;
  timestamp: string;
  value: number;
  sampleCount: number;
  metadata: Record<string, unknown>;
}

export interface MappingValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AssetSearchParams extends PaginationParams {
  searchQuery?: string;
  type?: AssetType;
  status?: AssetStatus;
  parentId?: string;
  tags?: string[];
}

// =============================================================================
// Asset API Methods
// =============================================================================

/**
 * Get all assets with optional filtering and pagination
 */
export async function getAssets(params?: AssetSearchParams): Promise<ApiResponse<AssetListResponse>> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery);
  if (params?.type) searchParams.append('type', params.type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.parentId) searchParams.append('parentId', params.parentId);
  if (params?.tags) {
    params.tags.forEach(tag => searchParams.append('tags', tag));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/assets?${queryString}` : '/api/assets';
  
  return digitalTwinApiClient.get<AssetListResponse>(url);
}

/**
 * Get asset by ID
 */
export async function getAssetById(id: string): Promise<ApiResponse<Asset>> {
  return digitalTwinApiClient.get<Asset>(`/api/assets/${id}`);
}

/**
 * Get asset tree (asset with all descendants recursively)
 */
export async function getAssetTree(id: string): Promise<ApiResponse<AssetTreeNode>> {
  return digitalTwinApiClient.get<AssetTreeNode>(`/api/assets/${id}/tree`);
}

/**
 * Get immediate children of an asset
 */
export async function getAssetChildren(id: string): Promise<ApiResponse<Asset[]>> {
  return digitalTwinApiClient.get<Asset[]>(`/api/assets/${id}/children`);
}

/**
 * Get all descendants of an asset (LTREE query)
 */
export async function getAssetDescendants(id: string): Promise<ApiResponse<Asset[]>> {
  return digitalTwinApiClient.get<Asset[]>(`/api/assets/${id}/descendants`);
}

/**
 * Get all ancestors of an asset (LTREE query)
 */
export async function getAssetAncestors(id: string): Promise<ApiResponse<Asset[]>> {
  return digitalTwinApiClient.get<Asset[]>(`/api/assets/${id}/ancestors`);
}

/**
 * Get root-level assets (assets with no parent)
 */
export async function getRootAssets(): Promise<ApiResponse<Asset[]>> {
  return digitalTwinApiClient.get<Asset[]>('/api/assets/roots');
}

/**
 * Search assets by name, type, status
 */
export async function searchAssets(params: AssetSearchParams): Promise<ApiResponse<AssetListResponse>> {
  return getAssets(params);
}

/**
 * Create new asset
 */
export async function createAsset(data: CreateAssetRequest): Promise<ApiResponse<Asset>> {
  return digitalTwinApiClient.post<Asset>('/api/assets', data);
}

/**
 * Update existing asset
 */
export async function updateAsset(id: string, data: UpdateAssetRequest): Promise<ApiResponse<Asset>> {
  return digitalTwinApiClient.put<Asset>(`/api/assets/${id}`, data);
}

/**
 * Move asset to new parent
 */
export async function moveAsset(id: string, data: MoveAssetRequest): Promise<ApiResponse<void>> {
  return digitalTwinApiClient.post<void>(`/api/assets/${id}/move`, data);
}

/**
 * Delete asset (and optionally its children)
 */
export async function deleteAsset(id: string): Promise<ApiResponse<void>> {
  return digitalTwinApiClient.delete<void>(`/api/assets/${id}`);
}

// =============================================================================
// Asset State API Methods
// =============================================================================

/**
 * Get current state of an asset
 */
export async function getAssetState(id: string): Promise<ApiResponse<AssetState>> {
  return digitalTwinApiClient.get<AssetState>(`/api/assets/${id}/state`);
}

/**
 * Update asset state
 */
export async function updateAssetState(id: string, data: UpdateAssetStateRequest): Promise<ApiResponse<AssetState>> {
  return digitalTwinApiClient.post<AssetState>(`/api/assets/${id}/state`, data);
}

/**
 * Get states for multiple assets in one call
 */
export async function getBulkAssetStates(assetIds: string[]): Promise<ApiResponse<BulkStateResponse>> {
  return digitalTwinApiClient.post<BulkStateResponse>('/api/assets/states/bulk', { assetIds });
}

// =============================================================================
// Data Point Mapping API Methods
// =============================================================================

/**
 * Get all mappings with pagination
 */
export async function getMappings(params?: PaginationParams): Promise<ApiResponse<MappingListResponse>> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  const queryString = searchParams.toString();
  const url = queryString ? `/api/mappings?${queryString}` : '/api/mappings';
  
  return digitalTwinApiClient.get<MappingListResponse>(url);
}

/**
 * Get mapping by ID
 */
export async function getMappingById(id: string): Promise<ApiResponse<DataPointMapping>> {
  return digitalTwinApiClient.get<DataPointMapping>(`/api/mappings/${id}`);
}

/**
 * Get all mappings for a specific schema
 */
export async function getMappingsBySchema(schemaId: string): Promise<ApiResponse<MappingListResponse>> {
  return digitalTwinApiClient.get<MappingListResponse>(`/api/mappings/by-schema/${schemaId}`);
}

/**
 * Get all mappings for a specific asset
 */
export async function getMappingsByAsset(assetId: string): Promise<ApiResponse<MappingListResponse>> {
  return digitalTwinApiClient.get<MappingListResponse>(`/api/mappings/by-asset/${assetId}`);
}

/**
 * Get mappings for a specific device (via schema)
 */
export async function getMappingsByDevice(deviceId: string): Promise<ApiResponse<MappingListResponse>> {
  return digitalTwinApiClient.get<MappingListResponse>(`/api/mappings/by-device/${deviceId}`);
}

/**
 * Create new mapping
 */
export async function createMapping(data: CreateMappingRequest): Promise<ApiResponse<DataPointMapping>> {
  return digitalTwinApiClient.post<DataPointMapping>('/api/mappings', data);
}

/**
 * Update existing mapping
 */
export async function updateMapping(id: string, data: UpdateMappingRequest): Promise<ApiResponse<DataPointMapping>> {
  return digitalTwinApiClient.put<DataPointMapping>(`/api/mappings/${id}`, data);
}

/**
 * Delete mapping
 */
export async function deleteMapping(id: string): Promise<ApiResponse<void>> {
  return digitalTwinApiClient.delete<void>(`/api/mappings/${id}`);
}

/**
 * Validate mapping without saving
 */
export async function validateMapping(data: CreateMappingRequest): Promise<ApiResponse<MappingValidationResult>> {
  return digitalTwinApiClient.post<MappingValidationResult>('/api/mappings/validate', data);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Set authentication token for all requests
 */
export function setAuthToken(token: string | null): void {
  digitalTwinApiClient.setAuthToken(token);
}

/**
 * Set tenant ID for all requests (multi-tenancy)
 */
export function setTenantId(tenantId: string | null): void {
  digitalTwinApiClient.setTenantId(tenantId);
}

/**
 * Build asset breadcrumb path from LTREE path
 * Example: "site_abc.building_123.equipment_456" → ["Site ABC", "Building 123", "Equipment 456"]
 */
export function buildAssetBreadcrumb(asset: Asset, allAssets: Asset[]): string[] {
  const pathParts = asset.path.split('.');
  const breadcrumb: string[] = [];
  
  for (const part of pathParts) {
    const ancestor = allAssets.find(a => a.path === part || a.path.endsWith(`.${part}`));
    if (ancestor) {
      breadcrumb.push(ancestor.name);
    }
  }
  
  return breadcrumb;
}

/**
 * Check if asset type is valid parent for child type
 * Example: Site can contain Building, but Sensor cannot contain anything
 */
export function canBeParent(parentType: AssetType, childType: AssetType): boolean {
  const hierarchy: Record<AssetType, AssetType[]> = {
    [AssetType.Site]: [AssetType.Building, AssetType.Equipment],
    [AssetType.Building]: [AssetType.Floor, AssetType.Area, AssetType.Equipment],
    [AssetType.Floor]: [AssetType.Area, AssetType.Zone, AssetType.Equipment],
    [AssetType.Area]: [AssetType.Zone, AssetType.Equipment],
    [AssetType.Zone]: [AssetType.Equipment],
    [AssetType.Equipment]: [AssetType.Subsystem, AssetType.Component, AssetType.Sensor],
    [AssetType.Subsystem]: [AssetType.Component, AssetType.Sensor],
    [AssetType.Component]: [AssetType.Subcomponent, AssetType.Sensor],
    [AssetType.Subcomponent]: [AssetType.Sensor],
    [AssetType.Sensor]: [], // Leaf node
  };

  return hierarchy[parentType]?.includes(childType) ?? false;
}

/**
 * Get icon name for asset type
 */
export function getAssetTypeIcon(type: AssetType): string {
  const icons: Record<AssetType, string> = {
    [AssetType.Site]: 'building',
    [AssetType.Building]: 'building-2',
    [AssetType.Floor]: 'layers',
    [AssetType.Area]: 'square',
    [AssetType.Zone]: 'box',
    [AssetType.Equipment]: 'cog',
    [AssetType.Subsystem]: 'component',
    [AssetType.Component]: 'package',
    [AssetType.Subcomponent]: 'package-2',
    [AssetType.Sensor]: 'radio',
  };

  return icons[type] || 'circle';
}

/**
 * Get color for asset status
 */
export function getAssetStatusColor(status: AssetStatus): string {
  const colors: Record<AssetStatus, string> = {
    [AssetStatus.Active]: 'green',
    [AssetStatus.Inactive]: 'gray',
    [AssetStatus.Maintenance]: 'yellow',
    [AssetStatus.Decommissioned]: 'red',
  };

  return colors[status] || 'gray';
}

/**
 * Get color for alarm status
 */
export function getAlarmStatusColor(status: AlarmStatus): string {
  const colors: Record<AlarmStatus, string> = {
    [AlarmStatus.Normal]: 'green',
    [AlarmStatus.Warning]: 'yellow',
    [AlarmStatus.Critical]: 'red',
  };

  return colors[status] || 'gray';
}
