/**
 * Schema API Client
 * 
 * API client for Schema Registry operations
 * Story 2.2 - Schema Definition Frontend
 */

import { serviceUrls } from './config';
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

// Schema API uses its own service URL (SchemaRegistry.API on port 5021)
const SCHEMA_BASE_URL = serviceUrls.schema;
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
 * Make a request to the Schema Registry API
 */
async function schemaRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SCHEMA_BASE_URL}${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Schema API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get list of schemas with optional filtering and pagination
 */
export async function getSchemas(params: GetSchemasParams = {}): Promise<SchemaListResponse> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return schemaRequest<SchemaListResponse>(`${BASE_PATH}${queryString}`);
}

/**
 * Get a single schema by ID
 */
export async function getSchema(id: string): Promise<Schema> {
  return schemaRequest<Schema>(`${BASE_PATH}/${id}`);
}

/**
 * Create a new schema
 */
export async function createSchema(request: CreateSchemaRequest): Promise<Schema> {
  return schemaRequest<Schema>(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update an existing schema (creates a new version)
 */
export async function updateSchema(id: string, request: UpdateSchemaRequest): Promise<Schema> {
  return schemaRequest<Schema>(`${BASE_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

/**
 * Soft delete a schema
 */
export async function deleteSchema(id: string): Promise<void> {
  await schemaRequest<void>(`${BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get all versions for a schema
 */
export async function getSchemaVersions(schemaId: string): Promise<SchemaVersion[]> {
  return schemaRequest<SchemaVersion[]>(`${BASE_PATH}/${schemaId}/versions`);
}

/**
 * Get a specific schema version
 */
export async function getSchemaVersion(schemaId: string, versionId: string): Promise<SchemaVersion> {
  return schemaRequest<SchemaVersion>(`${BASE_PATH}/${schemaId}/versions/${versionId}`);
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
  
  return schemaRequest<ValidationResult>(`${BASE_PATH}/validate`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
