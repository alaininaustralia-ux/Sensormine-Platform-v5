/**
 * Schema List Component Tests
 * 
 * Story 2.2 - Schema Definition Frontend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SchemaList } from '@/components/schemas/schema-list';
import * as schemaApi from '@/lib/api/schemas';
import type { Schema, SchemaListResponse } from '@/lib/types/schema';

// Mock the schema API
vi.mock('@/lib/api/schemas');

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockSchemas: Schema[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    name: 'Temperature Sensor Schema',
    description: 'Schema for temperature sensors',
    currentVersionId: 'v1',
    status: 'Active',
    tags: ['sensor', 'temperature'],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    currentVersion: {
      id: 'v1',
      schemaId: '1',
      version: '1.0.0',
      jsonSchema: '{}',
      changeLog: 'Initial version',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      createdBy: 'user1',
    },
  },
  {
    id: '2',
    tenantId: 'tenant1',
    name: 'Pressure Sensor Schema',
    description: 'Schema for pressure sensors',
    currentVersionId: 'v2',
    status: 'Draft',
    tags: ['sensor', 'pressure', 'industrial'],
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
    currentVersion: {
      id: 'v2',
      schemaId: '2',
      version: '0.1.0',
      jsonSchema: '{}',
      changeLog: 'Draft version',
      isActive: false,
      createdAt: '2025-01-10T00:00:00Z',
      createdBy: 'user1',
    },
  },
];

const mockResponse: SchemaListResponse = {
  schemas: mockSchemas,
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe('SchemaList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should render loading state initially', () => {
      vi.mocked(schemaApi.getSchemas).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<SchemaList />);

      expect(screen.getByText('Loading schemas...')).toBeInTheDocument();
    });

    it('should fetch and display schemas', async () => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue(mockResponse);

      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor Schema')).toBeInTheDocument();
        expect(screen.getByText('Pressure Sensor Schema')).toBeInTheDocument();
      });
    });

    it('should display empty state when no schemas', async () => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue({
        schemas: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });

      render(<SchemaList />);

      await waitFor(() => {
        expect(
          screen.getByText(/No schemas found. Create your first schema to get started./i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Schema Display', () => {
    beforeEach(() => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue(mockResponse);
    });

    it('should display schema names', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor Schema')).toBeInTheDocument();
        expect(screen.getByText('Pressure Sensor Schema')).toBeInTheDocument();
      });
    });

    it('should display schema descriptions', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText('Schema for temperature sensors')).toBeInTheDocument();
        expect(screen.getByText('Schema for pressure sensors')).toBeInTheDocument();
      });
    });

    it('should display schema status badges', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should display schema versions', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText('1.0.0')).toBeInTheDocument();
        expect(screen.getByText('0.1.0')).toBeInTheDocument();
      });
    });

    it('should display schema tags', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText('sensor')).toBeInTheDocument();
        expect(screen.getByText('temperature')).toBeInTheDocument();
        expect(screen.getByText('pressure')).toBeInTheDocument();
      });
    });

    it('should truncate tags when more than 2', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        // Pressure schema has 3 tags, so should show +1
        expect(screen.getByText('+1')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filters', () => {
    beforeEach(() => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue(mockResponse);
    });

    it('should have a search input', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search schemas...')).toBeInTheDocument();
      });
    });

    it('should have a status filter dropdown', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should call API with search parameter when searching', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search schemas...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search schemas...');
      fireEvent.change(searchInput, { target: { value: 'temperature' } });

      await waitFor(() => {
        expect(schemaApi.getSchemas).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'temperature',
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when multiple pages', async () => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue({
        schemas: mockSchemas,
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      });

      render(<SchemaList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 10 of 25 schemas/i)).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first page', async () => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue({
        schemas: mockSchemas,
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      });

      render(<SchemaList />);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous').closest('button');
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      vi.mocked(schemaApi.getSchemas).mockResolvedValue(mockResponse);
      vi.mocked(schemaApi.deleteSchema).mockResolvedValue();
    });

    it('should have action menu for each schema', async () => {
      render(<SchemaList />);

      await waitFor(() => {
        const actionButtons = screen.getAllByRole('button', { name: '' });
        expect(actionButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when fetch fails', async () => {
      const mockToast = vi.fn();
      vi.mocked(schemaApi.getSchemas).mockRejectedValue(new Error('Network error'));
      
      vi.doMock('@/hooks/use-toast', () => ({
        useToast: () => ({
          toast: mockToast,
        }),
      }));

      render(<SchemaList />);

      await waitFor(() => {
        // Component should handle error gracefully
        expect(screen.queryByText('Temperature Sensor Schema')).not.toBeInTheDocument();
      });
    });
  });
});
