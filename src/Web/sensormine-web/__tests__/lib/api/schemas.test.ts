/**
 * Schema API Client Tests
 * 
 * Story 2.2 - Schema Definition Frontend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSchemas,
  getSchema,
  createSchema,
  updateSchema,
  deleteSchema,
  getSchemaVersions,
  getSchemaVersion,
  validateData,
} from '@/lib/api/schemas';
import type {
  Schema,
  SchemaVersion,
  CreateSchemaRequest,
  UpdateSchemaRequest,
  ValidationResult,
} from '@/lib/types/schema';

// Mock fetch
global.fetch = vi.fn();

function createFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('Schema API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSchemas', () => {
    it('should fetch schemas with default parameters', async () => {
      const mockResponse = {
        schemas: [
          {
            id: '1',
            name: 'Temperature Sensor Schema',
            description: 'Schema for temperature sensors',
            status: 'Active',
            tags: ['sensor', 'temperature'],
            createdAt: '2025-12-05T10:00:00Z',
            updatedAt: '2025-12-05T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResponse));

      const result = await getSchemas();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0].name).toBe('Temperature Sensor Schema');
    });

    it('should fetch schemas with search parameter', async () => {
      const mockResponse = {
        schemas: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResponse));

      await getSchemas({ search: 'temperature' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=temperature'),
        expect.any(Object)
      );
    });

    it('should fetch schemas with status filter', async () => {
      const mockResponse = {
        schemas: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResponse));

      await getSchemas({ status: 'Active' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=Active'),
        expect.any(Object)
      );
    });

    it('should fetch schemas with pagination', async () => {
      const mockResponse = {
        schemas: [],
        total: 50,
        page: 2,
        pageSize: 10,
        totalPages: 5,
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResponse));

      const result = await getSchemas({ page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should handle fetch errors', async () => {
      (fetch as any).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(getSchemas()).rejects.toThrow();
    });
  });

  describe('getSchema', () => {
    it('should fetch a single schema by id', async () => {
      const mockSchema: Schema = {
        id: '1',
        tenantId: 'tenant-1',
        name: 'Temperature Sensor Schema',
        description: 'Schema for temperature sensors',
        currentVersionId: 'v1',
        status: 'Active',
        tags: ['sensor', 'temperature'],
        createdAt: '2025-12-05T10:00:00Z',
        updatedAt: '2025-12-05T10:00:00Z',
        currentVersion: {
          id: 'v1',
          schemaId: '1',
          version: '1.0.0',
          jsonSchema: '{"type": "object"}',
          changeLog: 'Initial version',
          isActive: true,
          createdAt: '2025-12-05T10:00:00Z',
          createdBy: 'user-1',
        },
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockSchema));

      const result = await getSchema('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas/1'),
        expect.any(Object)
      );
      expect(result.id).toBe('1');
      expect(result.name).toBe('Temperature Sensor Schema');
      expect(result.currentVersion).toBeDefined();
    });

    it('should handle 404 errors', async () => {
      (fetch as any).mockImplementationOnce(() =>
        createFetchResponse({ message: 'Schema not found' }, 404)
      );

      await expect(getSchema('invalid-id')).rejects.toThrow();
    });
  });

  describe('createSchema', () => {
    it('should create a new schema', async () => {
      const createRequest: CreateSchemaRequest = {
        name: 'New Schema',
        description: 'A new schema',
        jsonSchema: '{"type": "object", "properties": {}}',
        changeLog: 'Initial creation',
        tags: ['test'],
      };

      const mockResponse: Schema = {
        id: '2',
        tenantId: 'tenant-1',
        ...createRequest,
        currentVersionId: 'v1',
        status: 'Draft',
        createdAt: '2025-12-05T10:00:00Z',
        updatedAt: '2025-12-05T10:00:00Z',
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResponse, 201));

      const result = await createSchema(createRequest);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createRequest),
        })
      );
      expect(result.id).toBe('2');
      expect(result.name).toBe('New Schema');
    });

    it('should handle validation errors', async () => {
      const createRequest: CreateSchemaRequest = {
        name: '',
        description: '',
        jsonSchema: 'invalid json',
        changeLog: '',
        tags: [],
      };

      (fetch as any).mockImplementationOnce(() =>
        createFetchResponse(
          {
            message: 'Validation failed',
            errors: { name: 'Name is required' },
          },
          400
        )
      );

      await expect(createSchema(createRequest)).rejects.toThrow();
    });
  });

  describe('updateSchema', () => {
    it('should update an existing schema', async () => {
      const updateRequest: UpdateSchemaRequest = {
        description: 'Updated description',
        jsonSchema: '{"type": "object", "properties": {"newField": {}}}',
        changeLog: 'Added new field',
        tags: ['updated'],
      };

      const mockResponse: Schema = {
        id: '1',
        tenantId: 'tenant-1',
        name: 'Temperature Sensor Schema',
        description: 'Updated description',
        currentVersionId: 'v2',
        status: 'Active',
        tags: ['updated'],
        createdAt: '2025-12-05T10:00:00Z',
        updatedAt: '2025-12-05T11:00:00Z',
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResponse));

      const result = await updateSchema('1', updateRequest);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result.description).toBe('Updated description');
      expect(result.currentVersionId).toBe('v2');
    });
  });

  describe('deleteSchema', () => {
    it('should soft delete a schema', async () => {
      (fetch as any).mockImplementationOnce(() => createFetchResponse({}, 204));

      await deleteSchema('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete errors', async () => {
      (fetch as any).mockImplementationOnce(() =>
        createFetchResponse({ message: 'Cannot delete active schema' }, 400)
      );

      await expect(deleteSchema('1')).rejects.toThrow();
    });
  });

  describe('getSchemaVersions', () => {
    it('should fetch all versions for a schema', async () => {
      const mockVersions: SchemaVersion[] = [
        {
          id: 'v2',
          schemaId: '1',
          version: '2.0.0',
          jsonSchema: '{"type": "object"}',
          changeLog: 'Breaking change',
          isActive: true,
          createdAt: '2025-12-05T11:00:00Z',
          createdBy: 'user-1',
        },
        {
          id: 'v1',
          schemaId: '1',
          version: '1.0.0',
          jsonSchema: '{"type": "object"}',
          changeLog: 'Initial version',
          isActive: false,
          createdAt: '2025-12-05T10:00:00Z',
          createdBy: 'user-1',
        },
      ];

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockVersions));

      const result = await getSchemaVersions('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas/1/versions'),
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
      expect(result[0].version).toBe('2.0.0');
    });
  });

  describe('getSchemaVersion', () => {
    it('should fetch a specific schema version', async () => {
      const mockVersion: SchemaVersion = {
        id: 'v1',
        schemaId: '1',
        version: '1.0.0',
        jsonSchema: '{"type": "object"}',
        changeLog: 'Initial version',
        isActive: false,
        createdAt: '2025-12-05T10:00:00Z',
        createdBy: 'user-1',
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockVersion));

      const result = await getSchemaVersion('1', 'v1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas/1/versions/v1'),
        expect.any(Object)
      );
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('validateData', () => {
    it('should validate data against a schema successfully', async () => {
      const mockResult: ValidationResult = {
        isValid: true,
        errors: [],
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResult));

      const result = await validateData('1', { temperature: 25.5, unit: 'C' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schemas/validate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            schemaId: '1',
            data: { temperature: 25.5, unit: 'C' },
          }),
        })
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', async () => {
      const mockResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            path: '/temperature',
            message: 'Expected number, got string',
            lineNumber: 2,
          },
        ],
      };

      (fetch as any).mockImplementationOnce(() => createFetchResponse(mockResult));

      const result = await validateData('1', { temperature: 'invalid' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('/temperature');
    });
  });
});
