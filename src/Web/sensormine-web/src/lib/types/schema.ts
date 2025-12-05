/**
 * Schema Types
 * 
 * TypeScript types for Schema Registry API
 */

export type SchemaStatus = 'Draft' | 'Active' | 'Deprecated' | 'Archived';

export interface Schema {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  currentVersionId?: string;
  status?: SchemaStatus;
  tags?: string[]; // Optional - not always returned by backend
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  currentVersion?: SchemaVersion;
  versions?: SchemaVersion[];
  // Backend fields
  createdBy?: string;
  updatedBy?: string;
}

export interface SchemaVersion {
  id: string;
  schemaId: string;
  version: string;
  jsonSchema: string; // JSON string
  changeLog: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateSchemaRequest {
  name: string;
  description: string;
  jsonSchema: string;
  changeLog: string;
  tags: string[];
}

export interface UpdateSchemaRequest {
  description?: string;
  jsonSchema: string;
  changeLog: string;
  tags?: string[];
}

export interface GetSchemasParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SchemaStatus | SchemaStatus[];
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SchemaListResponse {
  schemas: Schema[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  lineNumber?: number;
  schemaPath?: string;
}

export interface ValidateDataRequest {
  schemaId: string;
  versionId?: string;
  data: unknown;
}

export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  jsonSchema: string;
  category: string;
}

export interface SchemaVersionDiff {
  added: string[];
  removed: string[];
  modified: string[];
  breaking: boolean;
  breakingChanges: string[];
}
