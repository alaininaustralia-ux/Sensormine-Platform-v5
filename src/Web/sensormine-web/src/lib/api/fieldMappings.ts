/**
 * Field Mappings API Client
 * 
 * API functions for managing device type field mappings
 */

import { apiClient } from './client';
import type { FieldMapping, FieldMappingRequest, BulkUpdateFieldMappingsRequest } from './types';

const BASE_URL = '/api/devicetype';

/**
 * Get field mappings for a device type
 */
export async function getFieldMappings(deviceTypeId: string): Promise<FieldMapping[]> {
  const response = await apiClient.get<FieldMapping[]>(
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
  const response = await apiClient.put<FieldMapping[]>(
    `${BASE_URL}/${deviceTypeId}/fields`,
    request
  );
  return response.data;
}

/**
 * Synchronize field mappings after schema or device type changes
 */
export async function synchronizeFieldMappings(deviceTypeId: string): Promise<FieldMapping[]> {
  const response = await apiClient.post<FieldMapping[]>(
    `${BASE_URL}/${deviceTypeId}/fields/sync`
  );
  return response.data;
}
