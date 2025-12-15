/**
 * Device Types API Client
 * 
 * API functions for Device Type CRUD operations
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';
import type {
  DeviceType,
  DeviceTypeRequest,
  DeviceTypeListResponse,
  SearchDeviceTypesRequest,
} from './types';

// Re-export types for convenience
export type { DeviceType, DeviceTypeRequest, DeviceTypeListResponse, SearchDeviceTypesRequest };

// Create dedicated client for Device.API (device types are managed by Device.API)
export const deviceApiClient = new ApiClient(serviceUrls.device, apiConfig.timeout);

const BASE_PATH = '/api/DeviceType';

/**
 * Create a new device type
 */
export async function createDeviceType(request: DeviceTypeRequest): Promise<DeviceType> {
  const response = await deviceApiClient.post<DeviceType>(BASE_PATH, request);
  return response.data;
}

/**
 * Get device type by ID
 */
export async function getDeviceTypeById(id: string): Promise<DeviceType> {
  const response = await deviceApiClient.get<DeviceType>(`${BASE_PATH}/${id}`);
  return response.data;
}

/**
 * Get all device types with pagination
 */
export async function getAllDeviceTypes(
  page: number = 1,
  pageSize: number = 20
): Promise<DeviceTypeListResponse> {
  const response = await deviceApiClient.get<DeviceTypeListResponse>(
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
  const response = await deviceApiClient.put<DeviceType>(`${BASE_PATH}/${id}`, request);
  return response.data;
}

/**
 * Delete device type (soft delete)
 */
export async function deleteDeviceType(id: string): Promise<void> {
  await deviceApiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Search device types with filters
 */
export async function searchDeviceTypes(
  criteria: SearchDeviceTypesRequest
): Promise<DeviceTypeListResponse> {
  const response = await deviceApiClient.post<DeviceTypeListResponse>(
    `${BASE_PATH}/search`,
    criteria
  );
  return response.data;
}

/**
 * Get version history for a device type
 */
export async function getDeviceTypeVersionHistory(id: string): Promise<DeviceTypeVersion[]> {
  const response = await deviceApiClient.get<DeviceTypeVersion[]>(`${BASE_PATH}/${id}/versions`);
  return response.data;
}

/**
 * Rollback device type to a previous version
 */
export async function rollbackDeviceType(id: string, versionNumber: number): Promise<DeviceType> {
  const response = await deviceApiClient.post<DeviceType>(`${BASE_PATH}/${id}/rollback`, { versionNumber });
  return response.data;
}

/**
 * Get usage statistics for a device type
 */
export async function getDeviceTypeUsageStatistics(id: string): Promise<DeviceTypeUsageStats> {
  const response = await deviceApiClient.get<DeviceTypeUsageStats>(`${BASE_PATH}/${id}/usage`);
  return response.data;
}

/**
 * Get audit logs for a device type
 */
export async function getDeviceTypeAuditLogs(
  id: string,
  page: number = 1,
  pageSize: number = 20
): Promise<DeviceTypeAuditLogResponse> {
  const response = await deviceApiClient.get<DeviceTypeAuditLogResponse>(
    `${BASE_PATH}/${id}/audit-logs?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
}

/**
 * Validate a device type update before applying
 */
export async function validateDeviceTypeUpdate(
  id: string,
  request: DeviceTypeRequest
): Promise<DeviceTypeValidationResult> {
  const response = await deviceApiClient.post<DeviceTypeValidationResult>(
    `${BASE_PATH}/${id}/validate-update`,
    request
  );
  return response.data;
}

// Version history types
export interface DeviceTypeVersion {
  id: string;
  deviceTypeId: string;
  version: number;
  versionData: string; // JSON
  changeSummary?: string;
  createdAt: string;
  createdBy?: string;
}

export interface DeviceTypeUsageStats {
  deviceTypeId: string;
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  errorDevices: number;
  lastDataReceived?: string;
}

export interface DeviceTypeAuditLog {
  id: string;
  deviceTypeId: string;
  action: string;
  changedBy?: string;
  changeTimestamp: string;
  oldValue?: string; // JSON
  newValue?: string; // JSON
  ipAddress?: string;
}

export interface DeviceTypeAuditLogResponse {
  logs: DeviceTypeAuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DeviceTypeValidationResult {
  isValid: boolean;
  breakingChanges: string[];
  warnings: string[];
  affectedDeviceCount: number;
  recommendedActions: string[];
}
