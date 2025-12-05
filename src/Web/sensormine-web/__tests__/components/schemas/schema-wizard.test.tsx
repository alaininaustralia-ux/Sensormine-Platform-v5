/**
 * Schema Wizard Tests
 * 
 * Story 2.2 - Schema Definition Frontend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchemaWizard } from '@/components/schemas/schema-wizard';
import * as schemaApi from '@/lib/api/schemas';

// Mock the schema API
vi.mock('@/lib/api/schemas');

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('SchemaWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Basic Information', () => {
    it('should render step 1 initially', () => {
      render(<SchemaWizard />);

      expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Schema Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });

    it('should disable Next button when name is empty', () => {
      render(<SchemaWizard />);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when required fields are filled', () => {
      render(<SchemaWizard />);

      const nameInput = screen.getByLabelText(/Schema Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Schema' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeEnabled();
    });

    it('should add tags when Enter is pressed', () => {
      render(<SchemaWizard />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      
      fireEvent.change(tagInput, { target: { value: 'sensor' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(screen.getByText('sensor')).toBeInTheDocument();
    });

    it('should move to step 2 when Next is clicked', () => {
      render(<SchemaWizard />);

      const nameInput = screen.getByLabelText(/Schema Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Schema' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      expect(screen.getByRole('heading', { name: 'JSON Schema' })).toBeInTheDocument();
    });
  });

  describe('Step 2: JSON Schema', () => {
    beforeEach(() => {
      render(<SchemaWizard />);

      // Fill step 1
      const nameInput = screen.getByLabelText(/Schema Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Schema' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);
    });

    it('should render step 2', () => {
      expect(screen.getByRole('heading', { name: 'JSON Schema' })).toBeInTheDocument();
      expect(screen.getByLabelText(/JSON Schema/)).toBeInTheDocument();
    });

    it('should have Back button on step 2', () => {
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should show validation error for invalid JSON', () => {
      const jsonInput = screen.getByLabelText(/JSON Schema/);
      
      fireEvent.change(jsonInput, { target: { value: 'invalid json' } });

      expect(screen.getByText(/Unexpected token/i)).toBeInTheDocument();
    });

    it('should show valid status for valid JSON Schema', () => {
      const jsonInput = screen.getByLabelText(/JSON Schema/);
      
      const validSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: { temp: { type: 'number' } },
      });
      
      fireEvent.change(jsonInput, { target: { value: validSchema } });

      expect(screen.getByText('Valid JSON Schema')).toBeInTheDocument();
    });

    it('should move to step 3 when Next is clicked with valid schema', () => {
      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
    });

    it('should go back to step 1 when Back is clicked', () => {
      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
    });
  });

  describe('Step 3: Review', () => {
    beforeEach(() => {
      render(<SchemaWizard />);

      // Fill step 1
      const nameInput = screen.getByLabelText(/Schema Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Schema' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      
      // Go to step 3
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    it('should render step 3 with review content', () => {
      expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
      expect(screen.getByText('Test Schema')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should have Create Schema button on step 3', () => {
      expect(screen.getByRole('button', { name: /Create Schema/i })).toBeInTheDocument();
    });

    it('should create schema when Create Schema is clicked', async () => {
      const mockSchema = {
        id: '1',
        name: 'Test Schema',
        description: 'Test Description',
        currentVersionId: 'v1',
        status: 'Draft' as const,
        tags: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        tenantId: 'tenant1',
      };

      vi.mocked(schemaApi.createSchema).mockResolvedValue(mockSchema);

      const createButton = screen.getByRole('button', { name: /Create Schema/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(schemaApi.createSchema).toHaveBeenCalledWith({
          name: 'Test Schema',
          description: 'Test Description',
          jsonSchema: expect.any(String),
          changeLog: 'Initial version',
          tags: [],
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Schema "Test Schema" created successfully',
      });

      expect(mockPush).toHaveBeenCalledWith('/schemas/1');
    });
  });

  describe('Progress Indicator', () => {
    it('should show progress through steps', () => {
      const { container } = render(<SchemaWizard />);

      // Step 1
      expect(screen.getByText('1')).toBeInTheDocument();
      
      // Fill and go to step 2
      fireEvent.change(screen.getByLabelText(/Schema Name/), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test' } });
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // Check for checkmark SVG icon on completed step
      const checkIcon = container.querySelector('svg.lucide-check');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('should navigate back to schemas list when Cancel is clicked', () => {
      render(<SchemaWizard />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/schemas');
    });
  });
});
