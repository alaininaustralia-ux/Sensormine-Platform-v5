/**
 * Devices API Client
 * 
 * API functions for managing devices
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';
import type { ApiResponse, PaginationParams } from './types';

// Create dedicated client for Device.API
const deviceApiClient = new ApiClient(serviceUrls.device, apiConfig.timeout);

export interface Device {
  id: string;
  tenantId: string;
  deviceId: string;
  name: string;
  deviceTypeId: string;
  deviceTypeName?: string;
  serialNumber?: string;
  customFieldValues: Record<string, unknown>;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata: Record<string, string>;
  status: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  schemaId?: string;
  schemaName?: string;
}

export interface CreateDeviceRequest {
  deviceId: string;
  name: string;
  deviceTypeId: string;
  serialNumber?: string;
  customFieldValues?: Record<string, unknown>;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, string>;
  status?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  customFieldValues?: Record<string, unknown>;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, string>;
  status?: string;
}

export interface BulkDeviceRegistrationRequest {
  deviceTypeId: string;
  devices: CreateDeviceRequest[];
}

export interface BulkDeviceRegistrationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    deviceId: string;
    error: string;
  }>;
}

export interface DeviceListResponse {
  devices: Device[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all devices with optional filtering and pagination
 */
export async function getDevices(params?: PaginationParams): Promise<ApiResponse<DeviceListResponse>> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const queryString = searchParams.toString();
  const url = queryString ? `/api/Device?${queryString}` : '/api/Device';
  
  return deviceApiClient.get<DeviceListResponse>(url);
}

/**
 * Get a device by its database ID
 */
export async function getDeviceById(id: string): Promise<ApiResponse<Device>> {
  return deviceApiClient.get<Device>(`/api/Device/${id}`);
}

/**
 * Get a device by its device ID (hardware ID)
 */
export async function getDeviceByDeviceId(deviceId: string): Promise<ApiResponse<Device>> {
  return deviceApiClient.get<Device>(`/api/Device/by-device-id/${deviceId}`);
}

/**
 * Register a new device
 */
export async function registerDevice(request: CreateDeviceRequest): Promise<ApiResponse<Device>> {
  return deviceApiClient.post<Device>('/api/Device', request);
}

/**
 * Update a device
 */
export async function updateDevice(id: string, request: UpdateDeviceRequest): Promise<ApiResponse<Device>> {
  return deviceApiClient.put<Device>(`/api/Device/${id}`, request);
}

/**
 * Delete a device
 */
export async function deleteDevice(id: string): Promise<ApiResponse<void>> {
  return deviceApiClient.delete<void>(`/api/Device/${id}`);
}

/**
 * Bulk register devices
 */
export async function bulkRegisterDevices(
  request: BulkDeviceRegistrationRequest
): Promise<ApiResponse<BulkDeviceRegistrationResult>> {
  return deviceApiClient.post<BulkDeviceRegistrationResult>('/api/Device/bulk', request);
}

/**
 * Get devices by device type
 */
export async function getDevicesByType(deviceTypeId: string): Promise<ApiResponse<Device[]>> {
  return deviceApiClient.get<Device[]>(`/api/Device?deviceTypeId=${deviceTypeId}`);
}

/**
 * Get schema information for a device
 */
export async function getDeviceSchema(deviceId: string): Promise<ApiResponse<{
  schemaId?: string;
  schemaName?: string;
}>> {
  return deviceApiClient.get(`/api/Device/by-device-id/${deviceId}/schema`);
}
