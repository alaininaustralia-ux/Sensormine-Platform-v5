/**
 * Schema API Client
 * 
 * API client for Schema Registry operations
 * Story 2.2 - Schema Definition Frontend
 */

import { apiClient } from './client';
import type {
  Schema,
  SchemaVersion,
  CreateSchemaRequest,
  UpdateSchemaRequest,
  GetSchemasParams,
  SchemaListResponse,
  ValidationResult,
  ValidateDataRequest,
} from '../types/schema';

const BASE_PATH = '/api/schemas';

/**
 * Build query string from params
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get list of schemas with optional filtering and pagination
 */
export async function getSchemas(params: GetSchemasParams = {}): Promise<SchemaListResponse> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  const response = await apiClient.get<SchemaListResponse>(`${BASE_PATH}${queryString}`);
  return response.data;
}

/**
 * Get a single schema by ID
 */
export async function getSchema(id: string): Promise<Schema> {
  const response = await apiClient.get<Schema>(`${BASE_PATH}/${id}`);
  return response.data;
}

/**
 * Create a new schema
 */
export async function createSchema(request: CreateSchemaRequest): Promise<Schema> {
  const response = await apiClient.post<Schema>(BASE_PATH, request);
  return response.data;
}

/**
 * Update an existing schema (creates a new version)
 */
export async function updateSchema(id: string, request: UpdateSchemaRequest): Promise<Schema> {
  const response = await apiClient.put<Schema>(`${BASE_PATH}/${id}`, request);
  return response.data;
}

/**
 * Soft delete a schema
 */
export async function deleteSchema(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Get all versions for a schema
 */
export async function getSchemaVersions(schemaId: string): Promise<SchemaVersion[]> {
  const response = await apiClient.get<SchemaVersion[]>(`${BASE_PATH}/${schemaId}/versions`);
  return response.data;
}

/**
 * Get a specific schema version
 */
export async function getSchemaVersion(schemaId: string, versionId: string): Promise<SchemaVersion> {
  const response = await apiClient.get<SchemaVersion>(`${BASE_PATH}/${schemaId}/versions/${versionId}`);
  return response.data;
}

/**
 * Validate data against a schema
 */
export async function validateData(
  schemaId: string,
  data: unknown,
  versionId?: string
): Promise<ValidationResult> {
  const request: ValidateDataRequest = {
    schemaId,
    data,
    ...(versionId && { versionId }),
  };
  
  const response = await apiClient.post<ValidationResult>(`${BASE_PATH}/validate`, request);
  return response.data;
}
