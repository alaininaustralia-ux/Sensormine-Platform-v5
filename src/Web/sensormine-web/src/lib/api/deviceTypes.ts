/**
 * Device Types API Client
 * 
 * API functions for Device Type CRUD operations
 */

import { apiClient } from './client';
import type {
  DeviceType,
  DeviceTypeRequest,
  DeviceTypeListResponse,
  SearchDeviceTypesRequest,
} from './types';

const BASE_PATH = '/api/DeviceType';

/**
 * Create a new device type
 */
export async function createDeviceType(request: DeviceTypeRequest): Promise<DeviceType> {
  const response = await apiClient.post<DeviceType>(BASE_PATH, request);
  return response.data;
}

/**
 * Get device type by ID
 */
export async function getDeviceTypeById(id: string): Promise<DeviceType> {
  const response = await apiClient.get<DeviceType>(`${BASE_PATH}/${id}`);
  return response.data;
}

/**
 * Get all device types with pagination
 */
export async function getAllDeviceTypes(
  page: number = 1,
  pageSize: number = 20
): Promise<DeviceTypeListResponse> {
  const response = await apiClient.get<DeviceTypeListResponse>(
    `${BASE_PATH}?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
}

/**
 * Update device type
 */
export async function updateDeviceType(
  id: string,
  request: DeviceTypeRequest
): Promise<DeviceType> {
  const response = await apiClient.put<DeviceType>(`${BASE_PATH}/${id}`, request);
  return response.data;
}

/**
 * Delete device type (soft delete)
 */
export async function deleteDeviceType(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Search device types with filters
 */
export async function searchDeviceTypes(
  criteria: SearchDeviceTypesRequest
): Promise<DeviceTypeListResponse> {
  const response = await apiClient.post<DeviceTypeListResponse>(
    `${BASE_PATH}/search`,
    criteria
  );
  return response.data;
}
