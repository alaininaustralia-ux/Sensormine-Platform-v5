/**
 * Field Mappings API Client
 * 
 * API functions for managing device type field mappings
 */

import { ApiClient } from './client';
import { serviceUrls, apiConfig } from './config';
import type { FieldMapping, FieldMappingRequest, BulkUpdateFieldMappingsRequest } from './types';

// Create dedicated client for Device.API
export const deviceApiClient = new ApiClient(serviceUrls.device, apiConfig.timeout);

// Set default tenant ID for development/testing
// In production, this should be set by AuthProvider after login
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
deviceApiClient.setTenantId(DEFAULT_TENANT_ID);

const BASE_URL = '/api/devicetype';

/**
 * Get field mappings for a device type
 */
export async function getFieldMappings(deviceTypeId: string): Promise<FieldMapping[]> {
  const response = await deviceApiClient.get<FieldMapping[]>(
    `${BASE_URL}/${deviceTypeId}/fields`
  );
  return response.data;
}

/**
 * Update field mappings for a device type
 */
export async function updateFieldMappings(
  deviceTypeId: string,
  request: BulkUpdateFieldMappingsRequest
): Promise<FieldMapping[]> {
  const response = await deviceApiClient.put<FieldMapping[]>(
    `${BASE_URL}/${deviceTypeId}/fields`,
    request
  );
  return response.data;
}

/**
 * Synchronize field mappings after schema or device type changes
 */
export async function synchronizeFieldMappings(deviceTypeId: string): Promise<FieldMapping[]> {
  const response = await deviceApiClient.post<FieldMapping[]>(
    `${BASE_URL}/${deviceTypeId}/fields/sync`
  );
  return response.data;
}
